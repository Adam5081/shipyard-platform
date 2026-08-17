/* ============================================================
   Taulau — живая демо-сцена кабинета на лендинге.
   Настоящий движок карты (game.js): при прокрутке к секции персонаж
   сам начинает проходить станции — идёт от вехи к вехе,
   закрывает станции и забирает инструменты. Не видео.
   ============================================================ */

(() => {
"use strict";

const cv = document.getElementById("ldCanvas");
if (!cv || !window.SHIPYARD_GAME) return;

const G = window.SHIPYARD_GAME;
const SW = 340;                       // логическая ширина сцены (как в game.js)

const STATIONS = [
  { title: "Диагностика и окружение", tool: "wrench" },
  { title: "Презентация проекта",     tool: "mic" },
  { title: "Чертёж продукта",         tool: "blueprint" },
  { title: "Ядро продукта",           tool: "hammer" },
  { title: "Обвязка",                 tool: "gear" },
  { title: "Тестирование и защита",   tool: "shield" },
  { title: "Продукт в сети",          tool: "rocket" },
  { title: "Защита проекта",          tool: "megaphone" },
  { title: "Вывод в рабочую среду",   tool: "trophy" },
];
const TOTAL = 5;                      // задач на станцию в демо

const avatar = G.PixelAvatar.generated("Основатель Демо");
const scene = new G.StationScene(cv);

const elStation = document.getElementById("ldStation");
const elFloat = document.getElementById("ldFloat");

let station = 0, done = 0, timer = null;

function apply() {
  scene.set({
    index: station,
    progress: done / TOTAL,
    hero: true,
    avatar,
    tasksTotal: TOTAL,
    tasksDone: done,
    done: done >= TOTAL,
    tool: STATIONS[station].tool,
    doorOpen: station === 8 && done >= TOTAL,
    gate: false,
    peers: [],
  });
  if (elStation) elStation.textContent = `Станция ${station + 1} из 9 · ${STATIONS[station].title}`;
}

/* всплывающие подсказки над вехой, к которой идёт персонаж */
function floatPts(text, cls) {
  if (!elFloat) return;
  const d = document.createElement("span");
  d.className = "ld-pt " + (cls || "");
  d.textContent = text;
  d.style.left = (scene.targetX / SW * 100) + "%";
  elFloat.appendChild(d);
  setTimeout(() => d.remove(), 1500);
}

function tick() {
  if (done < TOTAL) {
    done++;
    if (done >= TOTAL) floatPts("🚩 Станция закрыта — инструмент собран", "big");
    else floatPts("✓ Задача закрыта");
  } else {
    station = (station + 1) % 9;
    done = 0;
  }
  apply();
}

function start() {
  if (timer) return;
  station = 0; done = 0;
  apply();
  scene.charX = 26;                   // персонаж каждый раз проходит путь с нуля
  scene.vx = 0;
  timer = setInterval(tick, 1500);
}

function stop() {
  clearInterval(timer);
  timer = null;
}

/* прокрутил к секции — игра пошла; ушёл — пауза, чтобы не жечь батарею */
new IntersectionObserver(entries => {
  entries.forEach(e => (e.isIntersecting ? start() : stop()));
}, { threshold: 0.35 }).observe(cv);

apply();
})();
