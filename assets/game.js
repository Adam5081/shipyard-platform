/* ============================================================
   Taulau — пиксельный движок карты пути
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
  try { colors = { jacket: at(2, 14), skin: at(5, 4), tie: at(7, 14), shirt: at(7, 13) }; }
  catch { colors = null; }                    // холст «испачкан» — работаем на запасных цветах
  if (colors) colorCache.set(dataUrl, colors);
  return colors;
}

const darken = (css, k) => {
  const m = /rgb\((\d+),(\d+),(\d+)\)/.exec(css);
  if (!m) return css;
  return `rgb(${Math.round(m[1] * k)},${Math.round(m[2] * k)},${Math.round(m[3] * k)})`;
};

/* ---------------- сцены станций ----------------
   Каждый этап — отдельная карта: фон на весь кадр, время суток движется
   от рассвета (станция 0) к ночи (станция 8), персонаж идёт по дороге
   слева направо по мере закрытия задач станции. */

const SW = 340;            // ширина сцены в пиксель-юнитах
const SH = 150;            // высота сцены
const HORIZON = 100;       // линия горизонта: на ней стоит дальний город
const ROAD = 124;          // верх дороги, по ней идёт персонаж
const ROAD_H = 12;
const SSTART = 26;         // старт персонажа
const SFINISH = 300;       // финишный флаг

/* дальние силуэты Астаны — общие кисти сцен */

function fTower(ctx, x, base, w, h, color, win) {
  ctx.fillStyle = color;
  ctx.fillRect(x, base - h, w, h);
  ctx.fillStyle = win || "rgba(255,255,255,.4)";
  for (let y = base - h + 3; y < base - 2; y += 4) ctx.fillRect(x + 1, y, w - 2, 1);
  ctx.fillStyle = "rgba(0,0,0,.07)";
  ctx.fillRect(x + w - 1, base - h, 1, h);
}

function fKhanShatyr(ctx, x, base, color) {
  ctx.fillStyle = color;
  for (let j = 0; j < 26; j++) {
    const w = Math.round(j * 0.9) + 2;
    ctx.fillRect(Math.round(x - w / 2 + j * 0.18), base - 26 + j, w, 1);
  }
  ctx.fillStyle = "rgba(0,0,0,.2)";
  ctx.fillRect(x, base - 28, 1, 3);
}

function fBaiterek(ctx, x, base, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x - 2, base - 30, 4, 30);
  ctx.fillRect(x - 5, base - 5, 10, 5);
  ctx.fillStyle = "rgba(255,255,255,.5)";
  for (let j = 0; j < 10; j++) ctx.fillRect(x - 3 + (j % 2), base - 27 + j * 2, 6, 1);
  ctx.fillStyle = "#f2c14e";
  ctx.fillRect(x - 4, base - 38, 8, 8);
  ctx.fillRect(x - 5, base - 35, 10, 3);
  ctx.fillStyle = "#ffe9a8";
  ctx.fillRect(x - 2, base - 36, 3, 3);
}

function fNurAlem(ctx, x, base, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, base - 14, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.5)";
  ctx.fillRect(x - 8, base - 20, 5, 3);
  ctx.fillStyle = "rgba(0,0,0,.08)";
  ctx.fillRect(x - 12, base - 14, 24, 1);
  ctx.fillStyle = color;
  ctx.fillRect(x - 9, base - 3, 18, 3);
}

function fAkOrda(ctx, x, base) {
  const ctx2 = ctx;
  ctx2.fillStyle = "#eef4f9";
  ctx2.fillRect(x - 12, base - 9, 24, 9);
  ctx2.beginPath();
  ctx2.arc(x, base - 9, 8, Math.PI, 0);
  ctx2.fill();
  ctx2.fillStyle = "#7fc0e0";
  ctx2.beginPath();
  ctx2.arc(x, base - 9, 5, Math.PI, 0);
  ctx2.fill();
  ctx2.fillStyle = "#8fa8c0";
  ctx2.fillRect(x - 1, base - 25, 2, 9);
  ctx2.fillStyle = "#f2c14e";
  ctx2.fillRect(x - 2, base - 28, 4, 3);
}

