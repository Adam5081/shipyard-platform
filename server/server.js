/* ============================================================
   SHIPYARD backend — zero-dependency Node.js (≥ 22)
   HTTP API + раздача статики фронтенда из корня репозитория.
   Запуск: node server/server.js   (PORT=8787 по умолчанию)
   ============================================================ */

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const { db, hashPassword, DATA_DIR } = require("./db");
const {
  TASKS, SEC_IDS, LEGAL_IDS, DOCKS,
  scoreScreening, dockFor,
  computePoints, computeLevel, computeStation, computeWalk,
} = require("./catalog");

const PORT = Number(process.env.PORT || 8787);
const ROOT = path.join(__dirname, "..");
const TOKEN_TTL = 30 * 86400000; // 30 дней
const AVATAR_MAX = 40 * 1024;    // 40 КБ на пиксельный аватар — с запасом
const GH_COOLDOWN = 3 * 60000;   // не чаще раза в 3 минуты на участника

/* ---------- секрет для токенов (генерируется один раз) ---------- */

const SECRET_FILE = path.join(DATA_DIR, ".secret");
let SECRET = process.env.SHIPYARD_SECRET;
if (!SECRET) {
  try { SECRET = fs.readFileSync(SECRET_FILE, "utf8").trim(); }
  catch {
    SECRET = crypto.randomBytes(32).toString("hex");
    fs.writeFileSync(SECRET_FILE, SECRET);
  }
}

/* ---------- токены (HMAC, без внешних библиотек) ---------- */

const b64u = buf => Buffer.from(buf).toString("base64url");

