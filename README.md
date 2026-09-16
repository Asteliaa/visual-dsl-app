# ИТиВП, Часть 2 — Лабораторная работа 2

Продолжение лабораторной работы 1: то же REST API для диаграмм DiagramCode, теперь поверх PostgreSQL через Sequelize вместо массива в памяти.

## Подготовка базы данных

Создать бесплатный кластер PostgreSQL, например на [Neon](https://neon.tech) или [Supabase](https://supabase.com), и скопировать строку подключения.

```bash
cp .env.example .env
# вписать DATABASE_URL в .env
```

## Установка и запуск

```bash
npm install
npm run migrate
npm run seed
npm run dev
```

Сервер поднимается на `http://localhost:3000`.

## Тесты

```bash
npm test
```

Тесты используют SQLite в памяти (см. `config/config.js`, окружение `test`) — реальный PostgreSQL для их запуска не требуется. Порог покрытия — 100%.

## Миграции

- `migrations/20260101000000-create-diagrams.js` — создание таблицы `Diagrams`.
- `migrations/20260101000100-add-status-to-diagrams.js` — добавление поля `status`.

## Эндпоинты

| Метод  | URL             | Описание                    |
|--------|-----------------|------------------------------|
| GET    | /diagrams       | список всех диаграмм         |
| GET    | /diagrams/:id   | диаграмма по id              |
| POST   | /diagrams       | создать диаграмму            |
| PUT    | /diagrams/:id   | обновить диаграмму           |
| DELETE | /diagrams/:id   | удалить диаграмму            |

Тело запроса для POST/PUT: `{ "title": "...", "notation": "erd", "dslContent": "...", "status": "draft" }`.
