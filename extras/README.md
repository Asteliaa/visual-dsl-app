# extras: заготовки на случай изменений на защите

Все файлы здесь **не подключены** к приложению, а значит основной проект остается чистым. Каждый файл самодостаточен, начинается с комментария «Подключение» и покрыт тестами (`extras/__tests__/extras.test.js`, запуск: `npm test`).

## Что просят - что добавить

| Если попросят | Файл | Что сделать в `app.js` / проекте |
|---------------|------|----------------------------------|
| Заблокировать IP (вопрос 28) | `middleware/blockIp.js` | `app.use(require('./extras/middleware/blockIp')(['1.2.3.4']))` до маршрутов + скопировать `extras/views/403.ejs` в `views/` |
| Добавить заголовок `X-Powered-By` (20) / время выполнения (24) | `middleware/headers.js` | `app.use(poweredBy('VisualDSL')); app.use(responseTime());` |
| Изменить `req.body` (17), обрезать пробелы | `middleware/trimBody.js` | `app.use(require('./extras/middleware/trimBody'))` после `express.urlencoded()` |
| Ошибки в async-обработчике без try/catch (14) | `middleware/asyncHandler.js` | обернуть обработчик: `router.get('/x', asyncHandler(async (req, res) => {...}))` |
| Логи в файл | `middleware/fileLogger.js` | `app.use(require('./extras/middleware/fileLogger')('logs/requests.log'))` |
| Защита от CSRF (25) | `middleware/csrf.js` | `app.use(require('./extras/middleware/csrf'))` + скрытое поле `_csrf` в форме `add.ejs` |
| Ограничить частоту запросов | `middleware/rateLimit.js` | `app.use(rateLimit({ max: 100, windowMs: 60000 }))` или на один маршрут |
| Роли (admin / editor) | `middleware/requireRole.js` | `router.get('/admin', requireRole('admin'), handler)` + `403.ejs` |
| Редактирование / удаление элемента | `routes/extraRoutes.js` + `views/edit.ejs` | `app.use('/', require('./extras/routes/extraRoutes'))` после `pageRoutes`, до 404; скопировать `edit.ejs` в `views/` |
| Поиск, фильтр, сортировка, пагинация | `routes/extraRoutes.js` + `views/search.ejs`, `partials/card.ejs` | то же; скопировать `search.ejs`, `partials/card.ejs` |
| Страница «О проекте» | `routes/extraRoutes.js` + `views/about.ejs` | то же |
| JSON-статистика | `routes/extraRoutes.js` (`GET /stats`) | то же |

## Как подключать шаблоны

Вариант 1: скопируйте нужные `.ejs` из `extras/views/` в `views/` (partials - в `views/partials/`).
Вариант 2: в `app.js` замените строку views на массив:

```js
app.set('views', [path.join(__dirname, 'views'), path.join(__dirname, 'extras', 'views')]);
```

## Быстрые правки без файлов

| Просьба | Где менять |
|---------|-----------|
| Другой порт | `PORT=3000 npm start` или `server.js` |
| Поменять префикс/путь страницы | `routes/pageRoutes.js` |
| Добавить поле (например, `author`) | `models/diagramStore.js` (create/update), `controllers/pageController.js` (`addSubmit`), `views/add.ejs`, `views/item.ejs`, `views/index.ejs` |
| Другой параметр авторизации (`?token=1`) | `middlewares/auth.js` (`attachUser`) |
| Редирект вместо Гостя на всех страницах | `middlewares/auth.js`: использовать `requireAuth` в `app.use(requireAuth)` после `/login` |
| Изменить формат лога | `middlewares/logger.js` (строка `console.log`) |
| Добавить колонку в таблицу журнала | `models/logStore.js` (`add`), `views/logs.ejs` |
| Новый тип диаграммы | `DIAGRAM_TYPES` в `models/diagramStore.js` |
| Цвет/стили | `public/css/style.css` |
| Отключить страницу `/debug/error` | `NODE_ENV=production` |

После любой правки: `npm test` (должно быть зеленым) и `npm start`.
