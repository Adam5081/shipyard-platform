/* ============================================================
   SHIPYARD Platform — SPA
   Два режима:
   · API-режим — аккаунты и прогресс на бэкенде (server/server.js)
   · локальный — localStorage, если бэкенд недоступен (GitHub Pages)
   ============================================================ */

(() => {
"use strict";

const GAME = window.SHIPYARD_GAME;

/* ---------------- станции пути ----------------
   Девять станций пайплайна: миссия, задачи, артефакт недели и инструмент,
   который участник забирает с собой дальше. */

const STATIONS = [
  {
    id: "w0", week: 0, phase: "Старт", title: "Диагностика и окружение",
    tool: "wrench", toolName: "Ключ мастера",
    desc: "До старта: идея проверена, окружение готово, договор подписан.",
    story: "Первая остановка — база у подножия. Здесь мы честно смотрим на идею: кому больно, кто заплатит, что вообще собираем. Дальше настраиваем рабочее место — Claude Code, репозиторий, доступы — и разбираемся, как ставить агенту задачи так, чтобы он не уводил проект в сторону. Отсюда вы уходите с ключом мастера: рабочим окружением, в котором можно строить.",
    tasks: [
      { id: "w0_idea",   label: "Пройти диагностику идеи и получить заключение", pts: 30 },
      { id: "w0_docs",   label: "Подписать договор с программой (права на продукт — у вас)", pts: 20 },
      { id: "w0_cc",     label: "Установить Claude Code и настроить рабочее окружение", pts: 30 },
      { id: "w0_vibe",   label: "Изучить базовые принципы вайб-кодинга: контекст и планирование", pts: 20 },
      { id: "w0_tg",     label: "Войти в Telegram-группу потока", pts: 10 },
    ],
    artifact: "Заключение по идее · рабочее окружение · доступ к потоку",
  },
  {
    id: "w1", week: 1, phase: "Требования", title: "Разговор с рынком",
    tool: "mic", toolName: "Микрофон",
    desc: "Выйти к рынку до того, как написана первая строка кода.",
    story: "Подъём начинается с людей, а не с кода. Пять–семь разговоров с теми, кто живёт с вашей болью: как решают сейчас, сколько это стоит, что бесит. По итогам вы формулируете сегмент, боль и ценностное предложение одним предложением, которое понятно постороннему. Инструмент станции — микрофон: навык вытаскивать правду из клиента.",
    tasks: [
      { id: "w1_i1", label: "Интервью с клиентом №1 (по шаблону сценария)", pts: 30, interview: true },
      { id: "w1_i2", label: "Интервью с клиентом №2", pts: 30, interview: true },
      { id: "w1_i3", label: "Интервью с клиентом №3", pts: 30, interview: true },
      { id: "w1_i4", label: "Интервью с клиентом №4", pts: 30, interview: true },
      { id: "w1_i5", label: "Интервью с клиентом №5", pts: 30, interview: true },
      { id: "w1_seg",  label: "Определить сегмент и сформулировать боль", pts: 40 },
      { id: "w1_vp",   label: "Сформулировать ценностное предложение", pts: 40 },
    ],
    artifact: "Профиль клиента · карта боли · ценностное предложение",
    cp: { id: "КТ-1", cond: "Проведено 5–7 интервью, боль подтверждена минимум половиной респондентов" },
  },
  {
    id: "w2", week: 2, phase: "Проектирование", title: "Чертёж продукта",
    tool: "blueprint", toolName: "Чертёж",
    desc: "Урезать до минимума и перевести архитектуру на язык Claude Code.",
    story: "Самая недооценённая станция. Здесь вы режете задуманное до одного сценария, который можно собрать за четыре недели, выбираете стек и переносите архитектуру в CLAUDE.md — файл, по которому агент работает все следующие недели. Плохой чертёж стоит трёх недель переделок, поэтому контрольная точка тут жёсткая.",
    tasks: [
      { id: "w2_scope", label: "Определить реалистичный MVP с минимальными рабочими процессами", pts: 50 },
      { id: "w2_arch",  label: "Составить roadmap и выбрать техстек", pts: 40 },
      { id: "w2_mock",  label: "Собрать макеты ключевых экранов", pts: 30 },
      { id: "w2_md",    label: "Написать CLAUDE.md: контекст, правила, архитектурные решения", pts: 50 },
      { id: "w2_plan",  label: "Декомпозировать сборку на задачи и спринты", pts: 30 },
    ],
    artifact: "Техкарта · CLAUDE.md · прототип интерфейса · план спринтов",
    cp: { id: "КТ-2", cond: "Объём MVP умещается в 4 недели сборки. Не умещается — режем ещё" },
  },
  {
    id: "w3", week: 3, phase: "Сборка", title: "Ядро продукта",
    tool: "hammer", toolName: "Молоток",
    desc: "Сборка ключевого сценария — самостоятельно, через Claude Code, по спринтам.",
    story: "Стройка. Вы сами ведёте сборку через Claude Code по спринтам: каркас и модель данных, затем ключевой сценарий от входа пользователя до полезного результата. Эксперт разбирает с вами сложные участки и делает ревью сгенерированного кода — чтобы скорость не превратилась в технический долг.",
    tasks: [
      { id: "w3_s1",  label: "Спринт 1: каркас проекта и модель данных через Claude Code", pts: 50 },
      { id: "w3_s2",  label: "Спринт 2: ключевой сценарий от входа до результата", pts: 60 },
      { id: "w3_rev", label: "Ревью сгенерированного кода вместе с экспертом", pts: 30 },
    ],
    artifact: "Работающий ключевой сценарий",
  },
  {
    id: "w4", week: 4, phase: "Сборка", title: "Обвязка",
    tool: "gear", toolName: "Шестерёнка",
    desc: "Авторизация, база, интеграции — из готовых заготовок программы.",
    story: "То, что обычно съедает месяц, здесь подключается из готовых заготовок: авторизация, база с миграциями, почта, файлы, внешние API. С нуля это не пишется — время экономится для вашего ключевого сценария. К концу станции MVP функционально полный, и его уже можно показывать живому пользователю.",
    tasks: [
      { id: "w4_auth", label: "Подключить авторизацию из шаблонной заготовки", pts: 40 },
      { id: "w4_db",   label: "Подключить базу данных и миграции из заготовки", pts: 40 },
      { id: "w4_int",  label: "Подключить нужные интеграции (почта, файлы, API)", pts: 40 },
      { id: "w4_mid",  label: "Пройти промежуточный скрининг MVP и получить обратную связь", pts: 40 },
    ],
    artifact: "Функционально полный MVP",
    cp: { id: "КТ-3", cond: "Ключевой сценарий работает от начала до конца на реальных данных" },
  },
  {
    id: "w5", week: 5, phase: "Проверка", title: "Тестирование и защита",
    tool: "shield", toolName: "Щит",
    desc: "Найти и починить типовые ошибки вайб-кодинга. Закрыть чек-лист OWASP.",
    story: "Станция, из-за которой продукт можно показать клиенту, а не только другу. Прогон всех сценариев на реальных данных, ревью на типовые ошибки вайб-кодинга — захардкоженные секреты, дырявые доступы, молчаливые ошибки, — сканирование зависимостей и чек-лист OWASP. Щит остаётся с продуктом навсегда.",
    tasks: [
      { id: "w5_test", label: "Прогнать тестирование всех сценариев на реальных данных", pts: 40 },
      { id: "w5_rev",  label: "Ревью сгенерированного кода: типовые ошибки вайб-кодинга", pts: 40 },
      { id: "w5_scan", label: "Запустить сканирование зависимостей и конфигураций", pts: 40 },
      { id: "w5_owasp",label: "Закрыть чек-лист OWASP (раздел «Безопасность»)", pts: 60 },
    ],
    artifact: "Закрытый чек-лист OWASP · отчёт сканирования",
  },
  {
    id: "w6", week: 6, phase: "Запуск", title: "Продукт в сети",
    tool: "rocket", toolName: "Ракета",
    desc: "Хостинг, домен, автодеплой, мониторинг и юридический пакет.",
    story: "Продукт выходит наружу: хостинг, домен, сертификаты, автоматический деплой, мониторинг и резервные копии. Параллельно закрывается юридический пакет — оферта и политика данных, без которых нельзя принимать деньги. С этой станции у вас есть публичная ссылка, которую не стыдно отправить клиенту.",
    tasks: [
      { id: "w6_host", label: "Настроить хостинг, домен и сертификаты", pts: 40 },
      { id: "w6_cicd", label: "Настроить автоматический деплой (CI/CD)", pts: 40 },
      { id: "w6_mon",  label: "Включить мониторинг и резервные копии", pts: 30 },
      { id: "w6_legal",label: "Закрыть юридический пакет: оферта, политика данных", pts: 50 },
      { id: "w6_live", label: "Опубликовать продукт по публичной ссылке", pts: 60 },
    ],
    artifact: "Продукт в проде · юридический пакет",
    cp: { id: "КТ-4", cond: "Чек-лист безопасности закрыт, продукт доступен по публичной ссылке" },
  },
  {
    id: "w8", week: 7, phase: "Защита", title: "Защита проекта",
    tool: "trophy", toolName: "Кубок",
    desc: "Разбор результата перед отраслевыми экспертами.",
    story: "Вы собираете разбор проекта: проблема, решение, что подтвердилось, что нет, метрики и план развития. Прогон с ментором, затем защита перед отраслевыми экспертами и письменная обратная связь каждому. За защитой — последняя станция: продукт выходит в рабочую среду.",
    tasks: [
      { id: "w8_deck",  label: "Собрать разбор проекта: проблема, решение, результат, план", pts: 60 },
      { id: "w8_dry",   label: "Пройти прогон защиты с ментором", pts: 40 },
      { id: "w8_pitch", label: "Выступить на Demo Day перед экспертами", pts: 100 },
      { id: "w8_track", label: "Выбрать трек после программы", pts: 30 },
    ],
    artifact: "Разбор проекта · оценка экспертов · решение по треку",
  },
  {
    id: "w7", week: 8, phase: "Рабочая среда", title: "Вывод в рабочую среду",
    tool: "megaphone", toolName: "Рупор",
    desc: "Продукт попадает в руки первых пользователей.",
    story: "Финальная станция перед дверью. Продукт переезжает из демо в реальную работу: при необходимости собирается лендинг, запускается аналитика — и появляются первые люди, которые пользуются продуктом в своей работе. За дверью — сертификат и выбор, как жить дальше.",
    tasks: [
      { id: "w7_land",  label: "Собрать лендинг продукта (при необходимости)", pts: 40 },
      { id: "w7_chan",  label: "Запустить аналитику продукта", pts: 40 },
      { id: "w7_pay",   label: "Первые пользователи", pts: 200 },
    ],
    artifact: "Продукт в рабочей среде · первые пользователи",
    cp: { id: "КТ-5", cond: "Продукт используется вне вашей команды: есть первые пользователи" },
  },
];

const LEVELS = [
  { n: 1, name: "Sketch",       emoji: "✏️", cond: "Идея описана, диагностика пройдена", station: 0 },
  { n: 2, name: "Blueprint",    emoji: "📐", cond: "Требования собраны, ЦП сформулировано", station: 1 },
  { n: 3, name: "Keel",         emoji: "🔩", cond: "Архитектура и объём MVP утверждены", station: 2 },
  { n: 4, name: "Builder",      emoji: "🏗️", cond: "Ключевой сценарий работает", station: 4 },
  { n: 5, name: "Sea Trials",   emoji: "🌊", cond: "Тестирование и безопасность закрыты", station: 5 },
  { n: 6, name: "Launched",     emoji: "🚢", cond: "Продукт в проде, юрпакет собран", station: 6 },
  { n: 7, name: "Captain",      emoji: "⚓️", cond: "Защита пройдена", station: 7 },
  { n: 8, name: "First Voyage", emoji: "🧭", cond: "Продукт в рабочей среде у первых пользователей", station: 8 },
];

/* ---------------- скрининг сложности ----------------
   Определяет док (лигу). Сравниваем проекты схожей сложности,
   иначе гонка выигрывается выбором простой темы. */

const SCREENING = [
  { id: "q_int", q: "Сколько внешних систем нужно подключить в MVP?",
    opts: [["Ни одной", 0], ["Одну–две", 2], ["Три и больше", 4]] },
  { id: "q_reg", q: "Отрасль регулируемая (медицина, финансы, госсектор)?",
    opts: [["Нет", 0], ["Частично", 2], ["Да", 3]] },
  { id: "q_pdn", q: "Продукт работает с персональными или чувствительными данными?",
    opts: [["Нет", 0], ["Да", 2]] },
  { id: "q_pay", q: "Приём платежей входит в MVP?",
    opts: [["Нет", 0], ["Да", 2]] },
  { id: "q_mob", q: "Нужен ли мобильный клиент, а не только веб?",
    opts: [["Только веб", 0], ["Адаптив", 1], ["Отдельное приложение", 3]] },
  { id: "q_ml", q: "Есть ли внутри продукта модели или обработка данных как функция?",
    opts: [["Нет", 0], ["Готовые API", 1], ["Своя модель или обучение", 3]] },
  { id: "q_roles", q: "Сколько типов пользователей с разными правами?",
    opts: [["Один", 0], ["Два", 1], ["Три и больше", 2]] },
];

const DOCKS = {
  A: { name: "Док A", note: "Лёгкий контур: один сценарий, без интеграций и регуляторики" },
  B: { name: "Док B", note: "Средний контур: интеграции, роли, персональные данные" },
  C: { name: "Док C", note: "Тяжёлый контур: регуляторика, платежи, мобильный клиент или модели" },
};

const dockFor = score => (score <= 5 ? "A" : score <= 11 ? "B" : "C");

const PRIZES = [
  { place: "1 место в доке", emoji: "🥇", prize: "Год подписки Claude Max и слот сопровождения на месяц" },
  { place: "2 место", emoji: "🥈", prize: "Полгода подписки Claude Pro и разбор продукта с экспертом" },
  { place: "3 место", emoji: "🥉", prize: "Подписка Claude Pro на три месяца" },
  { place: "Все, кто дошёл до двери", emoji: "🎫", prize: "Сертификат, витрина проекта и вход в сообщество выпускников" },
];

const SECURITY = [
  { level: 1, title: "Чек-лист OWASP", tag: "всем участникам", items: [
    { id: "s_inj",   label: "Инъекции: все запросы к базе параметризованы, ввод не попадает в SQL/команды напрямую" },
    { id: "s_auth",  label: "Аутентификация: пароли хэшируются, сессии истекают, есть защита от перебора" },
    { id: "s_acc",   label: "Разграничение доступов: каждый эндпоинт проверяет права, нет «дыр» по прямым ссылкам" },
    { id: "s_secr",  label: "Секреты: ключи и токены в переменных окружения, не в коде и не в репозитории" },
    { id: "s_data",  label: "Персональные данные: собирается минимум, хранение и передача зашифрованы" },
    { id: "s_valid", label: "Валидация: все входные данные проверяются на сервере, не только в интерфейсе" },
    { id: "s_err",   label: "Ошибки: стек-трейсы и внутренние детали не показываются пользователю" },
    { id: "s_https", label: "Транспорт: HTTPS всюду, сертификаты валидны, HTTP редиректится" },
  ]},
  { level: 2, title: "Автоматическое сканирование", tag: "всем участникам", items: [
    { id: "s_deps",  label: "Зависимости просканированы, критические уязвимости закрыты" },
    { id: "s_conf",  label: "Конфигурации проверены: нет открытых портов, дефолтных паролей, публичных бакетов" },
    { id: "s_rep",   label: "Отчёт сканирования сохранён, исправления по приоритетам выполнены" },
  ]},
  { level: 3, title: "Ручной аудит", tag: "Pro / Partner", items: [
    { id: "s_man1",  label: "Аудит логики доступа специалистом пройден" },
    { id: "s_man2",  label: "Аудит бизнес-логики: сценарии злоупотребления разобраны" },
    { id: "s_man3",  label: "Повторная проверка после исправлений пройдена" },
  ]},
];

const LEGAL = [
  { id: "l0a", week: "0",   title: "Договор с программой",              why: "Фиксирует: права на продукт остаются у участника" },
  { id: "l1",  week: "1",   title: "Соглашение о конфиденциальности",   why: "Защита при разговорах с клиентами и партнёрами" },
  { id: "l2",  week: "2–3", title: "Регистрация компании",              why: "Основание для счетов и договоров" },
  { id: "l3",  week: "3",   title: "Соглашение между сооснователями",   why: "Критично, если участник не один" },
  { id: "l5",  week: "5–6", title: "Политика персональных данных",      why: "Требование законодательства" },
  { id: "l6",  week: "6",   title: "Публичная оферта и пользовательское соглашение", why: "Основание для приёма платежей. До этой точки деньги не принимаются" },
  { id: "l7",  week: "6–7", title: "Заявка на товарный знак",           why: "Защита названия продукта" },
];

const BADGES = [
  { id: "b_interview", emoji: "🎙️", name: "Interview Master",  desc: "5+ интервью с клиентами",            test: s => STATIONS[1].tasks.filter(t => t.interview && s.done[t.id]).length >= 5 },
  { id: "b_security",  emoji: "🛡️", name: "Security Cleared",  desc: "Чек-лист OWASP и сканирование закрыты", test: s => SECURITY.slice(0, 2).every(g => g.items.every(i => s.sec[i.id])) },
  { id: "b_legal",     emoji: "⚖️", name: "Legal Ready",       desc: "Юридический пакет собран",           test: s => ["l0a","l1","l5","l6"].every(id => s.legal[id]) },
  { id: "b_ship",      emoji: "🚢", name: "Zero Downtime",     desc: "Продукт в проде с мониторингом",     test: s => ["w6_host","w6_cicd","w6_mon","w6_live"].every(id => s.done[id]) },
  { id: "b_revenue",   emoji: "🧑‍🤝‍🧑", name: "First Users",       desc: "Первые пользователи продукта",       test: s => s.done["w7_pay"] },
  { id: "b_streak",    emoji: "🔥", name: "Демо-серия",        desc: "3 пятничных демо подряд",            test: s => s.demos.length >= 3 },
];

const KB = {
  materials: [
    { id: "m_setup",       icon: "🧭", week: 0, title: "Установка Claude Code и первый проект",        note: "Пошаговая настройка окружения, аутентификация, первый диалог", type: "гайд" },
    { id: "m_vibe",        icon: "🧠", week: 0, title: "Принципы вайб-кодинга: контекст и планирование", note: "Как формулировать требования, когда планировать, когда просить код", type: "гайд" },
    { id: "m_interview",   icon: "🎙️", week: 1, title: "Шаблон сценария интервью с клиентом",           note: "Готовый сценарий 5–7 вопросов: боль, частота, текущее решение, цена", type: "шаблон" },
    { id: "m_pain",        icon: "🗺️", week: 1, title: "Карта боли и ценностное предложение",           note: "Рабочий лист: сегмент → боль → альтернативы → наше отличие", type: "шаблон" },
    { id: "m_scope",       icon: "✂️", week: 2, title: "Как резать объём MVP",                          note: "Правило одного сценария: что выкидываем и почему это безопасно", type: "гайд" },
    { id: "m_claudemd_ref",icon: "📄", week: 2, title: "Шаблон CLAUDE.md",                              note: "Структура файла инструкций: контекст, правила, архитектура, запреты", type: "шаблон" },
    { id: "m_sprints",     icon: "🏗️", week: 3, title: "Спринты с Claude Code: декомпозиция задач",     note: "Как ставить задачи агенту, чтобы не терять контекст между сессиями", type: "гайд" },
    { id: "m_auth",        icon: "🔌", week: 4, title: "Заготовка: авторизация",                        note: "Готовый модуль: регистрация, вход, сессии, восстановление пароля", type: "заготовка" },
    { id: "m_db",          icon: "🗄️", week: 4, title: "Заготовка: база данных и миграции",             note: "Схема, миграции, бэкапы — подключается за один спринт", type: "заготовка" },
    { id: "m_mistakes",    icon: "🔍", week: 5, title: "Типовые ошибки вайб-кодинга и как их ловить",   note: "Каталог: захардкоженные секреты, дырявые доступы, молчаливые catch", type: "гайд" },
    { id: "m_owasp_ref",   icon: "🛡️", week: 5, title: "Чек-лист OWASP программы",                      note: "Интерактивная версия — в разделе «Безопасность»", type: "чек-лист" },
    { id: "m_infra",       icon: "🚀", week: 6, title: "Шаблон инфраструктуры и автодеплой",            note: "Хостинг, домен, CI/CD, мониторинг, резервные копии — по шагам", type: "заготовка" },
    { id: "m_legal",       icon: "📜", week: 6, title: "Пакет юридических шаблонов",                    note: "Оферта, политика данных, пользовательское соглашение", type: "шаблон" },
    { id: "m_pitch",       icon: "🎤", week: 7, title: "Структура разбора проекта",                     note: "Проблема, решение, что подтвердилось, метрики — 5 минут", type: "шаблон" },
    { id: "m_gtm",         icon: "📈", week: 8, title: "Лендинг, аналитика, первые пользователи",       note: "Как довести продукт до первых рабочих пользователей", type: "гайд" },
  ],
  prompts: [
    { icon: "🧱", title: "Промпт: план перед кодом", body: "Изучи CLAUDE.md и требования ниже. Прежде чем писать код, предложи план реализации из 3–5 шагов и задай уточняющие вопросы, если требования неполные. Код пиши только после моего подтверждения плана." },
    { icon: "🔍", title: "Промпт: ревью своего кода", body: "Проверь изменения этой сессии как строгий ревьюер: типовые ошибки вайб-кодинга (секреты в коде, отсутствие валидации на сервере, широкие доступы, молчаливые ошибки). Список проблем — по убыванию серьёзности, с файлом и строкой." },
    { icon: "🛡️", title: "Промпт: проверка перед деплоем", body: "Пройди по чек-листу OWASP из CLAUDE.md и покажи, какие пункты закрыты кодом, а какие требуют настройки окружения. Ничего не чини без подтверждения — сначала отчёт." },
    { icon: "✂️", title: "Промпт: урезание объёма", body: "Вот список функций MVP. Помоги урезать до одного ключевого сценария: для каждой функции ответь, умрёт ли проверка гипотезы без неё. Всё, что не критично, — в бэклог после недели 8." },
  ],
};

const CLAUDE_MD = `# CLAUDE.md — <название продукта>

## Контекст
Продукт для <сегмент>: решает боль «<боль из недели 1>».
Ключевой сценарий (единственный в MVP):
<пользователь> → <действие> → <ценный результат>.

## Стек и архитектура
- Frontend: <из техкарты недели 2>
- Backend/БД: <из техкарты>
- Хостинг: <из шаблона инфраструктуры>

## Правила работы
1. Перед кодом — план из 3–5 шагов; жди подтверждения.
2. Одна задача = одна сессия. Не расползаться за пределы задачи.
3. Секреты только в переменных окружения. Никогда в коде.
4. Каждый эндпоинт проверяет права доступа.
5. Валидация всех входных данных — на сервере.
6. Не добавлять функции вне ключевого сценария без явной просьбы.

## Запрещено
- Принимать платежи до закрытия юридического пакета (неделя 6).
- Хранить лишние персональные данные.
- Отключать проверки «чтобы быстрее заработало».

## Definition of Done
Сценарий проходит на реальных данных; пункт чек-листа OWASP
по затронутой области закрыт; изменение показано на пятничном демо.`;

/* сервисный пул — шесть направлений плюс ментор */
const SERVICE = [
  { icon: "🧑‍✈️", dir: "Ментор потока",     what: "Вопросы, блокеры, навигация, темп", format: "Telegram", weeks: "0–8, постоянно", indiv: false },
  { icon: "💻", dir: "Разработка",          what: "Архитектура, код-ревью, сложные участки", format: "Групповой созвон ВТ", weeks: "2–6", indiv: true },
  { icon: "⚙️", dir: "DevOps",              what: "Инфраструктура, деплой, мониторинг", format: "Групповой созвон + шаблон", weeks: "5–6", indiv: true },
  { icon: "🛡️", dir: "Кибербезопасность",   what: "Уязвимости, защита данных, доступы", format: "Чек-лист + сканирование", weeks: "5", indiv: true },
  { icon: "⚖️", dir: "Право",               what: "Компания, оферта, перс. данные, знак", format: "Групповые сессии + шаблоны", weeks: "1–7", indiv: true },
  { icon: "📊", dir: "Бизнес-аналитика",    what: "Метрики, юнит-экономика, приоритизация объёма", format: "Групповые созвоны + разбор", weeks: "1–7", indiv: true },
  { icon: "📣", dir: "Маркетинг и продажи", what: "Позиционирование, цена, каналы, сделки", format: "Групповые сессии + разборы", weeks: "7–8", indiv: true },
];

/* локальный режим: сиды потока (без бэкенда) */
const PEERS = [
  { name: "Айгерим С.", project: "MedQueue — запись в частные клиники", about: "Запись к врачу без звонков: пациент выбирает слот, клиника видит очередь.", pts: 720, lvl: 4, dock: "C", station: 4, open: true },
  { name: "Данияр Т.",  project: "CargoLink — биржа попутных грузов",   about: "Перевозчик находит обратную загрузку вместо холостого пробега.", pts: 660, lvl: 4, dock: "B", station: 4, open: true },
  { name: "Мария К.",   project: "LexDraft — генератор договоров",      about: "Типовой договор из анкеты: 12 полей на входе, документ на выходе.", pts: 605, lvl: 3, dock: "B", station: 3, open: true },
  { name: "Ерлан Ж.",   project: "AgroScan — учёт полей для фермеров",  about: "Карта полей и заметки агронома.", pts: 540, lvl: 3, dock: "A", station: 3, open: true },
  { name: "Салтанат Б.",project: "EduPay — оплата кружков для школ",    about: "Оплата школьных кружков в одном окне.", pts: 470, lvl: 3, dock: "B", station: 2, open: true },
  { name: "Тимур А.",   project: "FitDesk — абонементы для студий",     about: "Учёт абонементов для небольших студий.", pts: 390, lvl: 2, dock: "A", station: 2, open: true },
  { name: "Жанна О.",   project: "",                                    about: "", pts: 310, lvl: 2, dock: "C", station: 1, open: false },
];

const PEER_DEMOS = [
  { author: "Айгерим С.", project: "MedQueue", week: 3, text: "Ключевой сценарий записи работает: пациент выбирает врача, слот бронируется, клиника видит запись в панели.", votes: 5 },
  { author: "Данияр Т.",  project: "CargoLink", week: 3, text: "Собрал матчинг груза и машины через Claude Code. Показал на реальных заявках двух перевозчиков.", votes: 4 },
  { author: "Мария К.",   project: "LexDraft", week: 3, text: "Генерация договора аренды из анкеты: 12 полей → готовый документ. Юрист потока проверил формулировки.", votes: 6 },
  { author: "Ерлан Ж.",   project: "AgroScan", week: 2, text: "Урезал MVP с 9 функций до одной: карта поля + заметки агронома. CLAUDE.md утверждён на КТ-2.", votes: 3 },
  { author: "Салтанат Б.",project: "EduPay", week: 2, text: "7 интервью с директорами кружков: боль подтвердили 6 из 7. Ценностное предложение переписала трижды.", votes: 4 },
  { author: "Тимур А.",   project: "FitDesk", week: 3, text: "Каркас на заготовке авторизации программы. Первый спринт закрыт за 4 вечера.", votes: 2 },
];

/* ---------------- API-слой ---------------- */

let API = null;          // "" = same-origin, "https://…" = удалённый, null = локальный режим
let TOKEN = localStorage.getItem("shipyard_token") || null;
const CACHE = { demos: null, league: null, flow: null };

function candidateApi() {
  const o = localStorage.getItem("shipyard_api");
  if (o) return o.replace(/\/$/, "");
  if (window.SHIPYARD_REMOTE_API) return String(window.SHIPYARD_REMOTE_API).replace(/\/$/, "");
  if (location.protocol === "file:" || location.hostname.endsWith("github.io")) return null;
  return "";
}

async function apiCall(path, method = "GET", body) {
  const headers = { "Content-Type": "application/json" };
  if (TOKEN) headers.Authorization = "Bearer " + TOKEN;
  const r = await fetch(API + "/api" + path, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (r.status === 401) { logout(false); throw new Error(data.error || "Нужен вход"); }
  if (!r.ok) throw new Error(data.error || "Ошибка сервера");
  return data;
}

function applyMe(d) {
  const u = d.user || {};
  S.name = u.name;
  S.project = u.project;
  S.tariff = u.tariff;
  S.email = u.email;
  S.avatar = u.avatar || "";
  S.about = u.about || "";
  S.link = u.link || "";
  S.repo = u.repo || "";
  S.isPublic = u.isPublic !== false;
  S.dock = u.dock || "";
  S.complexity = u.complexity || 0;
  S.done = d.done || {};
  S.sec = d.sec || {};
  S.legal = d.legal || {};
  S.demos = d.demos || [];
  S.github = d.github || null;
}

function logout(rerender = true) {
  TOKEN = null;
  localStorage.removeItem("shipyard_token");
  CACHE.demos = CACHE.league = CACHE.flow = null;
  if (rerender) go("map");
}

/* ---------------- состояние ---------------- */

const KEY = "shipyard_state_v2";

const defaultState = () => ({
  name: "Гость",
  project: "Мой продукт",
  tariff: "Pro",
  email: "",
  avatar: "",
  about: "",
  link: "",
  repo: "",
  isPublic: true,
  dock: "",
  complexity: 0,
  github: null,
  startDate: Date.now(),
  done: {}, sec: {}, legal: {},
  demos: [], votes: {},
  kbTab: "materials",
  kbDoc: null,
  selStation: null,
});

let S;
try { S = Object.assign(defaultState(), JSON.parse(localStorage.getItem(KEY) || "{}")); }
catch { S = defaultState(); }

const save = () => { if (API === null) localStorage.setItem(KEY, JSON.stringify(S)); };

/* ---------------- вычисления ---------------- */

const stationDone = p => p.tasks.every(t => S.done[t.id]);
const stationProgress = p => p.tasks.filter(t => S.done[t.id]).length / p.tasks.length;

function currentStationIdx() {
  const i = STATIONS.findIndex(p => !stationDone(p));
  return i === -1 ? STATIONS.length - 1 : i;
}

function cpPassed(p) { return p.cp ? stationDone(p) : false; }

function level() {
  let lvl = LEVELS[0];
  for (const l of LEVELS) if (stationDone(STATIONS[l.station])) lvl = l; else break;
  return lvl;
}

function points() {
  let pts = 0;
  for (const p of STATIONS) for (const t of p.tasks) if (S.done[t.id]) pts += t.pts;
  for (const p of STATIONS) if (p.cp && cpPassed(p)) pts += 100;
  for (const g of SECURITY) for (const i of g.items) if (S.sec[i.id]) pts += 10;
  for (const id in S.legal) if (S.legal[id]) pts += 15;
  pts += S.demos.length * 50;
  if (S.demos.length >= 3) pts = Math.round(pts * 1.1);
  return pts;
}

function totalProgress() {
  const all = STATIONS.flatMap(p => p.tasks);
  return all.filter(t => S.done[t.id]).length / all.length;
}

/* Позиция персонажа: станция плюс доля закрытых задач внутри неё.
   По доле всех задач считать нельзя — с закрытыми поздними станциями
   персонаж уходил бы вперёд своих флагов. */
function walkPos() {
  const cur = currentStationIdx();
  const p = STATIONS[cur];
  const frac = p.tasks.filter(t => S.done[t.id]).length / p.tasks.length;
  return Math.max(0, Math.min(1, (cur + frac) / STATIONS.length));
}

const tools = () => STATIONS.filter(stationDone);
const doorOpen = () => STATIONS.every(stationDone);

function earnedBadges() { return BADGES.filter(b => b.test(S)); }

function demoDayDate() {
  // защита — станция 7: конец седьмой недели потока
  const d = new Date(S.startDate);
  d.setDate(d.getDate() + 49);
  return d;
}

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
const fmt = n => n.toLocaleString("ru-RU");

/* аватар: фото участника либо сгенерированный спрайт по имени */
function myAvatar() {
  if (S.avatar) return S.avatar;
  return GAME.PixelAvatar.generated(S.name || "?");
}
const peerAvatar = p => p.avatar || GAME.PixelAvatar.generated(p.name || "?");

/* ---------------- каркас ---------------- */

const view = document.getElementById("view");
const toastEl = document.getElementById("toast");
let toastTimer;

function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2800);
}

/* Праздник перехода: аватар радуется, когда закрыта станция или взят уровень.
   Небольшой дофамин между этапами — по фидбеку продакта. */
function celebrate(title, sub, emoji = "🎉") {
  document.querySelector(".cele")?.remove();
  const el = document.createElement("div");
  el.className = "cele";
  el.innerHTML = `
    <div class="cele-card">
      <div class="cele-confetti">${["🎉", "✨", "🎊", "⚓", "✨", "🎉"].map((e, i) => `<i style="animation-delay:${i * 0.12}s">${e}</i>`).join("")}</div>
      ${S.avatar
        ? `<img class="cele-avatar" src="${S.avatar}" alt="">`
        : `<div class="cele-emoji">${emoji}</div>`}
      <b>${esc(title)}</b>
      <small>${esc(sub)}</small>
      <button class="btn btn-primary btn-sm">Дальше</button>
    </div>`;
  const close = () => { el.classList.add("out"); setTimeout(() => el.remove(), 300); };
  el.addEventListener("click", e => { if (e.target === el || e.target.tagName === "BUTTON") close(); });
  document.body.appendChild(el);
  setTimeout(close, 5000);
}

function refreshChrome() {
  document.getElementById("userName").textContent = S.name;
  document.getElementById("userTariff").textContent =
    API !== null && !TOKEN ? "Не в системе"
      : `Тариф ${S.tariff}${S.dock ? " · " + DOCKS[S.dock].name : ""}`;
  const av = document.getElementById("userAvatar");
  av.innerHTML = `<img src="${myAvatar()}" alt="">`;
  document.getElementById("pillTrack").textContent = `ст. ${currentStationIdx()}`;
  const secAll = SECURITY.flatMap(g => g.items);
  document.getElementById("pillSec").textContent =
    `${secAll.filter(i => S.sec[i.id]).length}/${secAll.length}`;
  const pt = document.getElementById("pillTools");
  if (pt) pt.textContent = `${tools().length}/9`;
}

let activeView = "map";

async function go(name) {
  if (API !== null && !TOKEN) name = "auth";
  if (activeView !== name) S.kbDoc = null;   // переход по разделам закрывает открытый материал
  activeView = name;
  if (name !== "auth") history.replaceState(null, "", "#" + name);
  document.querySelectorAll(".side-link").forEach(b =>
    b.classList.toggle("active", b.dataset.view === name));
  try {
    if (API !== null && TOKEN) {
      if (name === "demos" && !CACHE.demos) CACHE.demos = (await apiCall("/demos")).demos;
      if (name === "league") CACHE.league = (await apiCall("/league")).rows;
      if (name === "flow" || name === "map") CACHE.flow = (await apiCall("/flow")).rows;
    }
  } catch (e) { toast(e.message); }
  render();
  document.getElementById("sidebar").classList.remove("open");
  window.scrollTo({ top: 0 });
}

document.querySelectorAll(".side-link").forEach(b =>
  b.addEventListener("click", () => go(b.dataset.view)));

document.getElementById("navToggle").addEventListener("click", () =>
  document.getElementById("sidebar").classList.toggle("open"));

/* участники потока для карты и дашборда */
function flowRows() {
  if (API !== null) return CACHE.flow || [];
  const me = {
    name: S.name, project: S.project, about: S.about, avatar: S.avatar, open: S.isPublic,
    dock: S.dock, points: points(), level: level().n, station: currentStationIdx(),
    walk: walkPos(), demos: S.demos.length, link: S.link, me: true,
  };
  const peers = PEERS.map(p => ({
    name: p.name, project: p.open ? p.project : "", about: p.open ? p.about : "",
    avatar: "", open: p.open, dock: p.dock, points: p.pts, level: p.lvl,
    station: p.station, walk: p.station / 8, demos: p.lvl, link: "", me: false,
  }));
  return [me, ...peers].sort((a, b) => b.walk - a.walk || b.points - a.points);
}

/* ---------------- views ---------------- */

const VIEWS = {

  /* ---- вход / регистрация ---- */
  auth() {
    return `
      <div style="max-width:440px;margin:8vh auto 0">
        <div style="text-align:center;margin-bottom:26px">
          <div style="font-size:44px">⚓</div>
          <h1 style="font-size:28px;font-weight:700;letter-spacing:-.02em;margin-top:8px">SHIPYARD</h1>
          <p class="muted" style="margin-top:6px">Войдите, чтобы путь, демо и лига жили на сервере</p>
        </div>
        <div class="panel">
          <div class="kb-tabs" style="margin-bottom:18px">
            <button class="kb-tab ${!S._reg ? "active" : ""}" data-authtab="login">Вход</button>
            <button class="kb-tab ${S._reg ? "active" : ""}" data-authtab="reg">Регистрация</button>
          </div>
          <form id="authForm">
            ${S._reg ? `
              <div class="field"><label>Имя</label><input id="aName" required placeholder="Как к вам обращаться"></div>
              <div class="field"><label>Проект</label><input id="aProject" placeholder="Название вашего продукта"></div>
              <div class="field"><label>Код приглашения</label>
                <input id="aInvite" required placeholder="SHP-XXXXXX" autocomplete="off" style="text-transform:uppercase">
              </div>
              <p class="muted" style="font-size:13px;margin:-6px 0 14px">Код приходит после одобрения заявки.
                Ещё не подавали? <a href="index.html#apply">Подать заявку</a></p>` : ""}
            <div class="field"><label>E-mail</label><input id="aEmail" type="email" required placeholder="you@example.com"></div>
            <div class="field"><label>Пароль</label><input id="aPass" type="password" required minlength="6" placeholder="Минимум 6 символов"></div>
            <div id="authErr" style="color:var(--red);font-size:14px;margin-bottom:12px;display:none"></div>
            <button class="btn btn-primary" type="submit" style="width:100%">${S._reg ? "Создать аккаунт" : "Войти"}</button>
          </form>
        </div>
        <p class="muted" style="text-align:center;font-size:13px">Пилотный поток №1 · права на ваш продукт всегда остаются у вас</p>
      </div>`;
  },

  /* ---- карта пути: главный экран ---- */
  map() {
    const cur = currentStationIdx();
    const sel = S.selStation === null ? cur : Math.max(0, Math.min(8, S.selStation));
    const st = STATIONS[sel];
    const lvl = level();
    const prog = Math.round(walkPos() * 100);
    const dd = demoDayDate();
    const daysLeft = Math.max(0, Math.ceil((dd - Date.now()) / 86400000));
    const done = stationDone(st);
    const locked = sel > cur;
    const got = tools();

    return `
      ${API === null ? `
        <div class="notice">
          <b>Демо-режим.</b> Бэкенд не подключён: прогресс хранится в этом браузере, аккаунтов и общего
          потока нет, участники рядом — из демонстрационного набора. Всё остальное работает по-настоящему:
          карта, миссии, инструменты, персонаж из вашего фото.
        </div>` : ""}
      ${!S.dock ? `
        <div class="notice">
          <b>Пройдите скрининг сложности проекта.</b> Он определяет ваш док — группу проектов схожей
          сложности. Сравнивать сложный проект с простым по скорости нечестно, поэтому лига считается внутри дока.
          <button class="btn btn-primary btn-sm" data-go="screening" style="margin-left:auto">Пройти за 2 минуты</button>
        </div>` : ""}

      <div class="map-head">
        <div>
          <div class="mh-label">Станция ${st.week} из 8 · ${esc(STATIONS[cur].phase)}</div>
          <h1>${esc(S.project)}</h1>
        </div>
        <div class="mh-stats">
          <div><b>${lvl.emoji} ${lvl.name}</b><span>уровень ${lvl.n} из 8</span></div>
          <div><b>${fmt(points())}</b><span>очков</span></div>
          <div><b>${got.length}/9</b><span>инструментов</span></div>
          <div><b>${daysLeft} дн.</b><span>до защиты</span></div>
        </div>
      </div>

      <div class="map-stage">
        <canvas id="mapCanvas"></canvas>
        <div class="map-hint">Нажмите на станцию, чтобы раскрыть миссию · вы прошли ${prog}% пути</div>
      </div>

      <div class="tool-shelf">
        ${STATIONS.map((p, i) => {
          const has = stationDone(p);
          return `<div class="tool-slot ${has ? "has" : ""}" title="${esc(p.toolName)} — станция ${i}">
            <canvas class="tool-ic" data-tool="${esc(p.tool)}" width="32" height="32"></canvas>
            <small>${esc(has ? p.toolName : "—")}</small>
          </div>`;
        }).join("")}
        <div class="tool-slot door ${doorOpen() ? "has" : ""}" title="Дверь MVP">
          <div class="door-ic">🚪</div>
          <small>${doorOpen() ? "Открыта" : "Дверь MVP"}</small>
        </div>
      </div>

      <div class="panel station-panel ${done ? "is-done" : locked ? "is-locked" : "is-current"}">
        <div class="sp-head">
          <div class="sp-num">${done ? "✓" : st.week}</div>
          <div>
            <b>${esc(st.title)}</b>
            <small>${esc(st.phase)} · награда: ${esc(st.toolName)}${locked ? " · станция впереди" : ""}</small>
          </div>
          <div class="sp-nav">
            <button class="btn btn-ghost btn-sm" data-station="${Math.max(0, sel - 1)}" ${sel === 0 ? "disabled" : ""}>←</button>
            <button class="btn btn-ghost btn-sm" data-station="${Math.min(8, sel + 1)}" ${sel === 8 ? "disabled" : ""}>→</button>
          </div>
        </div>
        <p class="sp-story">${esc(st.story)}</p>
        <div class="sp-tasks">
          ${st.tasks.map(t => taskRow(t)).join("")}
        </div>
        <div class="artifact-box">📦 <b>Артефакт недели:</b>&nbsp;${esc(st.artifact)}</div>
        ${st.cp ? cpBanner(st) : ""}
        ${done ? `<div class="reward-box">
            <canvas class="tool-ic big" data-tool="${esc(st.tool)}" width="48" height="48"></canvas>
            <div><b>Инструмент получен: ${esc(st.toolName)}</b>
            <small>Станция закрыта — персонаж поднялся выше по карте.</small></div>
          </div>` : ""}
      </div>

      <div class="panel">
        <h2>Кто ещё идёт рядом</h2>
        <p class="muted" style="margin-bottom:14px">Позиции участников потока на этой же карте. Подробности — в разделе «Кто где идёт».</p>
        ${flowRows().slice(0, 5).map(r => flowRow(r)).join("")}
        <button class="btn btn-ghost btn-sm" data-go="flow" style="margin-top:12px">Весь поток</button>
      </div>`;
  },

  /* ---- скрининг сложности ---- */
  screening() {
    return `
      <div class="page-head">
        <h1>Скрининг сложности</h1>
        <p>Семь вопросов о продукте, а не о вас. По ним проект попадает в док — группу схожих по сложности проектов. Лига и призы считаются внутри дока: медицинский сервис с интеграциями не соревнуется с записной книжкой.</p>
      </div>
      <form id="screenForm">
        ${SCREENING.map((qq, i) => `
          <div class="panel screen-q">
            <b>${i + 1}. ${esc(qq.q)}</b>
            <div class="screen-opts">
              ${qq.opts.map(([label, val], j) => `
                <label class="screen-opt">
                  <input type="radio" name="${qq.id}" value="${val}" ${j === 0 ? "checked" : ""}>
                  <span>${esc(label)}</span>
                </label>`).join("")}
            </div>
          </div>`).join("")}
        <div class="panel">
          <button class="btn btn-primary" type="submit">Определить док</button>
          <p class="muted" style="margin-top:12px">Скрининг можно пройти заново, если объём проекта изменился — док пересчитается.</p>
        </div>
      </form>
      <div class="panel">
        <h2>Как читаются доки</h2>
        ${Object.entries(DOCKS).map(([id, d]) => `
          <div class="req ok"><div class="r-ic">${id}</div><div><b>${esc(d.name)}</b> — ${esc(d.note)}</div></div>`).join("")}
      </div>`;
  },

  /* ---- дашборд потока ---- */
  flow() {
    const rows = flowRows();
    return `
      <div class="page-head">
        <h1>Кто где идёт</h1>
        <p>Общая карта потока: позиция каждого участника, док и последние результаты. Видно, кто вырвался вперёд и у кого стоит спросить, как он прошёл станцию.</p>
      </div>
      <div class="notice">
        <b>Что видят другие.</b> Ваше имя, аватар, станция и очки видны всем участникам потока всегда.
        Название и описание проекта — только если вы включили публичный профиль. Выключить можно в профиле в любой момент.
        <button class="btn btn-ghost btn-sm" data-go="profile" style="margin-left:auto">Настроить</button>
      </div>
      <div class="panel">
        ${rows.map(r => flowRow(r, true)).join("")}
      </div>`;
  },

  /* ---- стена демо ---- */
  demos() {
    let cards = "";
    if (API !== null) {
      const list = CACHE.demos || [];
      cards = list.map(d => `
        <div class="demo-card">
          <div class="d-head">
            <div class="avatar"><img src="${esc(d.avatar || GAME.PixelAvatar.generated(d.name))}" alt=""></div>
            <div><b>${esc(d.name)} — ${esc(d.project)}</b><small>${d.mine ? "моё демо" : "участник потока"}</small></div>
            <span class="d-week">ст. ${d.week}</span>
          </div>
          <p>${esc(d.text)}</p>
          <div class="d-actions">
            ${d.mine
              ? (d.link ? `<a href="${esc(d.link)}" target="_blank" rel="noopener" class="link-arrow" style="font-size:14px">Открыть</a>` : "")
              : `<button class="vote-btn ${d.my ? "voted" : ""}" data-voteid="${d.id}">${d.my ? "✓ Ваш голос" : "▲ Лучшее демо"} · ${d.votes}</button>
                 ${d.link ? `<a href="${esc(d.link)}" target="_blank" rel="noopener" class="link-arrow" style="font-size:14px">Открыть</a>` : ""}`}
          </div>
        </div>`).join("");
      if (!list.length) cards = `<div class="empty">Пока тихо. Будьте первым, кто сдаст демо этой недели.</div>`;
    } else {
      const myDemos = S.demos.map(d => `
        <div class="demo-card">
          <div class="d-head">
            <div class="avatar"><img src="${myAvatar()}" alt=""></div>
            <div><b>${esc(S.name)} — ${esc(S.project)}</b><small>моё демо</small></div>
            <span class="d-week">ст. ${d.week}</span>
          </div>
          <p>${esc(d.text)}</p>
          ${d.link ? `<a href="${esc(d.link)}" target="_blank" rel="noopener" class="link-arrow" style="font-size:14px">Открыть</a>` : ""}
        </div>`).join("");
      const peers = PEER_DEMOS.map((d, i) => {
        const voted = !!S.votes[i];
        return `
        <div class="demo-card">
          <div class="d-head">
            <div class="avatar"><img src="${GAME.PixelAvatar.generated(d.author)}" alt=""></div>
            <div><b>${esc(d.author)} — ${esc(d.project)}</b><small>участник потока</small></div>
            <span class="d-week">ст. ${d.week}</span>
          </div>
          <p>${esc(d.text)}</p>
          <div class="d-actions">
            <button class="vote-btn ${voted ? "voted" : ""}" data-vote="${i}">
              ${voted ? "✓ Ваш голос" : "▲ Лучшее демо"} · ${d.votes + (voted ? 1 : 0)}
            </button>
          </div>
        </div>`;
      }).join("");
      cards = myDemos + peers;
    }

    return `
      <div class="page-head">
        <h1>Стена демо</h1>
        <p>Публичный еженедельный результат — социальное обязательство сильнее напоминаний. Два пропуска подряд — перевод в следующий поток.</p>
      </div>
      <div class="panel">
        <h2>Сдать демо этой недели</h2>
        <p class="muted" style="margin-bottom:16px">Пятница, 5 минут на проект. Что работает сегодня, чего не работало неделю назад?</p>
        <form id="demoForm">
          <div class="field">
            <label>Что показываете</label>
            <textarea id="demoText" placeholder="Например: ключевой сценарий работает от входа до результата на реальных данных…" required></textarea>
          </div>
          <div class="field">
            <label>Ссылка: домен продукта, прототип или запись</label>
            <input id="demoLink" type="url" placeholder="https://…" value="${esc(S.link)}">
          </div>
          <div class="field">
            <label>Описание проекта для потока (видно, если профиль публичный)</label>
            <textarea id="demoAbout" placeholder="Одно-два предложения: для кого продукт и что он решает">${esc(S.about)}</textarea>
          </div>
          <div class="disclaimer">
            Сдавая демо, вы соглашаетесь: запись появляется на стене потока, а ваша позиция на карте
            видна другим участникам. Название и описание проекта показываются, только если включён публичный профиль.
          </div>
          <button class="btn btn-primary" type="submit">Опубликовать демо · +50 очков</button>
        </form>
      </div>
      <div class="demo-grid">${cards}</div>`;
  },

  /* ---- лига дока ---- */
  league() {
    let rows;
    if (API !== null) {
      rows = (CACHE.league || []).map(r => ({ ...r, name: r.me ? r.name + " (вы)" : r.name }));
    } else {
      const me = { name: S.name + " (вы)", project: S.project, pts: points(), lvl: level().n, me: true, avatar: S.avatar };
      rows = [...PEERS.filter(p => !S.dock || p.dock === S.dock)
        .map(p => ({ name: p.name, project: p.open ? p.project : "проект скрыт", pts: p.pts, lvl: p.lvl, avatar: "" })), me]
        .sort((a, b) => b.pts - a.pts);
    }
    const medals = ["🥇", "🥈", "🥉"];
    const dock = S.dock ? DOCKS[S.dock] : null;
    return `
      <div class="page-head">
        <h1>${dock ? esc(dock.name) : "Лига"}</h1>
        <p>${dock ? esc(dock.note) + "." : "Док определяется скринингом сложности."} Соревнование идёт только внутри дока: проекты сравниваются с сопоставимыми по объёму работ, а не по удачно выбранной простой теме.</p>
      </div>
      ${!S.dock ? `<div class="notice"><b>Док не определён.</b> Пройдите скрининг сложности — без него лига считается по общему потоку.
        <button class="btn btn-primary btn-sm" data-go="screening" style="margin-left:auto">Пройти</button></div>` : ""}
      <div class="panel">
        <table class="table">
          <thead><tr><th style="width:56px">Место</th><th>Участник</th><th>Проект</th><th>Уровень</th><th style="text-align:right">Очки</th></tr></thead>
          <tbody>
            ${rows.map((r, i) => {
              const lv = LEVELS[Math.max(0, Math.min(7, r.lvl - 1))];
              return `<tr class="${r.me ? "me" : ""}">
                <td><span class="rank-medal">${medals[i] || (i + 1)}</span></td>
                <td><div class="who"><span class="avatar sm"><img src="${esc(r.avatar || GAME.PixelAvatar.generated(r.name))}" alt=""></span><b>${esc(r.name)}</b></div></td>
                <td style="color:var(--ink-2)">${esc(r.project)}</td>
                <td><span class="lvl-chip">${lv.emoji} ${lv.name}</span></td>
                <td style="text-align:right;font-weight:700">${fmt(r.pts)}</td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>
      <div class="panel-row cols-2">
        <div class="panel">
          <h2>Призы потока</h2>
          <p class="muted" style="margin-bottom:12px">Разыгрываются внутри каждого дока по итогам восьми недель.</p>
          ${PRIZES.map(p => `
            <div class="kb-item"><div class="k-icon">${p.emoji}</div><div><b>${esc(p.place)}</b><small>${esc(p.prize)}</small></div></div>`).join("")}
        </div>
        <div class="panel">
          <h2>За что начисляются очки</h2>
          ${[["Пятничное демо", "+50"], ["Интервью с клиентом", "+30"], ["Пункт чек-листа ИБ", "+10"],
             ["Пройденная контрольная точка", "+100"], ["Пилот / первый платёж", "+200"], ["Серия из 3 демо", "×1.1"]]
            .map(([t, v]) => `<div class="req ok"><div class="r-ic" style="background:rgba(0,113,227,.1);color:var(--accent);font-size:11px">${v}</div>${t}</div>`).join("")}
          <p class="muted" style="margin-top:12px">Очки — только за проверяемые артефакты. За «время в системе» и строки кода очков нет.</p>
        </div>
      </div>`;
  },

  /* ---- безопасность ---- */
  security() {
    const all = SECURITY.flatMap(g => g.items);
    const done = all.filter(i => S.sec[i.id]).length;
    const pct = Math.round((done / all.length) * 100);
    const C = 2 * Math.PI * 56;
    return `
      <div class="page-head">
        <h1>Безопасность</h1>
        <p>Наше ключевое отличие: прототип нельзя показать клиенту — продукт с закрытым чек-листом можно. 100% выпущенных продуктов закрывают ИБ.</p>
      </div>
      <div class="panel">
        <div class="sec-ring-wrap">
          <div class="ring">
            <svg width="130" height="130">
              <circle class="ring-bg" cx="65" cy="65" r="56" fill="none" stroke-width="11"/>
              <circle class="ring-fg" cx="65" cy="65" r="56" fill="none" stroke-width="11"
                stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - done / all.length)}"/>
            </svg>
            <div class="ring-label"><b>${pct}%</b><small>закрыто</small></div>
          </div>
          <div>
            <h2>Готовность к контрольной точке КТ-4</h2>
            <p class="muted" style="max-width:520px">КТ-4 (станция 6) требует полностью закрытых уровней 1 и 2. Уровень 3 — ручной аудит специалистом — входит в тарифы Pro и Partner.</p>
          </div>
        </div>
      </div>
      ${SECURITY.map(g => `
        <div class="panel">
          <span class="sec-level-tag l${g.level}">Уровень ${g.level} · ${esc(g.tag)}</span>
          <h2>${esc(g.title)}</h2>
          <div style="margin-top:10px">
            ${g.items.map(i => `
              <div class="task ${S.sec[i.id] ? "done-task" : ""}">
                <input type="checkbox" id="${i.id}" data-sec="${i.id}" ${S.sec[i.id] ? "checked" : ""}>
                <label for="${i.id}">${esc(i.label)}</label>
                <span class="pts">+10</span>
              </div>`).join("")}
          </div>
        </div>`).join("")}`;
  },

  /* ---- юридический трек ---- */
  legal() {
    return `
      <div class="page-head">
        <h1>Юридический трек</h1>
        <p>Идёт параллельно программе. Приём денег — только после публичной оферты на станции 6. Регистрация компании и товарный знак могут продолжиться после программы — это фиксируется в договоре.</p>
      </div>
      <div class="panel">
        ${LEGAL.map(l => {
          const done = !!S.legal[l.id];
          return `
          <div class="legal-step">
            <div class="wk">ст. ${l.week}</div>
            <div><b>${esc(l.title)}</b><small>${esc(l.why)}</small></div>
            <button class="status-chip ${done ? "done" : "wait"}" data-legal="${l.id}" style="border:none;cursor:pointer">
              ${done ? "✓ Готово" : "Отметить"}
            </button>
          </div>`;
        }).join("")}
      </div>
      <div class="panel">
        <h2>Права на продукт</h2>
        <p class="muted">Договор с программой фиксирует со станции 0: полные права на код, дизайн и данные остаются у участника. Условия партнёрского трека публикуются до начала программы и одинаковы для всех; от них можно отказаться без потери прав.</p>
      </div>`;
  },

  /* ---- база знаний ---- */
  kb() {
    const tab = S.kbTab;
    const cur = currentStationIdx();

    /* открытый материал — режим чтения */
    if (tab === "materials" && S.kbDoc) {
      const m = KB.materials.find(x => x.id === S.kbDoc);
      const doc = m && (window.KB_DOCS || {})[m.id];
      if (m && doc && m.week <= cur) {
        return `
          <button class="btn btn-ghost btn-sm" id="kbBack" style="margin-bottom:18px">← Все материалы</button>
          <div class="page-head">
            <h1>${m.icon} ${esc(m.title)}</h1>
            <p>Станция ${m.week} · ${esc(m.type)}</p>
          </div>
          <div class="panel"><div class="doc">${doc.html}</div>
            ${doc.copy ? `<button class="btn btn-dark btn-sm" data-copy="${esc(doc.copy)}" style="margin-top:20px">Скопировать шаблон</button>` : ""}
          </div>`;
      }
      S.kbDoc = null;
    }

    const tabs = [
      ["materials", "Материалы станций"],
      ["claudemd", "Шаблон CLAUDE.md"],
      ["prompts", "Библиотека промптов"],
    ];
    let body = "";
    if (tab === "materials") {
      body = `<div class="panel">${KB.materials.map(m => {
        const locked = m.week > cur;
        return `
        <div class="kb-item${locked ? "" : " kb-open"}" ${locked ? "" : `data-doc="${m.id}"`} style="${locked ? "opacity:.45" : ""}">
          <div class="k-icon">${m.icon}</div>
          <div><b>${esc(m.title)}</b><small>Станция ${m.week} · ${esc(m.note)}${locked ? " · откроется по пути" : ""}</small></div>
          <span class="k-type">${locked ? "🔒 " : ""}${m.type}</span>
        </div>`;
      }).join("")}</div>`;
    } else if (tab === "claudemd") {
      body = `
        <div class="panel">
          <h2>Готовый шаблон CLAUDE.md</h2>
          <p class="muted">Файл инструкций проекта: контекст, правила и архитектурные решения для агента. Заполняется на станции 2 и живёт с проектом дальше.</p>
          <pre class="code">${esc(CLAUDE_MD)}</pre>
          <button class="btn btn-dark btn-sm" id="copyMd" style="margin-top:14px">Скопировать шаблон</button>
        </div>`;
    } else {
      body = `<div class="panel-row cols-2">${KB.prompts.map(p => `
        <div class="panel" style="margin-bottom:0">
          <h2 style="font-size:17px">${p.icon} ${esc(p.title)}</h2>
          <pre class="code" style="font-size:12px">${esc(p.body)}</pre>
          <button class="btn btn-ghost btn-sm" data-copy="${esc(p.body)}" style="margin-top:12px">Скопировать</button>
        </div>`).join("")}</div>`;
    }
    return `
      <div class="page-head">
        <h1>База знаний</h1>
        <p>Материалы станций, шаблоны, чек-листы, библиотека промптов и паттернов вайб-кодинга. Публикуются по понедельникам.</p>
      </div>
      <div class="kb-tabs">
        ${tabs.map(([id, name]) => `<button class="kb-tab ${tab === id ? "active" : ""}" data-tab="${id}">${name}</button>`).join("")}
      </div>
      ${body}`;
  },

  /* ---- сервисный пул ---- */
  experts() {
    const hours = S.tariff === "Solo" ? "4 ч/нед" : S.tariff === "Pro" ? "8 ч/нед" : "без лимита";
    return `
      <div class="page-head">
        <h1>Сервисный пул</h1>
        <p>Групповой контур и ментор в Telegram — всем. Индивидуальные созвоны с экспертами — по часам тарифа: 4 часа в неделю на Solo, 8 — на Pro, без лимита на Partner.</p>
      </div>
      <div class="panel">
        <table class="table">
          <thead><tr><th></th><th>Направление</th><th>Что закрывает</th><th>Формат</th><th>Станции</th><th></th></tr></thead>
          <tbody>
            ${SERVICE.map((e, i) => `
              <tr>
                <td style="font-size:20px">${e.icon}</td>
                <td><b>${esc(e.dir)}</b></td>
                <td style="color:var(--ink-2)">${esc(e.what)}</td>
                <td style="color:var(--ink-2)">${esc(e.format)}</td>
                <td style="white-space:nowrap">${esc(e.weeks)}</td>
                <td>${e.indiv
                  ? `<button class="btn btn-ghost btn-sm" data-book="${i}" title="Лимит тарифа: ${hours}">Слот</button>`
                  : `<span class="status-chip done">Всегда на связи</span>`}</td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>`;
  },

  /* ---- Demo Day ---- */
  demoday() {
    const dd = demoDayDate();
    const diff = Math.max(0, dd - Date.now());
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const reqs = [
      { ok: cpPassed(STATIONS[1]), label: "КТ-1 — боль подтверждена интервью" },
      { ok: cpPassed(STATIONS[2]), label: "КТ-2 — объём MVP утверждён" },
      { ok: cpPassed(STATIONS[4]), label: "КТ-3 — ключевой сценарий на реальных данных" },
      { ok: cpPassed(STATIONS[6]), label: "КТ-4 — безопасность закрыта, продукт в проде" },
      { ok: !!S.done["w8_deck"], label: "Разбор проекта собран" },
      { ok: !!S.done["w8_dry"], label: "Прогон защиты с ментором пройден" },
    ];
    const okCount = reqs.filter(r => r.ok).length;
    return `
      <div class="page-head">
        <h1>Demo Day</h1>
        <p>5 минут разбора, 3 минуты вопросов. В зале — отраслевые эксперты, практики и заказчики из вашей индустрии. Оценка по осям: проблема, решение, результат, план развития. Письменная обратная связь каждому.</p>
      </div>
      <div class="dd-count">
        <div class="dd-unit"><b>${days}</b><span>дней</span></div>
        <div class="dd-unit"><b>${hours}</b><span>часов</span></div>
        <div class="dd-unit"><b>${dd.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}</b><span>дата защиты</span></div>
      </div>
      <div class="panel-row cols-2">
        <div class="panel">
          <h2>Готовность к сцене · ${okCount}/${reqs.length}</h2>
          <p class="muted" style="margin-bottom:10px">Выступают проекты, прошедшие КТ-4. Остальные — зрители и участники разбора. После защиты остаётся последняя станция — вывод в рабочую среду.</p>
          ${reqs.map(r => `<div class="req ${r.ok ? "ok" : "no"}"><div class="r-ic">${r.ok ? "✓" : "·"}</div>${esc(r.label)}</div>`).join("")}
        </div>
        <div class="panel">
          <h2>Что происходит после</h2>
          ${[
            ["🧗", "Самостоятельный трек", "Забираете всё и растёте сами. Продукт, код и права — ваши."],
            ["🤝", "Сопровождение", "Подписка на нашу команду по фиксированной прозрачной ставке."],
            ["🚀", "Партнёрский трек", "Мы берём разработку на себя и входим в проект как партнёр. Только по приглашению, условия публикуются заранее."],
          ].map(([ic, t, n]) => `
            <div class="kb-item"><div class="k-icon">${ic}</div><div><b>${t}</b><small>${n}</small></div></div>`).join("")}
          <div class="divider"></div>
          <p class="muted">Мы обещаем доступ и подготовку: качественный разбор, подтверждённые метрики и практиков отрасли в зале.</p>
        </div>
      </div>`;
  },

  /* ---- сертификат ---- */
  certificate() {
    const open = doorOpen();
    const lvl = level();
    const num = `SHP-1-${String(hashNum(S.email || S.name)).padStart(4, "0")}`;
    return `
      <div class="page-head">
        <h1>Сертификат</h1>
        <p>Выдаётся за пройденный путь: девять станций, пять контрольных точек, продукт в рабочей среде. Не за время в программе.</p>
      </div>
      <div class="cert ${open ? "open" : "locked"}">
        <div class="cert-inner">
          <div class="cert-top">⚓ SHIPYARD · Поток №1</div>
          <div class="cert-name">${esc(S.name)}</div>
          <div class="cert-sub">прошёл путь от идеи до продукта в рабочей среде</div>
          <div class="cert-project">${esc(S.project)}</div>
          <div class="cert-row">
            <div><b>${S.dock ? esc(DOCKS[S.dock].name) : "—"}</b><span>док</span></div>
            <div><b>${fmt(points())}</b><span>очков</span></div>
            <div><b>${lvl.emoji} ${lvl.name}</b><span>уровень</span></div>
            <div><b>${tools().length}/9</b><span>станций</span></div>
          </div>
          <div class="cert-num">№ ${num}</div>
          ${open ? "" : `<div class="cert-lock">🔒 Откроется, когда все девять станций закрыты и дверь MVP открыта</div>`}
        </div>
      </div>
      <div class="panel">
        <h2>Что даёт сертификат</h2>
        ${["Публичная витрина проекта в каталоге выпускников",
           "Приоритет в отборе на партнёрский трек и сопровождение",
           "Участие в розыгрыше призов дока по итогам потока",
           "Вход в закрытое сообщество выпускников"]
          .map(t => `<div class="req ok"><div class="r-ic">✓</div>${t}</div>`).join("")}
      </div>`;
  },

  /* ---- профиль ---- */
  profile() {
    const lvl = level();
    const badges = earnedBadges().map(b => b.id);
    const gh = S.github;
    return `
      <div class="page-head">
        <h1>Профиль основателя</h1>
        <p>Аватар, проект и настройки видимости. Аватар превращается в вашего персонажа на карте пути.</p>
      </div>

      <div class="panel-row cols-2">
        <div class="panel">
          <h2>Персонаж</h2>
          <p class="muted" style="margin-bottom:14px">Загрузите фото — платформа снимет с него цвета (причёска, кожа, костюм, галстук) и соберёт пиксельного персонажа. Само фото никуда не отправляется: обработка идёт в браузере, на сервер уходит только спрайт 16×16.</p>
          <div class="avatar-editor">
            <div class="avatar-preview"><img id="avPreview" src="${myAvatar()}" alt=""></div>
            <div class="avatar-actions">
              <label class="btn btn-primary btn-sm">
                Загрузить фото<input type="file" id="avFile" accept="image/*" hidden>
              </label>
              <button class="btn btn-ghost btn-sm" id="avGen">Собрать без фото</button>
              ${S.avatar ? `<button class="btn btn-ghost btn-sm" id="avClear">Убрать</button>` : ""}
            </div>
          </div>
        </div>

        <div class="panel">
          <h2>Стадия</h2>
          <div style="display:flex;align-items:center;gap:16px;margin:16px 0">
            <div style="font-size:44px">${lvl.emoji}</div>
            <div>
              <b style="font-size:20px">${lvl.name}</b>
              <p class="muted">Уровень ${lvl.n} из 8 · ${esc(lvl.cond)}</p>
            </div>
          </div>
          <div class="bar"><i style="width:${lvl.n / 8 * 100}%"></i></div>
          <div class="divider"></div>
          <p class="muted"><b style="color:var(--ink)">${fmt(points())}</b> очков · ${S.dock ? esc(DOCKS[S.dock].name) + " · сложность " + S.complexity : "док не определён"}
            · <a href="#" data-go="screening">${S.dock ? "пересчитать" : "пройти скрининг"}</a></p>
          ${API === null ? `<div class="divider"></div><button class="btn btn-ghost btn-sm" id="resetState">Сбросить прогресс (демо)</button>` : ""}
        </div>
      </div>

      <div class="panel">
        <h2>Проект</h2>
        ${S.email ? `<p class="muted" style="margin-top:4px">${esc(S.email)}</p>` : ""}
        <form id="profileForm" style="margin-top:12px">
          <div class="panel-row cols-2" style="margin-bottom:0">
            <div>
              <div class="field"><label>Имя</label><input id="pfName" value="${esc(S.name)}"></div>
              <div class="field"><label>Название проекта</label><input id="pfProject" value="${esc(S.project)}"></div>
              <div class="field"><label>Тариф</label>
                <input value="${esc(S.tariff)}" disabled title="Тариф закреплён в договоре — для изменения напишите нам">
              </div>
            </div>
            <div>
              <div class="field"><label>Описание для потока</label>
                <textarea id="pfAbout" placeholder="Для кого продукт и какую боль закрывает">${esc(S.about)}</textarea>
              </div>
              <div class="field"><label>Домен или публичная ссылка</label>
                <input id="pfLink" type="url" placeholder="https://…" value="${esc(S.link)}">
              </div>
              <div class="field"><label>Репозиторий GitHub (публичный)</label>
                <input id="pfRepo" placeholder="owner/name" value="${esc(S.repo)}">
              </div>
            </div>
          </div>
          <label class="switch">
            <input type="checkbox" id="pfPublic" ${S.isPublic ? "checked" : ""}>
            <span>Показывать название и описание проекта другим участникам потока</span>
          </label>
          <p class="muted" style="margin:8px 0 14px;font-size:13px">
            Имя, аватар, станция и очки видны всегда — на этом держится общая карта потока.
            При выключенном переключателе вместо проекта участники видят «проект скрыт».
          </p>
          <button class="btn btn-primary btn-sm" type="submit">Сохранить</button>
          ${API !== null ? `<button class="btn btn-ghost btn-sm" type="button" id="logoutBtn" style="margin-left:10px">Выйти</button>` : ""}
        </form>
      </div>

      <div class="panel">
        <h2>Синхронизация с GitHub</h2>
        <p class="muted" style="margin-bottom:14px">Платформа читает публичный репозиторий и показывает реальную активность сборки: коммиты за неделю и последнее изменение. Токены и приватные репозитории не запрашиваются.</p>
        ${gh ? `
          <div class="gh-box">
            <div class="gh-stat"><b>${gh.weekCommits}</b><span>коммитов за 7 дней</span></div>
            <div class="gh-stat"><b>${esc(gh.language || "—")}</b><span>основной язык</span></div>
            <div class="gh-stat"><b>${gh.lastAt ? new Date(gh.lastAt).toLocaleDateString("ru-RU") : "—"}</b><span>последний коммит</span></div>
            <div class="gh-last">${esc(gh.lastMessage || "нет коммитов за неделю")}</div>
            <a class="link-arrow" href="${esc(gh.url || "#")}" target="_blank" rel="noopener" style="font-size:14px">${esc(gh.repo)}</a>
          </div>` : `<div class="empty" style="margin-bottom:14px">Синхронизация ещё не запускалась.</div>`}
        <button class="btn btn-dark btn-sm" id="ghSync">Синхронизировать</button>
      </div>

      <div class="panel">
        <h2>Бейджи</h2>
        <p class="muted" style="margin-bottom:16px">Признание за качество, а не только за скорость.</p>
        <div class="badge-grid">
          ${BADGES.map(b => `
            <div class="badge-card ${badges.includes(b.id) ? "earned" : "locked"}">
              <div class="b-emoji">${b.emoji}</div>
              <b>${esc(b.name)}</b>
              <small>${esc(b.desc)}</small>
            </div>`).join("")}
        </div>
      </div>`;
  },
};

/* ---------------- фрагменты ---------------- */

function taskRow(t) {
  const done = !!S.done[t.id];
  return `
    <div class="task ${done ? "done-task" : ""}">
      <input type="checkbox" id="${t.id}" data-task="${t.id}" ${done ? "checked" : ""}>
      <label for="${t.id}">${esc(t.label)}</label>
      <span class="pts">+${t.pts}</span>
    </div>`;
}

function cpBanner(p) {
  const passed = cpPassed(p);
  return `
    <div class="gate-banner ${passed ? "passed" : ""}">
      <span class="g-badge">${p.cp.id}</span>
      <div>${passed
        ? `<b>Контрольная точка пройдена · +100 очков.</b> ${esc(p.cp.cond)}`
        : `<b>Условие контрольной точки:</b> ${esc(p.cp.cond)}`}</div>
    </div>`;
}

function flowRow(r, full = false) {
  const pct = Math.round((r.walk || 0) * 100);
  const proj = r.open
    ? (r.project || "—")
    : r.me ? (r.project || "—") + " · скрыт от потока" : "проект скрыт";
  return `
    <div class="flow-row ${r.me ? "me" : ""}">
      <span class="avatar sm"><img src="${esc(peerAvatar(r))}" alt=""></span>
      <div class="fr-main">
        <b>${esc(r.name)}${r.me ? " (вы)" : ""}</b>
        <small>${esc(proj)}${full && r.open && r.about ? " · " + esc(r.about) : ""}</small>
        <div class="fr-track">
          <i style="width:${pct}%"></i>
          <span class="fr-dot" style="left:${pct}%"></span>
        </div>
      </div>
      <div class="fr-meta">
        <span class="dock-chip d${esc(r.dock || "x")}">${r.dock ? esc(DOCKS[r.dock].name) : "без дока"}</span>
        <small>станция ${r.station} · ${fmt(r.points || 0)} очк.</small>
        ${full && r.open && r.link ? `<a href="${esc(r.link)}" target="_blank" rel="noopener" class="link-arrow" style="font-size:13px">продукт ↗</a>` : ""}
      </div>
    </div>`;
}

/* Своя строка в потоке обновляется на месте: перерисовка карты не должна
   ронять список участников до следующего запроса к серверу. */
function patchMyFlow() {
  if (!CACHE.flow) return;
  const me = CACHE.flow.find(r => r.me);
  if (me) Object.assign(me, {
    name: S.name, avatar: S.avatar, project: S.project, about: S.about,
    link: S.link, open: S.isPublic, dock: S.dock,
    points: points(), level: level().n,
    station: currentStationIdx(), walk: walkPos(), demos: S.demos.length,
  });
  CACHE.flow.sort((a, b) => b.walk - a.walk || b.points - a.points);
}

function hashNum(s) {
  let h = 0;
  for (let i = 0; i < String(s).length; i++) h = (h * 31 + String(s).charCodeAt(i)) % 9973;
  return h;
}

/* ---------------- карта: жизненный цикл ---------------- */

let mapInstance = null;
let lastCharX = null;

function mountMap() {
  const cv = document.getElementById("mapCanvas");
  if (!cv) return;
  mapInstance = new GAME.CityMap(cv, {
    onSelect: i => {
      if (i >= 9) { go("certificate"); return; }
      S.selStation = i;
      save();
      render();
    },
  });
  if (lastCharX !== null) mapInstance.charX = lastCharX;
  mapInstance.set({
    stations: STATIONS.map(p => ({
      done: stationDone(p), tool: p.tool,
      gate: !!p.cp, gatePassed: cpPassed(p),
    })),
    station: currentStationIdx(),
    walk: walkPos(),
    avatar: myAvatar(),
    doorOpen: doorOpen(),
    peers: flowRows().filter(r => !r.me),
    name: S.name,
  });
}

function unmountMap() {
  if (mapInstance) {
    lastCharX = mapInstance.charX;
    mapInstance.destroy();
    mapInstance = null;
  }
}

/* иконки инструментов на полке */
function paintToolIcons() {
  view.querySelectorAll("canvas[data-tool]").forEach(cv => {
    const rows = GAME.TOOLS[cv.dataset.tool];
    if (!rows) return;
    const ctx = cv.getContext("2d");
    const px = Math.floor(cv.width / 8);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.imageSmoothingEnabled = false;
    GAME.drawSprite(ctx, rows, 0, 0, px);
  });
}

/* ---------------- события ---------------- */

function render() {
  unmountMap();
  view.innerHTML = VIEWS[activeView]();
  refreshChrome();
  if (activeView === "map") mountMap();
  paintToolIcons();
  bind();
}

async function syncToggle(kind, id, done) {
  if (API === null) return;
  await apiCall("/toggle", "POST", { kind, id, done });
}

function bind() {
  view.querySelectorAll("[data-go]").forEach(el =>
    el.addEventListener("click", e => { e.preventDefault(); go(el.dataset.go); }));

  view.querySelectorAll("[data-station]").forEach(b =>
    b.addEventListener("click", () => { S.selStation = Number(b.dataset.station); save(); render(); }));

  /* вход / регистрация */
  view.querySelectorAll("[data-authtab]").forEach(b =>
    b.addEventListener("click", () => { S._reg = b.dataset.authtab === "reg"; render(); }));

  const authForm = view.querySelector("#authForm");
  if (authForm) authForm.addEventListener("submit", async e => {
    e.preventDefault();
    const errEl = view.querySelector("#authErr");
    errEl.style.display = "none";
    try {
      const body = {
        email: view.querySelector("#aEmail").value,
        password: view.querySelector("#aPass").value,
      };
      let data;
      if (S._reg) {
        body.name = view.querySelector("#aName").value;
        body.project = view.querySelector("#aProject").value;
        body.invite = view.querySelector("#aInvite").value.trim().toUpperCase();
        data = await apiCall("/register", "POST", body);
      } else {
        data = await apiCall("/login", "POST", body);
      }
      TOKEN = data.token;
      localStorage.setItem("shipyard_token", TOKEN);
      applyMe(data);
      S._reg = false;
      toast(`Добро пожаловать на верфь, ${S.name}!`);
      go("map");
    } catch (err2) {
      errEl.textContent = err2.message;
      errEl.style.display = "block";
    }
  });

  /* задачи станций */
  view.querySelectorAll("[data-task]").forEach(cb =>
    cb.addEventListener("change", async () => {
      const id = cb.dataset.task;
      const wasLvl = level().n;
      const wasTools = tools().length;
      const checked = cb.checked;
      try {
        await syncToggle("task", id, checked);
        S.done[id] = checked;
        if (!checked) delete S.done[id];
        save();
        const nowLvl = level().n;
        const nowTools = tools().length;
        if (checked) {
          const t = STATIONS.flatMap(p => p.tasks).find(x => x.id === id);
          if (doorOpen() && wasTools < 9) celebrate("Дверь MVP открыта!", "Путь пройден — сертификат доступен", "🚪");
          else if (nowTools > wasTools) {
            const st = STATIONS.find(p => stationDone(p) && p.tasks.some(x => x.id === id));
            celebrate("Станция закрыта!", `Получен инструмент: ${st ? st.toolName : "новый"} · путь дальше открыт`, "🧰");
          } else if (nowLvl > wasLvl) celebrate(`Новый уровень: ${LEVELS[nowLvl - 1].name}!`, LEVELS[nowLvl - 1].cond, LEVELS[nowLvl - 1].emoji);
          else toast(`+${t.pts} очков`);
        }
        CACHE.league = null;
        patchMyFlow();
        render();
      } catch (err2) { toast(err2.message); cb.checked = !checked; }
    }));

  /* безопасность */
  view.querySelectorAll("[data-sec]").forEach(cb =>
    cb.addEventListener("change", async () => {
      const checked = cb.checked;
      try {
        await syncToggle("sec", cb.dataset.sec, checked);
        S.sec[cb.dataset.sec] = checked;
        if (!checked) delete S.sec[cb.dataset.sec];
        save();
        if (checked) toast("+10 очков · пункт ИБ закрыт");
        render();
      } catch (err2) { toast(err2.message); cb.checked = !checked; }
    }));

  /* юридический трек */
  view.querySelectorAll("[data-legal]").forEach(b =>
    b.addEventListener("click", async () => {
      const id = b.dataset.legal;
      const val = !S.legal[id];
      try {
        await syncToggle("legal", id, val);
        S.legal[id] = val;
        if (!val) delete S.legal[id];
        save();
        if (val) toast("+15 очков · документ готов");
        render();
      } catch (err2) { toast(err2.message); }
    }));

  /* скрининг сложности */
  const sf = view.querySelector("#screenForm");
  if (sf) sf.addEventListener("submit", async e => {
    e.preventDefault();
    const answers = {};
    SCREENING.forEach(qq => {
      const el = sf.querySelector(`input[name="${qq.id}"]:checked`);
      answers[qq.id] = el ? Number(el.value) : 0;
    });
    const score = Object.values(answers).reduce((a, b) => a + b, 0);
    try {
      if (API !== null) {
        const r = await apiCall("/screening", "POST", { answers });
        S.dock = r.dock; S.complexity = r.complexity;
      } else {
        S.dock = dockFor(score); S.complexity = score;
      }
      save();
      CACHE.league = null;
      patchMyFlow();
      toast(`Ваш док: ${DOCKS[S.dock].name} · сложность ${S.complexity}`);
      go("league");
    } catch (err2) { toast(err2.message); }
  });

  /* демо */
  const demoForm = view.querySelector("#demoForm");
  if (demoForm) demoForm.addEventListener("submit", async e => {
    e.preventDefault();
    const text = view.querySelector("#demoText").value.trim();
    if (!text) return;
    const link = view.querySelector("#demoLink").value.trim();
    const about = view.querySelector("#demoAbout").value.trim();
    const week = currentStationIdx();
    try {
      if (API !== null) {
        if (about !== S.about || (link && link !== S.link)) {
          applyMe(await apiCall("/me", "PUT", { about, link: link || S.link }));
        }
        await apiCall("/demos", "POST", { week, text, link });
        CACHE.demos = (await apiCall("/demos")).demos;
      }
      S.about = about;
      if (link) S.link = link;
      S.demos.unshift({ week, text, link, ts: Date.now() });
      patchMyFlow();
      save();
      toast(S.demos.length >= 3 ? "🔥 Серия из 3 демо — множитель ×1.1!" : "+50 очков · демо на стене потока");
      render();
    } catch (err2) { toast(err2.message); }
  });

  /* голоса — API-режим */
  view.querySelectorAll("[data-voteid]").forEach(b =>
    b.addEventListener("click", async () => {
      try {
        const r = await apiCall("/vote", "POST", { demoId: Number(b.dataset.voteid) });
        const d = (CACHE.demos || []).find(x => x.id === Number(b.dataset.voteid));
        if (d) { d.votes = r.votes; d.my = r.my; }
        render();
      } catch (err2) { toast(err2.message); }
    }));

  /* голоса — локальный режим */
  view.querySelectorAll("[data-vote]").forEach(b =>
    b.addEventListener("click", () => {
      const i = b.dataset.vote;
      S.votes[i] = !S.votes[i];
      if (!S.votes[i]) delete S.votes[i];
      save();
      render();
    }));

  /* база знаний */
  view.querySelectorAll("[data-tab]").forEach(b =>
    b.addEventListener("click", () => { S.kbTab = b.dataset.tab; S.kbDoc = null; save(); render(); }));

  view.querySelectorAll("[data-doc]").forEach(b =>
    b.addEventListener("click", () => { S.kbDoc = b.dataset.doc; save(); render(); window.scrollTo(0, 0); }));

  const kbBack = view.querySelector("#kbBack");
  if (kbBack) kbBack.addEventListener("click", () => { S.kbDoc = null; save(); render(); });

  const copyMd = view.querySelector("#copyMd");
  if (copyMd) copyMd.addEventListener("click", () => {
    navigator.clipboard?.writeText(CLAUDE_MD).then(() => toast("Шаблон CLAUDE.md скопирован"));
  });

  view.querySelectorAll("[data-copy]").forEach(b =>
    b.addEventListener("click", () =>
      navigator.clipboard?.writeText(b.dataset.copy).then(() => toast("Скопировано в буфер"))));

  /* сервисный пул */
  view.querySelectorAll("[data-book]").forEach(b =>
    b.addEventListener("click", () => {
      toast(`Слот у направления «${SERVICE[b.dataset.book].dir}» запрошен — ментор подтвердит в Telegram`);
    }));

  /* аватар */
  const avFile = view.querySelector("#avFile");
  if (avFile) avFile.addEventListener("change", async () => {
    const f = avFile.files && avFile.files[0];
    if (!f) return;
    try {
      const dataUrl = await GAME.PixelAvatar.fromFile(f);
      await saveAvatar(dataUrl);
      toast("Персонаж собран — он уже на карте");
      render();
    } catch (e2) { toast(e2.message || "Не удалось обработать фото"); }
  });

  const avGen = view.querySelector("#avGen");
  if (avGen) avGen.addEventListener("click", async () => {
    try {
      await saveAvatar(GAME.PixelAvatar.generated(S.name + Math.random()));
      toast("Персонаж собран");
      render();
    } catch (e2) { toast(e2.message); }
  });

  const avClear = view.querySelector("#avClear");
  if (avClear) avClear.addEventListener("click", async () => {
    try { await saveAvatar(""); toast("Аватар убран"); render(); }
    catch (e2) { toast(e2.message); }
  });

  /* GitHub */
  const ghBtn = view.querySelector("#ghSync");
  if (ghBtn) ghBtn.addEventListener("click", async () => {
    if (API === null) return toast("Синхронизация с GitHub работает при подключённом бэкенде");
    const repo = (view.querySelector("#pfRepo") || {}).value || S.repo;
    if (!repo) return toast("Укажите репозиторий в поле выше и сохраните профиль");
    ghBtn.disabled = true;
    ghBtn.textContent = "Читаем GitHub…";
    try {
      const r = await apiCall("/github/sync", "POST", { repo });
      S.github = r.github;
      S.repo = r.github.repo;
      toast(r.cached ? "Данные из кэша (обновляется раз в 3 минуты)" : `Синхронизировано: ${r.github.weekCommits} коммитов за неделю`);
      render();
    } catch (e2) {
      toast(e2.message);
      ghBtn.disabled = false;
      ghBtn.textContent = "Синхронизировать";
    }
  });

  /* профиль */
  const pf = view.querySelector("#profileForm");
  if (pf) pf.addEventListener("submit", async e => {
    e.preventDefault();
    const patch = {
      name: view.querySelector("#pfName").value.trim() || S.name,
      project: view.querySelector("#pfProject").value.trim() || S.project,
      about: view.querySelector("#pfAbout").value.trim(),
      link: view.querySelector("#pfLink").value.trim(),
      repo: view.querySelector("#pfRepo").value.trim(),
      isPublic: view.querySelector("#pfPublic").checked,
    };
    try {
      if (API !== null) applyMe(await apiCall("/me", "PUT", patch));
      else Object.assign(S, patch);
      CACHE.league = null;
      patchMyFlow();
      save();
      toast("Профиль сохранён");
      render();
    } catch (err2) { toast(err2.message); }
  });

  const logoutBtn = view.querySelector("#logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", () => {
    logout();
    toast("Вы вышли из системы");
  });

  const reset = view.querySelector("#resetState");
  if (reset) reset.addEventListener("click", () => {
    localStorage.removeItem(KEY);
    S = defaultState();
    save();
    toast("Прогресс сброшен");
    render();
  });
}

async function saveAvatar(dataUrl) {
  if (API !== null) await apiCall("/avatar", "POST", { avatar: dataUrl });
  S.avatar = dataUrl;
  patchMyFlow();
  save();
}

/* ---------------- старт ---------------- */

(async () => {
  const cand = candidateApi();
  if (cand !== null) {
    // Удалённый бесплатный хостинг может просыпаться десятки секунд.
    // Долго ждём только тех, у кого есть токен, — иначе быстро уходим в локальный режим.
    const tries = cand === "" ? [4000] : (TOKEN ? [8000, 30000] : [8000]);
    for (let i = 0; i < tries.length; i++) {
      if (i > 0) {
        const v = document.getElementById("view");
        if (v) v.innerHTML = `<div style="padding:40px 0;color:var(--ink-2);font-size:15px">Сервер просыпается, подключаемся…</div>`;
      }
      try {
        const r = await fetch(cand + "/api/health", { signal: AbortSignal.timeout(tries[i]) });
        if (r.ok) { API = cand; break; }
      } catch { API = null; }
    }
  }
  if (API !== null && TOKEN) {
    try { applyMe(await apiCall("/me")); }
    catch { /* токен истёк — увидим экран входа */ }
  }
  if (API === null) save();
  const start = decodeURIComponent(location.hash || "").replace("#", "");
  go(VIEWS[start] && start !== "auth" ? start : "map");
})();

})();
