// Демо-сценарий для защиты: при запущенном сервере (npm start) отправляет запросы всех видов,
// чтобы наполнить массив диаграмм и таблицу журнала /logs (успех, редирект, 4xx, 5xx).
// Запуск: npm run demo   (или: node scripts/demo.js http://localhost:5000)
const seeds = require('../seeds/diagrams');

const BASE = process.argv[2] || process.env.BASE_URL || 'http://localhost:5000';

const call = async (label, method, url, { json, form } = {}) => {
  const init = { method, redirect: 'manual', headers: {} };
  if (json) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(json);
  }
  if (form) {
    init.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    init.body = new URLSearchParams(form).toString();
  }
  const res = await fetch(BASE + url, init);
  console.log(`${String(res.status).padEnd(4)} ${method.padEnd(6)} ${url.padEnd(28)} ${label}`);
};

(async () => {
  console.log('Демо-запросы к', BASE);
  for (const d of seeds.demo) await call('создание диаграммы через API', 'POST', '/api/diagrams', { json: d });

  await call('главная (гость)', 'GET', '/');
  await call('главная (auth=1)', 'GET', '/?auth=1');
  await call('детальная страница', 'GET', '/item/1?auth=1');
  await call('форма без авторизации -> /login', 'GET', '/add');
  await call('форма с авторизацией', 'GET', '/add?auth=1');
  await call('добавление через форму', 'POST', '/add?auth=1', {
    form: { title: 'Диаграмма из демо-сценария', type: 'flowchart', dsl: 'graph LR; A-->B;' }
  });
  await call('пустая форма -> 400', 'POST', '/add?auth=1', { form: { title: '', dsl: '' } });
  await call('поиск в API', 'GET', '/api/diagrams?search=jwt');
  await call('обновление через API', 'PUT', '/api/diagrams/1', { json: { title: 'Архитектура v2', dsl: 'graph TD; A-->B;' } });
  await call('удаление через API', 'DELETE', '/api/diagrams/3');
  await call('несуществующий id в API -> 404', 'GET', '/api/diagrams/999');
  await call('несуществующая страница -> 404', 'GET', '/no-such-page');
  await call('исключение -> 500', 'GET', '/debug/error');
  console.log(`Готово. Откройте ${BASE}/logs?auth=1`);
})().catch((e) => {
  console.error('Сервер не отвечает. Сначала выполните npm start.', e.message);
  process.exit(1);
});
