/* ============================================================
   SHIPYARD Platform — SPA
   Два режима:
   · API-режим — аккаунты и прогресс на бэкенде (server/server.js)
   · локальный — localStorage, если бэкенд недоступен (GitHub Pages)
   ============================================================ */

(() => {
"use strict";

/* ---------------- данные программы ---------------- */

const PHASES = [
  {
    id: "w0", week: 0, phase: "Onboarding", title: "Диагностика и окружение",
    desc: "До старта: идея проверена, окружение готово, документы подписаны.",
    tasks: [
      { id: "w0_idea",   label: "Пройти диагностику идеи и получить заключение", pts: 30 },
      { id: "w0_ip",     label: "Пройти скрининг IP-конфликта с работодателем", pts: 20 },
      { id: "w0_docs",   label: "Подписать договор с программой (права на продукт — у вас)", pts: 20 },
      { id: "w0_cc",     label: "Установить Claude Code и настроить рабочее окружение", pts: 30 },
      { id: "w0_vibe",   label: "Изучить базовые принципы вайб-кодинга: контекст и планирование", pts: 20 },
      { id: "w0_tg",     label: "Войти в Telegram-группу потока", pts: 10 },
    ],
    artifact: "Заключение по идее · рабочее окружение · доступ к потоку",
  },
  {
    id: "w1", week: 1, phase: "Requirements", title: "Сбор требований",
    desc: "Выйти к рынку до того, как написана первая строка кода.",
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
    gate: { id: "G1", cond: "Проведено 5–7 интервью, боль подтверждена минимум половиной респондентов" },
  },
  {
    id: "w2", week: 2, phase: "Design", title: "Проектирование",
    desc: "Урезать до минимума. Перевести архитектуру на язык Claude Code.",
    tasks: [
      { id: "w2_scope", label: "Урезать объём MVP до одного ключевого сценария", pts: 50 },
      { id: "w2_arch",  label: "Составить техническую карту и выбрать стек", pts: 40 },
      { id: "w2_mock",  label: "Собрать макеты ключевых экранов", pts: 30 },
      { id: "w2_md",    label: "Написать CLAUDE.md: контекст, правила, архитектурные решения", pts: 50 },
      { id: "w2_plan",  label: "Декомпозировать сборку на задачи и спринты", pts: 30 },
    ],
    artifact: "Техкарта · CLAUDE.md · прототип интерфейса · план спринтов",
    gate: { id: "G2", cond: "Объём MVP умещается в 4 недели сборки. Не умещается — режем ещё" },
  },
  {
    id: "w3", week: 3, phase: "Implementation I", title: "Реализация: ядро",
    desc: "Сборка ключевого сценария — самостоятельно, через Claude Code, по спринтам.",
    tasks: [
      { id: "w3_s1",  label: "Спринт 1: каркас проекта и модель данных через Claude Code", pts: 50 },
      { id: "w3_s2",  label: "Спринт 2: ключевой сценарий от входа до результата", pts: 60 },
      { id: "w3_rev", label: "Ревью сгенерированного кода вместе с ментором", pts: 30 },
    ],
    artifact: "Работающий ключевой сценарий",
  },
  {
    id: "w4", week: 4, phase: "Implementation II", title: "Реализация: обвязка",
    desc: "Авторизация, база, интеграции — из готовых заготовок программы. С нуля не пишется.",
    tasks: [
      { id: "w4_auth", label: "Подключить авторизацию из шаблонной заготовки", pts: 40 },
      { id: "w4_db",   label: "Подключить базу данных и миграции из заготовки", pts: 40 },
      { id: "w4_int",  label: "Подключить нужные интеграции (почта, файлы, API)", pts: 40 },
      { id: "w4_mid",  label: "Пройти промежуточный смотр MVP", pts: 40 },
    ],
    artifact: "Функционально полный MVP",
    gate: { id: "G3", cond: "Ключевой сценарий работает от начала до конца на реальных данных" },
  },
  {
    id: "w5", week: 5, phase: "Testing & Security", title: "Тестирование и безопасность",
    desc: "Найти и починить типовые ошибки вайб-кодинга. Закрыть чек-лист OWASP.",
    tasks: [
      { id: "w5_test", label: "Прогнать тестирование всех сценариев на реальных данных", pts: 40 },
      { id: "w5_rev",  label: "Ревью сгенерированного кода: типовые ошибки вайб-кодинга", pts: 40 },
      { id: "w5_scan", label: "Запустить сканирование зависимостей и конфигураций", pts: 40 },
      { id: "w5_owasp",label: "Закрыть чек-лист OWASP (раздел «Безопасность»)", pts: 60 },
    ],
    artifact: "Закрытый чек-лист OWASP · отчёт сканирования",
  },
  {
    id: "w6", week: 6, phase: "Deployment", title: "Развёртывание",
    desc: "Продукт выходит в интернет: хостинг, домен, автодеплой, мониторинг.",
    tasks: [
      { id: "w6_host", label: "Настроить хостинг, домен и сертификаты", pts: 40 },
      { id: "w6_cicd", label: "Настроить автоматический деплой (CI/CD)", pts: 40 },
      { id: "w6_mon",  label: "Включить мониторинг и резервные копии", pts: 30 },
      { id: "w6_legal",label: "Закрыть юридический пакет: оферта, политика данных", pts: 50 },
      { id: "w6_live", label: "Опубликовать продукт по публичной ссылке", pts: 60 },
    ],
    artifact: "Продукт в проде · юридический пакет",
    gate: { id: "G4", cond: "Чек-лист безопасности закрыт, продукт доступен по публичной ссылке" },
  },
  {
    id: "w7", week: 7, phase: "Go-to-market", title: "Вывод на рынок",
    desc: "Предзаказы и LOI. Приём денег — только после закрытия юридического пакета.",
    tasks: [
      { id: "w7_land",  label: "Собрать лендинг продукта и определить цену", pts: 40 },
      { id: "w7_chan",  label: "Запустить первые каналы и подключить аналитику", pts: 40 },
      { id: "w7_loi",   label: "Подписать LOI или пилотное соглашение", pts: 200 },
      { id: "w7_pay",   label: "Первый платящий клиент (после юридического пакета)", pts: 200 },
    ],
    artifact: "Предзаказы · LOI · пилотные соглашения",
    gate: { id: "G5", cond: "Есть предзаказ, подписанное LOI или пилотное соглашение" },
  },
  {
    id: "w8", week: 8, phase: "Demo Day", title: "Защита",
    desc: "Питч перед инвесторами и жюри. Выбор дальнейшего трека.",
    tasks: [
      { id: "w8_deck",  label: "Собрать питч-дек: проблема, решение, трекшн, команда", pts: 60 },
      { id: "w8_dry",   label: "Пройти прогон питча с ментором", pts: 40 },
      { id: "w8_pitch", label: "Выступить на Demo Day", pts: 100 },
      { id: "w8_track", label: "Выбрать трек: самостоятельный / сопровождение / venture", pts: 30 },
    ],
    artifact: "Питч-дек · оценка жюри · решение по треку",
  },
];

const LEVELS = [
  { n: 1, name: "Sketch",       emoji: "✏️", cond: "Идея описана, диагностика пройдена", phase: 0 },
  { n: 2, name: "Blueprint",    emoji: "📐", cond: "Требования собраны, ЦП сформулировано", phase: 1 },
  { n: 3, name: "Keel",         emoji: "🔩", cond: "Архитектура и объём MVP утверждены", phase: 2 },
  { n: 4, name: "Builder",      emoji: "🏗️", cond: "Ключевой сценарий работает", phase: 4 },
  { n: 5, name: "Sea Trials",   emoji: "🌊", cond: "Тестирование и безопасность закрыты", phase: 5 },
  { n: 6, name: "Launched",     emoji: "🚢", cond: "Продукт в проде, юрпакет собран", phase: 6 },
  { n: 7, name: "First Voyage", emoji: "🧭", cond: "Первые пользователи или клиенты", phase: 7 },
  { n: 8, name: "Captain",      emoji: "⚓️", cond: "Demo Day пройден", phase: 8 },
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
  { level: 3, title: "Ручной аудит", tag: "Pro / Venture", items: [
    { id: "s_man1",  label: "Аудит логики доступа специалистом пройден" },
    { id: "s_man2",  label: "Аудит бизнес-логики: сценарии злоупотребления разобраны" },
    { id: "s_man3",  label: "Повторная проверка после исправлений пройдена" },
  ]},
];

const LEGAL = [
  { id: "l0a", week: "0",   title: "Договор с программой",              why: "Фиксирует: права на продукт остаются у участника" },
  { id: "l0b", week: "0",   title: "Скрининг IP-конфликта с работодателем", why: "Служебные произведения и конфликт интересов — до старта" },
  { id: "l1",  week: "1",   title: "Соглашение о конфиденциальности",   why: "Защита при разговорах с клиентами и партнёрами" },
  { id: "l2",  week: "2–3", title: "Регистрация компании",              why: "Основание для счетов и договоров" },
  { id: "l3",  week: "3",   title: "Соглашение между сооснователями",   why: "Критично, если участник не один" },
  { id: "l5",  week: "5–6", title: "Политика персональных данных",      why: "Требование законодательства" },
  { id: "l6",  week: "6",   title: "Публичная оферта и пользовательское соглашение", why: "Основание для приёма платежей. До этой точки деньги не принимаются" },
  { id: "l7",  week: "6–7", title: "Заявка на товарный знак",           why: "Защита названия продукта" },
];

const BADGES = [
  { id: "b_interview", emoji: "🎙️", name: "Interview Master",  desc: "5+ интервью с клиентами",            test: s => PHASES[1].tasks.filter(t => t.interview && s.done[t.id]).length >= 5 },
  { id: "b_security",  emoji: "🛡️", name: "Security Cleared",  desc: "Чек-лист OWASP и сканирование закрыты", test: s => SECURITY.slice(0, 2).every(g => g.items.every(i => s.sec[i.id])) },
  { id: "b_legal",     emoji: "⚖️", name: "Legal Ready",       desc: "Юридический пакет собран",           test: s => ["l0a","l0b","l1","l5","l6"].every(id => s.legal[id]) },
  { id: "b_ship",      emoji: "🚢", name: "Zero Downtime",     desc: "Продукт в проде с мониторингом",     test: s => ["w6_host","w6_cicd","w6_mon","w6_live"].every(id => s.done[id]) },
  { id: "b_revenue",   emoji: "💸", name: "First Revenue",     desc: "Первый платящий клиент или LOI",     test: s => s.done["w7_loi"] || s.done["w7_pay"] },
  { id: "b_streak",    emoji: "🔥", name: "Демо-серия",        desc: "3 пятничных демо подряд",            test: s => s.demos.length >= 3 },
];

const KB = {
  materials: [
    { icon: "🧭", week: 0, title: "Установка Claude Code и первый проект",        note: "Пошаговая настройка окружения, аутентификация, первый диалог", type: "гайд" },
    { icon: "🧠", week: 0, title: "Принципы вайб-кодинга: контекст и планирование", note: "Как формулировать требования, когда планировать, когда просить код", type: "гайд" },
    { icon: "🎙️", week: 1, title: "Шаблон сценария интервью с клиентом",           note: "Готовый сценарий 5–7 вопросов: боль, частота, текущее решение, цена", type: "шаблон" },
    { icon: "🗺️", week: 1, title: "Карта боли и ценностное предложение",           note: "Рабочий лист: сегмент → боль → альтернативы → наше отличие", type: "шаблон" },
    { icon: "✂️", week: 2, title: "Как резать объём MVP",                          note: "Правило одного сценария: что выкидываем и почему это безопасно", type: "гайд" },
    { icon: "📄", week: 2, title: "Шаблон CLAUDE.md",                              note: "Структура файла инструкций: контекст, правила, архитектура, запреты", type: "шаблон" },
    { icon: "🏗️", week: 3, title: "Спринты с Claude Code: декомпозиция задач",     note: "Как ставить задачи агенту, чтобы не терять контекст между сессиями", type: "гайд" },
    { icon: "🔌", week: 4, title: "Заготовка: авторизация",                        note: "Готовый модуль: регистрация, вход, сессии, восстановление пароля", type: "заготовка" },
    { icon: "🗄️", week: 4, title: "Заготовка: база данных и миграции",             note: "Схема, миграции, бэкапы — подключается за один спринт", type: "заготовка" },
    { icon: "🔍", week: 5, title: "Типовые ошибки вайб-кодинга и как их ловить",   note: "Каталог: захардкоженные секреты, дырявые доступы, молчаливые catch", type: "гайд" },
    { icon: "🛡️", week: 5, title: "Чек-лист OWASP программы",                      note: "Интерактивная версия — в разделе «Безопасность»", type: "чек-лист" },
    { icon: "🚀", week: 6, title: "Шаблон инфраструктуры и автодеплой",            note: "Хостинг, домен, CI/CD, мониторинг, резервные копии — по шагам", type: "заготовка" },
    { icon: "📜", week: 6, title: "Пакет юридических шаблонов",                    note: "Оферта, политика данных, пользовательское соглашение", type: "шаблон" },
    { icon: "📈", week: 7, title: "Лендинг, цена, каналы",                         note: "Как собрать предзаказы и LOI до приёма денег", type: "гайд" },
    { icon: "🎤", week: 8, title: "Структура питча для Demo Day",                  note: "Проблема, решение, трекшн, команда — 5 минут, 10 слайдов", type: "шаблон" },
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

const EXPERTS = [
  { icon: "🧑‍✈️", dir: "Ментор потока",     what: "Вопросы, блокеры, навигация, темп", format: "Telegram, SLA 4 раб. часа", weeks: "0–8, постоянно", indiv: false },
  { icon: "💻", dir: "Разработка",          what: "Архитектура, код-ревью, сложные участки", format: "Групповой созвон ВТ", weeks: "2–6", indiv: true },
  { icon: "⚙️", dir: "DevOps",              what: "Инфраструктура, деплой, мониторинг", format: "Групповой созвон + шаблон", weeks: "5–6", indiv: true },
  { icon: "🛡️", dir: "Кибербезопасность",   what: "Уязвимости, защита данных, доступы", format: "Чек-лист + сканирование", weeks: "5", indiv: true },
  { icon: "⚖️", dir: "Право",               what: "Компания, оферта, перс. данные, знак", format: "Групповые сессии + шаблоны", weeks: "1–7", indiv: true },
  { icon: "📦", dir: "Продукт",             what: "Объём MVP, метрики, приоритизация", format: "Групповые созвоны", weeks: "1–4", indiv: true },
  { icon: "📣", dir: "Маркетинг и продажи", what: "Позиционирование, цена, каналы, сделки", format: "Групповые сессии + питчи", weeks: "7–8", indiv: true },
  { icon: "💼", dir: "Инвестиционный трек", what: "Питч, оценка, структура сделки", format: "Подготовка к Demo Day", weeks: "8", indiv: true },
];

/* локальный режим: сиды для стены и лиги (без бэкенда) */
const PEERS = [
  { name: "Айгерим С.", project: "MedQueue — запись в частные клиники", pts: 720, lvl: 4 },
  { name: "Данияр Т.",  project: "CargoLink — биржа попутных грузов",   pts: 660, lvl: 4 },
  { name: "Мария К.",   project: "LexDraft — генератор договоров",      pts: 605, lvl: 3 },
  { name: "Ерлан Ж.",   project: "AgroScan — учёт полей для фермеров",  pts: 540, lvl: 3 },
  { name: "Салтанат Б.",project: "EduPay — оплата кружков для школ",    pts: 470, lvl: 3 },
  { name: "Тимур А.",   project: "FitDesk — абонементы для студий",     pts: 390, lvl: 2 },
  { name: "Жанна О.",   project: "TenderEye — мониторинг закупок",      pts: 310, lvl: 2 },
];

const PEER_DEMOS = [
  { author: "Айгерим С.", project: "MedQueue", week: 3, text: "Ключевой сценарий записи работает: пациент выбирает врача, слот бронируется, клиника видит запись в панели.", votes: 5 },
  { author: "Данияр Т.",  project: "CargoLink", week: 3, text: "Собрал матчинг груза и машины через Claude Code. Показал на реальных заявках двух перевозчиков.", votes: 4 },
  { author: "Мария К.",   project: "LexDraft", week: 3, text: "Генерация договора аренды из анкеты: 12 полей → готовый документ. Юрист потока проверил формулировки.", votes: 6 },
  { author: "Ерлан Ж.",   project: "AgroScan", week: 2, text: "Урезал MVP с 9 функций до одной: карта поля + заметки агронома. CLAUDE.md утверждён на G2.", votes: 3 },
  { author: "Салтанат Б.",project: "EduPay", week: 2, text: "7 интервью с директорами кружков: боль подтвердили 6 из 7. Ценностное предложение переписала трижды.", votes: 4 },
  { author: "Тимур А.",   project: "FitDesk", week: 3, text: "Каркас на заготовке авторизации программы. Первый спринт закрыт за 4 вечера.", votes: 2 },
];

/* ---------------- API-слой ---------------- */

let API = null;          // "" = same-origin, "https://…" = удалённый, null = локальный режим
let TOKEN = localStorage.getItem("shipyard_token") || null;
const CACHE = { demos: null, league: null };

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
  S.name = d.user.name;
  S.project = d.user.project;
  S.tariff = d.user.tariff;
  S.email = d.user.email;
  S.done = d.done || {};
  S.sec = d.sec || {};
  S.legal = d.legal || {};
  S.demos = d.demos || [];
}

function logout(rerender = true) {
  TOKEN = null;
  localStorage.removeItem("shipyard_token");
  CACHE.demos = CACHE.league = null;
  if (rerender) go("dashboard");
}

/* ---------------- состояние ---------------- */

const KEY = "shipyard_state_v1";

const defaultState = () => ({
  name: "Гость",
  project: "Мой продукт",
  tariff: "Pro",
  email: "",
  startDate: Date.now(),
  done: {}, sec: {}, legal: {},
  demos: [], votes: {},
  kbTab: "materials",
});

let S;
try { S = Object.assign(defaultState(), JSON.parse(localStorage.getItem(KEY) || "{}")); }
catch { S = defaultState(); }

const save = () => { if (API === null) localStorage.setItem(KEY, JSON.stringify(S)); };

/* ---------------- вычисления ---------------- */

const phaseDone = p => p.tasks.every(t => S.done[t.id]);
const phaseProgress = p => p.tasks.filter(t => S.done[t.id]).length / p.tasks.length;

function currentPhaseIdx() {
  const i = PHASES.findIndex(p => !phaseDone(p));
  return i === -1 ? PHASES.length - 1 : i;
}

function gatePassed(p) { return p.gate ? phaseDone(p) : false; }

function level() {
  let lvl = LEVELS[0];
  for (const l of LEVELS) if (phaseDone(PHASES[l.phase])) lvl = l; else break;
  return lvl;
}

function points() {
  let pts = 0;
  for (const p of PHASES) for (const t of p.tasks) if (S.done[t.id]) pts += t.pts;
  for (const p of PHASES) if (p.gate && gatePassed(p)) pts += 100;
  for (const g of SECURITY) for (const i of g.items) if (S.sec[i.id]) pts += 10;
  for (const id in S.legal) if (S.legal[id]) pts += 15;
  pts += S.demos.length * 50;
  if (S.demos.length >= 3) pts = Math.round(pts * 1.1);
  return pts;
}

function totalProgress() {
  const all = PHASES.flatMap(p => p.tasks);
  return all.filter(t => S.done[t.id]).length / all.length;
}

function earnedBadges() { return BADGES.filter(b => b.test(S)); }

function demoDayDate() {
  const d = new Date(S.startDate);
  d.setDate(d.getDate() + 56);
  return d;
}

const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
const fmt = n => n.toLocaleString("ru-RU");

/* ---------------- каркас ---------------- */

const view = document.getElementById("view");
const toastEl = document.getElementById("toast");
let toastTimer;

function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2600);
}

function refreshChrome() {
  document.getElementById("userName").textContent = S.name;
  document.getElementById("userTariff").textContent =
    API !== null && !TOKEN ? "Не в системе" : `Тариф ${S.tariff} · Поток №1`;
  document.getElementById("userAvatar").textContent = (S.name[0] || "A").toUpperCase();
  document.getElementById("pillTrack").textContent = `нед. ${currentPhaseIdx()}`;
  const secAll = SECURITY.flatMap(g => g.items);
  const secDone = secAll.filter(i => S.sec[i.id]).length;
  document.getElementById("pillSec").textContent = `${secDone}/${secAll.length}`;
}

let activeView = "dashboard";

async function go(name) {
  if (API !== null && !TOKEN) name = "auth";
  activeView = name;
  document.querySelectorAll(".side-link").forEach(b =>
    b.classList.toggle("active", b.dataset.view === name));
  try {
    if (API !== null && TOKEN) {
      if (name === "demos" && !CACHE.demos) CACHE.demos = (await apiCall("/demos")).demos;
      if (name === "league") CACHE.league = (await apiCall("/league")).rows;
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

/* ---------------- views ---------------- */

const VIEWS = {

  /* ---- вход / регистрация ---- */
  auth() {
    return `
      <div style="max-width:440px;margin:8vh auto 0">
        <div style="text-align:center;margin-bottom:26px">
          <div style="font-size:44px">⚓</div>
          <h1 style="font-size:28px;font-weight:700;letter-spacing:-.02em;margin-top:8px">SHIPYARD</h1>
          <p class="muted" style="margin-top:6px">Войдите, чтобы прогресс, демо и лига жили на сервере</p>
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
              <div class="field"><label>Тариф</label>
                <select id="aTariff"><option>Solo</option><option selected>Pro</option><option>Venture</option></select>
              </div>` : ""}
            <div class="field"><label>E-mail</label><input id="aEmail" type="email" required placeholder="you@example.com"></div>
            <div class="field"><label>Пароль</label><input id="aPass" type="password" required minlength="6" placeholder="Минимум 6 символов"></div>
            <div id="authErr" style="color:var(--red);font-size:14px;margin-bottom:12px;display:none"></div>
            <button class="btn btn-primary" type="submit" style="width:100%">${S._reg ? "Создать аккаунт" : "Войти"}</button>
          </form>
        </div>
        <p class="muted" style="text-align:center;font-size:13px">Пилотный поток №1 · права на ваш продукт всегда остаются у вас</p>
      </div>`;
  },

  /* ---- обзор ---- */
  dashboard() {
    const lvl = level();
    const cur = currentPhaseIdx();
    const p = PHASES[cur];
    const prog = Math.round(totalProgress() * 100);
    const badges = earnedBadges();
    const dd = demoDayDate();
    const daysLeft = Math.max(0, Math.ceil((dd - Date.now()) / 86400000));

    return `
      <div class="hero-card">
        <div class="hc-label">Неделя ${p.week} · ${esc(p.phase)}</div>
        <h1>${esc(S.project)}</h1>
        <p>${esc(p.desc)}</p>
        <div class="hc-stats">
          <div><b>${lvl.emoji} ${lvl.name}</b><span>уровень ${lvl.n} из 8</span></div>
          <div><b>${fmt(points())}</b><span>очков</span></div>
          <div><b>${S.demos.length}</b><span>демо сдано</span></div>
          <div><b>${daysLeft} дн.</b><span>до Demo Day</span></div>
        </div>
        <div class="bar"><i style="width:${prog}%"></i></div>
      </div>

      <div class="panel-row cols-3">
        <div class="panel tile">
          <div class="t-icon">🗺️</div>
          <div class="t-num">${prog}%</div>
          <div class="t-cap">трека пройдено · <a href="#" data-go="track">к треку</a></div>
        </div>
        <div class="panel tile">
          <div class="t-icon">🛡️</div>
          <div class="t-num">${SECURITY.flatMap(g=>g.items).filter(i=>S.sec[i.id]).length}/${SECURITY.flatMap(g=>g.items).length}</div>
          <div class="t-cap">пунктов безопасности · <a href="#" data-go="security">к чек-листу</a></div>
        </div>
        <div class="panel tile">
          <div class="t-icon">🏅</div>
          <div class="t-num">${badges.length}/${BADGES.length}</div>
          <div class="t-cap">бейджей получено · <a href="#" data-go="profile">в профиль</a></div>
        </div>
      </div>

      <div class="panel-row cols-2">
        <div class="panel">
          <h2>Эта неделя: ${esc(p.title)}</h2>
          <p class="muted" style="margin-bottom:14px">Фаза ${esc(p.phase)} · артефакт: ${esc(p.artifact)}</p>
          ${p.tasks.map(t => taskRow(t)).join("")}
          ${p.gate ? gateBanner(p) : ""}
        </div>
        <div class="panel">
          <h2>Ритм недели</h2>
          <p class="muted" style="margin-bottom:8px">Структура — на платформе, скорость — в Telegram.</p>
          ${[
            ["ПН", "Материалы фазы", "асинхронно, база знаний"],
            ["ВТ", "Групповой созвон с экспертом", "разбор фазы SDLC · 60–90 мин"],
            ["ЧТ", "Профильный созвон", "направление недели · 60–90 мин"],
            ["ПТ", "Демо — обязательное", "5 минут, публично, очки"],
            ["·", "Ментор в Telegram", "SLA — 4 рабочих часа, будни 10:00–19:00"],
          ].map(([d, t, n]) => `
            <div class="kb-item">
              <div class="k-icon" style="font-size:13px;font-weight:700;color:var(--accent)">${d}</div>
              <div><b>${t}</b><small>${n}</small></div>
            </div>`).join("")}
          <div class="divider"></div>
          <button class="btn btn-primary btn-sm" data-go="demos">Сдать пятничное демо</button>
        </div>
      </div>`;
  },

  /* ---- трек ---- */
  track() {
    const cur = currentPhaseIdx();
    return `
      <div class="page-head">
        <h1>Трек проекта · SDLC</h1>
        <p>Девять фаз, пять gates. Переход между фазами не автоматический: gate закрывается только проверяемым артефактом.</p>
      </div>
      ${PHASES.map((p, i) => {
        const done = phaseDone(p);
        const cls = done ? "done" : i === cur ? "current open" : i > cur ? "locked" : "";
        const prog = Math.round(phaseProgress(p) * 100);
        return `
        <div class="phase-card ${cls}" data-phase="${i}">
          <div class="phase-head" data-toggle="${i}">
            <div class="phase-num">${done ? "✓" : p.week}</div>
            <div class="phase-title">
              <b>${esc(p.title)}</b>
              <small>Неделя ${p.week} · ${esc(p.phase)} · ${esc(p.artifact)}</small>
            </div>
            <div class="phase-state">${done ? "Завершено" : i === cur ? "Текущая фаза" : prog > 0 ? prog + "%" : "Впереди"}</div>
          </div>
          <div class="phase-body">
            <p class="muted" style="margin-bottom:10px">${esc(p.desc)}</p>
            ${p.tasks.map(t => taskRow(t)).join("")}
            <div class="artifact-box">📦 <b>Артефакт недели:</b>&nbsp;${esc(p.artifact)}</div>
          </div>
        </div>
        ${p.gate ? gateBanner(p) : ""}`;
      }).join("")}`;
  },

  /* ---- стена демо ---- */
  demos() {
    let cards = "";
    if (API !== null) {
      const list = CACHE.demos || [];
      cards = list.map(d => `
        <div class="demo-card">
          <div class="d-head">
            <div class="avatar" style="${d.mine ? "" : "background:linear-gradient(135deg,#af52de,#ff2d55)"}">${esc(d.name[0] || "?")}</div>
            <div><b>${esc(d.name)} — ${esc(d.project)}</b><small>${d.mine ? "моё демо" : "участник потока"}</small></div>
            <span class="d-week">нед. ${d.week}</span>
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
            <div class="avatar">${esc((S.name[0] || "A").toUpperCase())}</div>
            <div><b>${esc(S.name)} — ${esc(S.project)}</b><small>моё демо</small></div>
            <span class="d-week">нед. ${d.week}</span>
          </div>
          <p>${esc(d.text)}</p>
          ${d.link ? `<a href="${esc(d.link)}" target="_blank" rel="noopener" class="link-arrow" style="font-size:14px">Открыть</a>` : ""}
        </div>`).join("");
      const peers = PEER_DEMOS.map((d, i) => {
        const voted = !!S.votes[i];
        return `
        <div class="demo-card">
          <div class="d-head">
            <div class="avatar" style="background:linear-gradient(135deg,#af52de,#ff2d55)">${esc(d.author[0])}</div>
            <div><b>${esc(d.author)} — ${esc(d.project)}</b><small>участник потока</small></div>
            <span class="d-week">нед. ${d.week}</span>
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
            <label>Ссылка (прод, прототип или запись) — необязательно</label>
            <input id="demoLink" type="url" placeholder="https://…">
          </div>
          <button class="btn btn-primary" type="submit">Опубликовать демо · +50 очков</button>
        </form>
      </div>
      <div class="demo-grid">${cards}</div>`;
  },

  /* ---- лига ---- */
  league() {
    let rows;
    if (API !== null) {
      rows = (CACHE.league || []).map(r => ({ ...r, name: r.me ? r.name + " (вы)" : r.name }));
    } else {
      const me = { name: S.name + " (вы)", project: S.project, pts: points(), lvl: level().n, me: true };
      rows = [...PEERS, me].sort((a, b) => b.pts - a.pts);
    }
    const medals = ["🥇", "🥈", "🥉"];
    return `
      <div class="page-head">
        <h1>Лига «Док А»</h1>
        <p>Мини-группа участников схожей стадии. Лиги вместо общего рейтинга: отстающие не демотивированы разрывом с лидерами.</p>
      </div>
      <div class="panel">
        <table class="table">
          <thead><tr><th style="width:56px">Место</th><th>Участник</th><th>Проект</th><th>Уровень</th><th style="text-align:right">Очки</th></tr></thead>
          <tbody>
            ${rows.map((r, i) => {
              const lv = LEVELS[Math.max(0, Math.min(7, r.lvl - 1))];
              return `<tr class="${r.me ? "me" : ""}">
                <td><span class="rank-medal">${medals[i] || (i + 1)}</span></td>
                <td><b>${esc(r.name)}</b></td>
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
          <h2>Что даёт высокое место</h2>
          ${["Приоритетный доступ к слотам экспертов на следующей неделе",
             "Выступление на Demo Day перед инвесторами — для верхней части рейтинга",
             "Скидка на трек сопровождения после программы",
             "Приглашение в закрытый venture-трек"]
            .map(t => `<div class="req ok"><div class="r-ic">✓</div>${t}</div>`).join("")}
        </div>
        <div class="panel">
          <h2>За что начисляются очки</h2>
          ${[["Пятничное демо", "+50"], ["Интервью с клиентом", "+30"], ["Пункт чек-листа ИБ", "+10"],
             ["Пройденный gate", "+100"], ["LOI / первый платёж", "+200"], ["Серия из 3 демо", "×1.1"]]
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
            <h2>Готовность к gate G4</h2>
            <p class="muted" style="max-width:520px">Gate G4 (неделя 6) требует полностью закрытых уровней 1 и 2. Уровень 3 — ручной аудит специалистом — входит в тарифы Pro и Venture.</p>
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
        <p>Идёт параллельно программе. Приём денег — только после публичной оферты на неделе 6. Регистрация компании и товарный знак могут продолжиться после программы — это фиксируется в договоре.</p>
      </div>
      <div class="panel">
        ${LEGAL.map(l => {
          const done = !!S.legal[l.id];
          return `
          <div class="legal-step">
            <div class="wk">нед. ${l.week}</div>
            <div><b>${esc(l.title)}</b><small>${esc(l.why)}</small></div>
            <button class="status-chip ${done ? "done" : "wait"}" data-legal="${l.id}" style="border:none;cursor:pointer">
              ${done ? "✓ Готово" : "Отметить"}
            </button>
          </div>`;
        }).join("")}
      </div>
      <div class="panel">
        <h2>Права на продукт</h2>
        <p class="muted">Договор с программой фиксирует с недели 0: полные права на код, дизайн и данные остаются у участника. Условия venture-сделки опубликованы до начала программы и одинаковы для всех; от сделки можно отказаться без потери прав.</p>
      </div>`;
  },

  /* ---- база знаний ---- */
  kb() {
    const tab = S.kbTab;
    const tabs = [
      ["materials", "Материалы недель"],
      ["claudemd", "Шаблон CLAUDE.md"],
      ["prompts", "Библиотека промптов"],
    ];
    let body = "";
    if (tab === "materials") {
      const cur = currentPhaseIdx();
      body = `<div class="panel">${KB.materials.map(m => `
        <div class="kb-item" style="${m.week > cur ? "opacity:.45" : ""}">
          <div class="k-icon">${m.icon}</div>
          <div><b>${esc(m.title)}</b><small>Неделя ${m.week} · ${esc(m.note)}${m.week > cur ? " · откроется по треку" : ""}</small></div>
          <span class="k-type">${m.type}</span>
        </div>`).join("")}</div>`;
    } else if (tab === "claudemd") {
      body = `
        <div class="panel">
          <h2>Готовый шаблон CLAUDE.md</h2>
          <p class="muted">Файл инструкций проекта: контекст, правила и архитектурные решения для агента. Заполняется на неделе 2 и живёт с проектом дальше.</p>
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
        <p>Материалы фаз, шаблоны, чек-листы, библиотека промптов и паттернов вайб-кодинга. Публикуются по понедельникам.</p>
      </div>
      <div class="kb-tabs">
        ${tabs.map(([id, name]) => `<button class="kb-tab ${tab === id ? "active" : ""}" data-tab="${id}">${name}</button>`).join("")}
      </div>
      ${body}`;
  },

  /* ---- эксперты ---- */
  experts() {
    const isPro = S.tariff !== "Solo";
    return `
      <div class="page-head">
        <h1>Экспертный пул</h1>
        <p>Групповой контур — всем: два созвона в неделю и ментор в Telegram. Индивидуальные слоты — дифференциатор тарифов Pro и Venture.</p>
      </div>
      <div class="panel">
        <table class="table">
          <thead><tr><th></th><th>Направление</th><th>Что закрывает</th><th>Формат</th><th>Недели</th><th></th></tr></thead>
          <tbody>
            ${EXPERTS.map((e, i) => `
              <tr>
                <td style="font-size:20px">${e.icon}</td>
                <td><b>${esc(e.dir)}</b></td>
                <td style="color:var(--ink-2)">${esc(e.what)}</td>
                <td style="color:var(--ink-2)">${esc(e.format)}</td>
                <td style="white-space:nowrap">${esc(e.weeks)}</td>
                <td>${e.indiv
                  ? (isPro
                      ? `<button class="btn btn-ghost btn-sm" data-book="${i}">Слот</button>`
                      : `<span class="status-chip wait">Pro / Venture</span>`)
                  : `<span class="status-chip done">Всегда на связи</span>`}</td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>
      <div class="panel">
        <h2>SLA менторской поддержки</h2>
        <p class="muted">Ответ ментора — в течение 4 рабочих часов, будни с 10:00 до 19:00. Мы сознательно не обещаем «24/7»: невыполнимое обещание хуже честного SLA.</p>
      </div>`;
  },

  /* ---- Demo Day ---- */
  demoday() {
    const dd = demoDayDate();
    const diff = Math.max(0, dd - Date.now());
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const g5 = gatePassed(PHASES[7]);
    const reqs = [
      { ok: gatePassed(PHASES[1]), label: "G1 — боль подтверждена интервью" },
      { ok: gatePassed(PHASES[2]), label: "G2 — объём MVP утверждён" },
      { ok: gatePassed(PHASES[4]), label: "G3 — ключевой сценарий на реальных данных" },
      { ok: gatePassed(PHASES[6]), label: "G4 — безопасность закрыта, продукт в проде" },
      { ok: g5, label: "G5 — предзаказ, LOI или пилотное соглашение" },
      { ok: !!S.done["w8_deck"], label: "Питч-дек собран" },
      { ok: !!S.done["w8_dry"], label: "Прогон питча с ментором пройден" },
    ];
    const okCount = reqs.filter(r => r.ok).length;
    return `
      <div class="page-head">
        <h1>Demo Day</h1>
        <p>5 минут питча, 3 минуты вопросов. Жюри: инвесторы, отраслевые заказчики, технические эксперты и внешний член с правом вето. Оценка по осям: проблема, решение, трекшн, команда.</p>
      </div>
      <div class="dd-count">
        <div class="dd-unit"><b>${days}</b><span>дней</span></div>
        <div class="dd-unit"><b>${hours}</b><span>часов</span></div>
        <div class="dd-unit"><b>${dd.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}</b><span>дата защиты</span></div>
      </div>
      <div class="panel-row cols-2">
        <div class="panel">
          <h2>Готовность к сцене · ${okCount}/${reqs.length}</h2>
          <p class="muted" style="margin-bottom:10px">Выступают проекты, прошедшие gate G5. Остальные — зрители и участники нетворкинга.</p>
          ${reqs.map(r => `<div class="req ${r.ok ? "ok" : "no"}"><div class="r-ic">${r.ok ? "✓" : "·"}</div>${esc(r.label)}</div>`).join("")}
        </div>
        <div class="panel">
          <h2>Что происходит после</h2>
          ${[
            ["🧗", "Самостоятельный трек", "Забираете всё и растёте сами. Продукт, код и права — ваши."],
            ["🤝", "Сопровождение", "Подписка на нашу команду по фиксированной прозрачной ставке."],
            ["🚀", "Venture", "Мы забираем разработку целиком и входим в долю. Только по приглашению, условия опубликованы до старта."],
          ].map(([ic, t, n]) => `
            <div class="kb-item"><div class="k-icon">${ic}</div><div><b>${t}</b><small>${n}</small></div></div>`).join("")}
          <div class="divider"></div>
          <p class="muted">Мы не обещаем инвестиции — мы обещаем доступ и подготовку: питч, подтверждённые метрики и людей, принимающих решения, в зале.</p>
        </div>
      </div>`;
  },

  /* ---- профиль ---- */
  profile() {
    const lvl = level();
    const badges = earnedBadges().map(b => b.id);
    return `
      <div class="page-head">
        <h1>Профиль основателя</h1>
        <p>Открытый профиль — основа нетворкинга: проект, стадия, стек, потребности. По нему вас находят соучастники и инвесторы.</p>
      </div>
      <div class="panel-row cols-2">
        <div class="panel">
          <h2>Данные</h2>
          ${S.email ? `<p class="muted" style="margin-top:4px">${esc(S.email)}</p>` : ""}
          <form id="profileForm" style="margin-top:12px">
            <div class="field"><label>Имя</label><input id="pfName" value="${esc(S.name)}"></div>
            <div class="field"><label>Проект</label><input id="pfProject" value="${esc(S.project)}"></div>
            <div class="field"><label>Тариф</label>
              <select id="pfTariff">
                ${["Solo", "Pro", "Venture"].map(t => `<option ${S.tariff === t ? "selected" : ""}>${t}</option>`).join("")}
              </select>
            </div>
            <button class="btn btn-primary btn-sm" type="submit">Сохранить</button>
            ${API !== null ? `<button class="btn btn-ghost btn-sm" type="button" id="logoutBtn" style="margin-left:10px">Выйти</button>` : ""}
          </form>
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
          <p class="muted"><b style="color:var(--ink)">${fmt(points())}</b> очков · уровень отражает стадию продукта, а не время в программе.</p>
          ${API === null ? `<div class="divider"></div><button class="btn btn-ghost btn-sm" id="resetState">Сбросить прогресс (демо)</button>` : ""}
        </div>
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
      </div>
      <div class="panel">
        <h2>Что вы уносите в любом случае</h2>
        ${["Работающий продукт и полные права на код, дизайн и данные",
           "Навык вайб-кодинга через Claude Code внутри полного цикла SDLC",
           "Зарегистрированную компанию и комплект юридических документов",
           "Закрытый чек-лист безопасности и инфраструктуру с автодеплоем",
           "Проверенную — или честно опровергнутую — бизнес-гипотезу",
           "Сеть контактов: поток, менторы, эксперты, инвесторы Demo Day"]
          .map(t => `<div class="req ok"><div class="r-ic">✓</div>${t}</div>`).join("")}
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

function gateBanner(p) {
  const passed = gatePassed(p);
  return `
    <div class="gate-banner ${passed ? "passed" : ""}">
      <span class="g-badge">${p.gate.id}</span>
      <div>${passed
        ? `<b>Gate пройден · +100 очков.</b> ${esc(p.gate.cond)}`
        : `<b>Условие gate:</b> ${esc(p.gate.cond)}`}</div>
    </div>`;
}

/* ---------------- события ---------------- */

function render() {
  view.innerHTML = VIEWS[activeView]();
  refreshChrome();
  bind();
}

async function syncToggle(kind, id, done) {
  if (API === null) return;
  await apiCall("/toggle", "POST", { kind, id, done });
}

function bind() {
  view.querySelectorAll("[data-go]").forEach(el =>
    el.addEventListener("click", e => { e.preventDefault(); go(el.dataset.go); }));

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
        body.tariff = view.querySelector("#aTariff").value;
        data = await apiCall("/register", "POST", body);
      } else {
        data = await apiCall("/login", "POST", body);
      }
      TOKEN = data.token;
      localStorage.setItem("shipyard_token", TOKEN);
      applyMe(data);
      S._reg = false;
      toast(`Добро пожаловать на верфь, ${S.name}!`);
      go("dashboard");
    } catch (err2) {
      errEl.textContent = err2.message;
      errEl.style.display = "block";
    }
  });

  /* задачи трека */
  view.querySelectorAll("[data-task]").forEach(cb =>
    cb.addEventListener("change", async () => {
      const id = cb.dataset.task;
      const wasLvl = level().n;
      const checked = cb.checked;
      try {
        await syncToggle("task", id, checked);
        S.done[id] = checked;
        if (!checked) delete S.done[id];
        save();
        const nowLvl = level().n;
        if (checked) {
          const t = PHASES.flatMap(p => p.tasks).find(x => x.id === id);
          if (nowLvl > wasLvl) toast(`${LEVELS[nowLvl - 1].emoji} Новый уровень: ${LEVELS[nowLvl - 1].name}!`);
          else toast(`+${t.pts} очков`);
        }
        CACHE.league = null;
        render();
      } catch (err2) { toast(err2.message); cb.checked = !checked; }
    }));

  view.querySelectorAll("[data-toggle]").forEach(h =>
    h.addEventListener("click", () =>
      h.closest(".phase-card").classList.toggle("open")));

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

  /* демо */
  const demoForm = view.querySelector("#demoForm");
  if (demoForm) demoForm.addEventListener("submit", async e => {
    e.preventDefault();
    const text = view.querySelector("#demoText").value.trim();
    if (!text) return;
    const link = view.querySelector("#demoLink").value.trim();
    const week = currentPhaseIdx();
    try {
      if (API !== null) {
        await apiCall("/demos", "POST", { week, text, link });
        CACHE.demos = (await apiCall("/demos")).demos;
      }
      S.demos.unshift({ week, text, link, ts: Date.now() });
      save();
      toast(S.demos.length >= 3 ? "🔥 Серия из 3 демо — множитель ×1.1!" : "+50 очков · демо на стене");
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
    b.addEventListener("click", () => { S.kbTab = b.dataset.tab; save(); render(); }));

  const copyMd = view.querySelector("#copyMd");
  if (copyMd) copyMd.addEventListener("click", () => {
    navigator.clipboard?.writeText(CLAUDE_MD).then(() => toast("Шаблон CLAUDE.md скопирован"));
  });

  view.querySelectorAll("[data-copy]").forEach(b =>
    b.addEventListener("click", () =>
      navigator.clipboard?.writeText(b.dataset.copy).then(() => toast("Промпт скопирован"))));

  /* эксперты */
  view.querySelectorAll("[data-book]").forEach(b =>
    b.addEventListener("click", () => {
      toast(`Слот у направления «${EXPERTS[b.dataset.book].dir}» запрошен — ментор подтвердит в Telegram`);
    }));

  /* профиль */
  const pf = view.querySelector("#profileForm");
  if (pf) pf.addEventListener("submit", async e => {
    e.preventDefault();
    const name = view.querySelector("#pfName").value.trim() || S.name;
    const project = view.querySelector("#pfProject").value.trim() || S.project;
    const tariff = view.querySelector("#pfTariff").value;
    try {
      if (API !== null) {
        const data = await apiCall("/me", "PUT", { name, project, tariff });
        applyMe(data);
      } else {
        S.name = name; S.project = project; S.tariff = tariff;
      }
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

/* ---------------- старт ---------------- */

(async () => {
  const cand = candidateApi();
  if (cand !== null) {
    try {
      const r = await fetch(cand + "/api/health", { signal: AbortSignal.timeout(4000) });
      if (r.ok) API = cand;
    } catch { API = null; }
  }
  if (API !== null && TOKEN) {
    try { applyMe(await apiCall("/me")); }
    catch { /* токен истёк — увидим экран входа */ }
  }
  if (API === null) save();
  go("dashboard");
})();

})();
