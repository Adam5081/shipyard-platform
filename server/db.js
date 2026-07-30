/* SQLite (встроенный node:sqlite, Node ≥ 22) — схема и сиды пилотного потока. */

const { DatabaseSync } = require("node:sqlite");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const DATA_DIR = path.join(__dirname, "data");
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
`);

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 32).toString("hex");
}

/* --- сид пилотного потока: 7 участников со стеной демо, как в концепции --- */

const SEED_PEERS = [
  { name: "Айгерим С.",  project: "MedQueue — запись в частные клиники", pts: 720, lvl: 4,
    demo: { week: 3, text: "Ключевой сценарий записи работает: пациент выбирает врача, слот бронируется, клиника видит запись в панели." } },
  { name: "Данияр Т.",   project: "CargoLink — биржа попутных грузов", pts: 660, lvl: 4,
    demo: { week: 3, text: "Собрал матчинг груза и машины через Claude Code. Показал на реальных заявках двух перевозчиков." } },
  { name: "Мария К.",    project: "LexDraft — генератор договоров", pts: 605, lvl: 3,
    demo: { week: 3, text: "Генерация договора аренды из анкеты: 12 полей → готовый документ. Юрист потока проверил формулировки." } },
  { name: "Ерлан Ж.",    project: "AgroScan — учёт полей для фермеров", pts: 540, lvl: 3,
    demo: { week: 2, text: "Урезал MVP с 9 функций до одной: карта поля + заметки агронома. CLAUDE.md утверждён на G2." } },
  { name: "Салтанат Б.", project: "EduPay — оплата кружков для школ", pts: 470, lvl: 3,
    demo: { week: 2, text: "7 интервью с директорами кружков: боль подтвердили 6 из 7. Ценностное предложение переписала трижды." } },
  { name: "Тимур А.",    project: "FitDesk — абонементы для студий", pts: 390, lvl: 2,
    demo: { week: 3, text: "Каркас на заготовке авторизации программы. Первый спринт закрыт за 4 вечера." } },
  { name: "Жанна О.",    project: "TenderEye — мониторинг закупок", pts: 310, lvl: 2, demo: null },
];

function seed() {
  const count = db.prepare("SELECT COUNT(*) AS n FROM users WHERE seed_pts > 0").get().n;
  if (count > 0) return;
  const now = Date.now();
  const insUser = db.prepare(
    "INSERT INTO users (email, pass_hash, salt, name, project, tariff, seed_pts, seed_lvl, created_at) VALUES (?,?,?,?,?,?,?,?,?)");
  const insDemo = db.prepare(
    "INSERT INTO demos (user_id, week, text, link, created_at) VALUES (?,?,?,?,?)");
  const insVote = db.prepare("INSERT OR IGNORE INTO votes (user_id, demo_id) VALUES (?,?)");

  const ids = [];
  SEED_PEERS.forEach((p, i) => {
    const salt = crypto.randomBytes(16).toString("hex");
    const pass = crypto.randomBytes(24).toString("hex"); // войти нельзя — пароль случайный
    const r = insUser.run(`peer${i + 1}@seed.shipyard`, hashPassword(pass, salt), salt,
      p.name, p.project, "Solo", p.pts, p.lvl, now - (7 - i) * 86400000);
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

module.exports = { db, hashPassword };