function signToken(uid) {
  const payload = b64u(JSON.stringify({ uid, exp: Date.now() + TOKEN_TTL }));
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function verifyToken(token) {
  if (!token || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  const expect = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  if (sig.length !== expect.length ||
      !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (data.exp < Date.now()) return null;
    return data.uid;
  } catch { return null; }
}

/* ---------- helpers ---------- */

const q = {
  userById: db.prepare("SELECT * FROM users WHERE id = ?"),
  userByEmail: db.prepare("SELECT * FROM users WHERE email = ?"),
  insertUser: db.prepare("INSERT INTO users (email, pass_hash, salt, name, project, tariff, created_at) VALUES (?,?,?,?,?,?,?)"),
  updateUser: db.prepare(`
    UPDATE users SET name = ?, project = ?, tariff = ?, about = ?, link = ?, repo = ?, is_public = ?
    WHERE id = ?`),
  updateAvatar: db.prepare("UPDATE users SET avatar = ? WHERE id = ?"),
  updateDock: db.prepare("UPDATE users SET dock = ?, complexity = ? WHERE id = ?"),
  updateGh: db.prepare("UPDATE users SET gh_cache = ?, gh_at = ? WHERE id = ?"),
  progress: db.prepare("SELECT kind, item_id FROM progress WHERE user_id = ?"),
  addProgress: db.prepare("INSERT OR IGNORE INTO progress (user_id, kind, item_id, done_at) VALUES (?,?,?,?)"),
  delProgress: db.prepare("DELETE FROM progress WHERE user_id = ? AND kind = ? AND item_id = ?"),
  myDemos: db.prepare("SELECT * FROM demos WHERE user_id = ? ORDER BY created_at DESC"),
  allDemos: db.prepare(`
    SELECT d.*, u.name, u.project, u.avatar, u.is_public,
      (SELECT COUNT(*) FROM votes v WHERE v.demo_id = d.id) AS votes
    FROM demos d JOIN users u ON u.id = d.user_id
    ORDER BY d.created_at DESC LIMIT 100`),
  myVotes: db.prepare("SELECT demo_id FROM votes WHERE user_id = ?"),
  addDemo: db.prepare("INSERT INTO demos (user_id, week, text, link, created_at) VALUES (?,?,?,?,?)"),
  demoById: db.prepare("SELECT * FROM demos WHERE id = ?"),
  hasVote: db.prepare("SELECT 1 FROM votes WHERE user_id = ? AND demo_id = ?"),
  addVote: db.prepare("INSERT OR IGNORE INTO votes (user_id, demo_id) VALUES (?,?)"),
  delVote: db.prepare("DELETE FROM votes WHERE user_id = ? AND demo_id = ?"),
  demoCountVotes: db.prepare("SELECT COUNT(*) AS n FROM votes WHERE demo_id = ?"),
  allUsers: db.prepare("SELECT * FROM users"),
  demoCount: db.prepare("SELECT COUNT(*) AS n FROM demos WHERE user_id = ?"),
  addApp: db.prepare(`
    INSERT INTO applications (name, contact, city, idea, stage, tariff, experience, ip_hash, created_at)
    VALUES (?,?,?,?,?,?,?,?,?)`),
  allApps: db.prepare("SELECT * FROM applications ORDER BY created_at DESC LIMIT 500"),
  appById: db.prepare("SELECT * FROM applications WHERE id = ?"),
  updateApp: db.prepare("UPDATE applications SET status = ?, note = ? WHERE id = ?"),
  appsFromIp: db.prepare("SELECT COUNT(*) AS n FROM applications WHERE ip_hash = ? AND created_at > ?"),
  appByInvite: db.prepare("SELECT * FROM applications WHERE invite_code = ? AND status = 'accepted'"),
  inviteExists: db.prepare("SELECT 1 FROM applications WHERE invite_code = ?"),
  setInvite: db.prepare("UPDATE applications SET invite_code = ? WHERE id = ?"),
  useInvite: db.prepare("UPDATE applications SET invite_used_at = ?, invited_user_id = ? WHERE id = ?"),
  lastDone: db.prepare("SELECT MAX(done_at) AS t FROM progress WHERE user_id = ?"),
};

const TARIFFS = ["Solo", "Pro", "Partner"];
const normTariff = t => (t === "Venture" ? "Partner" : t);

/* ---------- инвайты: регистрация только по коду из одобренной заявки ---------- */

// SHIPYARD_OPEN_REG=1 открывает свободную регистрацию (локальная разработка, демо)
const OPEN_REG = process.env.SHIPYARD_OPEN_REG === "1";

// без похожих символов (0/O, 1/I/L), чтобы код легко диктовался голосом
const INVITE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function makeInviteCode() {
  for (;;) {
    let code = "SHP-";
    for (const b of crypto.randomBytes(6)) code += INVITE_ALPHABET[b % INVITE_ALPHABET.length];
    if (!q.inviteExists.get(code)) return code;
  }
}

function userSets(uid) {
  const rows = q.progress.all(uid);
  const doneSet = new Set(), secSet = new Set(), legalSet = new Set();
  for (const r of rows) {
    if (r.kind === "task") doneSet.add(r.item_id);
    else if (r.kind === "sec") secSet.add(r.item_id);
    else legalSet.add(r.item_id);
  }
  return { doneSet, secSet, legalSet };
}

// станции, соответствующие уровням верфи, — для сидов без реального прогресса
const LEVEL_STATION = [0, 1, 2, 4, 5, 6, 7, 8];

function userStats(u) {
  if (u.seed_pts > 0) {
    const lvl = u.seed_lvl || 1;
    const station = LEVEL_STATION[Math.max(0, Math.min(7, lvl - 1))];
    return { points: u.seed_pts, level: lvl, station, walk: station / 8 };
  }
  const sets = userSets(u.id);
  const demoCount = q.demoCount.get(u.id).n;
  return {
    points: computePoints({ ...sets, demoCount }),
    level: computeLevel(sets.doneSet),
    station: computeStation(sets.doneSet),
    walk: computeWalk(sets.doneSet),
  };
}

function publicUser(u) {
  return {
    id: u.id, name: u.name, avatar: u.avatar || "",
    dock: u.dock || "", tariff: normTariff(u.tariff),
    // проект показывается только с согласия участника
    open: !!u.is_public,
    project: u.is_public ? u.project : "",
    about: u.is_public ? u.about : "",
    link: u.is_public ? u.link : "",
  };
}

function meState(u) {
  const { doneSet, secSet, legalSet } = userSets(u.id);
  const toObj = s => Object.fromEntries([...s].map(id => [id, true]));
  let gh = null;
  try { gh = u.gh_cache ? JSON.parse(u.gh_cache) : null; } catch { gh = null; }
  return {
    user: {
      id: u.id, email: u.email, name: u.name, project: u.project,
      tariff: normTariff(u.tariff), avatar: u.avatar || "", about: u.about || "",
      link: u.link || "", repo: u.repo || "", isPublic: !!u.is_public,
      dock: u.dock || "", complexity: u.complexity || 0,
    },
    done: toObj(doneSet),
    sec: toObj(secSet),
    legal: toObj(legalSet),
    demos: q.myDemos.all(u.id).map(d => ({ id: d.id, week: d.week, text: d.text, link: d.link, ts: d.created_at })),
    github: gh,
    ...userStats(u),
  };
}

const send = (res, code, data) => {
  const body = JSON.stringify(data);
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(body);
};

const err = (res, code, message) => send(res, code, { error: message });

function readBody(req, limit = 512 * 1024) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", c => { data += c; if (data.length > limit) req.destroy(); });
    req.on("end", () => { try { resolve(data ? JSON.parse(data) : {}); } catch { reject(new Error("bad json")); } });
    req.on("error", reject);
  });
}

