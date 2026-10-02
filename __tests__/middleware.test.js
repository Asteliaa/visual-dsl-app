process.env.NODE_ENV = 'test';

const { EventEmitter } = require('events');
const logger = require('../middlewares/logger');
const { attachUser, requireAuth } = require('../middlewares/auth');
const { notFoundHandler, serverErrorHandler } = require('../middlewares/errorHandlers');

const logStore = require('../models/logStore');

describe('middleware: logger', () => {
  beforeEach(() => logStore.clear());

  test('выводит метод, URL, статус и время после ответа и вызывает next', () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    process.env.NODE_ENV = 'development';
    const res = new EventEmitter();
    res.statusCode = 200;
    const next = jest.fn();

    logger({ method: 'GET', originalUrl: '/item/1' }, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(log).not.toHaveBeenCalled();

    res.emit('finish');
    process.env.NODE_ENV = 'test';
    const line = log.mock.calls[0][0];
    expect(line).toMatch(/GET \/item\/1 -> 200 \(\d+\.\d{2} мс\)/);
    expect(line).toMatch(/^\[\d{4}-\d{2}-\d{2}T/);
    log.mockRestore();
  });

  test('записывает запрос в журнал: время, событие, метод, URL, статус, пользователь, IP', () => {
    const res = new EventEmitter();
    res.statusCode = 404;
    logger({ method: 'POST', originalUrl: '/x', user: { name: 'Администратор' }, ip: '::1' }, res, jest.fn());
    res.emit('finish');

    const [e] = logStore.getAll();
    expect(e).toMatchObject({
      id: 1, event: 'Ошибка клиента', method: 'POST', url: '/x', status: 404, user: 'Администратор', ip: '::1'
    });
    expect(new Date(e.time).toString()).not.toBe('Invalid Date');
    expect(typeof e.durationMs).toBe('number');
  });

  test('без req.user и req.ip подставляет значения по умолчанию', () => {
    const res = new EventEmitter();
    res.statusCode = 200;
    logger({ method: 'GET', originalUrl: '/' }, res, jest.fn());
    res.emit('finish');
    expect(logStore.getAll()[0]).toMatchObject({ user: 'Гость', ip: '-' });
  });
});

describe('models/logStore', () => {
  beforeEach(() => logStore.clear());
  const add = (o = {}) =>
    logStore.add({ method: 'GET', url: '/', status: 200, durationMs: 1.234, user: 'Гость', ip: '-', ...o });

  test('тип события определяется по коду ответа', () => {
    expect(logStore.eventByStatus(200)).toBe('Успешный запрос');
    expect(logStore.eventByStatus(302)).toBe('Перенаправление');
    expect(logStore.eventByStatus(404)).toBe('Ошибка клиента');
    expect(logStore.eventByStatus(500)).toBe('Ошибка сервера');
  });

  test('getAll возвращает новые записи первыми, длительность округляется', () => {
    add({ url: '/a' });
    add({ url: '/b', durationMs: 2.5 });
    const all = logStore.getAll();
    expect(all.map((e) => e.url)).toEqual(['/b', '/a']);
    expect(all[1].durationMs).toBe(1.23);
  });

  test('фильтры по методу и событию', () => {
    add({ method: 'GET' });
    add({ method: 'POST', status: 400 });
    expect(logStore.getAll({ method: 'POST' })).toHaveLength(1);
    expect(logStore.getAll({ event: 'Ошибка клиента' })).toHaveLength(1);
    expect(logStore.getAll({ method: 'GET', event: 'Ошибка клиента' })).toHaveLength(0);
  });

  test('хранит не более MAX_ENTRIES записей', () => {
    for (let i = 0; i < logStore.MAX_ENTRIES + 5; i++) add({ url: '/' + i });
    const all = logStore.getAll();
    expect(all).toHaveLength(logStore.MAX_ENTRIES);
    expect(all[0].url).toBe('/' + (logStore.MAX_ENTRIES + 4));
  });

  test('clear очищает журнал и сбрасывает нумерацию', () => {
    add(); logStore.clear();
    expect(logStore.getAll()).toEqual([]);
    expect(add().id).toBe(1);
  });
});

describe('middleware: attachUser / requireAuth', () => {
  const run = (query) => {
    const req = { query };
    const res = { locals: {} };
    const next = jest.fn();
    attachUser(req, res, next);
    return { req, res, next };
  };

  test('auth=1 -> администратор и суффикс ?auth=1', () => {
    const { req, res, next } = run({ auth: '1' });
    expect(req.user).toEqual({ name: 'Администратор', isAuth: true });
    expect(res.locals.authQuery).toBe('?auth=1');
    expect(res.locals.user).toBe(req.user);
    expect(next).toHaveBeenCalled();
  });

  test('без параметра -> гость и пустой суффикс', () => {
    const { req, res } = run({});
    expect(req.user.name).toBe('Гость');
    expect(res.locals.authQuery).toBe('');
  });

  test('requireAuth пропускает авторизованного', () => {
    const next = jest.fn();
    const res = { redirect: jest.fn() };
    requireAuth({ user: { isAuth: true } }, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.redirect).not.toHaveBeenCalled();
  });

  test('requireAuth перенаправляет гостя на /login', () => {
    const next = jest.fn();
    const res = { redirect: jest.fn() };
    requireAuth({ user: { isAuth: false } }, res, next);
    expect(res.redirect).toHaveBeenCalledWith('/login');
    expect(next).not.toHaveBeenCalled();
  });

  test('requireAuth без req.user тоже редиректит', () => {
    const res = { redirect: jest.fn() };
    requireAuth({}, res, jest.fn());
    expect(res.redirect).toHaveBeenCalledWith('/login');
  });
});

describe('middleware: обработчики ошибок', () => {
  const makeRes = () => {
    const res = { headersSent: false };
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    res.render = jest.fn(() => res);
    return res;
  };

  test('404 для страницы -> render 404', () => {
    const res = makeRes();
    notFoundHandler({ originalUrl: '/x' }, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.render).toHaveBeenCalledWith('404', expect.any(Object));
  });

  test('404 для /api -> json', () => {
    const res = makeRes();
    notFoundHandler({ originalUrl: '/api/x' }, res);
    expect(res.json).toHaveBeenCalledWith({ error: 'Маршрут не найден' });
  });

  test('500 для страницы -> render 500 и console.error', () => {
    const err = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = makeRes();
    serverErrorHandler(new Error('x'), { originalUrl: '/x' }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.render).toHaveBeenCalledWith('500', expect.any(Object));
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });

  test('500 для /api -> json с сообщением', () => {
    const err = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = makeRes();
    serverErrorHandler(new Error('bad'), { originalUrl: '/api/x' }, res, jest.fn());
    expect(res.json).toHaveBeenCalledWith({ error: 'Внутренняя ошибка сервера', message: 'bad' });
    err.mockRestore();
  });

  test('если заголовки уже отправлены - передает ошибку дальше', () => {
    const err = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = makeRes();
    res.headersSent = true;
    const next = jest.fn();
    const e = new Error('late');
    serverErrorHandler(e, { originalUrl: '/x' }, res, next);
    expect(next).toHaveBeenCalledWith(e);
    err.mockRestore();
  });
});

describe('models/diagramStore', () => {
  const store = require('../models/diagramStore');
  beforeEach(() => store.reset());

  test('update возвращает null для неизвестного id', () => {
    expect(store.update(99, { title: 'a', dsl: 'b' })).toBeNull();
  });

  test('remove возвращает false для неизвестного id', () => {
    expect(store.remove(99)).toBe(false);
  });

  test('reset восстанавливает начальные данные и счетчик id', () => {
    store.create({ title: 'a', dsl: 'b' });
    store.reset();
    expect(store.getAll()).toHaveLength(2);
    expect(store.create({ title: 'a', dsl: 'b' }).id).toBe(3);
  });
});
