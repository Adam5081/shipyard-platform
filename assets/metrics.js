/* ============================================================
   Taulau — лёгкая аналитика лендинга (без внешних сервисов).
   Что собираем: просмотры секций (какие блоки реально доскроллили
   и увидели), клики по кнопкам/ссылкам/вкладкам. Ничего личного:
   ни IP в базе, ни куков, ни отпечатков — только счётчики событий.
   Смотреть: админка → вкладка «Лендинг».
   ============================================================ */

(() => {
"use strict";

/* Google Analytics 4: подключается, только если в config.js задан SHIPYARD_GA_ID.
   Наши события (просмотры блоков, клики) дублируются в GA как кастомные. */
const GA = String(window.SHIPYARD_GA_ID || "").trim();
if (GA) {
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA);
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  gtag("js", new Date());
  gtag("config", GA);
}
const gaEvent = (event, label) => {
  if (GA && typeof window.gtag === "function")
    try { window.gtag("event", event === "view" ? "section_view" : event === "click" ? "cta_click" : "page_view_custom", { label }); } catch {}
};

const API = (() => {
  const r = window.SHIPYARD_REMOTE_API;
  if (r) return String(r).replace(/\/$/, "");
  if (location.protocol === "file:" || location.hostname.endsWith("github.io")) return null;
  return "";
})();
if (API === null) return;

const Q = [];
let flushTimer = null;

function flush() {
  if (!Q.length) return;
  const body = JSON.stringify({ events: Q.splice(0, 50) });
  try {
    if (navigator.sendBeacon)
      navigator.sendBeacon(API + "/api/metrics", new Blob([body], { type: "application/json" }));
    else
      fetch(API + "/api/metrics", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
  } catch { /* аналитика не должна ломать страницу */ }
}

function push(event, label) {
  gaEvent(event, String(label || "").slice(0, 90));
  Q.push({ e: event, l: String(label || "").slice(0, 90) });
  clearTimeout(flushTimer);
  if (Q.length >= 12) flush();
  else flushTimer = setTimeout(flush, 4000);
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") flush();
});

/* просмотры секций: секция засчитана, когда видна на 40% */
const seen = new Set();
const io = new IntersectionObserver(entries => entries.forEach(x => {
  if (!x.isIntersecting) return;
  const id = x.target.dataset.metric;
  if (seen.has(id)) return;
  seen.add(id);
  push("view", id);
}), { threshold: 0.4 });
document.querySelectorAll("[data-metric]").forEach(el => io.observe(el));

/* клики по кнопкам, ссылкам и вкладкам ленты */
document.addEventListener("click", e => {
  const t = e.target.closest("a, button");
  if (!t) return;
  let label;
  if (t.dataset.stat) label = "вкладка:" + (t.querySelector("b")?.textContent || t.dataset.stat);
  else if (t.dataset.tariff) label = "тариф:" + t.dataset.tariff;
  else label = (t.getAttribute("href") || t.id || t.textContent.trim().slice(0, 50)) || "кнопка";
  push("click", label);
}, { capture: true, passive: true });

/* заход на страницу */
push("page", location.pathname.replace(/^\//, "") || "index");
})();
