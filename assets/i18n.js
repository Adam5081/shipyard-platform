/* ============================================================
   Taulau - переключение языка (русский / английский / арабский)

   Как это устроено. Исходный язык проекта - русский, он же лежит
   в разметке и в коде. Словари сопоставлены НЕ с абстрактными
   ключами, а с самой русской строкой: тогда не нужно размечать
   сотни элементов атрибутами, а перевод можно применять и к
   статичному лендингу, и к тому, что кабинет отрисовал только что.

   Обратная сторона: если русскую строку поменяли, а словарь нет -
   на месте перевода останется русский текст. Это видно глазом
   и чинится добавлением строки в словарь.
   ============================================================ */
(() => {
"use strict";

const STORE = "taulau_lang";
const LANGS = { ru: "Рус", en: "Eng", ar: "عربي" };

/* Ключ словаря: неразрывные пробелы и переносы строк схлопываем,
   иначе одна и та же фраза из разметки и из DOM не совпадёт. */
const norm = s => String(s).replace(/ /g, " ").replace(/\s+/g, " ").trim();

const DICT = { en: {}, ar: {} };

/* ---------- навигация и первый экран ---------- */
add("Кто мы", "About us", "من نحن");
add("Платформа", "Platform", "المنصة");
add("Наши преимущества", "How it works", "مزايانا");
add("Экономика", "Economics", "الجدوى الاقتصادية");
add("Тарифы", "Pricing", "الباقات");
add("Войти", "Log in", "تسجيل الدخول");
add("Занять место", "Join the cohort", "احجز مقعدك");
add("Запустите свой IT-продукт", "Launch your own software product", "أطلق منتجك الرقمي");
add("без навыков в программировании", "without knowing how to code", "دون خبرة في البرمجة");
add("Без программистов, без агентств, без «когда-нибудь». ИИ пишет код. Эксперты доводят до запуска. Вы - владелец: продукт, права и навык остаются у вас навсегда.",
    "No developers to hire, no agencies, no “someday”. AI writes the code. Industry experts carry it to launch. You own the outcome: the product, the rights and the skill stay with you.",
    "دون توظيف مبرمجين، ودون وكالات، ودون «يوماً ما». الذكاء الاصطناعي يكتب الشيفرة، والخبراء يوصلون المنتج إلى الإطلاق. وأنت المالك: المنتج والحقوق والمهارة تبقى لك.");
add("Занять место в потоке", "Join the next cohort", "احجز مقعدك في الدفعة");
add("Набор в ближайший поток открыт", "Enrolment for the next cohort is open", "التسجيل في الدفعة القادمة مفتوح");
add("Сначала посмотрите живую платформу ↓", "See the live platform first ↓", "شاهد المنصة الحية أولاً ↓");
add("Кабинет работает в проде - живое демо ниже", "The workspace is live in production - see the demo below", "لوحة المشارك تعمل فعلياً - جرّب العرض الحي أدناه");
add("NDA на ваш продукт", "NDA on your product", "اتفاقية سرية على منتجك");
add("- права остаются у вас", "- the rights stay yours", "- الحقوق تبقى لك");

/* ---------- кто мы ---------- */
add("Практики, а не лекторы", "Practitioners, not lecturers", "ممارسون، لا محاضرون");
add("За один поток вы запускаете свой рабочий IT-продукт - сервис для клиентов, автоматизацию для бизнеса или MVP для инвестора. Код пишет ИИ (Claude Code) - вместо найма разработчиков. Рядом эксперты - вместо курсов.",
    "In a single cohort you launch a working software product: a service for your customers, automation for your business, or an MVP for investors. AI (Claude Code) writes the code instead of a team you would otherwise hire. Experts work alongside you instead of a course.",
    "خلال دفعة واحدة تطلق منتجاً رقمياً عاملاً: خدمة لعملائك، أو أتمتة لأعمالك، أو نسخة أولية للمستثمرين. الذكاء الاصطناعي (Claude Code) يكتب الشيفرة بدل توظيف فريق، والخبراء يعملون إلى جانبك بدل الدورات التدريبية.");
add("А поток - это ещё и группа: вы идёте к запуску не в одиночку, а вместе с другими основателями, в общем темпе и с дедлайнами, которые доводят до финиша.",
    "A cohort is also a group: you move towards launch alongside other founders, at a shared pace and with deadlines that actually get people to the finish line.",
    "والدفعة مجموعة أيضاً: تسير نحو الإطلاق مع مؤسسين آخرين، بإيقاع مشترك ومواعيد نهائية توصل الجميع إلى خط النهاية.");
add("Ментор программы", "Programme mentor", "مرشد البرنامج");
add("Ведёт поток", "Runs the cohort", "يقود الدفعة");
add("Отбор участников, диагностика идей, темп потока и контрольные точки. Отвечает за то, чтобы проект дошёл до рабочей среды, а не до середины.",
    "Selects participants, stress-tests ideas, sets the pace and owns the checkpoints. Accountable for your project reaching production rather than stalling halfway.",
    "يختار المشاركين، ويفحص الأفكار، ويضبط الإيقاع، ويتولى نقاط التحقق. مسؤوليته أن يصل مشروعك إلى التشغيل الفعلي لا أن يتوقف في منتصف الطريق.");
add("Разработка и инфраструктура", "Engineering and infrastructure", "التطوير والبنية التحتية");
add("Архитектура и сборка", "Architecture and build", "البنية والتنفيذ");
add("Ревью сгенерированного кода, заготовки авторизации и базы, инфраструктура и автодеплой, разбор сложных участков.",
    "Reviews of generated code, ready-made auth and database building blocks, infrastructure and automated deployment, help with the hard parts.",
    "مراجعة الشيفرة المولّدة، وقوالب جاهزة لتسجيل الدخول وقواعد البيانات، والبنية التحتية والنشر الآلي، ومعالجة الأجزاء المعقدة.");
add("Безопасность и право", "Security and legal", "الأمن والشؤون القانونية");
add("Допуск к клиенту", "Cleared for real customers", "الجاهزية للعملاء");
add("Чек-лист OWASP, сканирование, ручной аудит, юридический пакет: компания, оферта, персональные данные, товарный знак.",
    "OWASP checklist, automated scanning, manual audit, and the legal pack: entity, public offer, personal data policy, trademark.",
    "قائمة OWASP، والفحص الآلي، والتدقيق اليدوي، والحزمة القانونية: الكيان، والعرض العام، وسياسة البيانات الشخصية، والعلامة التجارية.");
add("Аналитика и продажи", "Analytics and sales", "التحليلات والمبيعات");
add("Метрики и юнит-экономика, приоритизация объёма, позиционирование и доведение первых сделок до подписи.",
    "Metrics and unit economics, scope prioritisation, positioning, and getting your first deals signed.",
    "المؤشرات واقتصاديات الوحدة، وترتيب أولويات النطاق، والتموضع، وإتمام أولى الصفقات.");

/* ---------- платформа ---------- */
add("Виден путь, а не список уроков", "You see a route, not a list of lessons", "ترى مساراً، لا قائمة دروس");
add("Кабинет показывает одну вещь: где вы на пути к работающему продукту. Вы идёте по карте от станции к станции, забирая на каждой инструменты, чтобы ваш продукт приносил ценность. В конце пути - дверь MVP.",
    "The workspace shows one thing: where you stand on the way to a working product. You move along a map from station to station, picking up the tools that make your product useful. At the end of the route stands the MVP door.",
    "تُظهر لوحة المشارك شيئاً واحداً: أين أنت على طريق منتج عامل. تتقدم على خريطة من محطة إلى أخرى، وتجمع في كل محطة الأدوات التي تجعل منتجك ذا قيمة. وفي نهاية الطريق يقف باب النسخة الأولية.");
add("Это не видео - живая игра-восхождение из кабинета. Каждая станция программы - отметка высоты: персонаж-носильщик поднимается на гору Taulau, получая снаряжение у экспертов.",
    "This is not a video - it is the live climbing game from the workspace. Every station of the programme is an altitude mark: your porter climbs Mount Taulau, collecting gear from the experts.",
    "هذا ليس فيديو، بل لعبة التسلق الحية من داخل اللوحة. كل محطة في البرنامج علامة ارتفاع: تتسلق شخصيتك جبل تاولاو وتجمع العتاد من الخبراء.");
add("Платформа программы", "The programme platform", "منصة البرنامج");
add("Карта пути с девятью станциями, контрольные точки и чек-лист безопасности. Бэкенд без внешних зависимостей - тот же принцип, что мы требуем от участников: понятный код, который можно проверить.",
    "A nine-station route map, checkpoints and a security checklist. The backend runs with zero external dependencies - the same standard we hold participants to: code you can read and verify.",
    "خريطة مسار من تسع محطات، ونقاط تحقق، وقائمة تدقيق أمني. الواجهة الخلفية تعمل دون أي اعتماديات خارجية - وهو المعيار نفسه الذي نطلبه من المشاركين: شيفرة مفهومة يمكن التحقق منها.");
add("Заготовки программы", "Programme building blocks", "قوالب البرنامج");
add("Готовая техническая база", "A technical base that is already built", "أساس تقني جاهز");
add("Самые скучные и сложные части любого ИТ-продукта - вход по логину, хранение данных, платежи, публикация в интернете и шаблоны договоров - уже собраны и проверены. Вы не тратите недели на невидимую «сантехнику», а сразу строите то, ради чего пришли: сам продукт.",
    "The dullest and hardest parts of any software product - login, data storage, payments, going live, contract templates - are already built and tested. You spend no weeks on invisible plumbing and go straight to what you came for: the product itself.",
    "الأجزاء الأكثر رتابة وصعوبة في أي منتج رقمي - تسجيل الدخول، وتخزين البيانات، والمدفوعات، والنشر على الإنترنت، ونماذج العقود - جاهزة ومختبرة سلفاً. لن تضيّع أسابيع في السباكة غير المرئية، بل تبدأ مباشرة بما جئت من أجله: المنتج نفسه.");
add("готовые заготовки · шаблоны · чек-листы", "ready blocks · templates · checklists", "قوالب جاهزة · نماذج · قوائم تدقيق");
add("Скоро", "Coming soon", "قريباً");
add("Проекты первого потока", "Projects from the first cohort", "مشاريع الدفعة الأولى");
add("Здесь появятся продукты участников: что за проблема, что подтвердилось на практике, что работает в проде и на каких цифрах. Публикуем после защиты и только с согласия автора.",
    "Participant products will appear here: the problem, what held up in practice, what runs in production and on what numbers. Published after the final review and only with the author's consent.",
    "ستظهر هنا منتجات المشاركين: المشكلة، وما ثبت عملياً، وما يعمل في بيئة التشغيل وبأي أرقام. ننشرها بعد المراجعة النهائية وبموافقة صاحب المشروع فقط.");
add("витрина выпускников", "alumni showcase", "معرض الخريجين");
add("Открыть платформу", "Open the platform", "افتح المنصة");
add("Нажмите на блок - подробности развернутся под лентой.", "Tap a block - the details open below the strip.", "اضغط على أي بطاقة لتظهر التفاصيل أسفل الشريط.");

/* ---------- лента фактов ---------- */
add("Один поток", "One cohort", "دفعة واحدة");
add("до двух месяцев работы над продуктом - срок зависит от сложности проекта",
    "up to two months of work on your product - the length depends on its complexity",
    "حتى شهرين من العمل على منتجك - وتعتمد المدة على درجة تعقيده");
add("Путь проекта", "Project route", "مسار المشروع");
add("девять станций и пять контрольных точек с проверяемым артефактом",
    "nine stations and five checkpoints, each with a verifiable deliverable",
    "تسع محطات وخمس نقاط تحقق، ولكل منها مُخرَج قابل للتحقق");
add("6 направлений", "6 disciplines", "٦ تخصصات");
add("экспертизы отрасли в одном контуре", "industry expertise in a single loop", "خبرات الصناعة في حلقة واحدة");
add("защита проекта перед экспертами", "final project review in front of experts", "مراجعة نهائية للمشروع أمام الخبراء");
add("Безопасность", "Security", "الأمن");
add("чек-лист OWASP, сканирование и ручной аудит", "OWASP checklist, scanning and a manual audit", "قائمة OWASP، والفحص الآلي، والتدقيق اليدوي");
add("Это не курс. Это ваша команда на время потока.", "This is not a course. It is your team for the length of the cohort.", "هذا ليس دورة تدريبية، بل فريقك طوال مدة الدفعة.");
add("Один поток - до двух месяцев работы над вашим продуктом, срок зависит от сложности проекта. Вместо найма команды на полгода вы берёте подписку на процесс, инструменты и экспертов отрасли - и собираете продукт сами.",
    "One cohort is up to two months of work on your product, depending on its complexity. Instead of hiring a team for half a year, you subscribe to the process, the tooling and the industry experts - and build the product yourself.",
    "الدفعة الواحدة تصل إلى شهرين من العمل على منتجك بحسب تعقيده. وبدل توظيف فريق لستة أشهر، تشترك في المنهجية والأدوات وخبراء الصناعة - وتبني المنتج بنفسك.");
add("«Курс по AI-разработке»", "“A course on AI development”", "«دورة في التطوير بالذكاء الاصطناعي»");
add("Ваша команда", "Your team", "فريقك");
add("на время потока", "for the length of the cohort", "طوال مدة الدفعة");
add("«Вы научитесь программировать»", "“You will learn to code”", "«ستتعلم البرمجة»");
add("Вы", "You", "أنت");
add("выпустите продукт", "will ship a product", "ستطلق منتجاً");
add("и научитесь собирать следующий через Claude Code", "and learn to build the next one with Claude Code", "وتتعلم بناء التالي عبر Claude Code");
add("«Модули, уроки, домашние задания»", "“Modules, lessons, homework”", "«وحدات ودروس وواجبات»");
add("Спринты, релизы, демо", "Sprints, releases, demos", "دورات تطوير وإصدارات وعروض");
add(", первые клиенты", ", first customers", "، وأول العملاء");
add("«Сертификат об окончании»", "“A certificate of completion”", "«شهادة إتمام»");
add("Ссылка на работающий продукт", "A link to a working product", "رابط لمنتج يعمل فعلاً");
add("и отчёт по безопасности", "and a security report", "وتقرير أمني");

/* ---------- станции ---------- */
add("Девять станций. Пять контрольных точек.", "Nine stations. Five checkpoints.", "تسع محطات. خمس نقاط تحقق.");
add("Каждая станция закрывается проверяемым артефактом, а на контрольных точках путь дальше открывается только после проверки экспертом отрасли. Разверните станцию, чтобы увидеть, что происходит внутри.",
    "Every station closes with a deliverable that can be checked, and at each checkpoint the way forward opens only after an industry expert signs it off. Expand a station to see what happens inside.",
    "تُختتم كل محطة بمُخرَج قابل للتحقق، وعند كل نقطة تحقق لا ينفتح الطريق إلا بعد اعتماد خبير من الصناعة. افتح أي محطة لترى ما يجري داخلها.");
add("станция", "station", "محطة");
add("Диагностика и окружение", "Diagnosis and environment", "التشخيص وتهيئة بيئة العمل");
add("Старт · заключение по идее и рабочее место", "Start · verdict on the idea and a working setup", "البداية · تقييم الفكرة وتجهيز مكان العمل");
add("Честный разбор идеи: кому больно, кто платит, что именно собираем. Затем - рабочее окружение: Claude Code, репозиторий, доступы, и базовые принципы вайб-кодинга - как ставить задачи агенту, чтобы он не уводил проект в сторону.",
    "An honest look at the idea: whose pain it solves, who pays, what exactly gets built. Then the working environment: Claude Code, repository, access, and the basics of prompting an agent so it does not drift off course.",
    "نظرة صادقة إلى الفكرة: مَن يعاني، ومَن يدفع، وما الذي سنبنيه بالضبط. ثم بيئة العمل: Claude Code، والمستودع، والصلاحيات، وأساسيات توجيه الوكيل البرمجي كي لا ينحرف بالمشروع.");
add("📦 Заключение по идее + рабочее окружение", "📦 Verdict on the idea + a working environment", "📦 تقييم الفكرة + بيئة عمل جاهزة");
add("Презентация проекта", "Project brief", "عرض المشروع");
add("Контекст · блоки продукта, собранные через Claude Code", "Context · product blocks assembled with Claude Code", "السياق · مكوّنات المنتج مُجمَّعة عبر Claude Code");
add("Полная презентация проекта, собранная через Claude Code по блокам: ожидания и цели, функциональность, примеры похожих проектов и отличия. Это контекст, по которому агент и эксперты понимают продукт весь дальнейший путь. Live-сессия объясняет, зачем это нужно и как Claude работает с MD-файлами.",
    "A complete project brief assembled with Claude Code, block by block: goals and expectations, functionality, comparable products and what sets yours apart. This is the context the agent and the experts rely on for the rest of the route. A live session explains why it matters and how Claude works with markdown files.",
    "عرض كامل للمشروع مُجمَّع عبر Claude Code على شكل مكوّنات: الأهداف والتوقعات، والوظائف، ونماذج مشابهة وأوجه التميّز. هذا هو السياق الذي يعتمد عليه الوكيل والخبراء طوال بقية المسار. وتشرح جلسة مباشرة سبب أهميته وكيفية تعامل Claude مع ملفات markdown.");
add("📦 Презентация проекта, контекст для Claude", "📦 Project brief, context for Claude", "📦 عرض المشروع، وسياق العمل لـ Claude");
add("Контрольная точка 1 - презентация покрывает все блоки и принята ментором",
    "Checkpoint 1 - the brief covers every block and is accepted by the mentor",
    "نقطة التحقق ١ - العرض يغطي جميع المكوّنات ومعتمد من المرشد");
add("Чертёж продукта", "Product blueprint", "مخطط المنتج");
add("Проектирование · объём MVP и CLAUDE.md", "Design · MVP scope and CLAUDE.md", "التصميم · نطاق النسخة الأولية وملف CLAUDE.md");
add("Реалистичный MVP, который реально собрать за четыре недели: roadmap, техстек, макеты. Архитектура - в CLAUDE.md, по нему агент работает все следующие станции.",
    "An MVP scoped to what four weeks can actually deliver: roadmap, tech stack, mockups. The architecture lives in CLAUDE.md, which the agent follows for every station that comes after.",
    "نسخة أولية محدَّدة بما يمكن إنجازه فعلاً خلال أربعة أسابيع: خارطة طريق، وحزمة تقنية، ونماذج واجهات. أما البنية فتُوثَّق في ملف CLAUDE.md الذي يتبعه الوكيل في كل المحطات التالية.");
add("📦 Техкарта, CLAUDE.md, прототип интерфейса, план спринтов", "📦 Tech map, CLAUDE.md, interface prototype, sprint plan", "📦 الخريطة التقنية، وCLAUDE.md، ونموذج الواجهة، وخطة الدورات");
add("Контрольная точка 2 - объём MVP умещается в четыре недели сборки",
    "Checkpoint 2 - the MVP scope fits into four weeks of building",
    "نقطة التحقق ٢ - نطاق النسخة الأولية يتّسع لأربعة أسابيع من البناء");
add("Ядро продукта", "Product core", "نواة المنتج");
add("Сборка · ключевой сценарий", "Build · the core user journey", "البناء · المسار الأساسي للمستخدم");
add("Сборка идёт вашими руками через Claude Code по спринтам: каркас и модель данных, затем ключевой сценарий от входа пользователя до полезного результата. Эксперт разбирает сложные участки и делает ревью сгенерированного кода.",
    "You do the building yourself with Claude Code, sprint by sprint: the skeleton and the data model first, then the core journey from a user signing in to a result worth having. An expert walks you through the hard parts and reviews the generated code.",
    "تتولى البناء بنفسك عبر Claude Code على دفعات: الهيكل ونموذج البيانات أولاً، ثم المسار الأساسي من دخول المستخدم إلى نتيجة ذات قيمة. ويشرح الخبير الأجزاء المعقدة ويراجع الشيفرة المولّدة.");
add("📦 Работающий ключевой сценарий", "📦 A working core journey", "📦 مسار أساسي يعمل فعلاً");
add("Обвязка", "Supporting layer", "الطبقة المساندة");
add("Сборка · авторизация, база, интеграции", "Build · auth, database, integrations", "البناء · تسجيل الدخول وقاعدة البيانات والتكاملات");
add("То, что обычно съедает месяц, подключается из готовых заготовок программы: авторизация, база с миграциями, почта, файлы, внешние API. С нуля это не пишется - время остаётся на ваш ключевой сценарий.",
    "What normally eats a month gets plugged in from the programme's ready-made blocks: authentication, a database with migrations, email, file storage, external APIs. None of it is written from scratch, so the time stays with your core journey.",
    "ما يستهلك عادةً شهراً كاملاً يُركَّب من قوالب البرنامج الجاهزة: تسجيل الدخول، وقاعدة بيانات مع ترحيلاتها، والبريد، وتخزين الملفات، وواجهات خارجية. لا شيء يُكتب من الصفر، فيبقى الوقت لمسارك الأساسي.");
add("📦 Функционально полный MVP", "📦 A functionally complete MVP", "📦 نسخة أولية مكتملة وظيفياً");
add("Контрольная точка 3 - ключевой сценарий работает на реальных данных",
    "Checkpoint 3 - the core journey works on real data",
    "نقطة التحقق ٣ - المسار الأساسي يعمل على بيانات حقيقية");
add("Тестирование и защита", "Testing and hardening", "الاختبار والتحصين");
add("Проверка · чек-лист OWASP и сканирование", "Verification · OWASP checklist and scanning", "التحقق · قائمة OWASP والفحص الآلي");
add("Прогон сценариев на реальных данных, ревью типовых ошибок вайб-кодинга, сканирование и закрытие чек-листа OWASP.",
    "Running the journeys on real data, reviewing the classic AI-coding mistakes, scanning, and closing out the OWASP checklist.",
    "تشغيل المسارات على بيانات حقيقية، ومراجعة الأخطاء الشائعة في البرمجة بالذكاء الاصطناعي، والفحص الآلي، وإغلاق قائمة OWASP.");
add("📦 Закрытый чек-лист OWASP + отчёт сканирования", "📦 A closed OWASP checklist + scan report", "📦 قائمة OWASP مكتملة + تقرير الفحص");
add("Продукт в сети", "Product online", "المنتج على الإنترنت");
add("Запуск · хостинг, автодеплой, юрпакет", "Launch · hosting, automated deployment, legal pack", "الإطلاق · الاستضافة والنشر الآلي والحزمة القانونية");
add("Хостинг, домен, сертификаты, автоматический деплой, мониторинг и резервные копии. Параллельно закрывается юридический пакет - оферта и политика данных, без которых нельзя принимать деньги.",
    "Hosting, domain, certificates, automated deployment, monitoring and backups. In parallel the legal pack is closed out - the public offer and the data policy, without which you cannot take money.",
    "الاستضافة، والنطاق، والشهادات، والنشر الآلي، والمراقبة، والنسخ الاحتياطي. وبالتوازي تُستكمل الحزمة القانونية - العرض العام وسياسة البيانات، ودونهما لا يمكن استلام الأموال.");
add("📦 Продукт в проде + юридический пакет", "📦 Product in production + legal pack", "📦 المنتج في بيئة التشغيل + الحزمة القانونية");
add("Контрольная точка 4 - безопасность закрыта, продукт доступен по публичной ссылке",
    "Checkpoint 4 - security is closed out and the product is live at a public link",
    "نقطة التحقق ٤ - اكتمل الجانب الأمني والمنتج متاح عبر رابط عام");
add("Защита проекта", "Project review", "مراجعة المشروع");
add("Demo Day · разбор перед экспертами отрасли", "Demo Day · review in front of industry experts", "يوم العرض · مراجعة أمام خبراء الصناعة");
add("Разбор проекта: проблема, решение, что подтвердилось и что нет, метрики, план развития. Прогон с ментором, затем защита перед отраслевыми экспертами и обратная связь каждому участнику. Выступление на Demo Day - по желанию: если публичная защита не нужна, вы проходите разбор проекта с экспертами один на один.",
    "A full review: the problem, the solution, what held up and what did not, the metrics, the plan ahead. A rehearsal with your mentor, then the review in front of industry experts and individual feedback for everyone. Presenting on Demo Day is optional: if a public session is not for you, you go through the same review with the experts one to one.",
    "مراجعة كاملة: المشكلة، والحل، وما ثبت وما لم يثبت، والمؤشرات، وخطة التطوير. بروفة مع مرشدك، ثم المراجعة أمام خبراء الصناعة مع ملاحظات فردية لكل مشارك. والعرض في يوم العرض اختياري: إن لم ترغب في جلسة علنية، تخوض المراجعة نفسها مع الخبراء على انفراد.");
add("📦 Разбор проекта, оценка экспертов, решение по треку", "📦 Project review, expert assessment, decision on your track", "📦 مراجعة المشروع، وتقييم الخبراء، وقرار المسار");
add("Вывод в рабочую среду", "Into real-world use", "الانتقال إلى الاستخدام الفعلي");
add("Первые пользователи продукта", "The product's first users", "أول مستخدمي المنتج");
add("Продукт переезжает из демо в реальную работу: при необходимости собирается лендинг, запускается аналитика продукта. Цель станции - не трафик, а первые люди, которые пользуются продуктом в своей работе.",
    "The product moves out of demo and into real work: a landing page if one is needed, product analytics switched on. The goal of this station is not traffic but the first people using the product in their own work.",
    "ينتقل المنتج من العرض التجريبي إلى العمل الحقيقي: صفحة هبوط عند الحاجة، وتفعيل تحليلات المنتج. وهدف هذه المحطة ليس عدد الزيارات، بل أول أشخاص يستخدمون المنتج في أعمالهم.");
add("📦 Продукт в рабочей среде, первые пользователи", "📦 Product in real-world use, first users", "📦 المنتج قيد الاستخدام الفعلي، وأول المستخدمين");
add("Контрольная точка 5 - продукт используется вне вашей команды",
    "Checkpoint 5 - the product is used outside your own team",
    "نقطة التحقق ٥ - المنتج مستخدَم خارج فريقك");

/* ---------- сервисный пул ---------- */
add("Шесть направлений в одном контуре.", "Six disciplines in a single loop.", "ستة تخصصات في حلقة واحدة.");
add("Каждый эксперт - практик, который закрывает свой участок вашего проекта. Созвоны идут по часам тарифа: Solo - 4 часа групповых в неделю, Pro - те же 4 часа групповых плюс 2 часа один на один с экспертом. Сверх шести направлений с вами постоянно ментор потока.",
    "Every expert is a practitioner who owns their part of your project. Calls come out of your plan's hours: Solo gets 4 group hours a week, Pro gets the same 4 group hours plus 2 one-to-one hours with an expert. Beyond the six disciplines, your cohort mentor is always with you.",
    "كل خبير ممارس يتولى الجزء الخاص به من مشروعك. وتُحتسب الجلسات من ساعات باقتك: باقة Solo تمنح ٤ ساعات جماعية أسبوعياً، وباقة Pro تمنح الساعات الأربع نفسها إضافة إلى ساعتين فرديتين مع خبير. وإلى جانب التخصصات الستة، يرافقك مرشد الدفعة دائماً.");
add("Разработка", "Engineering", "التطوير");
add("Архитектура, код-ревью сгенерированного кода, сложные участки сборки.",
    "Architecture, reviews of generated code, the difficult parts of the build.",
    "البنية، ومراجعة الشيفرة المولّدة، والأجزاء الصعبة من البناء.");
add("станции 3–7 · созвон + разбор кода", "stations 3–7 · call + code review", "المحطات ٣–٧ · جلسة + مراجعة شيفرة");
add("Инфраструктура, домен, автоматический деплой, мониторинг и резервные копии.",
    "Infrastructure, domain, automated deployment, monitoring and backups.",
    "البنية التحتية، والنطاق، والنشر الآلي، والمراقبة، والنسخ الاحتياطي.");
add("станции 6–7 · шаблон + настройка вместе", "stations 6–7 · template + setup together", "المحطات ٦–٧ · قالب + إعداد مشترك");
add("Кибербезопасность", "Cybersecurity", "الأمن السيبراني");
add("Уязвимости, защита данных, разграничение доступов, ручной аудит логики.",
    "Vulnerabilities, data protection, access control, a manual audit of the logic.",
    "الثغرات، وحماية البيانات، وضبط الصلاحيات، والتدقيق اليدوي للمنطق البرمجي.");
add("станция 6 · чек-лист + сканирование", "station 6 · checklist + scanning", "المحطة ٦ · قائمة تدقيق + فحص آلي");
add("Право", "Legal", "القانون");
add("Компания, оферта, персональные данные, товарный знак, договоры с клиентами.",
    "Entity, public offer, personal data, trademark, customer contracts.",
    "تأسيس الكيان، والعرض العام، والبيانات الشخصية، والعلامة التجارية، وعقود العملاء.");
add("станции 2–8 · сессии + шаблоны", "stations 2–8 · sessions + templates", "المحطات ٢–٨ · جلسات + نماذج");
add("Бизнес-аналитика", "Business analytics", "تحليل الأعمال");
add("Метрики продукта, юнит-экономика, приоритизация объёма, разбор гипотез на цифрах.",
    "Product metrics, unit economics, scope prioritisation, testing hypotheses against numbers.",
    "مؤشرات المنتج، واقتصاديات الوحدة، وترتيب أولويات النطاق، واختبار الفرضيات بالأرقام.");
add("станции 2–8 · разбор метрик проекта", "stations 2–8 · project metrics review", "المحطات ٢–٨ · مراجعة مؤشرات المشروع");
add("Маркетинг и продажи", "Marketing and sales", "التسويق والمبيعات");
add("Позиционирование, цена, первые каналы, переговоры и доведение до сделки.",
    "Positioning, pricing, first channels, negotiation and closing.",
    "التموضع، والتسعير، وأول القنوات، والتفاوض، وإتمام الصفقة.");
add("станции 8–9 · сессии + разборы", "stations 8–9 · sessions + reviews", "المحطات ٨–٩ · جلسات ومراجعات");

/* ---------- Demo Day и безопасность ---------- */
add("Финал потока: защита перед практиками вашего рынка.", "The finale: a review in front of practitioners from your market.", "ختام الدفعة: مراجعة أمام ممارسين من سوقك.");
add("Защита проекта перед практиками вашего рынка: разбор, сессия вопросов и обратная связь каждому. Оценка по четырём осям: проблема, решение, результат, план развития. Не аплодисменты, а профессиональный разбор. Выступать или ограничиться закрытым разбором - выбор за вами.",
    "A review in front of practitioners from your market: analysis, questions, and feedback for everyone. Assessed on four axes: problem, solution, result, plan ahead. Not applause - a professional critique. Whether you present publicly or keep the review private is your call.",
    "مراجعة أمام ممارسين من سوقك: تحليل، وجلسة أسئلة، وملاحظات لكل مشارك. والتقييم على أربعة محاور: المشكلة، والحل، والنتيجة، وخطة التطوير. ليس تصفيقاً، بل نقداً مهنياً. ولك أن تعرض علناً أو تكتفي بمراجعة مغلقة.");
add("Прототип - каждому. Продукт, которому можно доверить чужие данные, - нашим.",
    "Anyone can get a prototype. A product you can trust with other people's data - that is ours.",
    "النموذج الأولي في متناول الجميع. أما منتج يُؤتمن على بيانات الآخرين، فهو ما نصنعه.");
add("Тот же инструмент внутри пайплайна - с архитектурой, тестированием, проверкой безопасности и деплоем - даёт не прототип, а продукт. Мы учим второму.",
    "The same tool inside a proper pipeline - with architecture, testing, security review and deployment - produces a product rather than a prototype. The second is what we teach.",
    "الأداة نفسها داخل مسار إنتاج سليم - ببنية واختبار ومراجعة أمنية ونشر - تنتج منتجاً لا نموذجاً أولياً. والثاني هو ما نعلّمه.");
add("1 · Чек-лист OWASP", "1 · OWASP checklist", "١ · قائمة OWASP");
add("Всем участникам. Типовые уязвимости, работа с секретами, разграничение доступов, защита данных.",
    "For every participant. Common vulnerabilities, handling secrets, access control, data protection.",
    "لجميع المشاركين. الثغرات الشائعة، والتعامل مع المفاتيح السرية، وضبط الصلاحيات، وحماية البيانات.");
add("2 · Сканирование", "2 · Scanning", "٢ · الفحص الآلي");
add("Всем участникам. Автоматизированная проверка зависимостей и конфигураций, отчёт с приоритетами исправлений.",
    "For every participant. Automated checks of dependencies and configuration, with a report prioritising the fixes.",
    "لجميع المشاركين. فحص آلي للاعتماديات والإعدادات، مع تقرير يرتّب أولويات الإصلاح.");
add("3 · Ручной аудит", "3 · Manual audit", "٣ · التدقيق اليدوي");
add("Тарифы Pro и Partner. Разбор специалистом: логика доступа, бизнес-логика, повторная проверка после исправлений.",
    "Pro and Partner plans. A specialist review: access logic, business logic, and a re-check after the fixes.",
    "لباقتَي Pro وPartner. مراجعة متخصص: منطق الصلاحيات، ومنطق الأعمال، وإعادة فحص بعد الإصلاحات.");

/* ---------- экономика ---------- */
add("Дешевле команды. Не «дешевле курсов».", "Cheaper than a team. Not “cheaper than a course”.", "أرخص من فريق. لا «أرخص من دورة».");
add("Техлид, два разработчика, DevOps, дизайнер, аудит безопасности и юристы на полгода - это от 10 млн ₸ и наём, который нужно содержать дальше. Поток Taulau - от 290 000 ₸ в месяц. Вы получаете ту же функцию подпиской на время потока.",
    "A tech lead, two developers, a DevOps engineer, a designer, a security audit and lawyers for six months start at $22,000 - plus a payroll you then have to keep carrying. A Taulau cohort starts at $640 a month. You get the same function as a subscription, for the length of the cohort.",
    "قائد تقني، ومطوّران، ومهندس عمليات، ومصمم، وتدقيق أمني، ومحامون لستة أشهر: تبدأ التكلفة من ٨٢٬٥٠٠ ريال سعودي، إضافة إلى رواتب تستمر بعد ذلك. أما دفعة تاولاو فتبدأ من ٢٬٤٠٠ ريال شهرياً، وتحصل على الوظيفة نفسها باشتراك طوال مدة الدفعة.");
add("Наём своей команды", "Hiring your own team", "توظيف فريق خاص بك");
add("от 10 млн ₸ за полгода", "from $22,000 per six months", "من ٨٢٬٥٠٠ ر.س لستة أشهر");
add("4–6 месяцев до первой версии", "4–6 months to a first version", "٤–٦ أشهر حتى النسخة الأولى");
add("Крупный бюджет и постоянный ФОТ", "A large budget and an ongoing payroll", "ميزانية كبيرة ورواتب مستمرة");
add("Продукт + зависимость от подрядчика", "A product plus dependence on the contractor", "منتج + اعتماد على المورّد");
add("Безопасность и право - отдельные бюджеты", "Security and legal are separate budgets", "الأمن والقانون ميزانيتان منفصلتان");
add("Навык остаётся у исполнителя", "The skill stays with the contractor", "المهارة تبقى لدى المنفّذ");
add("от 290 000 ₸ / месяц", "from $640 / month", "من ٢٬٤٠٠ ر.س / شهرياً");
/* суммы тарифных карточек: в EN - доллары, в AR - саудовские риялы (курс ~460 ₸/$, SAR = 3.75 $) */
add("290 000 ₸", "$640", "٢٬٤٠٠ ر.س");
add("590 000 ₸", "$1,280", "٤٬٨٠٠ ر.س");
add("Подписка вместо найма", "A subscription instead of hiring", "اشتراك بدل التوظيف");
add("Продукт в рабочей среде к концу потока", "A product in real-world use by the end of the cohort", "منتج قيد الاستخدام الفعلي بنهاية الدفعة");
add("Продукт + собственная компетенция", "A product plus a capability of your own", "منتج + كفاءة تمتلكها أنت");
add("Безопасность и право включены", "Security and legal are included", "الأمن والقانون مشمولان");
add("Навык остаётся у вас", "The skill stays with you", "المهارة تبقى لك");

/* ---------- тарифы ---------- */
add("Одна программа. Три уровня доступа к экспертам.", "One programme. Three levels of access to the experts.", "برنامج واحد. ثلاثة مستويات للوصول إلى الخبراء.");
add("Большинство начинают здесь", "Most people start here", "معظم المشاركين يبدأون هنا");
add("Вы собираете сами - процесс и эксперты рядом", "You build it yourself - with the process and the experts alongside", "تبني بنفسك - مع المنهجية والخبراء إلى جانبك");
add("/ месяц", "/ month", "/ شهرياً");
add("Материалы платформы и шаблоны", "Platform materials and templates", "مواد المنصة والنماذج");
add("4 часа групповых созвонов с экспертами в неделю", "4 hours of group calls with experts per week", "٤ ساعات جلسات جماعية مع الخبراء أسبوعياً");
add("Ментор в Telegram", "A mentor on Telegram", "مرشد عبر تيليغرام");
add("Чек-лист OWASP + автоматическое сканирование", "OWASP checklist + automated scanning", "قائمة OWASP + فحص آلي");
add("Юридические шаблоны", "Legal templates", "نماذج قانونية");
add("Инфраструктура - по шаблону с экспертами", "Infrastructure - from a template, with the experts", "البنية التحتية - عبر قالب جاهز مع الخبراء");
add("Участие в Demo Day", "A place at Demo Day", "المشاركة في يوم العرض");
add("Занять место на Solo", "Join on Solo", "احجز مقعدك في Solo");
add("Вам нужна команда рядом с проектом", "You want a team next to your project", "تحتاج فريقاً بجانب مشروعك");
add("Всё из Solo", "Everything in Solo", "كل ما في Solo");
add("Плюс 2 часа один на один с экспертом в неделю - к четырём групповым из Solo, без других участников",
    "Plus 2 one-to-one hours with an expert each week, on top of Solo's four group hours - with nobody else in the room",
    "إضافة إلى ساعتين فرديتين مع خبير أسبوعياً، فوق الساعات الجماعية الأربع في Solo - دون حضور مشاركين آخرين");
add("Ручной аудит безопасности специалистом", "A manual security audit by a specialist", "تدقيق أمني يدوي على يد متخصص");
add("Юридические консультации", "Legal consultations", "استشارات قانونية");
add("Настройка инфраструктуры и полный аудит экспертами", "Infrastructure setup and a full audit by the experts", "إعداد البنية التحتية وتدقيق كامل من الخبراء");
add("Занять место на Pro", "Join on Pro", "احجز مقعدك في Pro");
add("Вам нужна команда, которая заберёт разработку", "You want a team to take the build off your hands", "تحتاج فريقاً يتولى التطوير بالكامل");
add("По договорённости", "By arrangement", "حسب الاتفاق");
add("· по приглашению", "· by invitation", "· بالدعوة فقط");
add("Всё из Pro", "Everything in Pro", "كل ما في Pro");
add("Эксперты без лимита в рамках проекта", "Unlimited expert time within the project", "وقت غير محدود مع الخبراء ضمن المشروع");
add("Аудит + повторная проверка", "Audit plus a re-check", "تدقيق + إعادة فحص");
add("Полное юридическое сопровождение", "Full legal support", "مرافقة قانونية كاملة");
add("Инфраструктура под ключ", "Turnkey infrastructure", "بنية تحتية جاهزة بالكامل");
add("Запросить приглашение", "Request an invitation", "اطلب دعوة");
add("Права на код, дизайн и данные всегда остаются у участника. Условия партнёрского трека одинаковы для всех и публикуются до старта.",
    "Rights to the code, the design and the data always stay with the participant. Partner-track terms are the same for everyone and published before the cohort begins.",
    "حقوق الشيفرة والتصميم والبيانات تبقى دائماً للمشارك. وشروط مسار الشراكة واحدة للجميع وتُنشر قبل انطلاق الدفعة.");

/* ---------- вопросы и ответы ---------- */
add("Вопросы и ответы", "Questions and answers", "أسئلة وأجوبة");
add("Мне нужно уметь программировать?", "Do I need to know how to code?", "هل أحتاج إلى معرفة البرمجة؟");
add("Нет. Вы формулируете требования и проверяете результат, код пишет агент. Программа учит делать это правильно - внутри полного пайплайна, с архитектурой, тестированием и проверкой безопасности.",
    "No. You state the requirements and check the result; the agent writes the code. The programme teaches you to do that properly - inside a full pipeline, with architecture, testing and a security review.",
    "لا. أنت تحدد المتطلبات وتتحقق من النتيجة، والوكيل يكتب الشيفرة. ويعلّمك البرنامج القيام بذلك على نحو سليم داخل مسار إنتاج كامل، ببنية واختبار ومراجعة أمنية.");
add("Сколько времени это займёт в неделю?", "How much time will it take each week?", "كم من الوقت يتطلب أسبوعياً؟");
add("Всё зависит от сложности проекта. В среднем уходит 10–19 часов в неделю.",
    "It depends on the complexity of the project. On average it takes 10–19 hours a week.",
    "يعتمد ذلك على تعقيد المشروع. وفي المتوسط يستغرق ١٠–١٩ ساعة أسبوعياً.");
add("Кому принадлежит продукт?", "Who owns the product?", "لمن تعود ملكية المنتج؟");
add("Вам. Договор фиксирует это со станции 1. Эксперты подписывают соглашение о конфиденциальности и прав на ваш проект не получают.",
    "You do. The agreement locks this in from station 1. The experts sign a confidentiality agreement and acquire no rights to your project.",
    "لك أنت. ويثبّت العقد ذلك منذ المحطة الأولى. ويوقّع الخبراء اتفاقية سرية ولا يكتسبون أي حقوق في مشروعك.");
add("А если у меня сложный проект, а у соседа простой?", "What if my project is complex and someone else's is simple?", "ماذا لو كان مشروعي معقداً ومشروع غيري بسيطاً؟");
add("На старте проект проходит скрининг сложности - интеграции, регуляторика, данные, платежи, мобильный клиент, модели, роли - темп, объём поддержки и оценка на Demo Day учитывают сложность: ваш проект сравнивают только с сопоставимыми по объёму работ.",
    "At the start every project is screened for complexity - integrations, regulation, data, payments, a mobile client, models, roles. Pace, support and Demo Day assessment all account for it: your project is only compared with others of a similar scope.",
    "في البداية يخضع كل مشروع لفحص درجة التعقيد - التكاملات، والتنظيمات، والبيانات، والمدفوعات، وتطبيق الجوال، والنماذج، والأدوار. ويؤخذ ذلك في الحسبان في الإيقاع وحجم الدعم والتقييم في يوم العرض: فمشروعك يُقارن فقط بمشاريع مماثلة في حجم العمل.");
add("Что если я не успею за поток?", "What if I do not finish within the cohort?", "ماذا لو لم أُنهِ العمل خلال الدفعة؟");
add("Вы можете продолжить работу с нами - мы обязательно разберём ваш кейс отдельно, - либо продолжить самостоятельно. Выбор всегда за вами.",
    "You can carry on with us - we will always look at your case individually - or continue on your own. The choice is always yours.",
    "يمكنك المتابعة معنا - وسندرس حالتك على حدة بكل تأكيد - أو المتابعة بمفردك. والخيار دائماً لك.");
add("Обязательно ли выступать на Demo Day?", "Do I have to present at Demo Day?", "هل العرض في يوم العرض إلزامي؟");
add("Нет. Demo Day - это возможность: представить продукт экспертам и приглашённым гостям и получить разбор от практиков. Если выступать не хочется, вы проходите разбор проекта без публичной защиты - контрольная точка закрывается так же.",
    "No. Demo Day is an opportunity: to show the product to experts and invited guests and get a practitioner's critique. If presenting is not for you, you go through the review without the public session - the checkpoint closes just the same.",
    "لا. يوم العرض فرصة: أن تعرض منتجك على الخبراء والضيوف وتحصل على نقد من ممارسين. وإن لم ترغب في العرض، تخوض المراجعة دون جلسة علنية - وتُغلق نقطة التحقق كما هي.");
add("Кто оценивает проект на защите?", "Who assesses the project at the review?", "مَن يقيّم المشروع في المراجعة؟");
add("Эксперты нашей компании. При необходимости привлечём внешнего члена жюри, не связанного с программой, чтобы быть максимально объективными.",
    "Our own experts. Where it helps, we bring in an outside judge with no connection to the programme, to keep the assessment as objective as possible.",
    "خبراء شركتنا. وعند الحاجة نستعين بمحكّم خارجي لا صلة له بالبرنامج، حرصاً على أقصى قدر من الموضوعية.");
add("Что будет после программы?", "What happens after the programme?", "ماذا بعد البرنامج؟");
add("Три трека на выбор: самостоятельный (забираете всё и растёте сами), сопровождение (подписка на нашу команду по прозрачной ставке) или партнёрский (мы берём разработку на себя и входим в проект как партнёр - только по приглашению и на публичных условиях).",
    "Three tracks to choose from: on your own (you take everything and grow it yourself), supported (a subscription to our team at a transparent rate), or partnership (we take on the development and join the project as a partner - by invitation only and on published terms).",
    "ثلاثة مسارات للاختيار: مستقل (تأخذ كل شيء وتنمو بنفسك)، أو مرافقة (اشتراك مع فريقنا بسعر معلن)، أو شراكة (نتولى التطوير وندخل المشروع كشريك - بالدعوة فقط ووفق شروط منشورة).");
add("Что если Claude Code сменится другим инструментом?", "What if Claude Code is replaced by another tool?", "ماذا لو حلّت أداة أخرى محل Claude Code؟");
add("Мы строимся вокруг Claude Code как лучшего инструмента на сегодня, но продаём процесс. Смена инструмента меняет материалы одной станции, а не методологию.",
    "We build around Claude Code as the best tool available today, but what we sell is the process. Changing the tool changes the materials of one station, not the methodology.",
    "نبني حول Claude Code بوصفها أفضل أداة متاحة اليوم، لكن ما نقدّمه هو المنهجية. وتغيير الأداة يغيّر مواد محطة واحدة، لا المنهجية نفسها.");

/* ---------- форма записи ---------- */
add("Запись на поток", "Cohort sign-up", "التسجيل في الدفعة");
add("Займите место в потоке.", "Take your place in the cohort.", "احجز مقعدك في الدفعة.");
add("Займите место в потоке", "Take your place in the cohort", "احجز مقعدك في الدفعة");
add("Набор в ближайший поток открыт. Аккаунт создаётся сразу - полный доступ откроем после подтверждения командой.",
    "Enrolment for the next cohort is open. Your account is created immediately - full access opens once the team confirms it.",
    "التسجيل في الدفعة القادمة مفتوح. يُنشأ حسابك فوراً، ويُفتح الوصول الكامل بعد تأكيد الفريق.");
add("Как к вам обращаться?", "What should we call you?", "بماذا نناديك؟");
add("Имя и фамилия", "First and last name", "الاسم واسم العائلة");
add("Почта", "Email", "البريد الإلكتروني");
add("Номер телефона", "Phone number", "رقم الهاتف");
add("Создайте пароль", "Create a password", "أنشئ كلمة مرور");
add("Минимум 6 символов", "At least 6 characters", "٦ أحرف على الأقل");
add("Подтвердите пароль", "Confirm the password", "أكّد كلمة المرور");
add("Ещё раз тот же пароль", "The same password again", "كلمة المرور نفسها مرة أخرى");
add("Тариф:", "Plan:", "الباقة:");
add("изменить", "change", "تغيير");
add("Какой тариф предпочитаете?", "Which plan do you prefer?", "أي باقة تفضّل؟");
add("Выберите тариф", "Choose a plan", "اختر باقة");
add("Solo - 290 000 ₸ / месяц", "Solo - $640 / month", "Solo - ٢٬٤٠٠ ر.س / شهرياً");
add("Pro - 590 000 ₸ / месяц", "Pro - $1,280 / month", "Pro - ٤٬٨٠٠ ر.س / شهرياً");
add("Partner - по договорённости", "Partner - by arrangement", "Partner - حسب الاتفاق");
add("Продолжая, вы соглашаетесь с условиями", "By continuing you agree to the", "بالمتابعة فإنك توافق على");
add("Публичной оферты", "Public Offer", "العرض العام");
add("Политики обработки персональных данных", "Personal Data Policy", "سياسة معالجة البيانات الشخصية");
add("и", "and", "و");
add("Соглашения о конфиденциальности (NDA)", "Confidentiality Agreement (NDA)", "اتفاقية السرية (NDA)");
add("Записаться на поток", "Sign up for the cohort", "سجّل في الدفعة");
add("Права на продукт остаются у вас. Уже регистрировались?", "Rights to the product stay with you. Already registered?", "حقوق المنتج تبقى لك. هل سجّلت من قبل؟");
add("Войти в кабинет", "Log in to the workspace", "ادخل إلى لوحتك");
add("Закрыть", "Close", "إغلاق");

/* ---------- подвал и служебное ---------- */
add("Оферта", "Offer", "العرض");
add("Персональные данные", "Personal data", "البيانات الشخصية");
add("Claude Code - товарный знак Anthropic; используется как инструмент реализации в программе.",
    "Claude Code is a trademark of Anthropic, used in the programme as an implementation tool.",
    "Claude Code علامة تجارية لشركة Anthropic، تُستخدم في البرنامج بوصفها أداة تنفيذ.");
add("Taulau - от идеи до продукта, который работает у клиента",
    "Taulau - from an idea to a product that works for your customers",
    "تاولاو - من الفكرة إلى منتج يعمل لدى عملائك");
add("Программа для отраслевых экспертов: вы собираете продукт сами - с Claude Code, производственным пайплайном и экспертами отрасли рядом. Контрольные точки, безопасность, вывод в рабочую среду.",
    "A programme for industry experts: you build the product yourself, with Claude Code, a production pipeline and industry experts alongside. Checkpoints, security, and a move into real-world use.",
    "برنامج لخبراء القطاعات: تبني المنتج بنفسك، مع Claude Code ومسار إنتاج متكامل وخبراء الصناعة إلى جانبك. نقاط تحقق، وأمن، وانتقال إلى الاستخدام الفعلي.");


/* ============================================================
   Кабинет: интерфейс основных экранов (этап 2 перевода)
   ============================================================ */
add("Карта пути", "Route map", "خريطة المسار");
add("Календарь", "Calendar", "التقويم");
add("Юридический трек", "Legal track", "المسار القانوني");
add("Сертификат", "Certificate", "الشهادة");
add("База знаний", "Knowledge base", "قاعدة المعرفة");
add("Сервисный пул", "Expert pool", "فريق الخبراء");
add("Профиль", "Profile", "الملف الشخصي");
add("МОЙ ПУТЬ", "MY ROUTE", "مساري");
add("ФИНАЛ", "FINALE", "الختام");
add("РЕСУРСЫ", "RESOURCES", "الموارد");
add("Мой продукт", "My product", "منتجي");
add("в рюкзаке", "in the pack", "في الحقيبة");
add("Демо", "Demos", "العروض");
add("Гость", "Guest", "زائر");
add("Не в системе", "Not signed in", "غير مسجّل الدخول");
add("Тариф Solo", "Solo plan", "باقة Solo");
add("Тариф Pro", "Pro plan", "باقة Pro");

/* снаряжение и уровни - ядро геймификации */
add("Рюкзак восхождения", "Climbing pack", "حقيبة التسلق");
add("Навыки персонажа", "Character skills", "مهارات الشخصية");
add("Артефакт недели:", "Deliverable of the station:", "مُخرَج المحطة:");
add("Разведка", "Recon", "الاستطلاع");
add("Маршрут", "Route", "المسار");
add("Базовый лагерь", "Base camp", "المخيّم الأساسي");
add("Восхождение", "Ascent", "التسلق");
add("Страховка", "Belay", "التأمين");
add("Вершина", "Summit", "القمة");
add("Флаг", "Flag", "الراية");
add("Новая высота", "New altitude", "ارتفاع جديد");
add("Рюкзак и компас", "Pack and compass", "الحقيبة والبوصلة");
add("Горн проводника", "Guide's horn", "بوق الدليل");
add("Маршрутный лист", "Route card", "بطاقة المسار");
add("Ледоруб", "Ice axe", "فأس الجليد");
add("Страховочная обвязка", "Climbing harness", "حزام التأمين");
add("Каска", "Helmet", "الخوذة");
add("Сигнальная ракета", "Signal flare", "الشعلة الضوئية");
add("Вымпел вершины", "Summit pennant", "راية القمة");
add("Рупор", "Megaphone", "مكبّر الصوت");
add("Дверь MVP", "MVP door", "باب النسخة الأولية");
add("Питч и контекст", "Pitch and context", "العرض والسياق");
add("Вайб-кодинг", "AI coding", "البرمجة بالذكاء الاصطناعي");
add("Архитектура", "Architecture", "البنية");
add("Сборка", "Build", "التنفيذ");
add("DevOps", "DevOps", "عمليات التطوير");
add("Запуск", "Launch", "الإطلاق");

/* календарь и часы */
add("Часы этой недели", "Hours this week", "ساعات هذا الأسبوع");
add("Групповые", "Group", "جماعية");
add("Один на один", "One to one", "فردية");
add("Расписание", "Schedule", "الجدول");
add("Мои записи", "My bookings", "حجوزاتي");
add("Эта неделя", "This week", "هذا الأسبوع");
add("Записаться", "Book", "احجز");
add("Отписаться", "Cancel", "إلغاء");
add("вы записаны", "booked", "محجوز");
add("Недоступно", "Unavailable", "غير متاح");
add("Мест нет", "Full", "مكتمل");
add("Часы кончились", "Hours used up", "نفدت الساعات");
add("отменена", "cancelled", "أُلغيت");
add("созвоны с экспертами в группе", "group calls with experts", "جلسات جماعية مع الخبراء");
add("личный слот с экспертом", "a private slot with an expert", "جلسة فردية مع خبير");
add("Подписаться в Google Календаре", "Subscribe in Google Calendar", "اشترك في تقويم غوغل");
add("Добавить в Google Календарь →", "Add to Google Calendar →", "أضف إلى تقويم غوغل ←");
add("Ссылка на Google Meet →", "Google Meet link →", "رابط Google Meet ←");


/* фазы станций и подписи карты */
add("Старт", "Start", "البداية");
add("Контекст", "Context", "السياق");
add("Проектирование", "Design", "التصميم");
add("Проверка", "Verification", "التحقق");
add("Защита", "Review", "المراجعة");
add("Рабочая среда", "Real-world use", "الاستخدام الفعلي");
add("Рюкзак восхождения", "Climbing pack", "حقيبة التسلق");
add("- снаряжение, собранное на станциях. Наведите на предмет, чтобы узнать, за что он получен.",
    "- gear collected station by station. Hover an item to see what earned it.",
    "- عتاد جُمع محطةً بمحطة. مرّر المؤشر على أي عنصر لتعرف كيف حصلت عليه.");
add("Растут от задач станций, чек-листов и баттлов. Пять уровней в каждом.",
    "They grow from station tasks and checklists. Five levels each.",
    "تنمو من مهام المحطات وقوائم التدقيق. خمسة مستويات لكل مهارة.");
add("Глава 1 дневника восхождения откроется, когда станция будет закрыта",
    "Chapter 1 of the climbing journal unlocks once the station is closed",
    "يُفتح الفصل الأول من يوميات التسلق بعد إغلاق المحطة");
add("Право", "Legal", "القانون");
add("Ключевые события", "Key events", "الأحداث الرئيسية");


/* карта: боковое меню и шкала времени */
add("Мой путь", "My route", "مساري");
add("Финал", "Finale", "الختام");
add("Ресурсы", "Resources", "الموارد");
add("Осталось", "Left", "متبقٍ");
add("времени потока", "of the cohort time", "من مدة الدفعة");

/* карточка станции */
add("Сборка · награда: Ледоруб", "Build · reward: Ice axe", "التنفيذ · المكافأة: فأس الجليد");
add("Первый настоящий подъём. Никто не несёт вас - вы сами, шаг за шагом, вырубаете ступени в склоне: сначала опору, потом сам путь наверх. Тяжело и медленно, но именно здесь рюкзак перестаёт быть пустым обещанием и получает вес. За вырубленные ступени вам вручают ледоруб - инструмент, который останется с вами до самой вершины.",
    "The first real climb. Nobody carries you - step by step you cut footholds into the slope yourself: first the anchor, then the way up. It is slow and heavy work, but this is where the pack stops being an empty promise and starts to have weight. For the steps you cut, you are handed the ice axe - a tool that stays with you all the way to the summit.",
    "أول تسلّق حقيقي. لا أحد يحملك: خطوةً بخطوة تنحت المواطئ في المنحدر بنفسك، المرساة أولاً ثم الطريق صعوداً. عمل بطيء وشاق، لكن هنا تكفّ الحقيبة عن كونها وعداً فارغاً ويصبح لها وزن. ومقابل الدرجات التي نحتّها، تُمنح فأس الجليد - أداة ترافقك حتى القمة.");
add("Эта станция не поднимает уровень персонажа - он вырастет на следующей. Так задумано: уровни привязаны к контрольным точкам.",
    "This station does not raise your level - the next one will. That is deliberate: levels are tied to checkpoints.",
    "هذه المحطة لا ترفع مستواك - المحطة التالية ستفعل. وهذا مقصود: المستويات مرتبطة بنقاط التحقق.");
add("Спринт 1: каркас проекта и модель данных через Claude Code",
    "Sprint 1: project skeleton and data model with Claude Code",
    "الدورة ١: هيكل المشروع ونموذج البيانات عبر Claude Code");
add("Спринт 2: ключевой сценарий от входа до результата",
    "Sprint 2: the core journey from sign-in to result",
    "الدورة ٢: المسار الأساسي من الدخول إلى النتيجة");
add("Ревью сгенерированного кода вместе с экспертом",
    "Review the generated code with an expert",
    "مراجعة الشيفرة المولّدة مع خبير");
add("Работающий ключевой сценарий", "A working core journey", "مسار أساسي يعمل");
add("Сдайте её кнопкой «Готов» - ментор проверит и откроет путь дальше.",
    "Submit it with the “Ready” button - the mentor reviews and opens the way on.",
    "أرسلها بزر «جاهز» - يراجعها المرشد ويفتح الطريق التالي.");

/* станция 1: видна гостю целиком */
add("Старт · награда: Рюкзак и компас", "Start · reward: Pack and compass", "البداية · المكافأة: الحقيبة والبوصلة");
add("Вы стоите у подножия горы Taulau с пустыми руками - ни карты, ни повода идти именно сюда. Прежде чем сделать первый шаг, мастер лагеря проверяет вашу идею: та ли это гора и стоит ли вообще подниматься. Вы подписываете разрешение на восхождение и получаете первое снаряжение - рюкзак и компас. Теперь у вас есть с чем идти и куда идти.",
    "You stand at the foot of Mount Taulau empty-handed - no map, no particular reason this should be your mountain. Before the first step, the camp master checks your idea: is this the right mountain, and is it worth climbing at all. You sign the climbing permit and receive your first gear - a pack and a compass. Now you have something to carry and somewhere to go.",
    "تقف عند سفح جبل تاولاو خالي الوفاض - لا خريطة ولا سبباً يجعل هذا الجبل جبلك. قبل الخطوة الأولى يفحص مسؤول المخيّم فكرتك: هل هذا هو الجبل الصحيح، وهل يستحق الصعود أصلاً. توقّع تصريح التسلق وتتسلم أول عتادك - حقيبة وبوصلة. الآن لديك ما تحمله ووجهة تقصدها.");
add("Пройти диагностику идеи и получить заключение", "Go through the idea diagnosis and get the verdict", "اخضع لتشخيص الفكرة واحصل على التقييم");
add("Подписать договор с программой (права на продукт - у вас)", "Sign the programme agreement (the product rights are yours)", "وقّع عقد البرنامج (حقوق المنتج لك)");
add("Нажмите, чтобы прочитать и принять", "Tap to read and accept", "اضغط للقراءة والموافقة");
add("Принято - нажмите, чтобы перечитать", "Accepted - tap to reread", "تمت الموافقة - اضغط لإعادة القراءة");
add("Установить Claude Code и настроить рабочее окружение - live-сессия", "Install Claude Code and set up the working environment - live session", "ثبّت Claude Code وجهّز بيئة العمل - جلسة مباشرة");
add("Изучить базовые принципы вайб-кодинга: контекст и планирование", "Learn the basics of AI coding: context and planning", "تعلّم أساسيات البرمجة بالذكاء الاصطناعي: السياق والتخطيط");
add("Вступить в закрытый Telegram-канал потока", "Join the cohort's private Telegram channel", "انضم إلى قناة تيليغرام الخاصة بالدفعة");

/* гостевой режим и ожидание подтверждения */
add("Вы смотрите платформу как гость.", "You are viewing the platform as a guest.", "أنت تتصفح المنصة كزائر.");
add("Открыты карта пути и станция 1 - так выглядит работа внутри потока. Полный доступ откроется после записи и одобрения командой.",
    "The route map and station 1 are open - this is what working inside a cohort looks like. Full access opens after you sign up and the team approves it.",
    "خريطة المسار والمحطة الأولى مفتوحتان - هكذا يبدو العمل داخل الدفعة. ويُفتح الوصول الكامل بعد التسجيل وموافقة الفريق.");
add("Раздел под замком", "This section is locked", "هذا القسم مقفل");
add("Полный доступ открывается после записи на поток и оплаты: зарегистрируйтесь - и когда команда одобрит вашу заявку, все разделы откроются.",
    "Full access opens after you sign up for the cohort and pay: register, and once the team approves your application every section unlocks.",
    "يُفتح الوصول الكامل بعد التسجيل في الدفعة والدفع: سجّل، وحين يوافق الفريق على طلبك تُفتح جميع الأقسام.");
add("Ваш аккаунт создан и ждёт подтверждения командой - обычно это происходит сразу после оплаты. Мы напишем вам, и все разделы откроются.",
    "Your account is created and awaiting the team's confirmation - usually right after payment. We will message you, and every section will open.",
    "حسابك مُنشأ وينتظر تأكيد الفريق - وعادةً يتم ذلك فور الدفع. سنراسلك، وستُفتح جميع الأقسام.");
add("Аккаунт создан и ждёт подтверждения.", "Your account is created and awaiting confirmation.", "حسابك مُنشأ وينتظر التأكيد.");
add("Команда откроет полный доступ после оплаты - мы напишем вам. Пока открыты карта пути и станция 1.",
    "The team opens full access after payment - we will message you. For now the route map and station 1 are open.",
    "يفتح الفريق الوصول الكامل بعد الدفع - وسنراسلك. حالياً خريطة المسار والمحطة الأولى مفتوحتان.");
add("Понятно", "Got it", "حسناً");
add("Продолжить просмотр", "Keep browsing", "متابعة التصفح");
add("← Посмотреть платформу гостем", "← Browse the platform as a guest", "→ تصفّح المنصة كزائر");

/* ============================================================
   Движок
   ============================================================ */

function add(ru, en, ar) {
  const k = norm(ru);
  DICT.en[k] = en;
  DICT.ar[k] = ar;
}

function currentLang() {
  const q = new URLSearchParams(location.search).get("lang");
  if (q && LANGS[q]) { try { localStorage.setItem(STORE, q); } catch {} return q; }
  try { return LANGS[localStorage.getItem(STORE)] ? localStorage.getItem(STORE) : "ru"; } catch { return "ru"; }
}

let LANG = currentLang();

/* Шаблонные строки: перевести целиком нельзя - в них подставляются числа.
   Держим их отдельным списком правил с подстановкой групп. */
const PATTERNS = [
  [/^Станция (\d+) из 9 · (.+)$/, { en: m => `Station ${m[1]} of 9 · ${tr(m[2]) ?? m[2]}`, ar: m => `المحطة ${m[1]} من ٩ · ${tr(m[2]) ?? m[2]}` }],
  [/^уровень (\d+) из 8$/, { en: m => `level ${m[1]} of 8`, ar: m => `المستوى ${m[1]} من ٨` }],
  [/^Осталось (\d+)% времени потока$/, { en: m => `${m[1]}% of the cohort left`, ar: m => `تبقّى ${m[1]}% من مدة الدفعة` }],
  [/^станция (\d+) из 9$/, { en: m => `station ${m[1]} of 9`, ar: m => `المحطة ${m[1]} من ٩` }],
  [/^ст\. (\d+)$/, { en: m => `st. ${m[1]}`, ar: m => `م. ${m[1]}` }],
  [/^ур\. (\d+)$/, { en: m => `lvl ${m[1]}`, ar: m => `مستوى ${m[1]}` }],
  [/^Станция откроется после проверки станции (\d+)\.$/, { en: m => `This station opens once station ${m[1]} is approved.`, ar: m => `تُفتح هذه المحطة بعد اعتماد المحطة ${m[1]}.` }],
  [/^Глава (\d+) дневника восхождения откроется, когда станция будет закрыта$/, { en: m => `Chapter ${m[1]} of the climbing journal unlocks once the station is closed`, ar: m => `يُفتح الفصل ${m[1]} من يوميات التسلق بعد إغلاق المحطة` }],
  [/^(\d+) мин · (.+)$/, { en: m => `${m[1]} min · ${tr(m[2]) ?? m[2]}`, ar: m => `${m[1]} د · ${tr(m[2]) ?? m[2]}` }],
];

const tr = s => {
  if (LANG === "ru") return null;
  const k = norm(s);
  const v = DICT[LANG][k];
  if (v !== undefined) return v;
  /* строка часто начинается с эмодзи или значка: переводим остаток, значок оставляем */
  const byPattern = str => {
    for (const [re, fns] of PATTERNS) {
      const g = str.match(re);
      if (g && fns[LANG]) return fns[LANG](g);
    }
    return null;
  };
  const m = k.match(/^([^\p{L}\p{N}]+)\s*(.+)$/u);
  if (m) {
    const rest = norm(m[2]);
    // остаток ищем и в словаре, и в шаблонах: «🔒 Станция откроется после проверки станции 1.»
    const inner = DICT[LANG][rest] ?? byPattern(rest);
    if (inner != null) return m[1] + " " + inner;
  }
  return byPattern(k);
};

/* Обходим текстовые узлы: так перевод ложится и на статичную разметку,
   и на то, что кабинет дорисовал после перерендера. Скрипты и стили
   пропускаем, иначе можно испортить код. */
const SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "TEXTAREA"]);

