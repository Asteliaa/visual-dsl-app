process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const store = require('../models/diagramStore');
const logStore = require('../models/logStore');
const diagramSeeds = require('../seeds/diagrams');
const logSeeds = require('../seeds/logs');

beforeEach(() => {
  store.reset();
  logStore.clear();
});

describe('seed: диаграммы', () => {
  test('базовый seed содержит 2 диаграммы со всеми полями', () => {
    const base = diagramSeeds.base();
    expect(base).toHaveLength(2);
    base.forEach((d) => {
      expect(d).toEqual(
        expect.objectContaining({ id: expect.any(Number), title: expect.any(String), type: expect.any(String), dsl: expect.any(String) })
      );
      expect(store.DIAGRAM_TYPES).toContain(d.type);
    });
  });

  test('хранилище стартует с базового seed, а reset возвращает к нему', () => {
    expect(store.getAll().map((d) => d.title)).toEqual(diagramSeeds.base().map((d) => d.title));
    store.create({ title: 'x', dsl: 'y' });
    store.reset();
    expect(store.getAll()).toHaveLength(2);
  });

  test('каждый вызов base() возвращает новый независимый массив', () => {
    const a = diagramSeeds.base();
    a.pop();
    expect(diagramSeeds.base()).toHaveLength(2);
  });

  test('демо-диаграммы валидны и принимаются API (создание, 201)', async () => {
    for (const d of diagramSeeds.demo) {
      expect(store.DIAGRAM_TYPES).toContain(d.type);
      const res = await request(app).post('/api/diagrams').send(d);
      expect(res.statusCode).toBe(201);
      expect(res.body.title).toBe(d.title);
    }
    expect(store.getAll()).toHaveLength(2 + diagramSeeds.demo.length);
  });

  test('демо-диаграммы появляются на главной странице', async () => {
    for (const d of diagramSeeds.demo) await request(app).post('/api/diagrams').send(d);
    const res = await request(app).get('/');
    diagramSeeds.demo.forEach((d) => expect(res.text).toContain(d.title));
  });
});

describe('seed: журнал запросов', () => {
  beforeEach(() => logSeeds.load(logStore));

  test('seed загружается целиком и покрывает все события и методы', () => {
    const all = logStore.getAll();
    expect(all).toHaveLength(logSeeds.entries.length);
    expect(new Set(all.map((e) => e.event))).toEqual(
      new Set(['Успешный запрос', 'Перенаправление', 'Ошибка клиента', 'Ошибка сервера'])
    );
    expect(new Set(all.map((e) => e.method))).toEqual(new Set(['GET', 'POST', 'PUT', 'DELETE']));
  });

  test('фильтры по каждому событию возвращают ожидаемое число записей', () => {
    expect(logStore.getAll({ event: 'Успешный запрос' })).toHaveLength(3);
    expect(logStore.getAll({ event: 'Перенаправление' })).toHaveLength(2);
    expect(logStore.getAll({ event: 'Ошибка клиента' })).toHaveLength(3);
    expect(logStore.getAll({ event: 'Ошибка сервера' })).toHaveLength(1);
  });

  test('фильтры по каждому методу возвращают ожидаемое число записей', () => {
    expect(logStore.getAll({ method: 'GET' })).toHaveLength(5);
    expect(logStore.getAll({ method: 'POST' })).toHaveLength(2);
    expect(logStore.getAll({ method: 'PUT' })).toHaveLength(1);
    expect(logStore.getAll({ method: 'DELETE' })).toHaveLength(1);
  });

  test('страница /logs показывает все записи seed и последняя запись первая', async () => {
    const res = await request(app).get('/logs');
    logSeeds.entries.forEach((e) => expect(res.text).toContain(e.status.toString()));
    expect(res.text).toContain('/debug/error');
    expect(res.text.indexOf('/debug/error')).toBeLessThan(res.text.indexOf('/no-such-page'));
  });

  test('страница /logs: комбинированный фильтр метод + событие', async () => {
    const res = await request(app).get('/logs?method=POST&event=' + encodeURIComponent('Ошибка клиента'));
    expect(res.text).toContain('/add?auth=1');
    expect(res.text).not.toContain('/debug/error');
    expect(res.text).not.toContain('/api/diagrams/1<');
  });
});

describe('окружение и запуск', () => {
  test('в production маршрут /debug/error отсутствует (404)', async () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    let prodApp;
    jest.isolateModules(() => {
      prodApp = require('../app');
    });
    process.env.NODE_ENV = prev;
    const res = await request(prodApp).get('/debug/error');
    expect(res.statusCode).toBe(404);
  });

  // Запускает server.js в изолированном реестре модулей, подменяя listen (порт реально не открывается).
  const runServer = (port) => {
    const calls = [];
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    if (port === undefined) delete process.env.PORT;
    else process.env.PORT = port;
    jest.isolateModules(() => {
      const express = require('express');
      express.application.listen = function (p, cb) {
        calls.push(p);
        cb();
        return {};
      };
      require('../server');
    });
    const message = log.mock.calls[0][0];
    log.mockRestore();
    delete process.env.PORT;
    return { calls, message };
  };

  test('server.js запускает приложение на порту из PORT', () => {
    const { calls, message } = runServer('5999');
    expect(calls).toEqual(['5999']);
    expect(message).toContain('http://localhost:5999');
  });

  test('server.js использует порт 5000 по умолчанию', () => {
    const { calls, message } = runServer(undefined);
    expect(calls).toEqual([5000]);
    expect(message).toContain('http://localhost:5000');
  });
});

describe('сквозной сценарий защиты (end-to-end)', () => {
  test('гость -> /add -> /login -> вход -> форма -> ошибка -> успех -> список -> деталь -> журнал', async () => {
    let res = await request(app).get('/add');
    expect([res.statusCode, res.headers.location]).toEqual([302, '/login']);

    res = await request(app).get('/login');
    expect(res.text).toContain('/add?auth=1');

    res = await request(app).get('/add?auth=1');
    expect(res.statusCode).toBe(200);

    res = await request(app).post('/add?auth=1').type('form').send({ title: '', dsl: '' });
    expect(res.statusCode).toBe(400);

    res = await request(app).post('/add?auth=1').type('form').send({ title: 'E2E', type: 'state', dsl: 'S' });
    expect([res.statusCode, res.headers.location]).toEqual([302, '/?auth=1']);

    res = await request(app).get('/?auth=1');
    expect(res.text).toContain('E2E');

    res = await request(app).get('/item/3?auth=1');
    expect(res.text).toContain('E2E');

    res = await request(app).get('/item/404');
    expect(res.statusCode).toBe(404);

    res = await request(app).get('/logs?auth=1');
    expect(res.text).toContain('/add?auth=1');
    expect(res.text).toContain('Перенаправление');
    expect(res.text).toContain('Ошибка клиента');
  });
});
