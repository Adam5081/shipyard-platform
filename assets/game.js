/* ============================================================
   SHIPYARD — пиксельный движок карты пути
   · PixelAvatar — фото участника → мультяшный пиксельный спрайт
   · CityMap     — карта Астаны: персонаж идёт по станциям к двери MVP
   Никаких зависимостей, всё рисуется на canvas.
   ============================================================ */

(() => {
"use strict";

/* ---------------- палитра пиксель-арта ---------------- */

const P = {
  k: "#1d1d1f", w: "#ffffff", y: "#ffcc00", o: "#ff9500", r: "#ff3b30",
  b: "#0071e3", c: "#30b0c7", g: "#34c759", n: "#8a6240", s: "#b8bcc4",
  v: "#af52de", d: "#5a5f6a",
};

/* 8×8 спрайты инструментов, которые собираются на станциях */
const TOOLS = {
  wrench: [
    ".....ss.",
    "....s..s",
    "....s..s",
    "...ssss.",
    "..ss....",
    ".ss.....",
    "ss......",
    "s.......",
  ],
  mic: [
    "...ss...",
    "..s..s..",
    "..s..s..",
    "..s..s..",
    "..s..s..",
    ".s.ss.s.",
    "...ss...",
    "..ssss..",
  ],
  blueprint: [
    "bbbbbbbb",
    "b......b",
    "b.wwww.b",
    "b.w..w.b",
    "b.wwww.b",
    "b......b",
    "bbbbbbbb",
    "........",
  ],
  hammer: [
    ".ssss...",
    "ssssss..",
    ".ssss.s.",
    "...n....",
    "...n....",
    "...n....",
    "...n....",
    "........",
  ],
  gear: [
    ".s.ss.s.",
    ".ssssss.",
    "ss.ss.ss",
    "sss..sss",
    "sss..sss",
    "ss.ss.ss",
    ".ssssss.",
    ".s.ss.s.",
  ],
  shield: [
    ".cccccc.",
    ".c.ww.c.",
    ".cwwwwc.",
    ".c.ww.c.",
    ".cccccc.",
    "..cccc..",
    "...cc...",
    "........",
  ],
  rocket: [
    "...ww...",
    "..wwww..",
    "..wrrw..",
    "..wwww..",
    ".w.ww.w.",
    ".w.ww.w.",
    "...oo...",
    "...o....",
  ],
  megaphone: [
    "....oo..",
    "...ooo..",
    "..oooo..",
    ".ooooo..",
    "..oooo..",
    "...ooo..",
    "....oo..",
    "........",
  ],
  trophy: [
    ".yyyyyy.",
    "y.yyyy.y",
    "y.yyyy.y",
    ".yyyyyy.",
    "..yyyy..",
    "...yy...",
    "..yyyy..",
    ".yyyyyy.",
  ],
};

function drawSprite(ctx, rows, x, y, px = 1) {
  for (let j = 0; j < rows.length; j++) {
    for (let i = 0; i < rows[j].length; i++) {
      const c = P[rows[j][i]];
      if (!c) continue;
      ctx.fillStyle = c;
      ctx.fillRect(x + i * px, y + j * px, px, px);
    }
  }
}

/* ---------------- фото → пиксельный персонаж ----------------
   Уменьшать фото до 16 пикселей бессмысленно — получается пятно.
   Вместо этого из портрета вынимаются цвета (волосы, кожа, пиджак,
   рубашка, галстук) и собирается нарисованный спрайт-бюст: узнаётся
   и причёска, и костюм, и галстук. */

const PixelAvatar = {
  SIZE: 16,

  async fromFile(file) {
    const img = await readImage(file);
    return this.build(this.samplePortrait(img));
  },

  /* Замер портрета. Кадр не режем — фото целиком растягивается в сетку
     100×100 (для замера цвета искажение неважно), затем ищется полоса лица,
     и все зоны отсчитываются от неё. Так работает и квадратное фото,
     и вертикальное, и снятое с разного расстояния. */
  samplePortrait(img) {
    const N = 100;
    const cv = document.createElement("canvas");
    cv.width = cv.height = N;
    const ctx = cv.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, N, N);
    const px = ctx.getImageData(0, 0, N, N).data;

    const at = (x, y) => { const i = (y * N + x) * 4; return [px[i], px[i + 1], px[i + 2]]; };
    const clampN = v => Math.max(0, Math.min(N - 1, Math.round(v)));
    const avg = (x0, y0, x1, y1) => {
      let r = 0, g = 0, b = 0, n = 0;
      for (let y = clampN(y0); y <= clampN(y1); y++) for (let x = clampN(x0); x <= clampN(x1); x++) {
        const i = (y * N + x) * 4;
        r += px[i]; g += px[i + 1]; b += px[i + 2]; n++;
      }
      return n ? [r / n, g / n, b / n] : [128, 128, 128];
    };
    const mix2 = (a, b) => a.map((v, i) => (v + b[i]) / 2);

    /* Для волос усредняем только самые тёмные пиксели зоны: над головой
       почти всегда есть фон, и он светлее причёски. */
    const avgDark = (x0, y0, x1, y1, frac = 0.45) => {
      const list = [];
      for (let y = clampN(y0); y <= clampN(y1); y++) for (let x = clampN(x0); x <= clampN(x1); x++) {
        const c = at(x, y);
        list.push([0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2], c]);
      }
      if (!list.length) return [80, 70, 60];
      list.sort((a, b) => a[0] - b[0]);
      const take = list.slice(0, Math.max(1, Math.round(list.length * frac)));
      return take.reduce((s, [, c]) => [s[0] + c[0] / take.length, s[1] + c[1] / take.length, s[2] + c[2] / take.length], [0, 0, 0]);
    };

    // пиксель похож на кожу: красного заметно больше синего, но не как у кирпича
    const skinLike = ([r, g, b]) =>
      r > 60 && r < 253 && r > g + 8 && r - b > 12 && r - b < 115 && Math.abs(g - b) < 75;

    // самая длинная полоса строк, где кожи много, — лицо
    const rows = [];
    for (let y = 0; y < N; y++) {
      let n = 0;
      for (let x = 20; x < 80; x++) if (skinLike(at(x, y))) n++;
      rows.push(n);
    }
    let top = -1, bot = -1, bestLen = 0, curStart = -1;
    for (let y = 0; y <= N; y++) {
      if (y < N && rows[y] >= 6) { if (curStart < 0) curStart = y; }
      else if (curStart >= 0) {
        if (y - curStart > bestLen) { bestLen = y - curStart; top = curStart; bot = y - 1; }
        curStart = -1;
      }
    }
    if (bestLen < 8) { top = 18; bot = 48; }          // лицо не нашлось — обычная портретная рамка
    const fh = Math.max(10, bot - top);

    // горизонтальный центр лица
    let cx = 50, l = 100, r = 0;
    for (let x = 0; x < N; x++) {
      let n = 0;
      for (let y = top; y <= bot; y++) if (skinLike(at(x, y))) n++;
      if (n >= fh * 0.35) { if (x < l) l = x; if (x > r) r = x; }
    }
    if (r > l) cx = Math.round((l + r) / 2);

    const hair   = avgDark(cx - 7, top - fh * 0.34, cx + 7, top - fh * 0.05);
    const skin   = mix2(avg(cx - 11, top + fh * 0.26, cx - 5, top + fh * 0.46),
                        avg(cx + 5, top + fh * 0.26, cx + 11, top + fh * 0.46));
    const shirt  = mix2(avg(cx - 11, bot + fh * 0.02, cx - 6, bot + fh * 0.28),
                        avg(cx + 6, bot + fh * 0.02, cx + 11, bot + fh * 0.28));
    const tie    = avg(cx - 2, bot + fh * 0.45, cx + 2, bot + fh * 1.1);
    // плечи берём повыше: ниже пиджак уходит в тень и сереет до чёрного
    const jacket = mix2(avg(cx - 26, bot + fh * 0.05, cx - 17, bot + fh * 0.5),
                        avg(cx + 17, bot + fh * 0.05, cx + 26, bot + fh * 0.5));

    const p = {
      hair: toon(hair, 1.05, 0.9),
      skin: toon(skin, 1.1, 1.14),
      shirt: toon(shirt, 0.9, 1.16),
      tie: toon(tie, 1.4, 1.0),
      jacket: toon(jacket, 1.05, 1.26),
    };
    // волосы не могут совпадать с кожей: значит, замер попал на лоб или фон
    if (dist(p.hair, p.skin) < 50) p.hair = shade(p.skin, 0.32);
    // рубашка не должна сливаться с пиджаком: в костюме она всегда светлее
    if (dist(p.shirt, p.jacket) < 60 || dist(p.shirt, p.tie) < 55)
      p.shirt = lum(p.jacket) > 150 ? "#3a3f4a" : "#f1f2f5";
    if (dist(p.tie, p.shirt) < 45) p.tie = shade(p.jacket, 0.6);
    return p;
  },

  /* Без фото — тот же персонаж, но цвета собраны из имени. */
  generated(name) {
    const memo = this._memo || (this._memo = new Map());
    if (memo.has(name)) return memo.get(name);
    const h = hash(String(name || "?"));
    const url = this.build({
      skin:   ["#f0c8a0", "#e8b088", "#d69a70", "#b07a4e", "#8a5c3a"][h % 5],
      hair:   ["#241f1c", "#3d2a1d", "#6b4423", "#a8762f", "#5a3030"][(h >> 3) % 5],
      jacket: ["#3f4756", "#4a4f58", "#2f3a4a", "#55504a", "#3a4740"][(h >> 6) % 5],
      shirt:  "#f1f2f5",
      tie:    ["#8c2b3a", "#1f4e79", "#2f6b4f", "#7a4a1f", "#3f3f6b"][(h >> 9) % 5],
    });
    if (memo.size < 200) memo.set(name, url);
    return url;
  },

  /* Сборка спрайта 16×16: голова с причёской, плечи, рубашка, галстук. */
  build(p) {
    const cv = document.createElement("canvas");
    cv.width = cv.height = this.SIZE;
    const c = cv.getContext("2d");
    const R = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };

    const skinDark = shade(p.skin, 0.84);
    const hairLite = shade(p.hair, 1.35);
    const jacketDark = shade(p.jacket, 0.72);
    const eye = shade(p.hair, 0.55);

    // причёска
    R(4, 1, 8, 2, p.hair);
    R(3, 2, 10, 2, p.hair);
    // лицо
    R(4, 3, 8, 7, p.skin);
    // виски и уши
    R(3, 3, 1, 5, p.hair);
    R(12, 3, 1, 5, p.hair);
    R(3, 7, 1, 1, p.skin);
    R(12, 7, 1, 1, p.skin);
    // чёлка с пробором
    R(4, 3, 8, 1, p.hair);
    R(4, 4, 2, 1, p.hair);
    R(10, 4, 2, 1, p.hair);
    R(6, 3, 2, 1, hairLite);
    // глаза по одному пикселю: шире — читается как тёмная полоса на пол-лица
    R(6, 6, 1, 1, eye);
    R(9, 6, 1, 1, eye);
    // нос, рот, подбородок
    R(7, 7, 1, 1, skinDark);
    R(7, 8, 2, 1, shade(p.skin, 0.74));
    R(5, 9, 6, 1, p.skin);
    // шея
    R(6, 10, 4, 1, skinDark);
    // пиджак
    R(1, 11, 14, 5, p.jacket);
    c.clearRect(1, 11, 1, 1);
    c.clearRect(14, 11, 1, 1);
    // рубашка клином
    R(5, 11, 6, 1, p.shirt);
    R(6, 12, 4, 1, p.shirt);
    R(7, 13, 2, 1, p.shirt);
    // лацканы
    R(5, 12, 1, 1, jacketDark);
    R(10, 12, 1, 1, jacketDark);
    R(6, 13, 1, 1, jacketDark);
    R(9, 13, 1, 1, jacketDark);
    // галстук: узел и полотно
    R(7, 11, 2, 1, shade(p.tie, 1.2));
    R(7, 12, 2, 4, p.tie);

    return cv.toDataURL("image/png");
  },
};

