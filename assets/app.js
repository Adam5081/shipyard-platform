/* ============================================================
   Taulau Platform — SPA
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
      { id: "w0_cc",     label: "Установить Claude Code и настроить рабочее окружение — live-сессия", pts: 30 },
      { id: "w0_vibe",   label: "Изучить базовые принципы вайб-кодинга: контекст и планирование", pts: 20 },
      { id: "w0_tg",     label: "Вступить в закрытый Telegram-канал потока", pts: 10 },
    ],
    artifact: "Заключение по идее · рабочее окружение · доступ к потоку",
    log: "Рассвет. У подножия города-горы гудит базовый лагерь Taulau: где-то наверху, за девятой террасой, стоит дверь с табличкой «MVP». Мастер вручает вам ключ и говорит: «Инструменты здесь не выдают — их зарабатывают на станциях. Остальное — легенды». Вы кладёте ключ в карман и делаете первый шаг.",
  },
  {
    id: "w1", week: 1, phase: "Контекст", title: "Презентация проекта",
    tool: "mic", toolName: "Микрофон",
    desc: "Полная презентация проекта, собранная через Claude Code, — контекст для всего пути.",
    story: "Подъём начинается с контекста, а не с кода. На live-сессии разбираем, зачем это нужно: Claude ведёт проект ровно настолько хорошо, насколько хорошо проект описан. Вы собираете презентацию через код — блок за блоком: ожидания и цели, функциональность, примеры похожих проектов и ваши отличия. Это не работа ради работы: из этих блоков рождаются MD-файлы и инструкции, по которым агент работает все следующие станции.",
    tasks: [
      { id: "w1_live",  label: "Live-сессия: зачем проекту контекст и как Claude работает с MD-файлами", pts: 20 },
      { id: "w1_goals", label: "Прописать ожидания и цели проекта", pts: 30 },
      { id: "w1_func",  label: "Описать функциональность: что делает продукт и для кого", pts: 40 },
      { id: "w1_refs",  label: "Собрать примеры похожих проектов и сформулировать отличия", pts: 30 },
      { id: "w1_deck",  label: "Собрать презентацию проекта через Claude Code — по блокам", pts: 60 },
    ],
    artifact: "Презентация проекта · контекст для Claude",
    cp: { id: "КТ-1", cond: "Презентация покрывает все блоки и принята ментором" },
    log: "Первый подъём оказался не тропой, а мостом через туман: ступени появлялись только тогда, когда вы рассказывали городу, что именно строите. Блок за блоком туман отступал, и из него проступила следующая терраса. Внизу остался тот, кто не смог объяснить свой проект даже себе, — его мост так и не собрался.",
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
    log: "На второй террасе ветер срывает всё лишнее. Вы разворачиваете чертёж — и он рвётся по краям, оставляя ровно то, что можно построить за четыре недели. Мастер кивает: «Реалистичный план — единственный груз, который не тянет вниз». Ветер стихает, и вы впервые видите вершину.",
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
    log: "Выше начинается настоящая стройка. Молоток бьёт в такт спринтам, и на голой скале растёт каркас вашего продукта. Ночью вы впервые видите, как в окне макета загорается свет: сценарий прошёл от входа до результата. Где-то далеко внизу этому свету уже кто-то удивился.",
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
    log: "К каркасу подвозят готовые узлы Taulau: авторизацию, базу, интеграции. Шестерёнка встаёт на место с щелчком, и механизм оживает целиком. С площадки скрининга город впервые смотрит на то, что вы построили, — и возвращает вам голос: обратную связь, от которой продукт становится твёрже.",
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
    log: "На пятой террасе темнеет: здесь водятся тени — захардкоженные секреты, дырявые доступы, молчаливые ошибки. Вы поднимаете щит, и тени одна за другой отступают в свои списки, где их можно пересчитать и закрыть. Теперь продукт можно показывать не только друзьям — и это меняет всё.",
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
    log: "Ракета уходит вверх, и ваш продукт впервые виден всему городу: у него есть адрес, сертификаты и право принимать людей. Внизу, у подножия, кто-то открывает вашу публичную ссылку. Вы этого человека никогда не встречали — и именно поэтому сегодня особенный день.",
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
    log: "Зал на предпоследней террасе полон: практики города пришли слушать не легенду, а разбор. Пять минут — и наступает тишина, которая дороже аплодисментов: эксперты пишут заметки, и каждая ляжет в ваш журнал. Кубок в руках, но мастер показывает выше: осталась одна терраса.",
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
    log: "Последняя терраса — не финиш, а первый рабочий вторник вашего продукта: им пользуются без вашего напоминания. Вы поворачиваете ключ мастера, и дверь MVP открывается. За ней не конец пути — за ней город, в котором теперь работает то, что вы построили. Судовой журнал полон. Пора писать новый.",
  },
];

const LEVELS = [
  { n: 1, name: "Sketch",       emoji: "✏️", cond: "Идея описана, диагностика пройдена", station: 0 },
  { n: 2, name: "Blueprint",    emoji: "📐", cond: "Презентация проекта собрана", station: 1 },
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

/* ---------------- навыки персонажа ----------------
   RPG-прокачка: каждый навык растёт от своих задач, чек-листов и баттлов.
   5 уровней; уровень = floor(прогресс × 5). Считается на лету из состояния. */

