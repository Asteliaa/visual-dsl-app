// Seed журнала запросов: по одной записи каждого типа события и метода.
// Нужен тестам (детерминированные данные для фильтров) и для проверки таблицы /logs.
const entries = [
  { method: 'GET', url: '/', status: 200, durationMs: 1.5, user: 'Гость', ip: '::1' },
  { method: 'GET', url: '/item/1?auth=1', status: 200, durationMs: 2.1, user: 'Администратор', ip: '::1' },
  { method: 'GET', url: '/add', status: 302, durationMs: 0.6, user: 'Гость', ip: '::1' },
  { method: 'POST', url: '/add?auth=1', status: 302, durationMs: 3.2, user: 'Администратор', ip: '::1' },
  { method: 'POST', url: '/add?auth=1', status: 400, durationMs: 1.8, user: 'Администратор', ip: '::1' },
  { method: 'GET', url: '/no-such-page', status: 404, durationMs: 1.9, user: 'Гость', ip: '::1' },
  { method: 'PUT', url: '/api/diagrams/1', status: 200, durationMs: 1.1, user: 'Гость', ip: '::1' },
  { method: 'DELETE', url: '/api/diagrams/999', status: 404, durationMs: 0.9, user: 'Гость', ip: '::1' },
  { method: 'GET', url: '/debug/error', status: 500, durationMs: 2.4, user: 'Гость', ip: '::1' }
];

// Загружает seed в хранилище журнала.
const load = (logStore) => entries.forEach((e) => logStore.add(e));

module.exports = { entries, load };
