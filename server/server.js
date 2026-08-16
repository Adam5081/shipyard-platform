/* ============================================================
   Taulau backend — zero-dependency Node.js (≥ 22)
   HTTP API + раздача статики фронтенда из корня репозитория.
   Запуск: node server/server.js   (PORT=8787 по умолчанию)
   ============================================================ */

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const zlib = require("node:zlib");

const { db, hashPassword, hashPasswordAsync, DATA_DIR } = require("./db");
const {
  PHASE_TASKS, TASKS, SEC_IDS, LEGAL_IDS, DOCKS,
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
  spinCount: db.prepare("SELECT COUNT(*) AS n FROM lottery WHERE user_id = ?"),
  userPrizes: db.prepare("SELECT prize_id, prize_label, created_at FROM lottery WHERE user_id = ? ORDER BY id"),
  insertSpin: db.prepare("INSERT INTO lottery (user_id, prize_id, prize_label, created_at) VALUES (?,?,?,?)"),
  myBattles: db.prepare("SELECT * FROM battles WHERE challenger_id = ? OR opponent_id = ? ORDER BY id DESC LIMIT 50"),
  battleById: db.prepare("SELECT * FROM battles WHERE id = ?"),
  openBetween: db.prepare(`SELECT 1 FROM battles WHERE winner_id = 0
    AND ((challenger_id = @a AND opponent_id = @b) OR (challenger_id = @b AND opponent_id = @a))`),
  myOpenBattles: db.prepare("SELECT COUNT(*) AS n FROM battles WHERE challenger_id = ? AND winner_id = 0"),
  insertBattle: db.prepare("INSERT INTO battles (challenger_id, opponent_id, questions, created_at) VALUES (?,?,?,?)"),
  setChAnswer: db.prepare("UPDATE battles SET ch_score = ?, ch_ms = ? WHERE id = ?"),
  setOpAnswer: db.prepare("UPDATE battles SET op_score = ?, op_ms = ? WHERE id = ?"),
  resolveBattle: db.prepare("UPDATE battles SET winner_id = ?, resolved_at = ? WHERE id = ?"),
  addBattlePts: db.prepare("UPDATE users SET battle_pts = battle_pts + ? WHERE id = ?"),
  realUsers: db.prepare("SELECT * FROM users WHERE seed_pts = 0"),
  demoWeeks: db.prepare("SELECT COUNT(DISTINCT week) AS n FROM demos WHERE user_id = ?"),
  addBonusSpin: db.prepare("UPDATE users SET bonus_spins = bonus_spins + 1 WHERE id = ?"),
  pairResolvedSince: db.prepare(`SELECT COUNT(*) AS n FROM battles WHERE winner_id != 0 AND resolved_at > @since
    AND ((challenger_id = @a AND opponent_id = @b) OR (challenger_id = @b AND opponent_id = @a)) AND id != @self`),
  battlePtsSince: db.prepare(`SELECT COALESCE(SUM(CASE WHEN challenger_id = @uid THEN ch_award ELSE op_award END), 0) AS n
    FROM battles WHERE winner_id != 0 AND resolved_at > @since AND (challenger_id = @uid OR opponent_id = @uid)`),
  setAwards: db.prepare("UPDATE battles SET ch_award = ?, op_award = ? WHERE id = ?"),
  taskTimes: db.prepare("SELECT item_id, done_at FROM progress WHERE user_id = ? AND kind = 'task'"),
  userGates: db.prepare("SELECT gate FROM gate_approvals WHERE user_id = ?"),
  approveGate: db.prepare("INSERT OR IGNORE INTO gate_approvals (user_id, gate, approved_at) VALUES (?,?,?)"),
  revokeGate: db.prepare("DELETE FROM gate_approvals WHERE user_id = ? AND gate = ?"),
  setPassword: db.prepare("UPDATE users SET pass_hash = ?, salt = ? WHERE id = ?"),
  mentorByHash: db.prepare("SELECT * FROM mentors WHERE key_hash = ?"),
  mentorById: db.prepare("SELECT * FROM mentors WHERE id = ?"),
  allMentors: db.prepare(`SELECT m.*, (SELECT COUNT(*) FROM users u WHERE u.mentor_id = m.id AND u.seed_pts = 0) AS wards
    FROM mentors m ORDER BY m.id`),
  insertMentor: db.prepare("INSERT INTO mentors (name, key_hash, tg_chat, created_at) VALUES (?,?,?,?)"),
  deleteMentor: db.prepare("DELETE FROM mentors WHERE id = ?"),
  unassignMentor: db.prepare("UPDATE users SET mentor_id = 0 WHERE mentor_id = ?"),
  assignMentor: db.prepare("UPDATE users SET mentor_id = ? WHERE id = ?"),
};

