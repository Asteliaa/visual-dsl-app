process.env.NODE_ENV = 'test';

// Тесты доп-материалов для защиты. Мини-приложение подключает extras к основным шаблонам.
const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');
const request = require('supertest');

const store = require('../../models/diagramStore');
const { attachUser } = require('../../middlewares/auth');
const { notFoundHandler, serverErrorHandler } = require('../../middlewares/errorHandlers');
const blockIp = require('../middleware/blockIp');
const { poweredBy, responseTime } = require('../middleware/headers');
const trimBody = require('../middleware/trimBody');
const asyncHandler = require('../middleware/asyncHandler');
const fileLogger = require('../middleware/fileLogger');
const csrf = require('../middleware/csrf');
const rateLimit = require('../middleware/rateLimit');
const requireRole = require('../middleware/requireRole');
const extraRoutes = require('../routes/extraRoutes');

const ROOT = path.join(__dirname, '..', '..');

const makeApp = (setup = () => {}) => {
  const app = express();
  app.set('view engine', 'ejs');
  app.set('views', [path.join(ROOT, 'views'), path.join(ROOT, 'extras', 'views')]);
  app.locals.formatDate = (iso) => new Date(iso).toLocaleString('ru-RU');
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(attachUser);
  setup(app);
  app.use(notFoundHandler);
  app.use(serverErrorHandler);
  return app;
};

beforeEach(() => store.reset());