function walk(root) {
  if (LANG === "ru") return;
  const it = document.createNodeIterator(root, NodeFilter.SHOW_TEXT, {
    acceptNode: n => (n.parentElement && !SKIP.has(n.parentElement.tagName) && n.nodeValue.trim())
      ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
  });
  let n;
  while ((n = it.nextNode())) {
    const v = tr(n.nodeValue);
    if (v === null) continue;
    // сохраняем ведущие и хвостовые пробелы: они держат вёрстку строки
    const lead = n.nodeValue.match(/^\s*/)[0];
    const tail = n.nodeValue.match(/\s*$/)[0];
    n.nodeValue = lead + v + tail;
  }
  // подписи, подсказки и заголовок вкладки
  for (const el of root.querySelectorAll("[placeholder],[title],[aria-label],[alt]")) {
    for (const a of ["placeholder", "title", "aria-label", "alt"]) {
      const cur = el.getAttribute(a);
      if (!cur) continue;
      const v = tr(cur);
      if (v !== null) el.setAttribute(a, v);
    }
  }
  for (const el of root.querySelectorAll("option")) {
    const v = tr(el.textContent);
    if (v !== null) el.textContent = v;
  }
}

function applyDocumentLang() {
  const html = document.documentElement;
  html.setAttribute("lang", LANG);
  html.setAttribute("dir", LANG === "ar" ? "rtl" : "ltr");
  const t = tr(document.title);
  if (t !== null) document.title = t;
  const d = document.querySelector('meta[name="description"]');
  if (d) { const v = tr(d.content); if (v !== null) d.content = v; }
}