const clamp255 = v => Math.max(0, Math.min(255, Math.round(v)));
const hex = ([r, g, b]) =>
  "#" + [r, g, b].map(v => clamp255(v).toString(16).padStart(2, "0")).join("");
const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const lum = h => { const [r, g, b] = rgb(h); return 0.299 * r + 0.587 * g + 0.114 * b; };
const dist = (a, b) => {
  const [r1, g1, b1] = rgb(a), [r2, g2, b2] = rgb(b);
  return Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
};
const shade = (h, k) => hex(rgb(h).map(v => v * k));

/* мультяшность: поднять насыщенность и слегка развести яркость */
function toon([r, g, b], sat, bri) {
  const a = (r + g + b) / 3;
  return hex([
    clamp255((a + (r - a) * sat) * bri),
    clamp255((a + (g - a) * sat) * bri),
    clamp255((a + (b - a) * sat) * bri),
  ]);
}

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    if (!file || !/^image\//.test(file.type)) return reject(new Error("Нужен файл изображения"));
    if (file.size > 12 * 1024 * 1024) return reject(new Error("Фото больше 12 МБ — возьмите поменьше"));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Не удалось прочитать фото")); };
    img.src = url;
  });
}

/* кэш картинок аватаров */
const imgCache = new Map();
function avatarImage(dataUrl) {
  if (!dataUrl) return null;
  let im = imgCache.get(dataUrl);
  if (!im) {
    im = new Image();
    im.src = dataUrl;
    imgCache.set(dataUrl, im);
  }
  return im.complete && im.naturalWidth ? im : null;   // догрузится — появится на следующем кадре
}