function auth(req) {
  const h = req.headers.authorization || "";
  const uid = verifyToken(h.startsWith("Bearer ") ? h.slice(7) : null);
  return uid ? q.userById.get(uid) : null;
}

/* ---------- заявки с лендинга ---------- */

const APP_STAGES = ["идея", "прототип", "первые пользователи", "работающий продукт"];
const APP_STATUSES = ["new", "contacted", "accepted", "declined"];
const APP_PER_IP = 3;              // заявок с одного адреса
const APP_WINDOW = 60 * 60000;     // за час

/* Адрес отправителя не храним — только необратимый хэш, чтобы ограничить спам. */
function ipHash(req) {
  const fwd = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  const ip = fwd || req.socket.remoteAddress || "";
  return crypto.createHmac("sha256", SECRET).update(ip).digest("hex").slice(0, 32);
}

const ADMIN_KEY = process.env.SHIPYARD_ADMIN_KEY || "";

function isAdmin(req) {
  const given = String(req.headers["x-admin-key"] || "");
  if (!ADMIN_KEY || !given) return false;
  const a = Buffer.from(given), b = Buffer.from(ADMIN_KEY);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REPO_RE = /^(?:https?:\/\/)?(?:www\.)?(?:github\.com\/)?([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/;

/* ---------- синхронизация с GitHub (публичные репозитории) ---------- */

async function githubStats(repo) {
  const m = REPO_RE.exec(String(repo).trim());
  if (!m) throw new Error("Укажите репозиторий в виде owner/name или ссылкой на GitHub");
  const [, owner, name] = m;
  const headers = { "User-Agent": "shipyard-platform", Accept: "application/vnd.github+json" };
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const signal = AbortSignal.timeout(8000);

  const [repoRes, commitsRes] = await Promise.all([
    fetch(`https://api.github.com/repos/${owner}/${name}`, { headers, signal }),
    fetch(`https://api.github.com/repos/${owner}/${name}/commits?since=${since}&per_page=100`, { headers, signal }),
  ]);
  if (repoRes.status === 404) throw new Error("Репозиторий не найден или закрыт. Публичный репозиторий — обязателен");
  if (repoRes.status === 403) throw new Error("GitHub временно ограничил запросы. Попробуйте через несколько минут");
  if (!repoRes.ok) throw new Error("GitHub ответил ошибкой " + repoRes.status);

  const info = await repoRes.json();
  const commits = commitsRes.ok ? await commitsRes.json() : [];
  const last = Array.isArray(commits) && commits[0] ? commits[0] : null;

  return {
    repo: `${owner}/${name}`,
    url: info.html_url,
    stars: info.stargazers_count || 0,
    language: info.language || "",
    pushedAt: info.pushed_at ? Date.parse(info.pushed_at) : 0,
    weekCommits: Array.isArray(commits) ? commits.length : 0,
    lastMessage: last ? String(last.commit?.message || "").split("\n")[0].slice(0, 140) : "",
    lastAt: last?.commit?.author?.date ? Date.parse(last.commit.author.date) : 0,
    syncedAt: Date.now(),
  };
}

/* ---------- API-маршруты ---------- */

const routes = {

  "POST /api/register": async (req, res) => {
    const b = await readBody(req);
    const email = String(b.email || "").trim().toLowerCase();
    const password = String(b.password || "");
    const name = String(b.name || "").trim().slice(0, 60);
    if (!EMAIL_RE.test(email)) return err(res, 400, "Некорректный e-mail");
    if (password.length < 6) return err(res, 400, "Пароль — минимум 6 символов");
    if (!name) return err(res, 400, "Укажите имя");
    if (q.userByEmail.get(email)) return err(res, 409, "Этот e-mail уже зарегистрирован");

    // тариф не выбирается при регистрации — он приходит из одобренной заявки
    let app = null;
    let tariff = "Solo";
    if (OPEN_REG) {
      tariff = TARIFFS.includes(normTariff(b.tariff)) ? normTariff(b.tariff) : "Solo";
    } else {
      const code = String(b.invite || "").trim().toUpperCase();
      if (!code) return err(res, 403, "Регистрация — по коду приглашения. Он приходит после одобрения заявки");
      app = q.appByInvite.get(code);
      if (!app) return err(res, 403, "Код приглашения не найден. Проверьте написание или напишите нам");
      if (app.invite_used_at) return err(res, 403, "Этот код уже использован. Если это были не вы — напишите нам");
      if (TARIFFS.includes(normTariff(app.tariff))) tariff = normTariff(app.tariff);
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const project = String(b.project || "Мой продукт").trim().slice(0, 120) || "Мой продукт";
    const r = q.insertUser.run(email, hashPassword(password, salt), salt, name, project, tariff, Date.now());
    const u = q.userById.get(Number(r.lastInsertRowid));
    if (app) q.useInvite.run(Date.now(), u.id, app.id);
    send(res, 201, { token: signToken(u.id), ...meState(u) });
  },

  "POST /api/login": async (req, res) => {
    const b = await readBody(req);
    const email = String(b.email || "").trim().toLowerCase();
    const u = q.userByEmail.get(email);
    if (!u || hashPassword(String(b.password || ""), u.salt) !== u.pass_hash)
      return err(res, 401, "Неверный e-mail или пароль");
    send(res, 200, { token: signToken(u.id), ...meState(u) });
  },

  "GET /api/me": async (req, res) => {
    const u = auth(req);
    if (!u) return err(res, 401, "Нужен вход");
    send(res, 200, meState(u));
  },

  "PUT /api/me": async (req, res) => {
    const u = auth(req);
    if (!u) return err(res, 401, "Нужен вход");
    const b = await readBody(req);
    const name = String(b.name ?? u.name).trim().slice(0, 60) || u.name;
    const project = String(b.project ?? u.project).trim().slice(0, 120) || u.project;
    const tariff = normTariff(u.tariff); // тариф задаётся заявкой, из профиля не меняется
    const about = String(b.about ?? u.about ?? "").trim().slice(0, 400);
    const link = String(b.link ?? u.link ?? "").trim().slice(0, 300);
    if (link && !/^https?:\/\//.test(link)) return err(res, 400, "Ссылка должна начинаться с http(s)://");
    const repoRaw = String(b.repo ?? u.repo ?? "").trim().slice(0, 200);
    if (repoRaw && !REPO_RE.test(repoRaw)) return err(res, 400, "Репозиторий указывается как owner/name");
    const repo = repoRaw ? repoRaw.replace(REPO_RE, "$1/$2") : "";
    const isPublic = b.isPublic === undefined ? u.is_public : (b.isPublic ? 1 : 0);
    q.updateUser.run(name, project, tariff, about, link, repo, isPublic, u.id);
    send(res, 200, meState(q.userById.get(u.id)));
  },

  "POST /api/avatar": async (req, res) => {
    const u = auth(req);
    if (!u) return err(res, 401, "Нужен вход");
    const b = await readBody(req);
    const src = String(b.avatar || "");
    if (src && !/^data:image\/(png|webp);base64,[A-Za-z0-9+/=]+$/.test(src))
      return err(res, 400, "Аватар принимается только как PNG из редактора платформы");
    if (src.length > AVATAR_MAX) return err(res, 400, "Аватар слишком большой");
    q.updateAvatar.run(src, u.id);
    send(res, 200, { avatar: src });
  },

  "POST /api/screening": async (req, res) => {
    const u = auth(req);
    if (!u) return err(res, 401, "Нужен вход");
    const b = await readBody(req);
    const complexity = scoreScreening(b.answers || {});
    const dock = dockFor(complexity);
    q.updateDock.run(dock, complexity, u.id);
    send(res, 200, { dock, complexity, docks: DOCKS });
  },

  "POST /api/toggle": async (req, res) => {
    const u = auth(req);
    if (!u) return err(res, 401, "Нужен вход");
    const b = await readBody(req);
    const kind = b.kind;
    const id = String(b.id || "");
    const valid =
      (kind === "task" && TASKS[id] !== undefined) ||
      (kind === "sec" && SEC_IDS.includes(id)) ||
      (kind === "legal" && LEGAL_IDS.includes(id));
    if (!valid) return err(res, 400, "Неизвестный пункт");
    if (b.done) q.addProgress.run(u.id, kind, id, Date.now());
    else q.delProgress.run(u.id, kind, id);
    send(res, 200, { ok: true, ...userStats(q.userById.get(u.id)) });
  },

  "GET /api/demos": async (req, res) => {
    const u = auth(req);
    if (!u) return err(res, 401, "Нужен вход");
    const my = new Set(q.myVotes.all(u.id).map(r => r.demo_id));
    const demos = q.allDemos.all().map(d => ({
      id: d.id, week: d.week, text: d.text, link: d.link, ts: d.created_at,
      name: d.name, project: d.is_public || d.user_id === u.id ? d.project : "проект скрыт",
      avatar: d.avatar || "", votes: d.votes,
      my: my.has(d.id), mine: d.user_id === u.id,
    }));
    send(res, 200, { demos });
  },

  "POST /api/demos": async (req, res) => {
    const u = auth(req);
    if (!u) return err(res, 401, "Нужен вход");
    const b = await readBody(req);
    const text = String(b.text || "").trim().slice(0, 1000);
    if (!text) return err(res, 400, "Опишите, что показываете");
    const link = String(b.link || "").trim().slice(0, 300);
    if (link && !/^https?:\/\//.test(link)) return err(res, 400, "Ссылка должна начинаться с http(s)://");
    const week = Math.max(0, Math.min(8, Number(b.week) || 0));
    const r = q.addDemo.run(u.id, week, text, link, Date.now());
    // ссылка из демо заодно становится публичной ссылкой продукта
    if (link && !u.link) q.updateUser.run(u.name, u.project, u.tariff, u.about, link, u.repo, u.is_public, u.id);
    send(res, 201, { id: Number(r.lastInsertRowid), ...userStats(q.userById.get(u.id)) });
  },

  "POST /api/vote": async (req, res) => {
    const u = auth(req);
    if (!u) return err(res, 401, "Нужен вход");
    const b = await readBody(req);
    const demo = q.demoById.get(Number(b.demoId));
    if (!demo) return err(res, 404, "Демо не найдено");
    if (demo.user_id === u.id) return err(res, 400, "За своё демо голосовать нельзя");
    if (q.hasVote.get(u.id, demo.id)) q.delVote.run(u.id, demo.id);
    else q.addVote.run(u.id, demo.id);
    send(res, 200, {
      votes: q.demoCountVotes.get(demo.id).n,
      my: !!q.hasVote.get(u.id, demo.id),
    });
  },

  /* Лига — только внутри своего дока: тяжёлый проект не соревнуется с лёгким. */
  "GET /api/league": async (req, res) => {
    const u = auth(req);
    if (!u) return err(res, 401, "Нужен вход");
    const dock = u.dock || "";
    const rows = q.allUsers.all()
      .filter(x => (x.dock || "") === dock)
      .map(x => {
        const s = userStats(x);
        const p = publicUser(x);
        const me = x.id === u.id;
        return {
          name: x.name, project: (me ? x.project : p.project) || "проект скрыт", avatar: p.avatar,
          pts: s.points, lvl: s.level, station: s.station, me,
        };
      })
      .sort((a, b) => b.pts - a.pts)
      .slice(0, 20);
    send(res, 200, { rows, dock, docks: DOCKS });
  },

  /* Дашборд потока: кто где идёт по карте. */
  "GET /api/flow": async (req, res) => {
    const u = auth(req);
    if (!u) return err(res, 401, "Нужен вход");
    const rows = q.allUsers.all().map(x => {
      const s = userStats(x);
      const me = x.id === u.id;
      const p = publicUser(x);
      // себе проект виден всегда; open показывает, видят ли его остальные
      if (me) { p.project = x.project; p.about = x.about; p.link = x.link; }
      return {
        ...p, me,
        points: s.points, level: s.level, station: s.station, walk: s.walk,
        demos: q.demoCount.get(x.id).n,
      };
    }).sort((a, b) => b.walk - a.walk || b.points - a.points);
    send(res, 200, { rows, docks: DOCKS });
  },

  "POST /api/github/sync": async (req, res) => {
    const u = auth(req);
    if (!u) return err(res, 401, "Нужен вход");
    const b = await readBody(req);
    const repoRaw = String(b.repo || u.repo || "").trim();
    if (!repoRaw) return err(res, 400, "Сначала укажите репозиторий в профиле");
    if (u.gh_at && Date.now() - u.gh_at < GH_COOLDOWN && u.gh_cache) {
      return send(res, 200, { github: JSON.parse(u.gh_cache), cached: true });
    }
    let stats;
    try { stats = await githubStats(repoRaw); }
    catch (e) { return err(res, 502, e.message || "Не удалось связаться с GitHub"); }
    q.updateGh.run(JSON.stringify(stats), Date.now(), u.id);
    if (stats.repo !== u.repo) q.updateUser.run(u.name, u.project, u.tariff, u.about, u.link, stats.repo, u.is_public, u.id);
    send(res, 200, { github: stats, cached: false });
  },

  /* Сертификат — только когда трек действительно пройден. */
  "GET /api/certificate": async (req, res) => {
    const u = auth(req);
    if (!u) return err(res, 401, "Нужен вход");
    const s = userStats(u);
    const ready = s.level >= 8;
    send(res, 200, {
      ready,
      name: u.name, project: u.project, dock: u.dock || "",
      points: s.points, level: s.level,
      number: `SHP-1-${String(u.id).padStart(4, "0")}`,
      issuedAt: ready ? Date.now() : 0,
    });
  },

  /* ---- заявки с лендинга (без входа) ---- */

  "POST /api/apply": async (req, res) => {
    const b = await readBody(req, 32 * 1024);

    // скрытое поле формы: живой человек его не заполняет
    if (String(b.website || "").trim()) return send(res, 201, { ok: true });

    const name = String(b.name || "").trim().slice(0, 80);
    const contact = String(b.contact || "").trim().slice(0, 120);
    const idea = String(b.idea || "").trim().slice(0, 2000);
    if (name.length < 2) return err(res, 400, "Укажите имя");
    if (contact.length < 3) return err(res, 400, "Укажите почту или телеграм для связи");
    if (contact.includes("@") && !contact.startsWith("@") && !EMAIL_RE.test(contact))
      return err(res, 400, "Почта указана с ошибкой");
    if (idea.length < 30) return err(res, 400, "Опишите продукт подробнее — хотя бы пара предложений");

    const hash = ipHash(req);
    if (q.appsFromIp.get(hash, Date.now() - APP_WINDOW).n >= APP_PER_IP)
      return err(res, 429, "Заявка уже отправлена. Мы свяжемся с вами — писать ещё раз не нужно");

    const city = String(b.city || "").trim().slice(0, 80);
    const stage = APP_STAGES.includes(b.stage) ? b.stage : "";
    const tariff = TARIFFS.includes(normTariff(b.tariff)) ? normTariff(b.tariff) : "";
    const experience = String(b.experience || "").trim().slice(0, 400);

    const r = q.addApp.run(name, contact, city, idea, stage, tariff, experience, hash, Date.now());
    console.log(`[заявка #${r.lastInsertRowid}] ${name} · ${contact} · ${tariff || "тариф не выбран"}`);
    send(res, 201, { ok: true, id: Number(r.lastInsertRowid) });
  },

  "GET /api/applications": async (req, res) => {
    if (!isAdmin(req)) return err(res, 401, "Нужен ключ администратора");
    send(res, 200, {
      applications: q.allApps.all().map(a => ({
        id: a.id, name: a.name, contact: a.contact, city: a.city, idea: a.idea,
        stage: a.stage, tariff: a.tariff, experience: a.experience,
        status: a.status, note: a.note, ts: a.created_at,
        invite: a.invite_code, inviteUsedAt: a.invite_used_at,
      })),
    });
  },

  "PUT /api/applications": async (req, res) => {
    if (!isAdmin(req)) return err(res, 401, "Нужен ключ администратора");
    const b = await readBody(req);
    const app = q.appById.get(Number(b.id));
    if (!app) return err(res, 404, "Заявка не найдена");
    const status = APP_STATUSES.includes(b.status) ? b.status : app.status;
    const note = String(b.note ?? app.note).trim().slice(0, 1000);
    q.updateApp.run(status, note, app.id);
    // при статусе «взяли» заявке выдаётся код приглашения — по нему человек регистрируется
    let invite = app.invite_code;
    if (status === "accepted" && !invite) {
      invite = makeInviteCode();
      q.setInvite.run(invite, app.id);
    }
    send(res, 200, { ok: true, status, note, invite, inviteUsedAt: app.invite_used_at });
  },

  /* Участники и их прогресс — для админки. Сиды помечаются, а не скрываются:
     так видно ровно то же, что видят участники в потоке. */
  "GET /api/admin/users": async (req, res) => {
    if (!isAdmin(req)) return err(res, 401, "Нужен ключ администратора");
    const users = q.allUsers.all().map(x => {
      const s = userStats(x);
      return {
        id: x.id, name: x.name, email: x.email, project: x.project,
        tariff: normTariff(x.tariff), dock: x.dock || "",
        seed: x.seed_pts > 0,
        points: s.points, level: s.level, station: s.station, walk: s.walk,
        demos: q.demoCount.get(x.id).n,
        createdAt: x.created_at,
        lastAt: q.lastDone.get(x.id).t || 0,
      };
    }).sort((a, b) => b.walk - a.walk || b.points - a.points);
    send(res, 200, { users });
  },

  "GET /api/health": async (req, res) => send(res, 200, { ok: true, service: "shipyard" }),
};

/* ---------- статика ---------- */

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".md": "text/markdown; charset=utf-8",
};

function serveStatic(req, res, pathname) {
  if (pathname === "/") pathname = "/index.html";
  const file = path.normalize(path.join(ROOT, pathname));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end("forbidden"); }
  fs.readFile(file, (e, buf) => {
    if (e) { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); return res.end("Не найдено"); }
    res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
    res.end(buf);
  });
}

/* ---------- сервер ---------- */

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, "http://x");

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Admin-Key",
    });
    return res.end();
  }

  const handler = routes[`${req.method} ${pathname}`];
  if (handler) {
    try { return await handler(req, res); }
    catch (e) {
      console.error(e);
      return err(res, 500, "Внутренняя ошибка");
    }
  }

  if (pathname.startsWith("/api/")) return err(res, 404, "Нет такого метода");
  serveStatic(req, res, pathname);
});

server.listen(PORT, () => {
  console.log(`SHIPYARD backend + frontend: http://localhost:${PORT}`);
});
