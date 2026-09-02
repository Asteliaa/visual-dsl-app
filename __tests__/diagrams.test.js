const request = require('supertest');
const app = require('../app');

process.env.NODE_ENV = 'test';

describe('CRUD API /api/diagrams', () => {
  
  test('GET /api/diagrams — должен возвращать массив всех диаграмм', async () => {
    const res = await request(app).get('/api/diagrams');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('GET /api/diagrams/:id — должен возвращать диаграмму по ID', async () => {
    const res = await request(app).get('/api/diagrams/1');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id', 1);
    expect(res.body).toHaveProperty('title');
  });

  test('GET /api/diagrams/:id — должен возвращать 404, если диаграмма не найдена', async () => {
    const res = await request(app).get('/api/diagrams/999');
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  test('POST /api/diagrams — должен создавать новую диаграмму', async () => {
    const newDiagram = {
      title: 'Тестовая схема',
      type: 'flowchart',
      dsl: 'graph TD; A-->B;'
    };

    const res = await request(app)
      .post('/api/diagrams')
      .send(newDiagram);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe(newDiagram.title);
  });

  test('POST /api/diagrams — должен возвращать 400 при отсутствии обязательных полей', async () => {
    const res = await request(app)
      .post('/api/diagrams')
      .send({ type: 'flowchart' }); 

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('PUT /api/diagrams/:id — должен обновлять существующую диаграмму', async () => {
    const updatedData = {
      title: 'Обновленный заголовок',
      type: 'sequence',
      dsl: 'sequenceDiagram; A->>B: Ping;'
    };

    const res = await request(app)
      .put('/api/diagrams/1')
      .send(updatedData);

    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe(updatedData.title);
  });

  test('DELETE /api/diagrams/:id — должен удалять диаграмму', async () => {
    const res = await request(app).delete('/api/diagrams/1');
    expect(res.statusCode).toBe(204);

    const getRes = await request(app).get('/api/diagrams/1');
    expect(getRes.statusCode).toBe(404);
  });
});