/* Цвета костюма читаются прямо из спрайта — ноги и руки на карте
   должны быть того же пиджака, что и бюст. */
const colorCache = new Map();
function spriteColors(dataUrl) {
  if (!dataUrl) return null;
  if (colorCache.has(dataUrl)) return colorCache.get(dataUrl);
  const im = avatarImage(dataUrl);
  if (!im) return null;
  const cv = document.createElement("canvas");
  cv.width = cv.height = im.naturalWidth;
  const ctx = cv.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(im, 0, 0);
  const S = cv.width / 16;                    // спрайт всегда 16 логических пикселей
  const at = (x, y) => {
    const d = ctx.getImageData(Math.round((x + 0.5) * S), Math.round((y + 0.5) * S), 1, 1).data;
    return `rgb(${d[0]},${d[1]},${d[2]})`;
  };
  let colors = null;
  try { colors = { jacket: at(2, 14), skin: at(5, 4), tie: at(7, 14) }; }
  catch { colors = null; }                    // холст «испачкан» — работаем на запасных цветах
  if (colors) colorCache.set(dataUrl, colors);
  return colors;
}

const darken = (css, k) => {
  const m = /rgb\((\d+),(\d+),(\d+)\)/.exec(css);
  if (!m) return css;
  return `rgb(${Math.round(m[1] * k)},${Math.round(m[2] * k)},${Math.round(m[3] * k)})`;
};

