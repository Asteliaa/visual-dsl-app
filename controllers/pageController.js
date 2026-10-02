// Контроллеры HTML-страниц: данные из хранилища передаются в EJS-шаблоны.
const store = require('../models/diagramStore');
const logStore = require('../models/logStore');

const emptyForm = { title: '', type: 'flowchart', dsl: '' };

exports.index = (req, res) => {
  res.render('index', { title: 'Список диаграмм', items: store.getAll() });
};

exports.item = (req, res) => {
  const item = /^\d+$/.test(req.params.id) ? store.getById(parseInt(req.params.id, 10)) : null;
  if (!item) return res.status(404).render('404', { title: 'Ошибка 404' });
  res.render('item', { title: item.title, item });
};

exports.addForm = (req, res) => {
  res.render('add', { title: 'Новая диаграмма', form: emptyForm, errors: [], types: store.DIAGRAM_TYPES });
};

exports.addSubmit = (req, res) => {
  const { title = '', type = 'flowchart', dsl = '' } = req.body || {};
  const errors = [];

  if (!title.trim()) errors.push('Введите название диаграммы');
  if (!dsl.trim()) errors.push('Введите DSL-код диаграммы');
  if (!store.DIAGRAM_TYPES.includes(type)) errors.push('Выбран неизвестный тип диаграммы');

  if (errors.length) {
    return res.status(400).render('add', {
      title: 'Новая диаграмма',
      form: { title, type, dsl },
      errors,
      types: store.DIAGRAM_TYPES
    });
  }

  store.create({ title, type, dsl });
  res.redirect('/' + res.locals.authQuery);
};

const METHODS = ['GET', 'POST', 'PUT', 'DELETE'];
const EVENTS = ['Успешный запрос', 'Перенаправление', 'Ошибка клиента', 'Ошибка сервера'];

// Страница-таблица журнала запросов (время, событие, метод, URL, статус и др.).
exports.logs = (req, res) => {
  const method = METHODS.includes(req.query.method) ? req.query.method : '';
  const event = EVENTS.includes(req.query.event) ? req.query.event : '';
  res.render('logs', {
    title: 'Журнал запросов',
    entries: logStore.getAll({ method, event }),
    filter: { method, event },
    methods: METHODS,
    events: EVENTS
  });
};

exports.login =(req, res) => {
  res.render('login', { title: 'Авторизация' });
};

// Маршрут для демонстрации страницы 500 (только вне production).
exports.crash = () => {
  throw new Error('Тестовая ошибка для демонстрации страницы 500');
};
