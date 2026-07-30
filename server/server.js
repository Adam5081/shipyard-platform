/* ============================================================
   SHIPYARD backend — zero-dependency Node.js (≥ 22)
   HTTP API + раздача статики фронтенда из корня репозитория.
   Запуск: node server/server.js   (PORT=8787 по умолчанию)
   ============================================================ */

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const { db, hashPassword } = require("./db");
const { TASKS, SEC_IDS, LEGAL_IDS, computePoints, computeLevel } = require("./catalog");

const PORT = Number(process.env.PORT || 8787);
const ROOT = path.join(__dirname, "..");
const TOKEN_TTL = 30 * 86400000; // 30 дней

/* ---------- секрет для токенов (генерируется один раз) ---------- */

const SECRET_FILE = path.join(__dirname, "data", ".secret");
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
  updateUser: db.prepare("UPDATE users SET name = ?, project = ?, tariff = ? WHERE id = ?"),
  progress: db.prepare("SELECT kind, item_id FROM progress WHERE user_id = ?"),
  addProgress: db.prepare("INSERT OR IGNORE INTO progress (user_id, kind, item_id, done_at) VALUES (?,?,?,?)"),
  delProgress: db.prepare("DELETE FROM progress WHERE user_id = ? AND kind = ? AND item_id = ?"),
  myDemos: db.prepare("SELECT * FROM demos WHERE user_id = ? ORDER BY created_at DESC"),
  allDemos: db.prepare(`
    SELECT d.*, u.name, u.project,
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
};

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

function userStats(u) {
  if (u.seed_pts > 0) return { points: u.seed_pts, level: u.seed_lvl || 1 };
  const sets = userSets(u.id);
  const demoCount = q.demoCount.get(u.id).n;
  return {
    points: computePoints({ ...sets, demoCount }),
    level: computeLevel(sets.doneSet),
  };
}

function meState(u) {
  const { doneSet, secSet, legalSet } = userSets(u.id);
  const toObj = s => Object.fromEntries([...s].map(id => [id, true]));
  return {
    user: { id: u.id, email: u.email, name: u.name, project: u.project, tariff: u.tariff },
    done: toObj(doneSet),
    sec: toObj(secSet),
    legal: toObj(legalSet),
    demos: q.myDemos.all(u.id).map(d => ({ id: d.id, week: d.week, text: d.text, link: d.link, ts: d.created_at })),
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

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", c => { data += c; if (data.length > 64 * 1024) req.destroy(); });
    req.on("end", () => { try { resolve(data ? JSON.parse(data) : {}); } catch { reject(new Error("bad json")); } });
    req.on("error", reject);
  });
}

function auth(req) {
  const h = req.headers.authorization || "";
  const uid = verifyToken(h.startsWith("Bearer ") ? h.slice(7) : null);
  return uid ? q.userById.get(uid) : null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    const salt = crypto.randomBytes(16).toString("hex");
    const tariff = ["Solo", "Pro", "Venture"].includes(b.tariff) ? b.tariff : "Solo";
    const project = String(b.project || "Мой продукт").trim().slice(0, 120) || "Мой продукт";
    const r = q.insertUser.run(email, hashPassword(password, salt), salt, name, project, tariff, Date.now());
    const u = q.userById.get(Number(r.lastInsertRowid));
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
    const tariff = ["Solo", "Pro", "Venture"].includes(b.tariff) ? b.tariff : u.tariff;
    q.updateUser.run(name, project, tariff, u.id);
    send(res, 200, meState(q.userById.get(u.id)));
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
      name: d.name, project: d.project, votes: d.votes,
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
    send(res, 201, { id: Number(r.lastInsertRowid), ...userStats(u) });
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

  "GET /api/league": async (req, res) => {
    const u = auth(req);
    if (!u) return err(res, 401, "Нужен вход");
    const rows = q.allUsers.all()
      .map(x => {
        const s = userStats(x);
        return { name: x.name, project: x.project, pts: s.points, lvl: s.level, me: x.id === u.id };
      })
      .sort((a, b) => b.pts - a.pts)
      .slice(0, 20);
    send(res, 200, { rows });
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
  if (!file.startsWith(ROOT) || file.includes(path.sep + "server" + path.sep) || file.endsWith(path.sep + "server")) {
    res.writeHead(404); return res.end("Not found");
  }
  fs.readFile(file, (e, data) => {
    if (e) { res.writeHead(404, { "Content-Type": "text/plain" }); return res.end("Not found"); }
    res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
    res.end(data);
  });
}

/* ---------- сервер ---------- */

http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, "http://x");

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    });
    return res.end();
  }

  const handler = routes[`${req.method} ${pathname}`];
  if (handler) {
    try { await handler(req, res); }
    catch (e) {
      console.error(e);
      if (!res.headersSent) err(res, e.message === "bad json" ? 400 : 500, "Ошибка сервера");
    }
    return;
  }
  if (pathname.startsWith("/api/")) return err(res, 404, "Нет такого метода");
  serveStatic(req, res, pathname);
}).listen(PORT, () => console.log(`SHIPYARD backend + frontend: http://localhost:${PORT}`));
