// ДОП-маршруты: редактирование, удаление, поиск/сортировка/фильтр, пагинация, страница "О проекте", JSON-статистика.
// Подключение (app.js, ПОСЛЕ pageRoutes и ДО обработчика 404):
//   app.use('/', require('./extras/routes/extraRoutes'));
// Шаблоны из extras/views/ скопируйте в views/ (или добавьте папку в app.set('views', [...])).
const express = require('express');
const store = require('../../models/diagramStore');
const { requireAuth } = require('../../middlewares/auth');

const router = express.Router();
const parseId = (v) => (/^\d+$/.test(v) ? parseInt(v, 10) : NaN);

// Поиск, фильтр по типу, сортировка и пагинация: /search?q=jwt&type=sequence&sort=title&dir=desc&page=1&limit=5
router.get('/search', (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  const type = String(req.query.type || '');
  const sort = ['id', 'title', 'type', 'createdAt'].includes(req.query.sort) ? req.query.sort : 'id';
  const dir = req.query.dir === 'desc' ? -1 : 1;
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 5, 1), 50);

  let list = store.getAll().filter(
    (d) => (!q || d.title.toLowerCase().includes(q) || d.dsl.toLowerCase().includes(q)) && (!type || d.type === type)
  );
  list = [...list].sort((a, b) => (a[sort] > b[sort] ? 1 : a[sort] < b[sort] ? -1 : 0) * dir);

  const pages = Math.max(1, Math.ceil(list.length / limit));
  const page = Math.min(Math.max(parseInt(req.query.page, 10) || 1, 1), pages);
  res.render('search', {
    title: 'Поиск',
    items: list.slice((page - 1) * limit, page * limit),
    total: list.length,
    page,
    pages,
    q: req.query.q || '',
    type,
    types: store.DIAGRAM_TYPES
  });
});

router.get('/about', (req, res) => res.render('about', { title: 'О проекте' }));

// JSON со статистикой: количество диаграмм по типам.
router.get('/stats', (req, res) => {
  const byType = {};
  store.getAll().forEach((d) => (byType[d.type] = (byType[d.type] || 0) + 1));
  res.json({ total: store.getAll().length, byType });
});

// Редактирование (только для авторизованных).
router.get('/item/:id/edit', requireAuth, (req, res) => {
  const item = store.getById(parseId(req.params.id));
  if (!item) return res.status(404).render('404', { title: 'Ошибка 404' });
  res.render('edit', { title: 'Редактирование', item, errors: [], types: store.DIAGRAM_TYPES });
});

router.post('/item/:id/edit', requireAuth, (req, res) => {
  const id = parseId(req.params.id);
  const item = store.getById(id);
  if (!item) return res.status(404).render('404', { title: 'Ошибка 404' });

  const { title = '', type = item.type, dsl = '' } = req.body || {};
  const errors = [];
  if (!title.trim()) errors.push('Введите название диаграммы');
  if (!dsl.trim()) errors.push('Введите DSL-код диаграммы');
  if (!store.DIAGRAM_TYPES.includes(type)) errors.push('Выбран неизвестный тип диаграммы');
  if (errors.length) {
    return res.status(400).render('edit', {
      title: 'Редактирование', item: { id, title, type, dsl }, errors, types: store.DIAGRAM_TYPES
    });
  }
  store.update(id, { title, type, dsl });
  res.redirect(`/item/${id}${res.locals.authQuery}`);
});

// Удаление (POST, а не GET: опасные действия не выполняются по ссылке).
router.post('/item/:id/delete', requireAuth, (req, res) => {
  if (!store.remove(parseId(req.params.id))) return res.status(404).render('404', { title: 'Ошибка 404' });
  res.redirect('/' + res.locals.authQuery);
});

module.exports = router;