function fCrane(ctx, x, base, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, base - 34, 3, 34);              // мачта
  ctx.fillRect(x - 14, base - 34, 34, 2);         // стрела
  ctx.fillRect(x + 18, base - 32, 1, 6);          // трос
  ctx.fillStyle = "#f2c14e";
  ctx.fillRect(x + 16, base - 26, 5, 4);          // груз
  ctx.fillStyle = color;
  ctx.fillRect(x - 3, base - 3, 9, 3);            // основание
}

/* конфигурация сцен: небо, солнце/звёзды, зелень и набор силуэтов */

const SCENES = [
  { sky: ["#ffd9a0", "#ffeecb", "#f6f2e4"], sun: [36, 30], grass: "#94c065", soil: "#caa877",
    far: "#d8b48f", mid: "#e2c5a2",
    marks: ctx => { fCrane(ctx, 70, HORIZON, "#c0a17c"); fTower(ctx, 150, HORIZON, 8, 22, "#d8b48f"); fCrane(ctx, 240, HORIZON, "#c0a17c"); fTower(ctx, 290, HORIZON, 6, 14, "#e2c5a2"); } },
  { sky: ["#a8d8f0", "#d6ecfa", "#eef7ea"], sun: [60, 22], grass: "#8fbf5f", soil: "#c8a878",
    far: "#b3c6d8", mid: "#c6d5e2",
    marks: ctx => { fTower(ctx, 60, HORIZON, 7, 20, "#b3c6d8"); fKhanShatyr(ctx, 170, HORIZON, "#c6d5e2"); fTower(ctx, 270, HORIZON, 6, 16, "#b3c6d8"); } },
  { sky: ["#8fd0f5", "#cfeaf9", "#f3f7e9"], sun: [100, 16], grass: "#8fbf5f", soil: "#c2a06e",
    far: "#b3c6d8", mid: "#c6d5e2",
    marks: ctx => { fTower(ctx, 50, HORIZON, 8, 28, "#b3c6d8"); fTower(ctx, 64, HORIZON, 6, 18, "#c6d5e2"); fTower(ctx, 200, HORIZON, 9, 34, "#b3c6d8"); fTower(ctx, 285, HORIZON, 7, 22, "#c6d5e2"); } },
  { sky: ["#7cc8f5", "#c8e8fb", "#eef6ee"], sun: [150, 12], grass: "#86b957", soil: "#c2a06e",
    far: "#b3c6d8", mid: "#c6d5e2",
    marks: ctx => { fTower(ctx, 60, HORIZON, 7, 24, "#b3c6d8"); fBaiterek(ctx, 170, HORIZON, "#c6d5e2"); fTower(ctx, 280, HORIZON, 8, 26, "#b3c6d8"); } },
  { sky: ["#6ec0f2", "#bfe4fa", "#e9f4f0"], sun: [190, 10], grass: "#86b957", soil: "#bd9c6a",
    far: "#a8bfd4", mid: "#bccfe0",
    marks: ctx => { fTower(ctx, 55, HORIZON, 6, 20, "#a8bfd4"); fNurAlem(ctx, 175, HORIZON, "#a8cade"); fTower(ctx, 290, HORIZON, 7, 24, "#bccfe0"); } },
  { sky: ["#79c0ee", "#cfe6f6", "#f2ecd9"], sun: [230, 14], grass: "#7fb355", soil: "#bd9c6a",
    far: "#a8bfd4", mid: "#bccfe0",
    marks: ctx => { fTower(ctx, 45, HORIZON, 9, 36, "#a8bfd4"); fTower(ctx, 62, HORIZON, 6, 24, "#bccfe0"); fTower(ctx, 190, HORIZON, 8, 30, "#a8bfd4"); fTower(ctx, 285, HORIZON, 10, 40, "#93aac2"); } },
  { sky: ["#f6b26b", "#f9d9b0", "#f3e6d5"], sun: [260, 26], grass: "#79a84e", soil: "#b08f60",
    far: "#b08f8a", mid: "#c4a89b",
    marks: ctx => { fTower(ctx, 55, HORIZON, 7, 26, "#b08f8a"); fAkOrda(ctx, 175, HORIZON); fTower(ctx, 285, HORIZON, 6, 20, "#c4a89b"); } },
  { sky: ["#7d85b5", "#b4b9d6", "#e0e0ea"], sun: null, stars: true, grass: "#5f7f4a", soil: "#8f7a58",
    far: "#5a6584", mid: "#6d7897",
    marks: ctx => { fTower(ctx, 60, HORIZON, 9, 38, "#5a6584", "rgba(255,220,120,.75)"); fTower(ctx, 150, HORIZON, 7, 28, "#6d7897", "rgba(255,220,120,.6)"); fTower(ctx, 260, HORIZON, 10, 44, "#5a6584", "rgba(255,220,120,.75)"); } },
  { sky: ["#22304f", "#3d4d78", "#7c88ac"], sun: null, stars: true, moon: [280, 22], grass: "#4d6b40", soil: "#6f6048",
    far: "#3a4763", mid: "#4a577a",
    marks: ctx => { fTower(ctx, 50, HORIZON, 8, 30, "#3a4763", "rgba(255,220,120,.85)"); fKhanShatyr(ctx, 120, HORIZON, "#4a577a"); fBaiterek(ctx, 200, HORIZON, "#4a577a"); fTower(ctx, 260, HORIZON, 7, 24, "#3a4763", "rgba(255,220,120,.85)"); } },
];