const SKILLS = [
  { id: "sk_story", icon: "🎤", name: "Питч и контекст",
    hint: "Презентация проекта и защита",
    calc: s => taskFrac(["w1_goals", "w1_func", "w1_refs", "w1_deck", "w8_deck", "w8_dry", "w8_pitch"], s) },
  { id: "sk_vibe", icon: "🧠", name: "Вайб-кодинг",
    hint: "Работа с Claude Code + баттлы",
    calc: s => Math.min(1, taskFrac(["w0_cc", "w0_vibe", "w2_md", "w3_s1", "w3_s2"], s) * 0.7
      + Math.min(1, (s.battlePts || 0) / 250) * 0.3) },
  { id: "sk_arch", icon: "📐", name: "Архитектура",
    hint: "Реалистичный MVP, roadmap, техстек",
    calc: s => taskFrac(["w2_scope", "w2_arch", "w2_mock", "w2_plan"], s) },
  { id: "sk_build", icon: "🔨", name: "Сборка",
    hint: "Ядро продукта и обвязка",
    calc: s => taskFrac(["w3_s1", "w3_s2", "w3_rev", "w4_auth", "w4_db", "w4_int", "w4_mid"], s) },
  { id: "sk_sec", icon: "🛡️", name: "Безопасность",
    hint: "Чек-лист OWASP и сканирование",
    calc: s => { const all = SECURITY.flatMap(g => g.items); return all.filter(i => s.sec[i.id]).length / all.length; } },
  { id: "sk_legal", icon: "⚖️", name: "Право",
    hint: "Юридический трек",
    calc: s => { const n = LEGAL.length; return n ? LEGAL.filter(l => s.legal[l.id]).length / n : 0; } },
  { id: "sk_ops", icon: "🚀", name: "DevOps",
    hint: "Прод, автодеплой, мониторинг",
    calc: s => taskFrac(["w6_host", "w6_cicd", "w6_mon", "w6_live"], s) },
  { id: "sk_gtm", icon: "📈", name: "Запуск",
    hint: "Аналитика, демо, первые пользователи",
    calc: s => Math.min(1, taskFrac(["w7_land", "w7_chan", "w7_pay"], s) * 0.7 + Math.min(1, s.demos.length / 3) * 0.3) },
];

function taskFrac(ids, s) {
  return ids.filter(id => s.done[id]).length / ids.length;
}

const skillFrac = k => Math.max(0, Math.min(1, k.calc(S)));
const skillLevel = k => Math.floor(skillFrac(k) * 5);
const skillLevels = () => SKILLS.map(skillLevel);

/* тост о прокачке: вызывается после изменения прогресса со снимком «до» */
function announceSkillUps(before) {
  const now = skillLevels();
  const i = now.findIndex((lvl, idx) => lvl > before[idx]);
  if (i === -1) return false;
  toast(`⬆️ Навык «${SKILLS[i].name}» — уровень ${now[i]}${now[i] >= 5 ? " · MAX!" : ""}`);
  return true;
}

const BADGES = [
  { id: "b_deck",      emoji: "🎬", name: "Storyteller",       desc: "Презентация проекта собрана",        test: s => s.done["w1_deck"] },
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
    { id: "m_deck",        icon: "🎬", week: 1, title: "Блоки презентации проекта",                     note: "Готовый список блоков: ожидания, функциональность, похожие проекты, отличия", type: "шаблон" },
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
Продукт для <сегмент>: решает задачу «<из презентации проекта, станция 1>».
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
  { author: "Салтанат Б.",project: "EduPay", week: 2, text: "Собрала презентацию проекта через Claude Code: семь блоков, ментор принял с первого раза. Из неё родился CLAUDE.md.", votes: 4 },
  { author: "Тимур А.",   project: "FitDesk", week: 3, text: "Каркас на заготовке авторизации программы. Первый спринт закрыт за 4 вечера.", votes: 2 },
];

/* ---------------- API-слой ---------------- */

let API = null;          // "" = same-origin, "https://…" = удалённый, null = локальный режим
let TOKEN = localStorage.getItem("shipyard_token") || null;
const CACHE = { demos: null, league: null, flow: null, lottery: null, battles: null };

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
  if (u.startDate) S.startDate = u.startDate; // время потока отсчитывается от входа в программу
  S.battlePts = u.battlePts || 0;
  S.dock = u.dock || "";
  S.complexity = u.complexity || 0;
  S.done = d.done || {};
  S.sec = d.sec || {};
  S.legal = d.legal || {};
  S.gates = d.gates || {};   // K1..K5: open / pending / approved (жёсткий гейт КТ)
  S.demos = d.demos || [];
  S.github = d.github || null;
}

