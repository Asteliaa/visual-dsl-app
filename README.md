# ИТиВП, Часть 2 — Лабораторная работа 1

Серверное приложение на Node.js/Express для управления коллекцией диаграмм проекта DiagramCode.

## Запуск

```bash
npm install
npm run dev
```

Сервер поднимается на `http://localhost:3000`.

## Тесты

```bash
npm test
```

Порог покрытия — 100% (branches/functions/lines/statements), настроен в `package.json`.

## Эндпоинты

| Метод  | URL             | Описание                    |
|--------|-----------------|------------------------------|
| GET    | /diagrams       | список всех диаграмм         |
| GET    | /diagrams/:id   | диаграмма по id              |
| POST   | /diagrams       | создать диаграмму            |
| PUT    | /diagrams/:id   | обновить диаграмму           |
| DELETE | /diagrams/:id   | удалить диаграмму            |

Тело запроса для POST/PUT: `{ "title": "...", "notation": "erd", "dslContent": "..." }`.
