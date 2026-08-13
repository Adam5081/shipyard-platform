/* Настройки, которые меняются при деплое. Подключается и лендингом, и кабинетом.

   SHIPYARD_REMOTE_API — адрес размещённого бэкенда, например
   "https://shipyard-platform.onrender.com". Пусто — бэкенда нет:
   кабинет работает на localStorage, а форма заявки предлагает
   отправить заявку письмом.

   SHIPYARD_CONTACT — почта для заявок, пока бэкенд не поднят.
   Пусто — форма просто даст скопировать текст заявки. */

window.SHIPYARD_REMOTE_API = "https://shipyard-platform.onrender.com";
window.SHIPYARD_CONTACT = "";
