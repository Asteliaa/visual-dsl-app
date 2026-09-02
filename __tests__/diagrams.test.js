const request = require('supertest');
const app = require('../app');

process.env.NODE_ENV = 'test';

describe('Расширенное тестирование CRUD API /api/diagrams', () => {

  describe('GET /api/diagrams', () => {
    test('1. Должен возвращать полный список диаграмм (статус 200)', async () => {
      const res = await request(app).get('/api/diagrams');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    test('2. Должен фильтровать диаграммы по query-параметру ?search', async () => {
      const res = await request(app).get('/api/diagrams?search=микросервисов');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].title).toContain('микросервисов');
    });

    test('3. Должен возвращать пустой массив, если по поиску ничего не найдено', async () => {
      const res = await request(app).get('/api/diagrams?search=НесуществующаяДиаграмма123');
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('GET /api/diagrams/:id', () => {
    test('4. Должен возвращать диаграмму по валидному ID (статус 200)', async () => {
      const res = await request(app).get('/api/diagrams/1');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id', 1);
      expect(res.body).toHaveProperty('title');
      expect(res.body).toHaveProperty('dsl');
    });

    test('5. Должен возвращать 404 при запросе несуществующего ID', async () => {
      const res = await request(app).get('/api/diagrams/9999');
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error');
    });

    test('6. Должен возвращать 400, если ID не является числом', async () => {
      const res = await request(app).get('/api/diagrams/abc');
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('ID должен быть числом');
    });
  });

  describe('POST /api/diagrams', () => {
    test('7. Должен успешно создавать новую диаграмму (статус 201)', async () => {
      const newDiagram = {
        title: 'Тестовая диаграмма процессов',
        type: 'flowchart',
        dsl: 'graph TD; Start --> Stop;'
      };

      const res = await request(app)
        .post('/api/diagrams')
        .send(newDiagram);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe(newDiagram.title);
      expect(res.body.dsl).toBe(newDiagram.dsl);
      expect(res.body).toHaveProperty('createdAt');
    });

    test('8. Должен возвращать 400, если отсутствует поле title', async () => {
      const res = await request(app)
        .post('/api/diagrams')
        .send({ type: 'flowchart', dsl: 'graph TD; A-->B;' });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('title');
    });

    test('9. Должен возвращать 400, если отсутствует поле dsl', async () => {
      const res = await request(app)
        .post('/api/diagrams')
        .send({ title: 'Без DSL кода' });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('dsl');
    });

    test('10. Должен подставлять дефолтный тип flowchart, если type не передан', async () => {
      const res = await request(app)
        .post('/api/diagrams')
        .send({ title: 'Диаграмма без типа', dsl: 'graph LR; A-->B;' });

      expect(res.statusCode).toBe(201);
      expect(res.body.type).toBe('flowchart');
    });
  });

  describe('PUT /api/diagrams/:id', () => {
    test('11. Должен полностью обновлять диаграмму (статус 200)', async () => {
      const updatedData = {
        title: 'Обновленная архитетура',
        type: 'sequence',
        dsl: 'sequenceDiagram; Client->>Server: Request;'
      };

      const res = await request(app)
        .put('/api/diagrams/1')
        .send(updatedData);

      expect(res.statusCode).toBe(200);
      expect(res.body.title).toBe(updatedData.title);
      expect(res.body.type).toBe(updatedData.type);
      expect(res.body).toHaveProperty('updatedAt');
    });

    test('12. Должен возвращать 404 при попытке обновить несуществующую диаграмму', async () => {
      const res = await request(app)
        .put('/api/diagrams/8888')
        .send({ title: 'Тест', dsl: 'graph TD;' });

      expect(res.statusCode).toBe(404);
    });

    test('13. Должен возвращать 400 при передаче неполных данных для PUT', async () => {
      const res = await request(app)
        .put('/api/diagrams/1')
        .send({ title: 'Только заголовок' }); // без dsl

      expect(res.statusCode).toBe(400);
    });
  });

  describe('DELETE /api/diagrams/:id', () => {
    test('14. Должен успешно удалять диаграмму (статус 204)', async () => {
      const res = await request(app).delete('/api/diagrams/2');
      expect(res.statusCode).toBe(204);
      expect(res.body).toEqual({});
    });

    test('15. Повторный DELETE той же диаграммы должен возвращать 404', async () => {
      const res = await request(app).delete('/api/diagrams/2');
      expect(res.statusCode).toBe(404);
    });

    test('16. Должен возвращать 400 при невалидном ID на удаление', async () => {
      const res = await request(app).delete('/api/diagrams/invalid-id');
      expect(res.statusCode).toBe(400);
    });
  });

  describe('Обработка немаршрутизируемых запросов', () => {
    test('17. Должен возвращать 404 на несуществующие URL-маршруты', async () => {
      const res = await request(app).get('/api/unknown-endpoint');
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error', 'Маршрут не найден');
    });
  });
});