describe('extras: middleware', () => {
  test('blockIp блокирует адрес из списка (HTML 403) и пропускает остальных', async () => {
    const blocked = makeApp((a) => {
      a.use(blockIp(['::ffff:127.0.0.1', '::1', '127.0.0.1']));
      a.get('/', (req, res) => res.send('ok'));
    });
    const res = await request(blocked).get('/');
    expect(res.statusCode).toBe(403);
    expect(res.text).toContain('403 - Доступ запрещен');

    const api = await request(blocked).get('/api/x');
    expect(api.statusCode).toBe(403);
    expect(api.body.error).toBeDefined();

    const open = makeApp((a) => {
      a.use(blockIp(['10.0.0.1']));
      a.get('/', (req, res) => res.send('ok'));
    });
    expect((await request(open).get('/')).text).toBe('ok');
    const empty = makeApp((a) => {
      a.use(blockIp());
      a.get('/', (req, res) => res.send('ok'));
    });
    expect((await request(empty).get('/')).statusCode).toBe(200);
  });

  test('poweredBy и responseTime добавляют заголовки', async () => {
    const app = makeApp((a) => {
      a.use(poweredBy('VisualDSL'));
      a.use(responseTime());
      a.get('/', (req, res) => res.send('ok'));
    });
    const res = await request(app).get('/');
    expect(res.headers['x-powered-by']).toBe('VisualDSL');
    expect(res.headers['x-response-time']).toMatch(/^\d+\.\d{2}ms$/);
    const def = makeApp((a) => {
      a.use(poweredBy());
      a.get('/', (req, res) => res.send('ok'));
    });
    expect((await request(def).get('/')).headers['x-powered-by']).toBe('VisualDSL');
  });

  test('trimBody обрезает пробелы строковых полей и не трогает остальное', async () => {
    const app = makeApp((a) => {
      a.use(trimBody);
      a.post('/', (req, res) => res.json(req.body));
    });
    const res = await request(app).post('/').send({ title: '  A  ', n: 5, ok: true });
    expect(res.body).toEqual({ title: 'A', n: 5, ok: true });
    // без тела запроса middleware не падает
    const bare = express();
    const next = jest.fn();
    trimBody({}, {}, next);
    expect(next).toHaveBeenCalled();
    bare.get('/', (q, r) => r.send('x'));
  });

  test('asyncHandler передает отклоненный промис в обработчик ошибок (500)', async () => {
    const err = jest.spyOn(console, 'error').mockImplementation(() => {});
    const app = makeApp((a) => {
      a.get('/ok', asyncHandler(async (req, res) => res.send('fine')));
      a.get('/fail', asyncHandler(async () => { throw new Error('async boom'); }));
    });
    expect((await request(app).get('/ok')).text).toBe('fine');
    const res = await request(app).get('/fail');
    expect(res.statusCode).toBe(500);
    expect(res.text).toContain('500');
    err.mockRestore();
  });

  test('fileLogger пишет JSON-строки в файл', async () => {
    const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'dsl-')), 'sub', 'requests.log');
    const app = makeApp((a) => {
      a.use(fileLogger(file));
      a.get('/hello', (req, res) => res.send('hi'));
    });
    await request(app).get('/hello');
    await new Promise((r) => setTimeout(r, 100));
    const line = JSON.parse(fs.readFileSync(file, 'utf8').trim().split('\n')[0]);
    expect(line).toMatchObject({ method: 'GET', url: '/hello', status: 200 });
    expect(typeof line.ms).toBe('number');
  });

  test('fileLogger использует путь по умолчанию', () => {
    const mk = jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {});
    expect(typeof fileLogger()).toBe('function');
    mk.mockRestore();
  });

  test('csrf: выдает токен, отклоняет POST без токена и принимает с токеном', async () => {
    const app = makeApp((a) => {
      a.use(csrf);
      a.get('/form', (req, res) => res.json({ token: res.locals.csrfToken }));
      a.post('/submit', (req, res) => res.send('saved'));
    });
    const agent = request.agent(app);
    const get = await agent.get('/form');
    const token = get.body.token;
    expect(token).toMatch(/^[0-9a-f]{32}$/);
    expect(get.headers['set-cookie'][0]).toContain('csrf=' + token);

    expect((await agent.post('/submit').type('form').send({})).statusCode).toBe(403);
    expect((await agent.post('/submit').type('form').send({ _csrf: 'wrong' })).statusCode).toBe(403);
    const ok = await agent.post('/submit').type('form').send({ _csrf: token });
    expect(ok.text).toBe('saved');
    // запрос без cookie и без тела тоже отклоняется
    expect((await request(app).post('/submit')).statusCode).toBe(403);
  });

  test('rateLimit: после превышения лимита 429 с Retry-After', async () => {
    const app = makeApp((a) => {
      a.use(rateLimit({ max: 2, windowMs: 60000 }));
      a.get('/', (req, res) => res.send('ok'));
    });
    const r1 = await request(app).get('/');
    expect(r1.headers['x-ratelimit-remaining']).toBe('1');
    await request(app).get('/');
    const r3 = await request(app).get('/');
    expect(r3.statusCode).toBe(429);
    expect(r3.headers['retry-after']).toBeDefined();
  });

  test('rateLimit: окно сбрасывается по истечении времени и работают значения по умолчанию', async () => {
    const mw = rateLimit();
    const res = { setHeader: jest.fn() };
    const next = jest.fn();
    const now = jest.spyOn(Date, 'now');
    now.mockReturnValue(1000);
    mw({ ip: '1.1.1.1' }, res, next);
    now.mockReturnValue(1000 + 61000);
    mw({}, res, next);
    expect(next).toHaveBeenCalledTimes(2);
    now.mockRestore();
  });

  test('requireRole: admin допускается, гость получает 403', async () => {
    const app = makeApp((a) => {
      a.get('/admin', requireRole('admin'), (req, res) => res.send('panel:' + req.role));
    });
    expect((await request(app).get('/admin')).statusCode).toBe(403);
    expect((await request(app).get('/admin?auth=1')).text).toBe('panel:admin');
    expect((await request(app).get('/admin?role=admin')).text).toBe('panel:admin');
    expect((await request(app).get('/admin?role=editor')).statusCode).toBe(403);
  });
});