/* ---------------- карта пути ---------------- */

const PW = 340;          // ширина сцены в пиксель-юнитах
const PH = 124;          // высота сцены
const X0 = 22;           // центр первой станции
const DX = 34;           // шаг между станциями
const GROUND = 112;      // низ террас
const TOP = 96;          // верх нулевой террасы
const RISE = 7;          // подъём на станцию

const stationX = i => X0 + i * DX;
const stationTop = i => TOP - i * RISE;
const STEPS = 10;        // 9 станций + площадка двери

function stepAt(px) {
  return Math.max(0, Math.min(STEPS - 1, Math.round((px - X0) / DX)));
}

class CityMap {
  constructor(canvas, opts = {}) {
    this.cv = canvas;
    this.ctx = canvas.getContext("2d");
    this.onSelect = opts.onSelect || (() => {});
    this.data = { stations: [], walk: 0, station: 0, avatar: "", peers: [], name: "" };
    this.t = 0;
    this.hover = -1;
    this.charX = X0;
    this.targetX = X0;
    this.dead = false;

    this._click = e => {
      const i = this._pick(e);
      if (i >= 0) this.onSelect(i);
    };
    this._move = e => {
      const i = this._pick(e);
      if (i !== this.hover) { this.hover = i; canvas.style.cursor = i >= 0 ? "pointer" : "default"; }
    };
    this._leave = () => { this.hover = -1; };
    canvas.addEventListener("click", this._click);
    canvas.addEventListener("mousemove", this._move);
    canvas.addEventListener("mouseleave", this._leave);

    this._resize = () => this.resize();
    window.addEventListener("resize", this._resize);
    this.resize();
    this.loop();
  }

