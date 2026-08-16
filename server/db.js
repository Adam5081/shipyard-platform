/* SQLite (встроенный node:sqlite, Node ≥ 22) — схема и сиды пилотного потока. */

const { DatabaseSync } = require("node:sqlite");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const DATA_DIR = process.env.SHIPYARD_DATA_DIR || path.join(__dirname, "data");
fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, "shipyard.db"));

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    email      TEXT NOT NULL UNIQUE,
    pass_hash  TEXT NOT NULL,
    salt       TEXT NOT NULL,
    name       TEXT NOT NULL,
    project    TEXT NOT NULL DEFAULT 'Мой продукт',
    tariff     TEXT NOT NULL DEFAULT 'Solo',
    seed_pts   INTEGER NOT NULL DEFAULT 0,
    seed_lvl   INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS progress (
    user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind     TEXT NOT NULL CHECK (kind IN ('task','sec','legal')),
    item_id  TEXT NOT NULL,
    done_at  INTEGER NOT NULL,
    PRIMARY KEY (user_id, kind, item_id)
  );

  CREATE TABLE IF NOT EXISTS demos (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week       INTEGER NOT NULL,
    text       TEXT NOT NULL,
    link       TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS votes (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    demo_id INTEGER NOT NULL REFERENCES demos(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, demo_id)
  );

  /* заявки с лендинга: приходят от неавторизованных людей */
  CREATE TABLE IF NOT EXISTS applications (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    contact    TEXT NOT NULL,           -- почта или телеграм
    city       TEXT NOT NULL DEFAULT '',
    idea       TEXT NOT NULL,           -- что за продукт
    stage      TEXT NOT NULL DEFAULT '',
    tariff     TEXT NOT NULL DEFAULT '',
    experience TEXT NOT NULL DEFAULT '',
    status     TEXT NOT NULL DEFAULT 'new'
               CHECK (status IN ('new','contacted','accepted','declined')),
    note       TEXT NOT NULL DEFAULT '',
    ip_hash    TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_app_created ON applications(created_at DESC);

  /* лотерея верфи: приз выбирает сервер, запись = использованный спин */
  CREATE TABLE IF NOT EXISTS lottery (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prize_id    TEXT NOT NULL,
    prize_label TEXT NOT NULL,
    created_at  INTEGER NOT NULL
  );

  /* жёсткий гейт КТ: закрытая станция с контрольной точкой уходит «на проверку»,
     дальше участник идёт только после подтверждения ментором */
  CREATE TABLE IF NOT EXISTS gate_approvals (
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    gate        TEXT NOT NULL,                 -- K1..K5
    approved_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, gate)
  );

  /* баттлы на знании вайб-кодинга: вопросы и подсчёт — только на сервере */
  CREATE TABLE IF NOT EXISTS battles (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    challenger_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    opponent_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    questions     TEXT NOT NULL,                 -- JSON: индексы вопросов пула
    ch_score      INTEGER, ch_ms INTEGER,        -- NULL = ещё не отвечал
    op_score      INTEGER, op_ms INTEGER,
    winner_id     INTEGER NOT NULL DEFAULT 0,    -- 0 = идёт, -1 = ничья
    created_at    INTEGER NOT NULL,
    resolved_at   INTEGER NOT NULL DEFAULT 0
  );
`);

/* ---------- миграции: колонки, добавленные после первого релиза ---------- */

const NEW_COLUMNS = [
  ["avatar",     "TEXT NOT NULL DEFAULT ''"],      // пиксельный аватар (data:image/png;base64,…)
  ["about",      "TEXT NOT NULL DEFAULT ''"],      // описание продукта для потока
  ["link",       "TEXT NOT NULL DEFAULT ''"],      // домен / публичная ссылка продукта
  ["repo",       "TEXT NOT NULL DEFAULT ''"],      // публичный репозиторий GitHub (owner/name)
  ["is_public",  "INTEGER NOT NULL DEFAULT 1"],    // показывать проект другим участникам
  ["dock",       "TEXT NOT NULL DEFAULT ''"],      // лига по сложности: A / B / C ('' — скрининг не пройден)
  ["complexity", "INTEGER NOT NULL DEFAULT 0"],    // баллы скрининга сложности
  ["gh_cache",   "TEXT NOT NULL DEFAULT ''"],      // кэш ответа GitHub (JSON)
  ["gh_at",      "INTEGER NOT NULL DEFAULT 0"],    // время последней синхронизации
  ["battle_pts",  "INTEGER NOT NULL DEFAULT 0"],   // очки лиги, заработанные в баттлах
  ["bonus_spins", "INTEGER NOT NULL DEFAULT 0"],   // «счастливые билеты» лотереи (макс. 2 за поток)
];

const existing = new Set(db.prepare("PRAGMA table_info(users)").all().map(c => c.name));
for (const [name, decl] of NEW_COLUMNS) {
  if (!existing.has(name)) db.exec(`ALTER TABLE users ADD COLUMN ${name} ${decl}`);
}

/* Инвайты: код выдаётся заявке при статусе «взяли», регистрация — только по коду. */
const APP_COLUMNS = [
  ["invite_code",     "TEXT NOT NULL DEFAULT ''"],    // код приглашения (пустой — не выдан)
  ["invite_used_at",  "INTEGER NOT NULL DEFAULT 0"],  // когда код использован при регистрации
  ["invited_user_id", "INTEGER NOT NULL DEFAULT 0"],  // кто зарегистрировался по коду
];

const existingApp = new Set(db.prepare("PRAGMA table_info(applications)").all().map(c => c.name));
for (const [name, decl] of APP_COLUMNS) {
  if (!existingApp.has(name)) db.exec(`ALTER TABLE applications ADD COLUMN ${name} ${decl}`);
}

/* Аудит наград баттлов: сколько очков реально начислено каждой стороне
   (0 — дружеский реванш или недельный потолок). */
const BATTLE_COLUMNS = [
  ["ch_award", "INTEGER NOT NULL DEFAULT 0"],
  ["op_award", "INTEGER NOT NULL DEFAULT 0"],
];

const existingBattle = new Set(db.prepare("PRAGMA table_info(battles)").all().map(c => c.name));
for (const [name, decl] of BATTLE_COLUMNS) {
  if (!existingBattle.has(name)) db.exec(`ALTER TABLE battles ADD COLUMN ${name} ${decl}`);
}

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 32).toString("hex");
}

/* --- сид пилотного потока: 7 участников со стеной демо, как в концепции --- */

const SEED_PEERS = [
  { name: "Айгерим С.",  project: "MedQueue — запись в частные клиники", pts: 720, lvl: 4, dock: "C", cx: 14,
    about: "Запись к врачу в частные клиники без звонков: пациент выбирает слот, клиника видит очередь.",
    demo: { week: 3, text: "Ключевой сценарий записи работает: пациент выбирает врача, слот бронируется, клиника видит запись в панели." } },
  { name: "Данияр Т.",   project: "CargoLink — биржа попутных грузов", pts: 660, lvl: 4, dock: "B", cx: 9,
    about: "Биржа попутных грузов: перевозчик находит обратную загрузку вместо холостого пробега.",
    demo: { week: 3, text: "Собрал матчинг груза и машины через Claude Code. Показал на реальных заявках двух перевозчиков." } },
  { name: "Мария К.",    project: "LexDraft — генератор договоров", pts: 605, lvl: 3, dock: "B", cx: 7,
    about: "Генератор типовых договоров по анкете: 12 полей на входе, готовый документ на выходе.",
    demo: { week: 3, text: "Генерация договора аренды из анкеты: 12 полей → готовый документ. Юрист потока проверил формулировки." } },
  { name: "Ерлан Ж.",    project: "AgroScan — учёт полей для фермеров", pts: 540, lvl: 3, dock: "A", cx: 4,
    about: "Карта полей и заметки агронома: что посеяно, что обработано, что убрано.",
    demo: { week: 2, text: "Урезал MVP с 9 функций до одной: карта поля + заметки агронома. CLAUDE.md утверждён на КТ-2." } },
  { name: "Салтанат Б.", project: "EduPay — оплата кружков для школ", pts: 470, lvl: 3, dock: "B", cx: 10,
    about: "Оплата школьных кружков в одном окне: родитель платит, школа видит поступления.",
    demo: { week: 2, text: "Собрала презентацию проекта через Claude Code: семь блоков, ментор принял с первого раза. Из неё родился CLAUDE.md." } },
  { name: "Тимур А.",    project: "FitDesk — абонементы для студий", pts: 390, lvl: 2, dock: "A", cx: 5,
    about: "Учёт абонементов для небольших фитнес-студий: клиенты, посещения, продления.",
    demo: { week: 3, text: "Каркас на заготовке авторизации программы. Первый спринт закрыт за 4 вечера." } },
  { name: "Жанна О.",    project: "TenderEye — мониторинг закупок", pts: 310, lvl: 2, dock: "C", cx: 12,
    about: "Мониторинг госзакупок по фильтрам отрасли с уведомлением в первый час публикации.",
    demo: null },
];

function seed() {
  const count = db.prepare("SELECT COUNT(*) AS n FROM users WHERE seed_pts > 0").get().n;
  if (count > 0) {
    // добор полей для сидов, созданных до появления лиг и описаний
    const upd = db.prepare("UPDATE users SET dock = ?, complexity = ?, about = ? WHERE email = ?");
    SEED_PEERS.forEach((p, i) => upd.run(p.dock, p.cx, p.about, `peer${i + 1}@seed.shipyard`));
    return;
  }
  const now = Date.now();
  const insUser = db.prepare(`
    INSERT INTO users (email, pass_hash, salt, name, project, tariff, seed_pts, seed_lvl, created_at, about, dock, complexity)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);
  const insDemo = db.prepare(
    "INSERT INTO demos (user_id, week, text, link, created_at) VALUES (?,?,?,?,?)");
  const insVote = db.prepare("INSERT OR IGNORE INTO votes (user_id, demo_id) VALUES (?,?)");

  const ids = [];
  SEED_PEERS.forEach((p, i) => {
    const salt = crypto.randomBytes(16).toString("hex");
    const pass = crypto.randomBytes(24).toString("hex"); // войти нельзя — пароль случайный
    const r = insUser.run(`peer${i + 1}@seed.shipyard`, hashPassword(pass, salt), salt,
      p.name, p.project, "Solo", p.pts, p.lvl, now - (7 - i) * 86400000, p.about, p.dock, p.cx);
    ids.push(Number(r.lastInsertRowid));
  });
  SEED_PEERS.forEach((p, i) => {
    if (!p.demo) return;
    const r = insDemo.run(ids[i], p.demo.week, p.demo.text, "", now - (6 - i) * 86400000);
    const demoId = Number(r.lastInsertRowid);
    // немного взаимных голосов, чтобы стена была живой
    ids.filter((_, j) => j !== i && j < 4).forEach(uid => insVote.run(uid, demoId));
  });
}

seed();

module.exports = { db, hashPassword, DATA_DIR };