/* ---------- уведомления ментору в Telegram ----------
   Включаются переменными окружения SHIPYARD_TG_TOKEN (токен бота от
   @BotFather) и SHIPYARD_TG_CHAT (id чата/группы ментора). Без них — тихо
   выключены. Отправка не блокирует ответ клиенту и не роняет запрос. */
const TG_TOKEN = process.env.SHIPYARD_TG_TOKEN || "";
const TG_CHAT = process.env.SHIPYARD_TG_CHAT || "";

function notifyTg(text, chat = TG_CHAT) {
  if (!TG_TOKEN || !chat) return;
  fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chat, text }),
  }).catch(() => {});
}

/* Событие про участника — таргетированно его ментору (в личку или чат
   группы ментора); без назначенного ментора — в общий чат админов. */
function notifyAboutUser(u, text) {
  const mentor = u.mentor_id ? q.mentorById.get(u.mentor_id) : null;
  notifyTg(text, (mentor && mentor.tg_chat) || TG_CHAT);
}

const TARIFFS = ["Solo", "Pro", "Partner"];
const normTariff = t => (t === "Venture" ? "Partner" : t);

/* ---------- инвайты: регистрация только по коду из одобренной заявки ---------- */

// SHIPYARD_OPEN_REG=1 открывает свободную регистрацию (локальная разработка, демо)
const OPEN_REG = process.env.SHIPYARD_OPEN_REG === "1";

// без похожих символов (0/O, 1/I/L), чтобы код легко диктовался голосом
const INVITE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function makeInviteCode() {
  for (;;) {
    let code = "TAU-";
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

// станции, соответствующие уровням пути, — для сидов без реального прогресса
const LEVEL_STATION = [0, 1, 2, 4, 5, 6, 7, 8];

function userStats(u) {
  if (u.seed_pts > 0) {
    const lvl = u.seed_lvl || 1;
    const station = LEVEL_STATION[Math.max(0, Math.min(7, lvl - 1))];
    return { points: u.seed_pts, level: lvl, station, walk: station / 8 };
  }
  const sets = userSets(u.id);
  const demoCount = q.demoWeeks.get(u.id).n;   // зачёт — по уникальным неделям
  return {
    points: computePoints({ ...sets, demoCount, battlePts: u.battle_pts || 0, approvedGates: approvedGates(u.id) }),
    level: computeLevel(sets.doneSet),
    station: computeStation(sets.doneSet),
    walk: computeWalk(sets.doneSet),
  };
}

/* ---------- жёсткий гейт КТ ---------- */

const approvedGates = uid => new Set(q.userGates.all(uid).map(r => r.gate));

/* Первая закрытая, но не подтверждённая КТ. Всё, что дальше неё, заблокировано. */
function pendingGate(uid) {
  const { doneSet } = userSets(uid);
  const ok = approvedGates(uid);
  for (let i = 0; i < PHASE_TASKS.length; i++) {
    const p = PHASE_TASKS[i];
    if (p.gate && Object.keys(p.tasks).every(id => doneSet.has(id)) && !ok.has(p.gate))
      return { idx: i, gate: p.gate };
  }
  return null;
}

/* Все КТ участника со статусами — для кабинета и админки. */
function gateStates(uid) {
  const { doneSet } = userSets(uid);
  const ok = approvedGates(uid);
  const out = {};
  PHASE_TASKS.forEach(p => {
    if (!p.gate) return;
    const done = Object.keys(p.tasks).every(id => doneSet.has(id));
    out[p.gate] = ok.has(p.gate) ? "approved" : done ? "pending" : "open";
  });
  return out;
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
      startDate: u.created_at,
      battlePts: u.battle_pts || 0,
    },
    done: toObj(doneSet),
    sec: toObj(secSet),
    legal: toObj(legalSet),
    gates: gateStates(u.id),
    demos: q.myDemos.all(u.id).map(d => ({ id: d.id, week: d.week, text: d.text, link: d.link, ts: d.created_at })),
    github: gh,
    ...userStats(u),
  };
}

const send = (res, code, data) => {
  const body = JSON.stringify(data);
  const head = {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  };
  // большие ответы (flow, лига, база) сжимаются — заметно на мобильном интернете
  const ae = String(res.req?.headers["accept-encoding"] || "");
  if (body.length > 2048 && ae.includes("gzip")) {
    head["Content-Encoding"] = "gzip";
    res.writeHead(code, head);
    return res.end(zlib.gzipSync(Buffer.from(body)));
  }
  res.writeHead(code, head);
  res.end(body);
};