describe('extras: маршруты и шаблоны', () => {
  const app = () => makeApp((a) => a.use('/', extraRoutes));

  test('GET /about и GET /stats', async () => {
    const a = app();
    expect((await request(a).get('/about')).text).toContain('О проекте');
    const stats = await request(a).get('/stats');
    expect(stats.body).toEqual({ total: 2, byType: { flowchart: 1, sequence: 1 } });
  });

  test('поиск: по тексту, типу, сортировка, пагинация, partial-карточки', async () => {
    store.create({ title: 'Бета', type: 'class', dsl: 'B' });
    store.create({ title: 'Альфа', type: 'class', dsl: 'A' });
    const a = app();

    let res = await request(a).get('/search?q=jwt');
    expect(res.text).toContain('Найдено: 1');
    expect(res.text).toContain('Поток авторизации JWT');
    expect(res.text).toContain('class="card"');

    res = await request(a).get('/search?type=class&sort=title');
    expect(res.text.indexOf('Альфа')).toBeLessThan(res.text.indexOf('Бета'));
    res = await request(a).get('/search?type=class&sort=title&dir=desc');
    expect(res.text.indexOf('Бета')).toBeLessThan(res.text.indexOf('Альфа'));

    res = await request(a).get('/search?limit=1&page=2&auth=1');
    expect(res.text).toContain('Страница 2 из 4');
    expect(res.text).toContain('&larr; Назад');
    expect(res.text).toContain('Вперед &rarr;');
    expect(res.text).toContain('auth=1');

    res = await request(a).get('/search?limit=1&page=999');
    expect(res.text).toContain('Страница 4 из 4');

    res = await request(a).get('/search?q=zzzz');
    expect(res.text).toContain('Ничего не найдено');

    res = await request(a).get('/search?sort=hack&limit=abc&page=-5');
    expect(res.statusCode).toBe(200);
    res = await request(a).get('/search?sort=id&dir=asc&limit=1000');
    expect(res.statusCode).toBe(200);
  });

  test('редактирование: гость -> /login, форма, валидация, сохранение', async () => {
    const a = app();
    expect((await request(a).get('/item/1/edit')).headers.location).toBe('/login');
    expect((await request(a).post('/item/1/edit')).headers.location).toBe('/login');

    let res = await request(a).get('/item/1/edit?auth=1');
    expect(res.text).toContain('Редактирование диаграммы #1');

    res = await request(a).post('/item/1/edit?auth=1').type('form').send({ title: '', dsl: '', type: 'bad' });
    expect(res.statusCode).toBe(400);
    expect(res.text).toContain('Введите название диаграммы');
    expect(res.text).toContain('неизвестный тип');

    res = await request(a).post('/item/1/edit?auth=1').type('form').send({ title: 'Новое', type: 'state', dsl: 'S' });
    expect([res.statusCode, res.headers.location]).toEqual([302, '/item/1?auth=1']);
    expect(store.getById(1)).toMatchObject({ title: 'Новое', type: 'state' });

    res = await request(a).post('/item/1/edit?auth=1').type('form').send({ title: 'Т', dsl: 'D' });
    expect(store.getById(1).type).toBe('state'); // тип по умолчанию - прежний

    res = await request(a).post('/item/1/edit?auth=1');
    expect(res.statusCode).toBe(400);

    expect((await request(a).get('/item/999/edit?auth=1')).statusCode).toBe(404);
    expect((await request(a).post('/item/999/edit?auth=1')).statusCode).toBe(404);
    expect((await request(a).get('/item/x/edit?auth=1')).statusCode).toBe(404);
  });

  test('удаление: только POST и только для авторизованных', async () => {
    const a = app();
    expect((await request(a).post('/item/1/delete')).headers.location).toBe('/login');
    expect(store.getAll()).toHaveLength(2);
    const res = await request(a).post('/item/1/delete?auth=1');
    expect([res.statusCode, res.headers.location]).toEqual([302, '/?auth=1']);
    expect(store.getAll()).toHaveLength(1);
    expect((await request(a).post('/item/1/delete?auth=1')).statusCode).toBe(404);
    expect((await request(a).get('/item/2/delete?auth=1')).statusCode).toBe(404);
  });
});
