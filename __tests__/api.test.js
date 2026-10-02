process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const store = require('../models/diagramStore');

beforeEach(() => store.reset());

describe('REST API /api/diagrams', () => {
  describe('GET /api/diagrams', () => {
    test('возвращает полный список (200)', async () => {
      const res = await request(app).get('/api/diagrams');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    test('фильтрует по ?search (без учета регистра)', async () => {
      const res = await request(app).get('/api/diagrams?search=МИКРОСЕРВИСОВ');
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toContain('микросервисов');
    });

    test('поиск работает и по типу диаграммы', async () => {
      const res = await request(app).get('/api/diagrams?search=sequence');
      expect(res.body).toHaveLength(1);
      expect(res.body[0].id).toBe(2);
    });

    test('пустой результат поиска - пустой массив', async () => {
      const res = await request(app).get('/api/diagrams?search=nothing999');
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('GET /api/diagrams/:id', () => {
    test('возвращает диаграмму по id', async () => {
      const res = await request(app).get('/api/diagrams/1');
      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(1);
    });

    test('400 для нечислового id', async () => {
      const res = await request(app).get('/api/diagrams/abc');
      expect(res.statusCode).toBe(400);
    });

    test('400 для id вида "1abc"', async () => {
      const res = await request(app).get('/api/diagrams/1abc');
      expect(res.statusCode).toBe(400);
    });

    test('404 для несуществующего id', async () => {
      const res = await request(app).get('/api/diagrams/999');
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('POST /api/diagrams', () => {
    test('создает диаграмму (201) и подставляет тип по умолчанию', async () => {
      const res = await request(app).post('/api/diagrams').send({ title: '  Новая ', dsl: ' A-->B ' });
      expect(res.statusCode).toBe(201);
      expect(res.body).toMatchObject({ id: 3, title: 'Новая', type: 'flowchart', dsl: 'A-->B' });
      expect(store.getAll()).toHaveLength(3);
    });

    test('использует переданный тип', async () => {
      const res = await request(app).post('/api/diagrams').send({ title: 'T', type: 'class', dsl: 'X' });
      expect(res.body.type).toBe('class');
    });

    test('400 без title', async () => {
      const res = await request(app).post('/api/diagrams').send({ dsl: 'X' });
      expect(res.statusCode).toBe(400);
    });

    test('400 при пустом dsl из пробелов', async () => {
      const res = await request(app).post('/api/diagrams').send({ title: 'T', dsl: '   ' });
      expect(res.statusCode).toBe(400);
    });

    test('400 если title не строка', async () => {
      const res = await request(app).post('/api/diagrams').send({ title: 123, dsl: 'X' });
      expect(res.statusCode).toBe(400);
    });

    test('400 при пустом теле запроса', async () => {
      const res = await request(app).post('/api/diagrams');
      expect(res.statusCode).toBe(400);
    });
  });

  describe('PUT /api/diagrams/:id', () => {
    test('обновляет диаграмму и сохраняет createdAt', async () => {
      const before = store.getById(1).createdAt;
      const res = await request(app).put('/api/diagrams/1').send({ title: 'Upd', type: 'state', dsl: 'S' });
      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({ id: 1, title: 'Upd', type: 'state', dsl: 'S', createdAt: before });
      expect(res.body.updatedAt).toBeDefined();
    });

    test('сохраняет прежний тип, если он не передан', async () => {
      const res = await request(app).put('/api/diagrams/2').send({ title: 'Upd', dsl: 'S' });
      expect(res.body.type).toBe('sequence');
    });

    test('400 для нечислового id', async () => {
      const res = await request(app).put('/api/diagrams/x').send({ title: 'a', dsl: 'b' });
      expect(res.statusCode).toBe(400);
    });

    test('404 для несуществующей диаграммы', async () => {
      const res = await request(app).put('/api/diagrams/999').send({ title: 'a', dsl: 'b' });
      expect(res.statusCode).toBe(404);
    });

    test('400 без обязательных полей', async () => {
      const res = await request(app).put('/api/diagrams/1').send({ title: 'a' });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('DELETE /api/diagrams/:id', () => {
    test('удаляет диаграмму (204)', async () => {
      const res = await request(app).delete('/api/diagrams/1');
      expect(res.statusCode).toBe(204);
      expect(store.getById(1)).toBeUndefined();
    });

    test('повторное удаление - 404', async () => {
      await request(app).delete('/api/diagrams/1');
      const res = await request(app).delete('/api/diagrams/1');
      expect(res.statusCode).toBe(404);
    });

    test('400 для нечислового id', async () => {
      const res = await request(app).delete('/api/diagrams/abc');
      expect(res.statusCode).toBe(400);
    });
  });

  describe('Ошибки API возвращаются в JSON', () => {
    test('404 для неизвестного маршрута в /api', async () => {
      const res = await request(app).get('/api/unknown');
      expect(res.statusCode).toBe(404);
      expect(res.headers['content-type']).toMatch(/json/);
    });

    test('500 в JSON при сбое хранилища', async () => {
      const spy = jest.spyOn(store, 'getAll').mockImplementation(() => {
        throw new Error('boom');
      });
      const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const res = await request(app).get('/api/diagrams');
      expect(res.statusCode).toBe(500);
      expect(res.body).toMatchObject({ error: 'Внутренняя ошибка сервера', message: 'boom' });
      spy.mockRestore();
      errSpy.mockRestore();
    });

    test('невалидный JSON в теле - 500 в JSON (обработчик ошибок)', async () => {
      const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const res = await request(app)
        .post('/api/diagrams')
        .set('Content-Type', 'application/json')
        .send('{bad json');
      expect(res.statusCode).toBe(500);
      expect(res.headers['content-type']).toMatch(/json/);
      errSpy.mockRestore();
    });
  });
});
