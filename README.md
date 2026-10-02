# VisualDSL Project

Professional DSL Editor for generating diagrams from code.

## ПЗ1. Middleware и шаблонизаторы (ветка `pz21`)

Express + EJS, данные хранятся в массиве в памяти (без БД).

### Запуск

```bash
npm install
npm start          # http://localhost:5000
npm test           # 117 тестов (Jest + Supertest)
npm run test:coverage
npm run demo       # демо-запросы для защиты (сервер должен быть запущен)
npm run screenshots   # скриншоты для отчета (нужен Google Chrome)
```

### Страницы

| URL | Описание |
|-----|----------|
| `/` | список диаграмм |
| `/item/:id` | детальная страница |
| `/add?auth=1` | форма добавления (гость перенаправляется на `/login`) |
| `/login` | страница "доступ запрещен" |
| `/debug/error` | демонстрация страницы 500 (не в production) |
| любой другой | страница 404 |

Авторизация имитируется параметром `?auth=1`. REST API: `/api/diagrams` (GET, POST, PUT, DELETE).

### Документы

- `docs/Отчет_ПЗ1.docx`, `docs/Отчет_ПЗ1.pdf` - отчет по СТП БГУИР
- `docs/Подготовка_к_защите_ПЗ1.md` - задание, теория, разбор кода, запуск, Postman, план защиты
- `docs/postman/` - коллекция Postman
- `seeds/` - начальные данные для приложения и тестов
- `extras/` - заготовки на случай правок на защите (см. `extras/README.md`)
