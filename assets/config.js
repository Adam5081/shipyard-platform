/* Настройки, которые меняются при деплое. Подключается и лендингом, и кабинетом.

   SHIPYARD_REMOTE_API — адрес размещённого бэкенда, например
   "https://shipyard-platform.onrender.com". Пусто — бэкенда нет:
   кабинет работает на localStorage, а форма заявки предлагает
   отправить заявку письмом.

   SHIPYARD_CONTACT — почта для заявок, пока бэкенд не поднят.
   Пусто — форма просто даст скопировать текст заявки.

   SHIPYARD_FLOW_UI — социальные разделы потока в кабинете («Кто где
   идёт», «Стена демо», «Лига дока», «Баттлы»). false — скрыты от
   клиентов до готовности; поставить true, когда откроем. */

window.SHIPYARD_REMOTE_API = "https://api.taulau.com";
window.SHIPYARD_CONTACT = "";

/* Google Analytics 4: Measurement ID вида "G-XXXXXXXXXX".
   Пусто — GA не подключается. Лендинг грузит gtag.js и шлёт туда
   те же события, что и своя аналитика (просмотры блоков, клики);
   админка шлёт page_view при переключении вкладок.
   Ресурс «Taulau» (аккаунт Aluneva), поток «Taulau - сайт и кабинет». */
window.SHIPYARD_GA_ID = "G-NFRE9PMWLE";
window.SHIPYARD_FLOW_UI = false;
window.SHIPYARD_LOTTERY_UI = false;  // лотерея — этап 2 геймификации
window.SHIPYARD_POINTS_UI = false;   // баллы на станциях — пока не считаем