  destroy() {
    this.dead = true;
    cancelAnimationFrame(this.raf);
    this.cv.removeEventListener("click", this._click);
    this.cv.removeEventListener("mousemove", this._move);
    this.cv.removeEventListener("mouseleave", this._leave);
    window.removeEventListener("resize", this._resize);
  }

  _pick(e) {
    const r = this.cv.getBoundingClientRect();
    const px = (e.clientX - r.left) / (r.width / PW);
    const py = (e.clientY - r.top) / (r.height / PH);
    if (py < 0 || py > PH) return -1;
    const i = stepAt(px);
    return i;
  }

  resize() {
    const parentW = this.cv.parentElement ? this.cv.parentElement.clientWidth : 900;
    const w = Math.max(320, parentW);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.scale = w / PW;
    this.cv.width = Math.round(w * dpr);
    this.cv.height = Math.round(PH * this.scale * dpr);
    this.cv.style.width = w + "px";
    this.cv.style.height = Math.round(PH * this.scale) + "px";
    this.ctx.setTransform(this.scale * dpr, 0, 0, this.scale * dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = false;
  }

  set(data) {
    Object.assign(this.data, data);
    const w = Math.max(0, Math.min(1, this.data.walk || 0));
    this.targetX = X0 + w * (stationX(STEPS - 1) - X0);
    if (this.charX === X0 && w > 0 && this.t < 2) this.charX = this.targetX;
  }

  loop() {
    if (this.dead) return;
    this.t += 1 / 60;
    // персонаж догоняет свою позицию — движение видно глазом
    const d = this.targetX - this.charX;
    if (Math.abs(d) > 0.15) this.charX += Math.sign(d) * Math.min(Math.abs(d), 0.55);
    else this.charX = this.targetX;
    this.draw();
    this.raf = requestAnimationFrame(() => this.loop());
  }

  /* ---------- отрисовка ---------- */

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, PW, PH);
    this.sky();
    this.terraces();
    this.city();      // город стоит на террасах и поднимается вместе с треком
    this.stations();
    this.door();
    this.peers();
    this.hero();
  }

  sky() {
    const ctx = this.ctx;
    const grad = ctx.createLinearGradient(0, 0, 0, PH);
    grad.addColorStop(0, "#8fd0f5");
    grad.addColorStop(0.55, "#cfeaf9");
    grad.addColorStop(1, "#f3f7e9");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, PW, PH);

    // солнце
    ctx.fillStyle = "#ffd84d";
    ctx.fillRect(26, 12, 10, 10);
    ctx.fillRect(24, 14, 14, 6);
    ctx.fillRect(28, 10, 6, 14);

    // облака — медленный дрейф
    const clouds = [[30, 16], [120, 10], [200, 20], [255, 13]];
    ctx.fillStyle = "rgba(255,255,255,.92)";
    clouds.forEach(([cx, cy], i) => {
      const x = Math.round((cx + this.t * (3 + i)) % (PW + 40)) - 20;
      ctx.fillRect(x, cy, 14, 4);
      ctx.fillRect(x + 3, cy - 3, 8, 4);
      ctx.fillRect(x + 9, cy - 2, 6, 3);
    });
  }

  /* Астана поднимается вместе с треком: на каждой террасе — свой силуэт. */
  city() {
    const g = i => stationTop(i);
    const far = "#b3c6d8", mid = "#c6d5e2";

    this.tower(stationX(0) - 15, g(0), 7, 20, far);
    this.tower(stationX(0) - 6, g(0), 5, 13, mid);

    this.khanShatyr(stationX(1) - 10, g(1));

    this.tower(stationX(2) - 15, g(2), 6, 24, far);
    this.tower(stationX(2) - 7, g(2), 8, 16, mid);

    this.baiterek(stationX(3) - 10, g(3));

    this.nurAlem(stationX(4) - 12, g(4));

    this.tower(stationX(5) - 15, g(5), 7, 28, far);
    this.tower(stationX(5) - 6, g(5), 5, 18, mid);

    this.akOrda(stationX(6) - 15, g(6));

    this.tower(stationX(7) - 14, g(7), 9, 32, far);   // высотная доминанта

    this.tower(stationX(8) - 15, g(8), 6, 20, far);
    this.tower(stationX(8) - 7, g(8), 5, 14, mid);
  }

  tower(x, base, w, h, color) {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    ctx.fillRect(x, base - h, w, h);
    ctx.fillStyle = "rgba(255,255,255,.4)";
    for (let y = base - h + 3; y < base - 2; y += 4) ctx.fillRect(x + 1, y, w - 2, 1);
    ctx.fillStyle = "rgba(0,0,0,.07)";
    ctx.fillRect(x + w - 1, base - h, 1, h);
  }

  khanShatyr(x, base) {
    const ctx = this.ctx;
    ctx.fillStyle = "#c6d5e2";
    for (let j = 0; j < 20; j++) {
      const w = Math.round(j * 0.9) + 2;
      ctx.fillRect(Math.round(x - w / 2 + j * 0.18), base - j, w, 1);
    }
    ctx.fillStyle = "#8fa8c0";
    ctx.fillRect(x, base - 21, 1, 3);
  }

  baiterek(x, base) {
    const ctx = this.ctx;
    ctx.fillStyle = "#c6d5e2";
    ctx.fillRect(x - 2, base - 22, 4, 22);
    ctx.fillRect(x - 4, base - 4, 8, 4);
    ctx.fillStyle = "rgba(255,255,255,.5)";
    for (let j = 0; j < 7; j++) ctx.fillRect(x - 3 + (j % 2), base - 20 + j * 2, 6, 1);
    ctx.fillStyle = "#f2c14e";
    ctx.fillRect(x - 3, base - 28, 6, 6);
    ctx.fillRect(x - 4, base - 26, 8, 2);
    ctx.fillStyle = "#ffe9a8";
    ctx.fillRect(x - 2, base - 27, 2, 2);
  }

  nurAlem(x, base) {
    const ctx = this.ctx;
    ctx.fillStyle = "#a8cade";
    ctx.beginPath();
    ctx.arc(x, base - 11, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.5)";
    ctx.fillRect(x - 6, base - 15, 4, 2);
    ctx.fillStyle = "rgba(0,0,0,.06)";
    ctx.fillRect(x - 9, base - 11, 18, 1);
    ctx.fillStyle = "#c6d5e2";
    ctx.fillRect(x - 7, base - 3, 14, 3);
  }

  akOrda(x, base) {
    const ctx = this.ctx;
    ctx.fillStyle = "#eef4f9";
    ctx.fillRect(x - 9, base - 7, 18, 7);
    ctx.beginPath();
    ctx.arc(x, base - 7, 6, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = "#7fc0e0";
    ctx.beginPath();
    ctx.arc(x, base - 7, 4, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = "#8fa8c0";
    ctx.fillRect(x - 1, base - 20, 2, 7);
    ctx.fillStyle = "#f2c14e";
    ctx.fillRect(x - 2, base - 22, 4, 3);
  }

  terraces() {
    const ctx = this.ctx;
    for (let i = 0; i < STEPS; i++) {
      const x = stationX(i) - DX / 2;
      const top = stationTop(i);
      const gr = ctx.createLinearGradient(0, top, 0, GROUND);
      gr.addColorStop(0, "#dcc79c");
      gr.addColorStop(1, "#b4966a");
      ctx.fillStyle = gr;
      ctx.fillRect(x, top, DX, GROUND - top);
      // трава сверху
      ctx.fillStyle = "#8fbf5f";
      ctx.fillRect(x, top, DX, 3);
      ctx.fillStyle = "#79a84e";
      ctx.fillRect(x, top + 3, DX, 1);
      // слои породы — очень мягко
      ctx.fillStyle = "rgba(255,255,255,.16)";
      for (let y = top + 8; y < GROUND; y += 7) ctx.fillRect(x + 2, y, DX - 4, 1);
      // теневой уступ слева
      ctx.fillStyle = "rgba(0,0,0,.10)";
      ctx.fillRect(x, top, 1, GROUND - top);
    }
  }

  stations() {
    const ctx = this.ctx;
    const st = this.data.stations || [];
    for (let i = 0; i < 9; i++) {
      const s = st[i] || {};
      const x = stationX(i);
      const top = stationTop(i);
      const state = s.done ? "done" : i === this.data.station ? "current" : "wait";
      const col = state === "done" ? P.g : state === "current" ? P.b : "#9aa0a8";

      // флагшток
      ctx.fillStyle = "#6b7280";
      ctx.fillRect(x + 9, top - 15, 1, 15);
      // полотнище — колышется
      const wave = Math.round(Math.sin(this.t * 2.5 + i) * 1);
      ctx.fillStyle = col;
      ctx.fillRect(x + 10, top - 15, 8, 5);
      ctx.fillRect(x + 10, top - 10 + wave, 6, 1);

      // номер недели на полотнище
      ctx.fillStyle = "#fff";
      ctx.font = "4px monospace";
      ctx.fillText(String(i), x + 12, top - 11);

      // подсветка при наведении
      if (this.hover === i) {
        ctx.fillStyle = "rgba(0,113,227,.18)";
        ctx.fillRect(x - DX / 2, top - 20, DX, GROUND - top + 20);
      }

      // собранный инструмент парит над станцией
      if (s.done && s.tool && TOOLS[s.tool]) {
        const bob = Math.round(Math.sin(this.t * 2 + i) * 1.5);
        drawSprite(ctx, TOOLS[s.tool], x - 4, top - 28 + bob, 1);
        ctx.fillStyle = "rgba(255,255,255,.5)";
        ctx.fillRect(x - 4, top - 20 + bob, 8, 1);
      }

      // контрольная точка — шлагбаум между станциями
      if (s.gate) {
        const gx = x + DX / 2 - 2;
        const gtop = Math.min(top, stationTop(i + 1)) - 12;
        ctx.fillStyle = s.gatePassed ? P.g : "#e0a33a";
        ctx.fillRect(gx, gtop, 4, 12);
        ctx.fillStyle = s.gatePassed ? "rgba(52,199,89,.35)" : "rgba(224,163,58,.35)";
        ctx.fillRect(gx - 1, gtop - 3, 6, 3);
      }
    }
  }

  door() {
    const ctx = this.ctx;
    const x = stationX(9);
    const top = stationTop(9);
    const open = !!this.data.doorOpen;

    // портал
    ctx.fillStyle = open ? "#2a7d46" : "#5b4632";
    ctx.fillRect(x - 8, top - 22, 16, 22);
    ctx.fillStyle = open ? "#7ee08a" : "#7a5c3f";
    ctx.fillRect(x - 6, top - 20, 12, 20);
    if (open) {
      const glow = 0.35 + Math.sin(this.t * 3) * 0.15;
      ctx.fillStyle = `rgba(255,255,255,${glow})`;
      ctx.fillRect(x - 6, top - 20, 12, 20);
    }
    ctx.fillStyle = P.y;
    ctx.fillRect(x + 3, top - 11, 2, 2);

    // вывеска MVP
    ctx.fillStyle = "#1d1d1f";
    ctx.fillRect(x - 9, top - 30, 18, 7);
    ctx.fillStyle = open ? P.g : "#8a8f98";
    ctx.font = "bold 5px monospace";
    ctx.fillText("MVP", x - 6, top - 25);
  }

  peers() {
    const ctx = this.ctx;
    const peers = (this.data.peers || []).filter(p => !p.me).slice(0, 8);
    peers.forEach((p, idx) => {
      const px = X0 + Math.max(0, Math.min(1, p.walk || 0)) * (stationX(STEPS - 1) - X0);
      const top = stationTop(stepAt(px));
      const bob = Math.sin(this.t * 2 + idx) * 0.6;
      ctx.globalAlpha = 0.55;
      // маленькая фигурка позади героя
      const im = avatarImage(p.avatar);
      const hx = Math.round(px - 4 + (idx % 3) - 7), hy = Math.round(top - 14 + bob);
      ctx.fillStyle = "#5b6470";
      ctx.fillRect(hx + 3, hy + 9, 3, 5);
      if (im) ctx.drawImage(im, hx, hy, 9, 9);
      else { ctx.fillStyle = "#d2b48c"; ctx.fillRect(hx + 1, hy + 1, 7, 7); }
      ctx.globalAlpha = 1;
    });
  }

  hero() {
    const ctx = this.ctx;
    const x = Math.round(this.charX);
    const top = stationTop(stepAt(this.charX));
    const moving = Math.abs(this.targetX - this.charX) > 0.2;
    const step = moving ? Math.floor(this.t * 8) % 2 : 0;
    const bob = moving ? (step ? -1 : 0) : Math.round(Math.sin(this.t * 2) * 0.5);
    const feet = top + bob;

    const col = spriteColors(this.data.avatar) || { jacket: "rgb(63,71,86)", skin: "rgb(232,176,136)" };
    const trousers = darken(col.jacket, 0.78);

    // тень
    ctx.fillStyle = "rgba(0,0,0,.18)";
    ctx.fillRect(x - 6, top - 1, 13, 2);

    // ноги в брюках от костюма
    ctx.fillStyle = trousers;
    if (step) { ctx.fillRect(x - 5, feet - 6, 3, 6); ctx.fillRect(x + 2, feet - 5, 3, 5); }
    else { ctx.fillRect(x - 4, feet - 6, 3, 6); ctx.fillRect(x + 1, feet - 6, 3, 6); }
    ctx.fillStyle = "#1d1d1f";                       // туфли
    if (step) { ctx.fillRect(x - 6, feet - 1, 4, 1); ctx.fillRect(x + 2, feet - 1, 4, 1); }
    else { ctx.fillRect(x - 5, feet - 1, 4, 1); ctx.fillRect(x + 1, feet - 1, 4, 1); }

    // руки в рукавах пиджака
    ctx.fillStyle = col.jacket;
    if (step) { ctx.fillRect(x - 10, feet - 16, 2, 5); ctx.fillRect(x + 8, feet - 17, 2, 5); }
    else { ctx.fillRect(x - 10, feet - 17, 2, 5); ctx.fillRect(x + 8, feet - 16, 2, 5); }
    ctx.fillStyle = col.skin;                        // кисти
    if (step) { ctx.fillRect(x - 10, feet - 11, 2, 1); ctx.fillRect(x + 8, feet - 12, 2, 1); }
    else { ctx.fillRect(x - 10, feet - 12, 2, 1); ctx.fillRect(x + 8, feet - 11, 2, 1); }

    // бюст: голова, плечи, рубашка и галстук — одним спрайтом из фото
    const im = avatarImage(this.data.avatar);
    if (im) ctx.drawImage(im, x - 8, feet - 22, 16, 16);
    else {
      ctx.fillStyle = col.skin; ctx.fillRect(x - 4, feet - 19, 8, 7);
      ctx.fillStyle = col.jacket; ctx.fillRect(x - 7, feet - 11, 14, 5);
    }
  }
}

window.SHIPYARD_GAME = { PixelAvatar, CityMap, TOOLS, drawSprite };

})();
