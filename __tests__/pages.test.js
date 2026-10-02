process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const store = require('../models/diagramStore');

beforeEach(() => store.reset());

describe('HTML-страницы (EJS)', () => {
  describe('GET /', () => {
    test('рендерит список диаграмм из массива', async () => {
      const res = await request(app).get('/');
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toMatch(/html/);
      expect(res.text).toContain('Список диаграмм');
      expect(res.text).toContain('Архитектура микросервисов');
      expect(res.text).toContain('Поток авторизации JWT');
    });

    test('использует общий каркас (partials): шапка, футер, CSS', async () => {
      const res = await request(app).get('/');
      expect(res.text).toContain('<!DOCTYPE html>');
      expect(res.text).toContain('/static/css/style.css');
      expect(res.text).toContain('site-footer');
    });

    test('для гостя показывает имя "Гость" и ссылку без auth', async () => {
      const res = await request(app).get('/');
      expect(res.text).toContain('Гость');
      expect(res.text).toContain('href="/item/1"');
    });

    test('с ?auth=1 показывает администратора и сохраняет auth в ссылках', async () => {
      const res = await request(app).get('/?auth=1');
      expect(res.text).toContain('Администратор');
      expect(res.text).toContain('href="/item/1?auth=1"');
      expect(res.text).toContain('href="/add?auth=1"');
    });

    test('при пустом массиве выводит сообщение', async () => {
      store.getAll().length = 0;
      const res = await request(app).get('/');
      expect(res.text).toContain('Диаграмм пока нет');
    });

    test('экранирует HTML в названиях (защита от XSS)', async () => {
      store.create({ title: '<script>alert(1)</script>', dsl: 'x' });
      const res = await request(app).get('/');
      expect(res.text).not.toContain('<script>alert(1)</script>');
      expect(res.text).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    });
  });

  describe('GET /item/:id', () => {
    test('показывает детали диаграммы', async () => {
      const res = await request(app).get('/item/1');
      expect(res.statusCode).toBe(200);
      expect(res.text).toContain('Архитектура микросервисов');
      expect(res.text).toContain('flowchart');
      expect(res.text).toContain('API Gateway');
    });

    test('показывает дату изменения у обновленной диаграммы', async () => {
      store.update(1, { title: 'Upd', dsl: 'x' });
      const res = await request(app).get('/item/1');
      expect(res.text).toContain('Изменена');
    });

    test('404 для несуществующего id (страница 404.ejs)', async () => {
      const res = await request(app).get('/item/999');
      expect(res.statusCode).toBe(404);
      expect(res.text).toContain('404 - Страница не найдена');
    });

    test('404 для нечислового id', async () => {
      const res = await request(app).get('/item/abc');
      expect(res.statusCode).toBe(404);
      expect(res.text).toContain('404');
    });

    test('экранирует DSL-код', async () => {
      const d = store.create({ title: 'x', dsl: '<img src=x onerror=alert(1)>' });
      const res = await request(app).get(`/item/${d.id}`);
      expect(res.text).not.toContain('<img src=x');
      expect(res.text).toContain('&lt;img');
    });
  });

  describe('GET /add', () => {
    test('гость перенаправляется на /login', async () => {
      const res = await request(app).get('/add');
      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toBe('/login');
    });

    test('?auth=0 тоже считается гостем', async () => {
      const res = await request(app).get('/add?auth=0');
      expect(res.statusCode).toBe(302);
    });

    test('с ?auth=1 показывает форму', async () => {
      const res = await request(app).get('/add?auth=1');
      expect(res.statusCode).toBe(200);
      expect(res.text).toContain('<form method="POST" action="/add?auth=1">');
      expect(res.text).toContain('name="title"');
      expect(res.text).toContain('name="dsl"');
      expect(res.text).toContain('<option value="sequence"');
    });
  });

  describe('POST /add', () => {
    test('гость не может добавить (редирект на /login)', async () => {
      const res = await request(app).post('/add').type('form').send({ title: 'x', dsl: 'y' });
      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toBe('/login');
      expect(store.getAll()).toHaveLength(2);
    });

    test('добавляет элемент и редиректит на главную с auth', async () => {
      const res = await request(app)
        .post('/add?auth=1')
        .type('form')
        .send({ title: 'Моя диаграмма', type: 'class', dsl: 'class A {}' });
      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toBe('/?auth=1');
      expect(store.getAll()).toHaveLength(3);
      expect(store.getById(3)).toMatchObject({ title: 'Моя диаграмма', type: 'class' });

      const list = await request(app).get('/?auth=1');
      expect(list.text).toContain('Моя диаграмма');
    });

    test('пустая форма - 400, ошибки и сохранение введенных значений', async () => {
      const res = await request(app).post('/add?auth=1').type('form').send({ title: '  ', dsl: '', type: 'state' });
      expect(res.statusCode).toBe(400);
      expect(res.text).toContain('Введите название диаграммы');
      expect(res.text).toContain('Введите DSL-код диаграммы');
      expect(res.text).toContain('<option value="state" selected>');
      expect(store.getAll()).toHaveLength(2);
    });

    test('неизвестный тип отклоняется', async () => {
      const res = await request(app).post('/add?auth=1').type('form').send({ title: 'a', dsl: 'b', type: 'hack' });
      expect(res.statusCode).toBe(400);
      expect(res.text).toContain('неизвестный тип');
    });

    test('при ошибке введенный HTML экранируется в форме', async () => {
      const res = await request(app).post('/add?auth=1').type('form').send({ title: '"><script>x</script>', dsl: '' });
      expect(res.text).not.toContain('<script>x</script>');
    });

    test('значения по умолчанию, если поля не переданы', async () => {
      const res = await request(app).post('/add?auth=1');
      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /login', () => {
    test('показывает страницу авторизации', async () => {
      const res = await request(app).get('/login');
      expect(res.statusCode).toBe(200);
      expect(res.text).toContain('Доступ запрещен');
      expect(res.text).toContain('/add?auth=1');
    });
  });

  describe('GET /logs (журнал запросов в таблице)', () => {
    const logStore = require('../models/logStore');
    beforeEach(() => logStore.clear());

    test('показывает таблицу с колонками и записями выполненных запросов', async () => {
      await request(app).get('/item/1?auth=1');
      await request(app).get('/no-such-page');
      const res = await request(app).get('/logs');
      expect(res.statusCode).toBe(200);
      for (const col of ['Время', 'Событие', 'Метод', 'URL', 'Статус', 'Пользователь', 'IP']) {
        expect(res.text).toContain(`<th>${col}</th>`);
      }
      expect(res.text).toContain('/item/1?auth=1');
      expect(res.text).toContain('Ошибка клиента');
      expect(res.text).toContain('Администратор');
    });

    test('пустой журнал - сообщение вместо таблицы', async () => {
      const spy = jest.spyOn(logStore, 'getAll').mockReturnValue([]);
      const res = await request(app).get('/logs');
      expect(res.text).toContain('Записей нет');
      spy.mockRestore();
    });

    test('фильтр по методу и событию', async () => {
      await request(app).post('/add').type('form').send({ title: 'x', dsl: 'y' }); // 302
      const res = await request(app).get('/logs?method=POST&event=Перенаправление');
      expect(res.text).toContain('<option value="POST" selected>');
      expect(res.text).toContain('/add');
      const none = await request(app).get('/logs?method=DELETE');
      expect(none.text).not.toContain('<td>/add</td>');
    });

    test('неизвестные значения фильтра игнорируются', async () => {
      const res = await request(app).get('/logs?method=HACK&event=<b>');
      expect(res.statusCode).toBe(200);
      expect(res.text).not.toContain('selected>HACK');
    });

    test('экранирует URL с HTML в записях журнала', async () => {
      await request(app).get('/%3Cscript%3Ealert(1)%3C/script%3E');
      const res = await request(app).get('/logs');
      expect(res.text).not.toContain('<script>alert(1)</script>');
    });

    test('сохраняет auth в ссылке пункта меню', async () => {
      const res = await request(app).get('/logs?auth=1');
      expect(res.text).toContain('href="/logs?auth=1"');
    });
  });

  describe('Статика', () => {
    test('отдает CSS из public', async () => {
      const res = await request(app).get('/static/css/style.css');
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toMatch(/css/);
    });
  });

  describe('Обработка ошибок', () => {
    test('404 для неизвестной страницы рендерит 404.ejs', async () => {
      const res = await request(app).get('/no-such-page');
      expect(res.statusCode).toBe(404);
      expect(res.headers['content-type']).toMatch(/html/);
      expect(res.text).toContain('404 - Страница не найдена');
    });

    test('500 рендерит 500.ejs и логирует ошибку', async () => {
      const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const res = await request(app).get('/debug/error');
      expect(res.statusCode).toBe(500);
      expect(res.text).toContain('500 - Внутренняя ошибка сервера');
      expect(errSpy).toHaveBeenCalled();
      errSpy.mockRestore();
    });
  });
});