/* Переключатель: три короткие кнопки, текущая подсвечена. */
function mountSwitcher() {
  const host = document.querySelector(".nav-links") || document.querySelector(".side-foot") || document.body;
  if (!host || document.getElementById("langSwitch")) return;
  const box = document.createElement("div");
  box.id = "langSwitch";
  box.className = "lang-switch";
  box.innerHTML = Object.entries(LANGS).map(([code, label]) =>
    `<button type="button" data-lang="${code}"${code === LANG ? ' class="on" aria-current="true"' : ""}>${label}</button>`).join("");
  host.appendChild(box);
  box.addEventListener("click", e => {
    const b = e.target.closest("[data-lang]");
    if (!b || b.dataset.lang === LANG) return;
    try { localStorage.setItem(STORE, b.dataset.lang); } catch {}
    location.reload();   // перерисовываем всё разом - надёжнее точечной подмены
  });
}

/* Игра рисует подписи на канвасе внутри iframe - туда обход текстовых
   узлов не достаёт. Передаём язык параметром, игра переводит себя сама. */
function syncGameFrames() {
  for (const f of document.querySelectorAll('iframe[src*="index-game.html"]')) {
    const u = new URL(f.getAttribute('src'), location.href);
    if (u.searchParams.get('lang') === LANG) continue;
    u.searchParams.set('lang', LANG);
    f.setAttribute('src', u.pathname + u.search);
  }
}

function run() {
  applyDocumentLang();
  walk(document.body);
  syncGameFrames();
  mountSwitcher();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
else run();

/* Кабинет перерисовывает разделы на лету - даём ему способ перевести
   свежую разметку: window.TaulauI18n.apply(корневой_элемент) */
window.TaulauI18n = {
  lang: () => LANG,
  apply: root => walk(root || document.body),
  t: s => tr(s) ?? s,
};
})();
