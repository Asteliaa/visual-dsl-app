process.env.NODE_ENV = 'test';

// Тесты редких ветвей: пустое тело запроса и ошибки без стека.
const request = require('supertest');
const app = require('../app');
const store = require('../models/diagramStore');
const { serverErrorHandler } = require('../middlewares/errorHandlers');

beforeEach(() => store.reset());

describe('редкие ветви контроллеров', () => {
  test('PUT без тела запроса - 400', async () => {
    const res = await request(app).put('/api/diagrams/1');
    expect(res.statusCode).toBe(400);
  });

  test('POST /add без тела формы - 400 и форма с типом по умолчанию', async () => {
    const res = await request(app).post('/add?auth=1');
    expect(res.statusCode).toBe(400);
    expect(res.text).toContain('<option value="flowchart" selected>');
  });

  test('POST /add: тип не указан - используется flowchart', async () => {
    await request(app).post('/add?auth=1').type('form').send({ title: 'T', dsl: 'D' });
    expect(store.getById(3).type).toBe('flowchart');
  });

  test('обработчик 500 логирует ошибку без стека (строка)', () => {
    const err = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = { headersSent: false, status: jest.fn().mockReturnThis(), render: jest.fn() };
    const e = new Error('no stack');
    e.stack = undefined;
    serverErrorHandler(e, { originalUrl: '/x' }, res, jest.fn());
    expect(err).toHaveBeenCalledWith(e);
    err.mockRestore();
  });

  test('поиск в API принимает пустую строку (возвращает все записи)', async () => {
    const res = await request(app).get('/api/diagrams?search=');
    expect(res.body).toHaveLength(2);
  });
});