/* лёгкий TTL-кэш тяжёлых сводок: считать очки всех участников на каждый
   запрос карты дорого при сотне человек; 3 секунды устаревания незаметны */
const memo = new Map();
function memoized(key, ttl, build) {
  const hit = memo.get(key);
  if (hit && Date.now() - hit.t < ttl) return hit.v;
  const v = build();
  memo.set(key, { t: Date.now(), v });
  return v;
}

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

/* Защита входа от перебора: 10 неудачных попыток с адреса за 10 минут — пауза.
   Держим в памяти: при рестарте счётчики обнуляются, для пилота достаточно. */
const LOGIN_TRIES = 10, LOGIN_WINDOW = 10 * 60000;
const loginFails = new Map();

function loginBlocked(req) {
  const rec = loginFails.get(ipHash(req));
  return rec && rec.n >= LOGIN_TRIES && Date.now() - rec.t < LOGIN_WINDOW;
}

function noteLoginFail(req, failed) {
  const key = ipHash(req);
  if (!failed) { loginFails.delete(key); return; }
  const rec = loginFails.get(key);
  if (!rec || Date.now() - rec.t > LOGIN_WINDOW) loginFails.set(key, { n: 1, t: Date.now() });
  else rec.n++;
  if (loginFails.size > 5000) loginFails.clear();   // страховка от разрастания
}

const ADMIN_KEY = process.env.SHIPYARD_ADMIN_KEY || "";

/* Роли доступа в админку по одному полю ключа:
   мастер-ключ из env → админ (всё); ключ из таблицы mentors → ментор
   (только свои участники). Хэш ключа — HMAC на серверном секрете. */
const mentorKeyHash = key => crypto.createHmac("sha256", SECRET).update(String(key)).digest("hex");