function logout(rerender = true) {
  TOKEN = null;
  localStorage.removeItem("shipyard_token");
  CACHE.demos = CACHE.league = CACHE.flow = CACHE.lottery = CACHE.battles = null;
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

/* ключ гейта на сервере: «КТ-2» → «K2» */
const gateKey = p => p.cp ? "K" + p.cp.id.replace(/\D/g, "") : null;

/* КТ пройдена: задачи закрыты И (в серверном режиме) ментор подтвердил */
function cpPassed(p) {
  if (!p.cp || !stationDone(p)) return false;
  if (API === null) return true;                       // демо-режим — без гейта
  return (S.gates || {})[gateKey(p)] === "approved";
}

/* КТ ждёт ментора: задачи закрыты, подтверждения нет */
function cpPending(p) {
  return !!p.cp && stationDone(p) && API !== null && (S.gates || {})[gateKey(p)] !== "approved";
}

/* индекс станции с неподтверждённой КТ; всё дальше неё заблокировано */
function pendingGateIdx() {
  for (let i = 0; i < STATIONS.length; i++) if (cpPending(STATIONS[i])) return i;
  return Infinity;
}

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
  const demoWeeks = new Set(S.demos.map(d => d.week)).size; // зачёт — по уникальным неделям
  pts += demoWeeks * 50;
  if (demoWeeks >= 3) pts = Math.round(pts * 1.1);
  pts += S.battlePts || 0; // очки баттлов, начисленные сервером
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

/* конструктор персонажа: палитры частей и текущий черновик */
const AV_PARTS = [
  { key: "skin",   label: "Кожа",    colors: ["#f6d7b8", "#f0c8a0", "#e0a87e", "#c98a5a", "#a06a42", "#7c4f2f"] },
  { key: "hair",   label: "Волосы",  colors: ["#1d1d1f", "#3d2a1d", "#6b4423", "#c9a35f", "#b5502a", "#b8bcc4"] },
  { key: "jacket", label: "Пиджак",  colors: ["#3f4756", "#2f3a4a", "#55504a", "#5b2733", "#2f5240", "#7a6a52"] },
  { key: "shirt",  label: "Рубашка", colors: ["#f1f2f5", "#cfe3f5", "#d9d9de", "#23252a"] },
  { key: "tie",    label: "Галстук", colors: ["#8c2b3a", "#1f4e79", "#2f6b4f", "#c07a2a", "#5b3f8c", "#1d1d1f"] },
];

const AV = { skin: "#f0c8a0", hair: "#3d2a1d", jacket: "#3f4756", shirt: "#f1f2f5", tie: "#8c2b3a" };

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
   Небольшой дофамин между этапами — по фидбеку продакта. Значком можно
   поделиться, открытая глава судового журнала показывается сразу. */
async function shareAchievement(text) {
  const full = `${text}\n${location.origin + location.pathname.replace(/app\.html$/, "")}`;
  try {
    if (navigator.share) { await navigator.share({ text: full }); return; }
    throw 0;
  } catch {
    try { await navigator.clipboard.writeText(full); toast("Текст значка скопирован — вставьте в соцсеть или чат"); }
    catch { toast("Не удалось поделиться — выделите текст вручную"); }
  }
}

function celebrate(title, sub, emoji = "🎉", opts = {}) {
  document.querySelector(".cele")?.remove();
  const el = document.createElement("div");
  el.className = "cele";
  el.innerHTML = `
    <div class="cele-card">
      <div class="cele-confetti">${["🎉", "✨", "🎊", "🏔️", "✨", "🎉"].map((e, i) => `<i style="animation-delay:${i * 0.12}s">${e}</i>`).join("")}</div>
      ${S.avatar
        ? `<img class="cele-avatar" src="${S.avatar}" alt="">`
        : `<div class="cele-emoji">${emoji}</div>`}
      <b>${esc(title)}</b>
      <small>${esc(sub)}</small>
      ${opts.log ? `<div class="cele-log">📖 <b>Судовой журнал</b><p>${esc(opts.log)}</p></div>` : ""}
      <div class="cele-actions">
        ${opts.share ? `<button class="btn btn-ghost btn-sm" data-share>Поделиться значком</button>` : ""}
        <button class="btn btn-primary btn-sm" data-close>Дальше</button>
      </div>
    </div>`;
  const close = () => { el.classList.add("out"); setTimeout(() => el.remove(), 300); };
  el.addEventListener("click", e => {
    if (e.target.closest("[data-share]")) return shareAchievement(opts.share);
    if (e.target === el || e.target.closest("[data-close]")) close();
  });
  document.body.appendChild(el);
  if (!opts.log) setTimeout(close, 6000); // с главой журнала окно не закрывается само — дать дочитать
}

/* Слот-машина лотереи: приз уже выбран сервером, фронт крутит три барабана.
   Барабаны останавливаются по очереди, как в казино, все три — на призе. */
const PRIZE_EMOJI = {
  expert_hour: "🧑‍🏫", review_bonus: "🔍", discount10: "💸", merch: "🎁", tariff_week: "🚀",
};

async function spinLottery(btn) {
  btn.disabled = true;
  let data;
  try { data = await apiCall("/lottery/spin", "POST", {}); }
  catch (e) { btn.disabled = false; return toast(e.message); }

  const pool = (CACHE.lottery?.pool || []).length ? CACHE.lottery.pool : [data.prize];
  CACHE.lottery = data;
  const winEmoji = PRIZE_EMOJI[data.prize.id] || "🎁";
  const CELL = 58, LOOPS = 3;

  // лента барабана: несколько кругов пула + приз последним — на нём и остановимся
  const strip = () => {
    const seq = [];
    for (let l = 0; l < LOOPS; l++) pool.forEach(p => seq.push(PRIZE_EMOJI[p.id] || "🎁"));
    seq.push(winEmoji);
    return seq;
  };

  document.querySelector(".cele")?.remove();
  const el = document.createElement("div");
  el.className = "cele";
  el.innerHTML = `
    <div class="cele-card slot-card">
      <b>🎰 Лотерея Taulau</b>
      <div class="slot-frame">
        <div class="slot-lights">${Array.from({ length: 14 }, (_, i) => `<i style="animation-delay:${i * 0.1}s"></i>`).join("")}</div>
        <div class="slot-window">
          ${[0, 1, 2].map(r => `
            <div class="reel"><div class="reel-strip" data-reel="${r}">
              ${strip().map(e => `<span>${e}</span>`).join("")}
            </div></div>`).join("")}
        </div>
      </div>
      <small class="slot-status">Барабаны крутятся…</small>
    </div>`;
  document.body.appendChild(el);

  // разгон и остановка: каждый барабан едет к последней ячейке со своей задержкой
  requestAnimationFrame(() => requestAnimationFrame(() => {
    el.querySelectorAll(".reel-strip").forEach(s => {
      const r = Number(s.dataset.reel);
      const end = (s.children.length - 1) * CELL;
      s.style.transition = `transform ${1.3 + r * 0.55}s cubic-bezier(.15,.65,.25,1.02)`;
      s.style.transform = `translateY(-${end}px)`;
    });
  }));

  setTimeout(() => {
    el.querySelector(".slot-frame").classList.add("win");
    el.querySelector(".slot-status").textContent = data.prize.label;
    setTimeout(() => {
      el.remove();
      celebrate("Джекпот Taulau!", data.prize.label, winEmoji,
        { share: `🏔️ Taulau: слот-машина Taulau выдала мне «${data.prize.label}»! Спины зарабатываются закрытыми станциями.` });
      render();
    }, 1600);
  }, 2700); // последний барабан останавливается на ~2.4 c
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

/* ссылка-приглашение: app.html#reg=TAU-XXXXXX сразу открывает регистрацию с кодом */
const REG_CODE = (decodeURIComponent(location.hash || "").match(/^#reg=([A-Za-z0-9-]{4,})$/i) || [])[1] || "";

/* Социальные разделы потока: скрыты, пока в config.js SHIPYARD_FLOW_UI не true.
   Прячем и пункты меню, и прямые ссылки #flow/#league — редирект на карту. */
const FLOW_UI = window.SHIPYARD_FLOW_UI === true;
/* лотерея и баллы скрыты до второго этапа геймификации (код не удаляем) */
const LOTTERY_UI = window.SHIPYARD_LOTTERY_UI === true;
const POINTS_UI = window.SHIPYARD_POINTS_UI === true;
const FLOW_VIEWS = new Set(["flow", "demos", "league", "battles"]);
if (!FLOW_UI) { const g = document.getElementById("flowGroup"); if (g) g.remove(); }

async function go(name) {
  if (API !== null && !TOKEN) name = "auth";
  if (!FLOW_UI && FLOW_VIEWS.has(name)) name = "map";
  if (activeView !== name) S.kbDoc = null;   // переход по разделам закрывает открытый материал
  if (name !== "battles") { BATTLE.play = null; BATTLE.review = null; }
  activeView = name;
  if (name !== "auth") history.replaceState(null, "", "#" + name);
  document.querySelectorAll(".side-link").forEach(b =>
    b.classList.toggle("active", b.dataset.view === name));
  try {
    if (API !== null && TOKEN) {
      if (name === "demos" && !CACHE.demos) CACHE.demos = (await apiCall("/demos")).demos;
      if (name === "league") CACHE.league = (await apiCall("/league")).rows;
      if (FLOW_UI && (name === "flow" || name === "map")) CACHE.flow = (await apiCall("/flow")).rows;
      if (LOTTERY_UI && name === "map" && !CACHE.lottery) CACHE.lottery = await apiCall("/lottery");
      if (name === "battles" && !CACHE.battles) CACHE.battles = await apiCall("/battles");
    }
  } catch (e) { toast(e.message); }
  render();
  // мягкий каскадный вход панелей — только при смене раздела, не на каждый клик
  view.classList.remove("view-anim");
  void view.offsetWidth;
  view.classList.add("view-anim");
  setTimeout(() => view.classList.remove("view-anim"), 700);
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
          <div style="margin:0 auto;width:52px"><svg viewBox="0 0 100 100" width="52" height="52"><rect width="100" height="100" rx="22" fill="#0071e3"/><path d="M27 34h46M50 34v32q0 13 13 13 7 0 10-6" stroke="#fff" stroke-width="11" fill="none" stroke-linecap="round"/></svg></div>
          <h1 style="font-size:28px;font-weight:700;letter-spacing:-.02em;margin-top:8px">TAULAU</h1>
          <p class="muted" style="margin-top:6px">Войдите, чтобы путь, демо и лига жили на сервере</p>
        </div>
        <div class="panel">
          <div class="kb-tabs" style="margin-bottom:18px">
            <button class="kb-tab ${!S._reg ? "active" : ""}" data-authtab="login">Вход</button>
            <button class="kb-tab ${S._reg ? "active" : ""}" data-authtab="reg">Регистрация</button>
          </div>
          <form id="authForm">
            ${S._reg ? `
              <div class="field"><label>Код приглашения</label>
                <input id="aInvite" required placeholder="TAU-XXXXXX" autocomplete="off"
                  style="text-transform:uppercase" value="${esc(REG_CODE)}">
              </div>
              <p class="muted" style="font-size:13px;margin:-6px 0 14px">Имя и тариф подставятся из вашей заявки.
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

    /* лайфтаймер потока: сколько времени подписки осталось, 100% → 0% */
    const FLOW_MS = 56 * 86400000;
    const timeLeft = Math.max(0, Math.min(1, (S.startDate + FLOW_MS - Date.now()) / FLOW_MS));
    const timePct = Math.round(timeLeft * 100);
    const timeCls = timeLeft > 0.5 ? "ok" : timeLeft > 0.2 ? "warn" : "low";
    const flowDays = Math.max(0, Math.ceil((S.startDate + FLOW_MS - Date.now()) / 86400000));

    return `
      ${API === null ? `
        <div class="notice">
          <b>Демо-режим.</b> Бэкенд не подключён: прогресс хранится в этом браузере, аккаунтов и общего
          потока нет, участники рядом — из демонстрационного набора. Всё остальное работает по-настоящему:
          карта, миссии, инструменты, персонаж из вашего фото.
        </div>` : ""}
      ${!S.avatar ? `
        <div class="notice">
          <b>🎨 Соберите своего персонажа.</b> Загрузите фото — платформа соберёт пиксельного героя по его цветам,
          — или соберите вручную в конструкторе. Персонаж будет идти по картам станций и радоваться на праздниках.
          <button class="btn btn-primary btn-sm" data-go="profile" style="margin-left:auto">Создать персонажа</button>
        </div>` : ""}
      ${!S.dock ? `
        <div class="notice">
          <b>Пройдите скрининг сложности проекта.</b> Он определяет ваш док — группу проектов схожей
          сложности. Сравнивать сложный проект с простым по скорости нечестно, поэтому лига считается внутри дока.
          <button class="btn btn-primary btn-sm" data-go="screening" style="margin-left:auto">Пройти за 2 минуты</button>
        </div>` : ""}

      <div class="map-head">
        <div>
          <div class="mh-label">Станция ${st.week} из 8 · ${esc(st.phase)}</div>
          <h1>${esc(S.project)}</h1>
        </div>
        <div class="mh-stats">
          <div><b>${lvl.emoji} ${lvl.name}</b><span>уровень ${lvl.n} из 8</span></div>
          ${POINTS_UI ? `<div><b>${fmt(points())}</b><span>очков</span></div>` : ""}
          <div><b>${got.length}/9</b><span>инструментов</span></div>
          <div><b>${daysLeft} дн.</b><span>до защиты</span></div>
        </div>
      </div>

      <div class="time-bar ${timeCls}" title="Поток: ${flowDays} дн. из 56 осталось">
        <div class="tb-track"><i style="width:${timePct}%"></i></div>
        <span>⏳ ${timePct > 0 ? `Осталось <b>${timePct}%</b> времени потока` : "Время потока вышло"}</span>
      </div>

      <div class="map-stage">
        <canvas id="mapCanvas"></canvas>
        <button class="scene-nav prev" data-station="${Math.max(0, sel - 1)}" ${sel === 0 ? "disabled" : ""} aria-label="Предыдущая станция">‹</button>
        <button class="scene-nav next" data-station="${Math.min(8, sel + 1)}" ${sel === 8 ? "disabled" : ""} aria-label="Следующая станция">›</button>
        <div class="scene-title">Карта ${sel + 1} из 9 · ${esc(st.title)}</div>
        <div class="map-hint">${
          sel === cur
            ? `Персонаж на этой карте: закрыто ${st.tasks.filter(t => S.done[t.id]).length} из ${st.tasks.length} задач — дойдёт до флага, когда станция будет закрыта · всего пройдено ${prog}% пути`
            : done ? "Карта пройдена — инструмент собран, дорога открыта"
            : "Эта карта впереди — персонаж придёт сюда после предыдущих станций"}</div>
      </div>
      <div class="scene-dots">
        ${STATIONS.map((p, i) => `
          <button class="scene-dot ${stationDone(p) ? "done" : ""} ${i === sel ? "sel" : ""} ${i === cur ? "cur" : ""}"
            data-station="${i}" title="Станция ${i}: ${esc(p.title)}">${i}</button>`).join("")}
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

      ${API !== null && LOTTERY_UI && CACHE.lottery ? `
        <div class="lottery-strip">
          <div class="ls-main">
            <b>🎡 Лотерея Taulau</b>
            <small>Спин за каждые 3 закрытые станции, ещё один — за дверь MVP, бонус — топ-3 своего дока на финише. Иногда за закрытую станцию выпадает 🎟️ счастливый билет. Приз выбирает Taulau: час эксперта, скидка, апгрейд тарифа…</small>
            ${CACHE.lottery.top3 ? `<small class="ls-won">🏅 Вы в топ-3 своего дока — бонусный спин начислен</small>` : ""}
            ${CACHE.lottery.prizes.length ? `<small class="ls-won">🎁 Выиграно: ${CACHE.lottery.prizes.map(p => esc(p.label)).join(" · ")}</small>` : ""}
          </div>
          ${CACHE.lottery.available > 0
            ? `<button class="btn btn-primary btn-sm btn-breathe" data-spin>Крутить · ${CACHE.lottery.available}</button>`
            : `<span class="status-chip wait">спинов: 0</span>`}
        </div>` : ""}

      <div class="panel">
        <h2>Навыки персонажа</h2>
        <p class="muted" style="margin-bottom:14px">Растут от задач станций, чек-листов и баттлов. Пять уровней в каждом.</p>
        <div class="skill-grid">
          ${SKILLS.map(k => {
            const frac = skillFrac(k), lvl = skillLevel(k);
            return `
              <div class="skill ${lvl >= 5 ? "max" : lvl > 0 ? "on" : ""}" title="${esc(k.hint)}">
                <div class="sk-icon">${k.icon}</div>
                <div class="sk-main">
                  <b>${esc(k.name)}<span class="sk-lvl">${lvl >= 5 ? "MAX" : `ур. ${lvl}`}</span></b>
                  <div class="sk-bar"><i style="width:${Math.round(frac * 100)}%"></i></div>
                </div>
              </div>`;
          }).join("")}
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
        ${sel > pendingGateIdx() ? `
          <div class="notice" style="margin-bottom:12px">
            <b>⏳ Станция откроется после подтверждения ${esc(STATIONS[pendingGateIdx()].cp.id)}.</b>
            Ментор сверяет артефакты предыдущей контрольной точки — как подтвердит, задачи разблокируются.
          </div>` : ""}
        <div class="sp-tasks">
          ${st.tasks.map(t => taskRow(t, sel > pendingGateIdx())).join("")}
        </div>
        <div class="artifact-box">📦 <b>Артефакт недели:</b>&nbsp;${esc(st.artifact)}</div>
        ${done
          ? `<div class="log-box"><b>📖 Судовой журнал · глава ${sel + 1} из 9</b><p>${esc(st.log)}</p></div>`
          : `<div class="log-box locked">📖 Глава ${sel + 1} судового журнала откроется, когда станция будет закрыта</div>`}
        ${st.cp ? cpBanner(st) : ""}
        ${done ? `<div class="reward-box">
            <canvas class="tool-ic big" data-tool="${esc(st.tool)}" width="48" height="48"></canvas>
            <div><b>Инструмент получен: ${esc(st.toolName)}</b>
            <small>Станция закрыта — персонаж поднялся выше по карте.</small></div>
          </div>` : ""}
      </div>

      ${FLOW_UI ? `<div class="panel">
        <h2>Кто ещё идёт рядом</h2>
        <p class="muted" style="margin-bottom:14px">Позиции участников потока на этой же карте. Подробности — в разделе «Кто где идёт».</p>
        ${flowRows().slice(0, 5).map(r => flowRow(r)).join("")}
        <button class="btn btn-ghost btn-sm" data-go="flow" style="margin-top:12px">Весь поток</button>
      </div>` : ""}`;
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
        <table class="table league-table">
          <thead><tr><th style="width:56px">Место</th><th>Участник</th><th class="col-lvl">Уровень</th><th style="text-align:right">Очки</th></tr></thead>
          <tbody>
            ${rows.map((r, i) => {
              const lv = LEVELS[Math.max(0, Math.min(7, r.lvl - 1))];
              return `<tr class="${r.me ? "me" : ""}">
                <td><span class="rank-medal">${medals[i] || (i + 1)}</span></td>
                <td><div class="who"><span class="avatar sm"><img src="${esc(r.avatar || GAME.PixelAvatar.generated(r.name))}" alt=""></span><div><b>${esc(r.name)}</b><small class="who-proj">${esc(r.project)}</small></div></div></td>
                <td class="col-lvl"><span class="lvl-chip">${lv.emoji} ${lv.name}</span></td>
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
          ${[["Пятничное демо", "+50"], ["Блок презентации проекта", "+30"], ["Пункт чек-листа ИБ", "+10"],
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
                ${POINTS_UI ? `<span class="pts">+10</span>` : ""}
              </div>`).join("")}
          </div>
        </div>`).join("")}`;
  },

  /* ---- юридический трек ---- */
  legal() {
    return `
      <div class="page-head">
        <h1>Юридический трек</h1>
        <p>Идёт параллельно программе. Приём денег — только после публичной оферты на станции 6, по желанию клиента. Регистрация компании и товарный знак могут продолжиться после программы — это фиксируется в договоре.</p>
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
      <div class="svc-grid">
        ${SERVICE.map((e, i) => `
          <div class="panel svc-card">
            <div class="svc-head">
              <span class="svc-ic">${e.icon}</span>
              <b>${esc(e.dir)}</b>
              ${e.indiv
                ? `<button class="btn btn-primary btn-sm" data-book="${i}" title="Лимит тарифа: ${hours}">Слот · ${hours}</button>`
                : `<span class="status-chip done">всегда на связи</span>`}
            </div>
            <p class="svc-what">${esc(e.what)}</p>
            <small class="svc-meta">${esc(e.format)} · станции ${esc(e.weeks)}</small>
          </div>`).join("")}
      </div>`;
  },

  /* ---- баттлы ---- */
  battles() {
    if (API === null) return `
      <div class="page-head"><h1>Баттлы</h1><p>Пять вопросов о вайб-кодинге против соперника из потока.</p></div>
      <div class="notice"><b>Демо-режим.</b> Баттлы работают при подключённом бэкенде.
        Пока можно <a href="vibe-check.html" target="_blank" rel="noopener">потренироваться в открытой игре «Вайб-чек» ↗</a></div>`;

    if (BATTLE.play) {
      const p = BATTLE.play;
      const item = p.questions[p.idx];
      return `
        <div class="page-head"><h1>Баттл ⚔️</h1><p>Вопрос ${p.idx + 1} из ${p.questions.length} · время идёт, счёт считает сервер</p></div>
        <div class="panel">
          <div class="battle-q">${esc(item.q)}</div>
          ${item.opts.map((o, i) => `<button class="battle-opt" data-bopt="${i}">${esc(o)}</button>`).join("")}
        </div>`;
    }

    if (BATTLE.review) {
      const r = BATTLE.review;
      return `
        <div class="page-head"><h1>Ответы приняты</h1>
          <p>${r.status === "done"
            ? (r.result === "win" ? "🏆 Победа! +50 очков лиги"
              : r.result === "draw" ? "🤝 Ничья — по +25 очков обоим"
              : `Соперник оказался точнее (${r.theirScore} из ${r.total}) · +10 очков за участие`)
            : "Ждём соперника — результат появится в списке баттлов"}</p></div>
        <div class="panel">
          <h2>Ваш счёт: ${r.myScore} из ${r.total}</h2>
          ${r.review.map(x => `
            <div class="battle-rev ${x.right ? "ok" : "no"}">
              <b>${x.right ? "✅" : "❌"} ${esc(x.q)}</b>
              ${x.right ? "" : `<small>Ваш ответ: ${esc(x.yours)}</small><small>Верный: ${esc(x.correct)}</small>`}
              <small class="why">${esc(x.why)}</small>
            </div>`).join("")}
          <button class="btn btn-primary btn-sm" data-bback style="margin-top:12px">К списку баттлов</button>
        </div>`;
    }

    const B = CACHE.battles || { battles: [], opponents: [] };
    const open = B.battles.filter(b => b.status !== "done");
    const finished = B.battles.filter(b => b.status === "done");
    return `
      <div class="page-head">
        <h1>Баттлы</h1>
        <p>Пять вопросов о вайб-кодинге, одинаковых для обоих. Побеждает точность, при равенстве — скорость.
           Победа — +50 очков лиги, ничья — +25, участие — +10. Зачётный баттл с одним соперником — раз в неделю
           (реванши дружеские, без очков), потолок очков с баттлов — 150 в неделю.</p>
      </div>
      <div class="panel">
        <h2>Вызвать на баттл</h2>
        ${B.opponents.length ? `
          <div class="battle-new">
            <select id="bOpp">${B.opponents.map(o =>
              `<option value="${o.id}">${esc(o.name)}${o.project ? " · " + esc(o.project) : ""}</option>`).join("")}</select>
            <button class="btn btn-primary btn-sm" id="bChallenge">Вызвать</button>
          </div>`
          : `<p class="empty">В потоке пока нет соперников.</p>`}
        <p class="muted" style="font-size:13px;margin-top:10px">Потренироваться без ставок можно в открытой игре
          <a href="vibe-check.html" target="_blank" rel="noopener">«Вайб-чек» ↗</a> — её можно отправить и друзьям не из потока.</p>
      </div>
      ${open.length ? `<div class="panel"><h2>Идут сейчас</h2>${open.map(battleRow).join("")}</div>` : ""}
      ${finished.length ? `<div class="panel"><h2>Завершённые</h2>${finished.map(battleRow).join("")}</div>` : ""}
      ${!B.battles.length ? `<div class="panel"><p class="empty">Баттлов ещё не было. Вызовите первого соперника!</p></div>` : ""}`;
  },

  /* ---- Demo Day ---- */
  demoday() {
    const dd = demoDayDate();
    const diff = Math.max(0, dd - Date.now());
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const reqs = [
      { ok: cpPassed(STATIONS[1]), label: "КТ-1 — презентация проекта принята" },
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
        <p>Разбор, сессия вопросов и обратная связь каждому. В зале — эксперты и, при необходимости, внешние люди из вашей индустрии. Оценка по осям: проблема, решение, результат, план развития.</p>
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
    const num = `TAU-1-${String(hashNum(S.email || S.name)).padStart(4, "0")}`;
    return `
      <div class="page-head">
        <h1>Сертификат</h1>
        <p>Выдаётся за пройденный путь: девять станций, пять контрольных точек, продукт в рабочей среде. Не за время в программе.</p>
      </div>
      <div class="cert ${open ? "open" : "locked"}">
        <div class="cert-inner">
          <div class="cert-top">τ TAULAU · Поток №1</div>
          <div class="cert-name">${esc(S.name)}</div>
          <div class="cert-sub">прошёл путь от идеи до продукта в рабочей среде</div>
          <div class="cert-project">${esc(S.project)}</div>
          <div class="cert-row">
            <div><b>${S.dock ? esc(DOCKS[S.dock].name) : "—"}</b><span>док</span></div>
            ${POINTS_UI ? `<div><b>${fmt(points())}</b><span>очков</span></div>` : ""}
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
              <button class="btn btn-ghost btn-sm" id="avGen">Случайный</button>
              ${S.avatar ? `<button class="btn btn-ghost btn-sm" id="avClear">Убрать</button>` : ""}
            </div>
          </div>
          <div class="av-builder">
            <small class="muted">Или соберите вручную — превью слева обновляется сразу:</small>
            ${AV_PARTS.map(part => `
              <div class="sw-row">
                <span>${part.label}</span>
                <div class="sw-list">
                  ${part.colors.map(c => `
                    <button class="sw ${AV[part.key] === c ? "sel" : ""}" data-avpart="${part.key}"
                      data-avcolor="${c}" style="background:${c}" title="${part.label}"></button>`).join("")}
                </div>
              </div>`).join("")}
            <button class="btn btn-dark btn-sm" id="avSave" style="margin-top:10px">Сохранить персонажа</button>
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
        <p class="muted" style="margin-bottom:16px">Признание за качество, а не только за скорость. Заработанным значком можно поделиться.</p>
        <div class="badge-grid">
          ${BADGES.map(b => `
            <div class="badge-card ${badges.includes(b.id) ? "earned" : "locked"}">
              <div class="b-emoji">${b.emoji}</div>
              <b>${esc(b.name)}</b>
              <small>${esc(b.desc)}</small>
              ${badges.includes(b.id) ? `<button class="btn btn-ghost btn-sm" data-sharebadge="${b.id}" style="margin-top:8px">Поделиться</button>` : ""}
            </div>`).join("")}
        </div>
      </div>`;
  },
};

/* ---------------- фрагменты ---------------- */

function taskRow(t, blocked = false) {
  const done = !!S.done[t.id];
  return `
    <div class="task ${done ? "done-task" : ""} ${blocked && !done ? "task-blocked" : ""}">
      <input type="checkbox" id="${t.id}" data-task="${t.id}" ${done ? "checked" : ""} ${blocked && !done ? "disabled" : ""}>
      <label for="${t.id}">${esc(t.label)}</label>
      ${POINTS_UI ? `<span class="pts">+${t.pts}</span>` : ""}
    </div>`;
}

/* транзитное состояние баттла: активная игра и разбор после сдачи */
const BATTLE = { play: null, review: null };

function battleRow(b) {
  const chip = b.status === "yours"
    ? `<button class="btn btn-primary btn-sm" data-bplay="${b.id}">Играть</button>`
    : b.status === "waiting"
      ? `<span class="status-chip wait">ждём соперника</span>`
      : b.result === "win" ? `<span class="status-chip done">победа ${b.myScore}:${b.theirScore}${b.myAward ? ` · +${b.myAward}` : " · дружеский"}</span>`
      : b.result === "draw" ? `<span class="status-chip wait">ничья ${b.myScore}:${b.theirScore}${b.myAward ? ` · +${b.myAward}` : " · дружеский"}</span>`
      : `<span class="status-chip">поражение ${b.myScore}:${b.theirScore}${b.myAward ? ` · +${b.myAward}` : ""}</span>`;
  return `
    <div class="battle-row">
      <div>
        <b>⚔️ ${esc(b.vs.name)}</b>
        <small>${esc(b.vs.project || "проект скрыт")} · ${b.challengedByMe ? "ваш вызов" : "вас вызвали"}</small>
      </div>
      ${chip}
    </div>`;
}

function cpBanner(p) {
  const passed = cpPassed(p);
  const pending = cpPending(p);
  return `
    <div class="gate-banner ${passed ? "passed" : pending ? "pending" : ""}">
      <span class="g-badge">${p.cp.id}</span>
      <div>${passed
        ? `<b>Контрольная точка пройдена · +100 очков.</b> ${esc(p.cp.cond)}`
        : pending
          ? `<b>⏳ На проверке у ментора.</b> Задачи закрыты — эксперт сверяет артефакты. После подтверждения: +100 очков и путь дальше.`
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
let lastScene = null;   // { idx, x } — чтобы персонаж не телепортировался при перерисовке

function mountMap() {
  const cv = document.getElementById("mapCanvas");
  if (!cv) return;
  const cur = currentStationIdx();
  const sel = S.selStation === null ? cur : Math.max(0, Math.min(8, S.selStation));
  const st = STATIONS[sel];
  const frac = stationDone(st) ? 1 : st.tasks.filter(t => S.done[t.id]).length / st.tasks.length;

  mapInstance = new GAME.StationScene(cv);
  // счётчик задач переживает перерисовку вьюхи — иначе искры чекпоинта не сработают
  if (lastScene && lastScene.idx === sel && lastScene.done !== undefined)
    mapInstance.prevDone = lastScene.done;
  mapInstance.set({
    index: sel,
    progress: frac,
    tasksTotal: st.tasks.length,
    tasksDone: st.tasks.filter(t => S.done[t.id]).length,
    hero: sel === cur,                 // персонаж живёт на своей текущей карте
    locked: sel > cur,
    done: stationDone(st),
    tool: st.tool,
    gate: !!st.cp,
    gatePassed: cpPassed(st),
    doorOpen: doorOpen(),
    avatar: myAvatar(),
    // соседи, находящиеся на этой же карте, идут рядом по дороге (пока поток скрыт — не показываем)
    peers: !FLOW_UI ? [] : flowRows().filter(r => !r.me && r.station === sel)
      .map(r => ({ avatar: r.avatar, frac: Math.max(0, Math.min(1, (r.walk || 0) * 9 - sel)) })),
  });
  if (lastScene && lastScene.idx === sel) mapInstance.charX = lastScene.x;
}

function unmountMap() {
  if (mapInstance) {
    lastScene = { idx: mapInstance.data.index, x: mapInstance.charX, done: mapInstance.prevDone };
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
  if (API === null) return null;
  return apiCall("/toggle", "POST", { kind, id, done });
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
        body.invite = view.querySelector("#aInvite").value.trim().toUpperCase();
        data = await apiCall("/register", "POST", body);
      } else {
        data = await apiCall("/login", "POST", body);
      }
      TOKEN = data.token;
      localStorage.setItem("shipyard_token", TOKEN);
      applyMe(data);
      S._reg = false;
      toast(`Добро пожаловать в Taulau, ${S.name}!`);
      go("map");
    } catch (err2) {
      errEl.textContent = err2.message;
      errEl.style.display = "block";
    }
  });

  /* лотерея */
  const spinBtn = view.querySelector("[data-spin]");
  if (spinBtn) spinBtn.addEventListener("click", () => spinLottery(spinBtn));

  /* баттлы */
  const bChallenge = view.querySelector("#bChallenge");
  if (bChallenge) bChallenge.addEventListener("click", async () => {
    bChallenge.disabled = true;
    try {
      await apiCall("/battles", "POST", { opponentId: Number(view.querySelector("#bOpp").value) });
      CACHE.battles = await apiCall("/battles");
      toast("Вызов отправлен — соперник увидит баттл у себя");
      render();
    } catch (e2) { toast(e2.message); bChallenge.disabled = false; }
  });

  view.querySelectorAll("[data-bplay]").forEach(b => b.addEventListener("click", () => {
    const bt = (CACHE.battles?.battles || []).find(x => x.id === Number(b.dataset.bplay));
    if (!bt || !bt.questions) return toast("Баттл недоступен — обновите список");
    BATTLE.play = { id: bt.id, questions: bt.questions, idx: 0, answers: [], startedAt: Date.now() };
    render();
  }));

  view.querySelectorAll("[data-bopt]").forEach(b => b.addEventListener("click", async () => {
    const p = BATTLE.play;
    if (!p) return;
    p.answers.push(Number(b.dataset.bopt));
    if (++p.idx < p.questions.length) return render();
    BATTLE.play = null;
    try {
      const r = await apiCall("/battles/submit", "POST", { id: p.id, answers: p.answers, ms: Date.now() - p.startedAt });
      BATTLE.review = r;
      CACHE.battles = CACHE.league = CACHE.flow = null;
      if (r.status === "done") applyMe(await apiCall("/me")); // очки лиги обновились
      if (r.result === "win")
        celebrate("Баттл выигран!", "+50 очков лиги дока", "⚔️",
          { share: `🏔️ Taulau: выиграл баттл по вайб-кодингу со счётом ${r.myScore}/${r.total}! ⚔️` });
    } catch (e2) { toast(e2.message); }
    render();
  }));

  const bBack = view.querySelector("[data-bback]");
  if (bBack) bBack.addEventListener("click", async () => {
    BATTLE.review = null;
    try { if (!CACHE.battles) CACHE.battles = await apiCall("/battles"); } catch {}
    render();
  });

  /* поделиться бейджем из профиля */
  view.querySelectorAll("[data-sharebadge]").forEach(b => b.addEventListener("click", () => {
    const bd = BADGES.find(x => x.id === b.dataset.sharebadge);
    if (bd) shareAchievement(`🏔️ Taulau: бейдж ${bd.emoji} «${bd.name}» — ${bd.desc}!`);
  }));

  /* задачи станций */
  view.querySelectorAll("[data-task]").forEach(cb =>
    cb.addEventListener("change", async () => {
      const id = cb.dataset.task;
      const wasLvl = level().n;
      const wasTools = tools().length;
      const wasSkills = skillLevels();
      const checked = cb.checked;
      try {
        const resp = await syncToggle("task", id, checked);
        S.done[id] = checked;
        if (!checked) delete S.done[id];
        save();
        // «счастливый билет» показываем поверх праздника станции, с паузой
        if (resp?.lucky) setTimeout(() => toast("🎟️ Счастливый билет Taulau — +1 спин лотереи!"), 1600);
        const nowLvl = level().n;
        const nowTools = tools().length;
        if (checked) {
          const t = STATIONS.flatMap(p => p.tasks).find(x => x.id === id);
          if (doorOpen() && wasTools < 9) {
            const last = STATIONS[STATIONS.length - 1];
            celebrate("Дверь MVP открыта!", "Путь пройден — сертификат доступен", "🚪",
              { log: last.log, share: "🏔️ Taulau: дверь MVP открыта! Девять станций, пять контрольных точек — мой продукт работает в рабочей среде." });
          } else if (nowTools > wasTools) {
            const st = STATIONS.find(p => stationDone(p) && p.tasks.some(x => x.id === id));
            celebrate("Станция закрыта!", `Получен инструмент: ${st ? st.toolName : "новый"} · путь дальше открыт`, "🧰",
              st ? { log: st.log, share: `🏔️ Taulau: станция «${st.title}» закрыта — в руках ${st.toolName}! Поднимаюсь к двери MVP.` } : {});
          } else if (nowLvl > wasLvl) {
            celebrate(`Новый уровень: ${LEVELS[nowLvl - 1].name}!`, LEVELS[nowLvl - 1].cond, LEVELS[nowLvl - 1].emoji,
              { share: `🏔️ Taulau: новый уровень — ${LEVELS[nowLvl - 1].name} ${LEVELS[nowLvl - 1].emoji}! ${LEVELS[nowLvl - 1].cond}.` });
          } else if (!announceSkillUps(wasSkills)) toast(POINTS_UI ? `+${t.pts} очков` : "Задача закрыта ✓");
        }
        CACHE.league = null;
        CACHE.lottery = null; // закрытая станция могла добавить спин
        patchMyFlow();
        render();
        if (LOTTERY_UI && API !== null && activeView === "map")
          apiCall("/lottery").then(l => { CACHE.lottery = l; if (activeView === "map") render(); }).catch(() => {});
      } catch (err2) { toast(err2.message); cb.checked = !checked; }
    }));

  /* безопасность */
  view.querySelectorAll("[data-sec]").forEach(cb =>
    cb.addEventListener("change", async () => {
      const checked = cb.checked;
      const wasSkills = skillLevels();
      try {
        await syncToggle("sec", cb.dataset.sec, checked);
        S.sec[cb.dataset.sec] = checked;
        if (!checked) delete S.sec[cb.dataset.sec];
        save();
        if (checked && !announceSkillUps(wasSkills)) toast("+10 очков · пункт ИБ закрыт");
        render();
      } catch (err2) { toast(err2.message); cb.checked = !checked; }
    }));

  /* юридический трек */
  view.querySelectorAll("[data-legal]").forEach(b =>
    b.addEventListener("click", async () => {
      const id = b.dataset.legal;
      const val = !S.legal[id];
      const wasSkills = skillLevels();
      try {
        await syncToggle("legal", id, val);
        S.legal[id] = val;
        if (!val) delete S.legal[id];
        save();
        if (val && !announceSkillUps(wasSkills)) toast("+15 очков · документ готов");
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

  /* конструктор персонажа: свотч меняет черновик и превью, сохранение — кнопкой */
  view.querySelectorAll("[data-avpart]").forEach(b => b.addEventListener("click", () => {
    AV[b.dataset.avpart] = b.dataset.avcolor;
    const row = b.closest(".sw-list");
    row.querySelectorAll(".sw").forEach(x => x.classList.toggle("sel", x === b));
    const prev = view.querySelector("#avPreview");
    if (prev) prev.src = GAME.PixelAvatar.build(AV);
  }));

  const avSave = view.querySelector("#avSave");
  if (avSave) avSave.addEventListener("click", async () => {
    try {
      await saveAvatar(GAME.PixelAvatar.build(AV));
      celebrate("Персонаж готов!", "Он уже идёт по карте пути", "🎨",
        { share: "🏔️ Taulau: собрал своего пиксельного персонажа — он поднимается по картам к двери MVP!" });
      render();
    } catch (e2) { toast(e2.message); }
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
  if (REG_CODE && !TOKEN) S._reg = true;   // пришли по ссылке-приглашению
  const start = decodeURIComponent(location.hash || "").replace("#", "");
  go(VIEWS[start] && start !== "auth" ? start : "map");
})();

})();