/* детерминированная «случайность» для звёзд и деревьев */
const rnd = (i, k) => ((i * 73 + k * 137) % 997) / 997;

class StationScene {
  constructor(canvas) {
    this.cv = canvas;
    this.ctx = canvas.getContext("2d");
    this.data = { index: 0, progress: 0, hero: false, avatar: "", peers: [] };
    this.t = 0;
    this.charX = SSTART;
    this.targetX = SSTART;
    this.dead = false;

    this._resize = () => this.resize();
    window.addEventListener("resize", this._resize);
    this.resize();
    this.loop();
  }

  destroy() {
    this.dead = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this._resize);
  }

  resize() {
    const parentW = this.cv.parentElement ? this.cv.parentElement.clientWidth : 900;
    const w = Math.max(320, parentW);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.scale = w / SW;
    this.cv.width = Math.round(w * dpr);
    this.cv.height = Math.round(SH * this.scale * dpr);
    this.cv.style.width = w + "px";
    this.cv.style.height = Math.round(SH * this.scale) + "px";
    this.ctx.setTransform(this.scale * dpr, 0, 0, this.scale * dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = false;
  }

  set(data) {
    const sceneChanged = data.index !== undefined && data.index !== this.data.index;
    Object.assign(this.data, data);
    const p = Math.max(0, Math.min(1, this.data.progress || 0));
    this.targetX = SSTART + p * (SFINISH - 24 - SSTART);
    // при смене сцены персонаж появляется на месте — бежит только внутри своей карты
    if (sceneChanged) this.charX = this.targetX;
  }

  loop() {
    if (this.dead) return;
    this.t += 1 / 60;
    const d = this.targetX - this.charX;
    if (Math.abs(d) > 0.15) this.charX += Math.sign(d) * Math.min(Math.abs(d), 1.1);
    else this.charX = this.targetX;
    this.draw();
    this.raf = requestAnimationFrame(() => this.loop());
  }

  scene() { return SCENES[Math.max(0, Math.min(8, this.data.index || 0))]; }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, SW, SH);
    this.sky();
    this.scene().marks(ctx);   // силуэты города на горизонте
    this.meadow();
    this.road();
    this.startPost();
    this.finish();
    this.peers();
    if (this.data.hero) this.hero();
    if (this.data.locked) {
      ctx.fillStyle = "rgba(240,244,248,.45)";      // станция впереди — сцена в дымке
      ctx.fillRect(0, 0, SW, SH);
    }
  }

  sky() {
    const ctx = this.ctx;
    const sc = this.scene();
    const grad = ctx.createLinearGradient(0, 0, 0, HORIZON + 8);
    grad.addColorStop(0, sc.sky[0]);
    grad.addColorStop(0.6, sc.sky[1]);
    grad.addColorStop(1, sc.sky[2]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, SW, HORIZON + 8);

    if (sc.sun) {
      const [sx, sy] = sc.sun;
      ctx.fillStyle = "#ffd84d";
      ctx.fillRect(sx, sy, 10, 10);
      ctx.fillRect(sx - 2, sy + 2, 14, 6);
      ctx.fillRect(sx + 2, sy - 2, 6, 14);
    }
    if (sc.moon) {
      const [mx, my] = sc.moon;
      ctx.fillStyle = "#f2ecd9";
      ctx.beginPath(); ctx.arc(mx, my, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = sc.sky[0];
      ctx.beginPath(); ctx.arc(mx - 3, my - 2, 6, 0, Math.PI * 2); ctx.fill();
    }
    if (sc.stars) {
      ctx.fillStyle = "rgba(255,255,255,.85)";
      for (let k = 0; k < 26; k++) {
        const x = Math.round(rnd(this.data.index, k) * SW);
        const y = Math.round(rnd(this.data.index, k + 40) * (HORIZON - 30));
        const tw = Math.sin(this.t * 2 + k) > 0.4 ? 1 : 0;
        if (tw) ctx.fillRect(x, y, 1, 1);
      }
    }

    // облака — медленный дрейф (ночью почти не видны)
    const clouds = [[30, 18], [120, 10], [200, 24], [255, 14]];
    ctx.fillStyle = sc.stars ? "rgba(255,255,255,.14)" : "rgba(255,255,255,.92)";
    clouds.forEach(([cx, cy], i) => {
      const x = Math.round((cx + this.t * (3 + i)) % (SW + 40)) - 20;
      ctx.fillRect(x, cy, 14, 4);
      ctx.fillRect(x + 3, cy - 3, 8, 4);
      ctx.fillRect(x + 9, cy - 2, 6, 3);
    });
  }

  /* луг между горизонтом и дорогой: газон, деревья, кусты */
  meadow() {
    const ctx = this.ctx;
    const sc = this.scene();
    const i = this.data.index || 0;
    ctx.fillStyle = sc.grass;
    ctx.fillRect(0, HORIZON, SW, ROAD - HORIZON);
    ctx.fillStyle = "rgba(0,0,0,.06)";
    ctx.fillRect(0, HORIZON, SW, 2);

    for (let k = 0; k < 7; k++) {
      const x = Math.round(20 + rnd(i, k + 7) * (SW - 40));
      const y = HORIZON + 4 + Math.round(rnd(i, k + 19) * 10);
      if (k % 2) {                                   // дерево
        ctx.fillStyle = "#6f5138";
        ctx.fillRect(x, y + 4, 2, 5);
        ctx.fillStyle = darken(sc.grass, 0.62);
        ctx.fillRect(x - 3, y - 2, 8, 6);
        ctx.fillRect(x - 1, y - 4, 4, 3);
      } else {                                       // куст
        ctx.fillStyle = darken(sc.grass, 0.7);
        ctx.fillRect(x - 2, y + 4, 6, 3);
      }
    }
  }

  road() {
    const ctx = this.ctx;
    const sc = this.scene();
    ctx.fillStyle = sc.soil;
    ctx.fillRect(0, ROAD, SW, ROAD_H);
    ctx.fillStyle = "rgba(0,0,0,.10)";
    ctx.fillRect(0, ROAD, SW, 1);
    // разметка тропы
    ctx.fillStyle = "rgba(255,255,255,.35)";
    for (let x = 4; x < SW; x += 16) ctx.fillRect(x, ROAD + ROAD_H / 2, 7, 1);
    // обочина внизу
    ctx.fillStyle = darken(sc.soil, 0.75);
    ctx.fillRect(0, ROAD + ROAD_H, SW, SH - ROAD - ROAD_H);
  }

  startPost() {
    const ctx = this.ctx;
    ctx.fillStyle = "#6b7280";
    ctx.fillRect(8, ROAD - 28, 3, 28);
    ctx.fillStyle = "#eef2f6";
    ctx.fillRect(11, ROAD - 28, 16, 11);
    ctx.fillStyle = "#1d1d1f";
    ctx.font = "7px monospace";
    ctx.fillText(String(this.data.index ?? 0), 16, ROAD - 19);
  }

  /* финиш сцены: флаг станции, шлагбаум КТ или дверь MVP на последней */
  finish() {
    const ctx = this.ctx;
    const x = SFINISH;
    const d = this.data;
    const base = ROAD + 2;

    if (d.index === 8) {                             // дверь MVP — в рост персонажа
      const open = !!d.doorOpen;
      ctx.fillStyle = open ? "#2a7d46" : "#5b4632";
      ctx.fillRect(x - 16, base - 74, 32, 74);
      ctx.fillStyle = open ? "#7ee08a" : "#7a5c3f";
      ctx.fillRect(x - 12, base - 69, 24, 69);
      if (open) {
        const glow = 0.35 + Math.sin(this.t * 3) * 0.15;
        ctx.fillStyle = `rgba(255,255,255,${glow})`;
        ctx.fillRect(x - 12, base - 69, 24, 69);
      }
      ctx.fillStyle = P.y;
      ctx.fillRect(x + 6, base - 38, 3, 3);
      ctx.fillStyle = "#1d1d1f";
      ctx.fillRect(x - 19, base - 88, 38, 12);
      ctx.fillStyle = open ? P.g : "#8a8f98";
      ctx.font = "bold 9px monospace";
      ctx.fillText("MVP", x - 13, base - 79);
      return;
    }

    const col = d.done ? P.g : d.hero ? P.b : "#9aa0a8";
    ctx.fillStyle = "#6b7280";
    ctx.fillRect(x, ROAD - 52, 3, 54);
    const wave = Math.round(Math.sin(this.t * 2.5) * 1);
    ctx.fillStyle = col;
    ctx.fillRect(x + 3, ROAD - 52, 18, 11);
    ctx.fillRect(x + 3, ROAD - 41 + wave, 13, 3);
    ctx.fillStyle = "#fff";
    ctx.font = "7px monospace";
    ctx.fillText(String((d.index ?? 0) + 1), x + 8, ROAD - 44);

    // контрольная точка — шлагбаум поперёк дороги
    if (d.gate) {
      ctx.fillStyle = d.gatePassed ? P.g : "#e0a33a";
      ctx.fillRect(x + 26, ROAD - 30, 4, 32);
      const arm = d.gatePassed ? -24 : 0;            // пройдена — стрела поднята
      ctx.fillRect(x + 26 - (d.gatePassed ? 3 : 24), ROAD - 30 + arm, d.gatePassed ? 6 : 27, 4);
      ctx.fillStyle = "rgba(0,0,0,.15)";
      ctx.fillRect(x + 26, ROAD + 2, 4, 1);
    }

    // инструмент станции парит над финишем, когда станция закрыта
    if (d.done && d.tool && TOOLS[d.tool]) {
      const bob = Math.round(Math.sin(this.t * 2) * 1.5);
      drawSprite(ctx, TOOLS[d.tool], x - 22, ROAD - 74 + bob, 2);
      ctx.fillStyle = "rgba(255,255,255,.5)";
      ctx.fillRect(x - 22, ROAD - 56 + bob, 16, 2);
    }
  }

  peers() {
    const ctx = this.ctx;
    const peers = (this.data.peers || []).slice(0, 6);
    peers.forEach((p, idx) => {
      const frac = Math.max(0, Math.min(1, p.frac || 0));
      const px = Math.round(SSTART + frac * (SFINISH - 24 - SSTART));
      const bob = Math.sin(this.t * 2 + idx) * 0.6;
      const hy = Math.round(ROAD - 20 + bob + (idx % 2) * 3);
      ctx.globalAlpha = 0.5;
      const im = avatarImage(p.avatar);
      const hx = px - 26 - (idx % 3) * 10;
      ctx.fillStyle = "#5b6470";
      ctx.fillRect(hx + 6, hy + 19, 4, 9);
      ctx.fillRect(hx + 11, hy + 19, 4, 9);
      if (im) ctx.drawImage(im, hx, hy, 20, 20);
      else { ctx.fillStyle = "#d2b48c"; ctx.fillRect(hx + 3, hy + 3, 14, 14); }
      ctx.globalAlpha = 1;
    });
  }

  /* Персонаж переднего плана в пропорциях бойца из Mortal Kombat на Сеге:
     рост ~98px при сцене 150 (две трети экрана), голова — небольшая часть
     роста, полноценные торс, руки и ноги. Голова вырезается из спрайта-
     аватара (узнаваемое лицо), костюм дорисовывается его же цветами. */
  hero() {
    const ctx = this.ctx;
    const x = Math.round(this.charX);
    const ground = ROAD + 10;
    const moving = Math.abs(this.targetX - this.charX) > 0.2;
    const f = moving ? Math.floor(this.t * 9) % 4 : 0;   // фаза шага
    const stride = [0, 5, 0, -5][f];                     // вынос ног
    const bob = moving ? [0, -2, 0, -2][f] : Math.round(Math.sin(this.t * 1.6));
    const feet = ground + bob;

    const col = spriteColors(this.data.avatar) ||
      { jacket: "rgb(63,71,86)", skin: "rgb(232,176,136)", shirt: "rgb(241,242,245)", tie: "rgb(140,43,58)" };
    const trousers = darken(col.jacket, 0.72);
    const jacketDark = darken(col.jacket, 0.8);

    // тень на дороге
    ctx.fillStyle = "rgba(0,0,0,.18)";
    ctx.fillRect(x - 20, ground + 1, 41, 3);

    // ноги маятником: одна вперёд, другая назад
    ctx.fillStyle = trousers;
    ctx.fillRect(x - 11 + stride, feet - 40, 9, 37);
    ctx.fillRect(x + 2 - stride, feet - 40, 9, 37);
    ctx.fillStyle = "#1d1d1f";                           // ботинки
    ctx.fillRect(x - 13 + stride, feet - 4, 12, 4);
    ctx.fillRect(x + 1 - stride, feet - 4, 12, 4);

    // торс: пиджак с плечами, рубашка клином, галстук, ремень
    ctx.fillStyle = col.jacket;
    ctx.fillRect(x - 13, feet - 72, 26, 32);
    ctx.fillRect(x - 15, feet - 72, 30, 7);              // плечи
    ctx.fillStyle = col.shirt || "rgb(241,242,245)";
    ctx.fillRect(x - 4, feet - 72, 8, 12);
    ctx.fillStyle = col.tie || jacketDark;
    ctx.fillRect(x - 1, feet - 72, 3, 16);
    ctx.fillStyle = jacketDark;                          // лацканы и ремень
    ctx.fillRect(x - 7, feet - 72, 2, 13);
    ctx.fillRect(x + 5, feet - 72, 2, 13);
    ctx.fillRect(x - 13, feet - 42, 26, 2);

    // руки в противофазе с ногами
    const arm = moving ? [0, 4, 0, -4][f] : 0;
    ctx.fillStyle = col.jacket;
    ctx.fillRect(x - 20, feet - 70, 6, 30 + arm);
    ctx.fillRect(x + 14, feet - 70, 6, 30 - arm);
    ctx.fillStyle = col.skin;                            // кисти
    ctx.fillRect(x - 20, feet - 40 + arm, 6, 4);
    ctx.fillRect(x + 14, feet - 40 - arm, 6, 4);

    // шея и голова из аватара: берётся только лицо с причёской
    ctx.fillStyle = col.skin;
    ctx.fillRect(x - 3, feet - 77, 6, 5);
    const im = avatarImage(this.data.avatar);
    if (im) {
      const S = im.naturalWidth / 16;                    // голова в спрайте: колонки 3–12, строки 0–10
      ctx.drawImage(im, 3 * S, 0, 10 * S, 11 * S, x - 10, feet - 98, 20, 22);
    } else {
      ctx.fillStyle = col.skin; ctx.fillRect(x - 8, feet - 94, 16, 17);
      ctx.fillStyle = "#3d2a1d"; ctx.fillRect(x - 9, feet - 98, 18, 7);
    }
  }
}

window.SHIPYARD_GAME = { PixelAvatar, StationScene, TOOLS, drawSprite };

})();