function roleOf(req) {
  const given = String(req.headers["x-admin-key"] || "");
  if (!given) return null;
  if (ADMIN_KEY) {
    const a = Buffer.from(given), b = Buffer.from(ADMIN_KEY);
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) return { role: "admin" };
  }
  const m = q.mentorByHash.get(mentorKeyHash(given));
  return m ? { role: "mentor", mentor: m } : null;
}

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
    const r = q.insertUser.run(email, await hashPasswordAsync(password, salt), salt, name, project, tariff, Date.now());
    const u = q.userById.get(Number(r.lastInsertRowid));
    if (app) q.useInvite.run(Date.now(), u.id, app.id);
    notifyTg(`✅ Регистрация в Taulau: ${name} (${email}) · тариф ${tariff}`);
    send(res, 201, { token: signToken(u.id), ...meState(u) });
  },

  "POST /api/login": async (req, res) => {
    if (loginBlocked(req))
      return err(res, 429, "Слишком много попыток входа — подождите 10 минут");
    const b = await readBody(req);
    const email = String(b.email || "").trim().toLowerCase();
    const u = q.userByEmail.get(email);
    const bad = !u || await hashPasswordAsync(String(b.password || ""), u.salt) !== u.pass_hash;
    noteLoginFail(req, bad);
    if (bad) return err(res, 401, "Неверный e-mail или пароль");
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

    /* жёсткий гейт: пока закрытая КТ не подтверждена ментором,
       задачи станций дальше неё отмечать нельзя */
    if (b.done && kind === "task") {
      const gate = pendingGate(u.id);
      const phaseIdx = PHASE_TASKS.findIndex(p => p.tasks[id] !== undefined);
      if (gate && phaseIdx > gate.idx)
        return err(res, 423, `Станция ${gate.idx} ждёт подтверждения контрольной точки ментором — путь дальше пока закрыт`);
    }

    const closedBefore = closedStations(u.id);
    if (b.done) q.addProgress.run(u.id, kind, id, Date.now());
    else q.delProgress.run(u.id, kind, id);

    /* «Счастливый билет»: закрытие станции с шансом даёт бонус-спин лотереи.
       Азарт по расписанию переменного подкрепления, но фарм невозможен:
       станций всего 9, билетов не больше LUCKY_MAX за поток. */
    let lucky = false;
    const closedAfter = closedStations(u.id);
    if (b.done && kind === "task" && closedAfter > closedBefore
        && u.bonus_spins < LUCKY_MAX && crypto.randomInt(100) < LUCKY_CHANCE) {
      q.addBonusSpin.run(u.id);
      lucky = true;
    }
    // станция закрылась — узнаёт СВОЙ ментор (или общий чат, если не назначен)
    if (b.done && kind === "task" && closedAfter > closedBefore) {
      const pg = pendingGate(u.id);
      notifyAboutUser(u, pg
        ? `⏳ ${u.name}: станция ${pg.idx} закрыта — КТ-${pg.gate.slice(1)} ждёт подтверждения в админке`
        : `🏁 ${u.name} закрыл станцию (${closedAfter}/9)`);
    }
    send(res, 200, { ok: true, lucky, ...userStats(q.userById.get(u.id)) });
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
    const rows = memoized("league:" + dock, 3000, () => q.allUsers.all()
      .filter(x => (x.dock || "") === dock)
      .map(x => {
        const s = userStats(x);
        const p = publicUser(x);
        return {
          id: x.id, name: x.name, project: p.project || "проект скрыт", avatar: p.avatar,
          pts: s.points, lvl: s.level, station: s.station, _project: x.project,
        };
      })
      .sort((a, b) => b.pts - a.pts))
      .map(r => {
        const me = r.id === u.id;
        const { _project, ...pub } = r;
        return { ...pub, me, project: me ? (_project || "проект скрыт") : pub.project };
      })
      .slice(0, 20);
    send(res, 200, { rows, dock, docks: DOCKS });
  },

  /* Дашборд потока: кто где идёт по карте. Общая часть кэшируется,
     личные поля (свой скрытый проект) подставляются per-request. */
  "GET /api/flow": async (req, res) => {
    const u = auth(req);
    if (!u) return err(res, 401, "Нужен вход");
    const base = memoized("flow", 3000, () => q.allUsers.all().map(x => {
      const s = userStats(x);
      return {
        ...publicUser(x),
        points: s.points, level: s.level, station: s.station, walk: s.walk,
        demos: q.demoCount.get(x.id).n,
        _project: x.project, _about: x.about, _link: x.link,   // видны только самому себе
      };
    }).sort((a, b) => b.walk - a.walk || b.points - a.points));
    const rows = base.map(r => {
      const me = r.id === u.id;
      const { _project, _about, _link, ...pub } = r;
      return me ? { ...pub, me, project: _project, about: _about, link: _link } : { ...pub, me };
    });
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
      number: `TAU-1-${String(u.id).padStart(4, "0")}`,
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
    notifyTg(`📥 Новая заявка в Taulau\n${name} · ${tariff || "тариф не выбран"}${city ? " · " + city : ""}\n«${idea.slice(0, 120)}${idea.length > 120 ? "…" : ""}»\n→ admin.html`);
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
    const r = roleOf(req);
    if (!r) return err(res, 401, "Нужен ключ доступа");
    let users = memoized("admin-users", 3000, () => q.allUsers.all().map(x => {
      const s = userStats(x);
      const seed = x.seed_pts > 0;
      return {
        id: x.id, name: x.name, email: x.email, project: x.project,
        tariff: normTariff(x.tariff), dock: x.dock || "",
        seed, mentorId: x.mentor_id || 0,
        points: s.points, level: s.level, station: s.station, walk: s.walk,
        demos: q.demoCount.get(x.id).n,
        createdAt: x.created_at,
        lastAt: q.lastDone.get(x.id).t || 0,
        prizes: q.userPrizes.all(x.id).map(r => r.prize_label),
        economy: seed ? null : userEconomy(x),
      };
    }).sort((a, b) => b.walk - a.walk || b.points - a.points));
    // ментор видит только свою группу (сиды ему тоже ни к чему)
    if (r.role === "mentor") users = users.filter(u => u.mentorId === r.mentor.id);
    send(res, 200, { users });
  },

  /* выгрузка резервной копии базы: скачивается по админ-ключу.
     VACUUM INTO даёт консистентный снимок даже при WAL. */
  "GET /api/admin/backup": async (req, res) => {
    if (!isAdmin(req)) return err(res, 401, "Нужен ключ администратора");
    const tmp = path.join(DATA_DIR, `backup-${Date.now()}.db`);
    try {
      db.exec(`VACUUM INTO '${tmp.replace(/'/g, "''")}'`);
      const buf = fs.readFileSync(tmp);
      res.writeHead(200, {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="shipyard-${new Date().toISOString().slice(0, 10)}.db"`,
        "Access-Control-Allow-Origin": "*",
      });
      res.end(buf);
    } catch (e) {
      err(res, 500, "Не удалось собрать резервную копию");
    } finally {
      try { fs.unlinkSync(tmp); } catch {}
    }
  },

  /* кто вошёл: админ или ментор — интерфейс подстраивается */
  "GET /api/admin/whoami": async (req, res) => {
    const r = roleOf(req);
    if (!r) return err(res, 401, "Нужен ключ доступа");
    send(res, 200, r.role === "admin"
      ? { role: "admin" }
      : { role: "mentor", name: r.mentor.name, mentorId: r.mentor.id });
  },

  /* команда: список менторов/экспертов (только админ) */
  "GET /api/admin/mentors": async (req, res) => {
    if (!isAdmin(req)) return err(res, 401, "Нужен ключ администратора");
    send(res, 200, { mentors: q.allMentors.all().map(m => ({ id: m.id, name: m.name, tgChat: m.tg_chat, wards: m.wards })) });
  },

  /* создать ментора: ключ доступа генерируется и показывается один раз */
  "POST /api/admin/mentors": async (req, res) => {
    if (!isAdmin(req)) return err(res, 401, "Нужен ключ администратора");
    const b = await readBody(req);
    const name = String(b.name || "").trim().slice(0, 60);
    if (!name) return err(res, 400, "Укажите имя ментора");
    const tgChat = String(b.tgChat || "").trim().slice(0, 32);
    let key = "MEN-";
    for (const byte of crypto.randomBytes(16)) key += INVITE_ALPHABET[byte % INVITE_ALPHABET.length];
    q.insertMentor.run(name, mentorKeyHash(key), tgChat, Date.now());
    memo.clear();
    send(res, 201, { ok: true, key });   // ключ отдаётся только сейчас — дальше хранится хэш
  },

  /* удалить ментора: его участники возвращаются в «не назначен» */
  "POST /api/admin/mentors/delete": async (req, res) => {
    if (!isAdmin(req)) return err(res, 401, "Нужен ключ администратора");
    const b = await readBody(req);
    const m = q.mentorById.get(Number(b.id || 0));
    if (!m) return err(res, 404, "Ментор не найден");
    q.unassignMentor.run(m.id);
    q.deleteMentor.run(m.id);
    memo.clear();
    send(res, 200, { ok: true });
  },

  /* распределение участников по менторам (только админ) */
  "POST /api/admin/assign": async (req, res) => {
    if (!isAdmin(req)) return err(res, 401, "Нужен ключ администратора");
    const b = await readBody(req);
    const user = q.userById.get(Number(b.userId || 0));
    if (!user || user.seed_pts > 0) return err(res, 400, "Участник не найден");
    const mid = Number(b.mentorId || 0);
    if (mid && !q.mentorById.get(mid)) return err(res, 404, "Ментор не найден");
    q.assignMentor.run(mid, user.id);
    memo.clear();
    if (mid) {
      const m = q.mentorById.get(mid);
      notifyTg(`👥 ${user.name} закреплён за ментором: ${m.name}`, m.tg_chat || TG_CHAT);
    }
    send(res, 200, { ok: true });
  },

  /* сброс пароля участника: SMTP нет — ментор получает временный пароль
     и отправляет его человеку сам. Пароль показывается один раз.
     Ментор может сбрасывать пароли только своим участникам. */
  "POST /api/admin/reset-password": async (req, res) => {
    const r = roleOf(req);
    if (!r) return err(res, 401, "Нужен ключ доступа");
    const b = await readBody(req);
    const user = q.userById.get(Number(b.userId || 0));
    if (!user || user.seed_pts > 0) return err(res, 400, "Участник не найден");
    if (r.role === "mentor" && user.mentor_id !== r.mentor.id)
      return err(res, 403, "Это участник другого ментора");
    let pwd = "";
    for (const byte of crypto.randomBytes(10)) pwd += INVITE_ALPHABET[byte % INVITE_ALPHABET.length];
    const salt = crypto.randomBytes(16).toString("hex");
    q.setPassword.run(await hashPasswordAsync(pwd, salt), salt, user.id);
    send(res, 200, { ok: true, password: pwd });
  },

  /* подтверждение / отзыв КТ: админ — любым, ментор — только своим */
  "POST /api/admin/gates": async (req, res) => {
    const r = roleOf(req);
    if (!r) return err(res, 401, "Нужен ключ доступа");
    const b = await readBody(req);
    const user = q.userById.get(Number(b.userId || 0));
    const gate = String(b.gate || "");
    if (!user || !PHASE_TASKS.some(p => p.gate === gate)) return err(res, 400, "Участник или КТ не найдены");
    if (r.role === "mentor" && user.mentor_id !== r.mentor.id)
      return err(res, 403, "Это участник другого ментора");
    if (b.approved) q.approveGate.run(user.id, gate, Date.now());
    else q.revokeGate.run(user.id, gate);
    memo.clear();   // очки и статусы изменились — сводки пересчитаются
    send(res, 200, { ok: true, gates: gateStates(user.id) });
  },

  /* ---------- лотерея Taulau ----------
     Спины зарабатываются прогрессом и считаются ТОЛЬКО на сервере:
     1 спин за каждые 3 закрытые станции + 1 за дверь MVP (все 9).
     Приз тоже выбирает сервер — фронт лишь показывает колесо. */
  "GET /api/lottery": async (req, res) => {
    const u = auth(req);
    if (!u) return err(res, 401, "Нужен вход");
    send(res, 200, lotteryState(u.id));
  },

  "POST /api/lottery/spin": async (req, res) => {
    const u = auth(req);
    if (!u) return err(res, 401, "Нужен вход");
    const st = lotteryState(u.id);
    if (st.available <= 0) return err(res, 403, "Спины ещё не заработаны: спин даётся за каждые 3 закрытые станции");
    const total = PRIZES.reduce((s, p) => s + p.w, 0);
    let roll = crypto.randomInt(total);
    const prize = PRIZES.find(p => (roll -= p.w) < 0) || PRIZES[PRIZES.length - 1];
    q.insertSpin.run(u.id, prize.id, prize.label, Date.now());
    send(res, 200, { prize: { id: prize.id, label: prize.label }, ...lotteryState(u.id) });
  },

  /* ---------- баттлы на знании вайб-кодинга ----------
     Вопросы выбирает сервер, счёт считает сервер. Победа — выше счёт,
     при равном — быстрее время. Очки идут в лигу (battle_pts). */
  "GET /api/battles": async (req, res) => {
    const u = auth(req);
    if (!u) return err(res, 401, "Нужен вход");
    const battles = q.myBattles.all(u.id, u.id).map(b => battleView(b, u.id));
    const opponents = q.realUsers.all()
      .filter(x => x.id !== u.id)
      .map(x => ({ id: x.id, name: x.name, project: x.is_public ? x.project : "" }));
    send(res, 200, { battles, opponents });
  },

  "POST /api/battles": async (req, res) => {
    const u = auth(req);
    if (!u) return err(res, 401, "Нужен вход");
    const b = await readBody(req);
    const opp = q.userById.get(Number(b.opponentId || 0));
    if (!opp || opp.id === u.id) return err(res, 400, "Выберите соперника из потока");
    if (opp.seed_pts > 0) return err(res, 400, "Этого участника нельзя вызвать на баттл");
    if (q.openBetween.get({ a: u.id, b: opp.id })) return err(res, 409, "У вас уже идёт баттл с этим участником");
    if (q.myOpenBattles.get(u.id).n >= 3) return err(res, 429, "Не больше трёх открытых вызовов одновременно");
    const idx = new Set();
    while (idx.size < BATTLE_QN) idx.add(crypto.randomInt(QUIZ_QUESTIONS.length));
    const r = q.insertBattle.run(u.id, opp.id, JSON.stringify([...idx]), Date.now());
    send(res, 201, battleView(q.battleById.get(Number(r.lastInsertRowid)), u.id));
  },

  "POST /api/battles/submit": async (req, res) => {
    const u = auth(req);
    if (!u) return err(res, 401, "Нужен вход");
    const b = await readBody(req);
    const bt = q.battleById.get(Number(b.id || 0));
    if (!bt) return err(res, 404, "Баттл не найден");
    const role = bt.challenger_id === u.id ? "ch" : bt.opponent_id === u.id ? "op" : null;
    if (!role) return err(res, 403, "Это не ваш баттл");
    if (bt.winner_id !== 0) return err(res, 409, "Баттл уже завершён");
    if ((role === "ch" ? bt.ch_score : bt.op_score) !== null) return err(res, 409, "Вы уже отвечали в этом баттле");

    const qidx = JSON.parse(bt.questions);
    const answers = Array.isArray(b.answers) ? b.answers : [];
    const score = qidx.reduce((s, qi, i) => s + (Number(answers[i]) === QUIZ_QUESTIONS[qi].a ? 1 : 0), 0);
    const ms = Math.max(1000, Math.min(30 * 60000, Number(b.ms) || 30 * 60000));
    (role === "ch" ? q.setChAnswer : q.setOpAnswer).run(score, ms, bt.id);

    const fresh = q.battleById.get(bt.id);
    if (fresh.ch_score !== null && fresh.op_score !== null) {
      let winner = -1; // ничья
      if (fresh.ch_score !== fresh.op_score) winner = fresh.ch_score > fresh.op_score ? fresh.challenger_id : fresh.opponent_id;
      else if (fresh.ch_ms !== fresh.op_ms) winner = fresh.ch_ms < fresh.op_ms ? fresh.challenger_id : fresh.opponent_id;
      q.resolveBattle.run(winner, Date.now(), bt.id);

      /* Антифарм: реванш той же пары в течение 7 дней — дружеский (0 очков);
         сверх недельного потолка BATTLE_WEEK_CAP очки тоже не начисляются.
         Сыграть можно сколько угодно — на экономику влияет только зачётное. */
      const weekAgo = Date.now() - 7 * 86400000;
      const friendly = q.pairResolvedSince.get({ a: fresh.challenger_id, b: fresh.opponent_id, since: weekAgo, self: fresh.id }).n > 0;
      const base = uid2 =>
        winner === -1 ? BATTLE_DRAW_PTS : winner === uid2 ? BATTLE_WIN_PTS : BATTLE_LOSE_PTS;
      const capped = uid2 => Math.max(0, Math.min(base(uid2), BATTLE_WEEK_CAP - q.battlePtsSince.get({ uid: uid2, since: weekAgo }).n));
      const chAward = friendly ? 0 : capped(fresh.challenger_id);
      const opAward = friendly ? 0 : capped(fresh.opponent_id);
      q.setAwards.run(chAward, opAward, fresh.id);
      if (chAward) q.addBattlePts.run(chAward, fresh.challenger_id);
      if (opAward) q.addBattlePts.run(opAward, fresh.opponent_id);
    }
    // разбор — только после сдачи собственных ответов
    const review = qidx.map((qi, i) => ({
      q: QUIZ_QUESTIONS[qi].q, correct: QUIZ_QUESTIONS[qi].opts[QUIZ_QUESTIONS[qi].a],
      yours: QUIZ_QUESTIONS[qi].opts[Number(answers[i])] ?? "—",
      right: Number(answers[i]) === QUIZ_QUESTIONS[qi].a, why: QUIZ_QUESTIONS[qi].why,
    }));
    send(res, 200, { ...battleView(q.battleById.get(bt.id), u.id), review });
  },

  "GET /api/health": async (req, res) => send(res, 200, { ok: true, service: "taulau" }),
};

/* ---------- баттлы: константы и представление ---------- */

const { QUIZ_QUESTIONS } = require("../assets/quiz");
const BATTLE_QN = 5, BATTLE_WIN_PTS = 50, BATTLE_LOSE_PTS = 10, BATTLE_DRAW_PTS = 25;
const BATTLE_WEEK_CAP = 150;   // потолок очков с баттлов за 7 дней — сговор двух аккаунтов бессмысленен
const LUCKY_CHANCE = 20;       // % шанс «счастливого билета» при закрытии станции
const LUCKY_MAX = 2;           // билетов за поток

function battleView(b, uid) {
  const meCh = b.challenger_id === uid;
  const my = meCh ? { score: b.ch_score, ms: b.ch_ms } : { score: b.op_score, ms: b.op_ms };
  const their = meCh ? { score: b.op_score, ms: b.op_ms } : { score: b.ch_score, ms: b.ch_ms };
  const vs = q.userById.get(meCh ? b.opponent_id : b.challenger_id);
  const done = b.winner_id !== 0;
  return {
    id: b.id, ts: b.created_at,
    vs: vs ? { name: vs.name, project: vs.is_public ? vs.project : "" } : { name: "—", project: "" },
    challengedByMe: meCh,
    myScore: my.score, theirScore: done ? their.score : null, // чужой счёт виден после развязки
    status: done ? "done" : my.score === null ? "yours" : "waiting",
    result: !done ? null : b.winner_id === -1 ? "draw" : b.winner_id === uid ? "win" : "loss",
    myAward: done ? (meCh ? b.ch_award : b.op_award) : null,   // 0 = дружеский или потолок недели
    total: BATTLE_QN,
    // вопросы отдаются только когда ход за вами — и без правильных ответов
    questions: !done && my.score === null
      ? JSON.parse(b.questions).map(qi => ({ q: QUIZ_QUESTIONS[qi].q, opts: QUIZ_QUESTIONS[qi].opts }))
      : null,
  };
}

/* призы лотереи: веса подобраны так, чтобы час эксперта выпадал часто,
   а апгрейд тарифа оставался редкой удачей; исполняет призы ментор вручную */
const PRIZES = [
  { id: "expert_hour",  label: "+1 час индивидуально с экспертом",       w: 35 },
  { id: "review_bonus", label: "Внеочередное ревью проекта ментором",     w: 30 },
  { id: "discount10",   label: "Скидка 10% на следующий месяц",           w: 20 },
  { id: "merch",        label: "Мерч Taulau",                             w: 10 },
  { id: "tariff_week",  label: "Апгрейд тарифа на неделю",                w: 5 },
];

function closedStations(uid) {
  const { doneSet } = userSets(uid);
  return PHASE_TASKS.filter(p => Object.keys(p.tasks).every(id => doneSet.has(id))).length;
}

function lotteryState(uid) {
  const closed = closedStations(uid);
  let earned = Math.floor(closed / 3) + (closed === PHASE_TASKS.length ? 1 : 0);
  // бонус финала: топ-3 своего дока среди реальных участников — ещё один спин
  const top3 = closed === PHASE_TASKS.length && dockRank(uid) <= 3;
  if (top3) earned += 1;
  earned += q.userById.get(uid).bonus_spins || 0;   // «счастливые билеты»
  const used = q.spinCount.get(uid).n;
  return {
    earned, used,
    available: Math.max(0, earned - used),
    closed, top3,
    prizes: q.userPrizes.all(uid).map(r => ({ id: r.prize_id, label: r.prize_label, ts: r.created_at })),
    pool: PRIZES.map(p => ({ id: p.id, label: p.label })),
  };
}

/* Разбивка экономики участника для админ-дэшборда: откуда очки, спины
   и не закрывал ли он станции подозрительно быстро (маркер самонакрутки —
   повод ментору проверить артефакты перед подтверждением КТ). */
function userEconomy(u) {
  const sets = userSets(u.id);
  let taskPts = 0;
  for (const id of sets.doneSet) if (TASKS[id]) taskPts += TASKS[id];
  const lot = lotteryState(u.id);

  // станция закрыта менее чем за 10 минут от первой до последней отметки — флаг
  const times = new Map(q.taskTimes.all(u.id).map(r => [r.item_id, r.done_at]));
  const fast = [];
  PHASE_TASKS.forEach((p, i) => {
    const ids = Object.keys(p.tasks);
    if (!ids.every(id => times.has(id))) return;
    const ts = ids.map(id => times.get(id));
    if (Math.max(...ts) - Math.min(...ts) < 10 * 60000) fast.push(i);
  });

  const gs = gateStates(u.id);
  return {
    taskPts, gatePts: Object.values(gs).filter(s => s === "approved").length * 100,
    secPts: sets.secSet.size * 10, legalPts: sets.legalSet.size * 15,
    demoPts: q.demoWeeks.get(u.id).n * 50, battlePts: u.battle_pts || 0,
    spinsEarned: lot.earned, spinsUsed: lot.used, luckyTickets: u.bonus_spins || 0,
    fastStations: fast,
    gates: gs,   // open / pending / approved — pending требует действия ментора
  };
}

/* место участника в лиге своего дока; сиды не соперники — исключаются */
function dockRank(uid) {
  const me = q.userById.get(uid);
  if (!me || !me.dock) return Infinity;
  const rows = q.realUsers.all()
    .filter(x => x.dock === me.dock)
    .map(x => ({ id: x.id, pts: userStats(x).points }))
    .sort((a, b) => b.pts - a.pts);
  const i = rows.findIndex(r => r.id === uid);
  return i === -1 ? Infinity : i + 1;
}

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

/* Статика: кэш в памяти по mtime + заранее сжатый gzip. Файлов немного,
   поэтому после прогрева диск не трогается вовсе. */
const staticCache = new Map();
const GZIP_EXT = new Set([".html", ".css", ".js", ".svg", ".md", ".json"]);

function serveStatic(req, res, pathname) {
  if (pathname === "/") pathname = "/index.html";
  const file = path.normalize(path.join(ROOT, pathname));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end("forbidden"); }

  let st;
  try { st = fs.statSync(file); } catch { st = null; }
  if (!st || !st.isFile()) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("Не найдено");
  }

  let hit = staticCache.get(file);
  if (!hit || hit.mtime !== st.mtimeMs) {
    const buf = fs.readFileSync(file);
    const ext = path.extname(file);
    hit = { mtime: st.mtimeMs, buf, gz: GZIP_EXT.has(ext) && buf.length > 1024 ? zlib.gzipSync(buf) : null };
    staticCache.set(file, hit);
  }

  const head = { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" };
  // ассеты версионируются query-параметром — можно кэшировать надолго;
  // html отдаётся свежим, чтобы обновления доходили сразу
  head["Cache-Control"] = pathname.startsWith("/assets/")
    ? "public, max-age=604800"
    : "no-cache";

  const ae = String(req.headers["accept-encoding"] || "");
  if (hit.gz && ae.includes("gzip")) {
    head["Content-Encoding"] = "gzip";
    res.writeHead(200, head);
    return res.end(hit.gz);
  }
  res.writeHead(200, head);
  res.end(hit.buf);
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
  console.log(`Taulau backend + frontend: http://localhost:${PORT}`);
});
