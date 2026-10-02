const path = require('path');
const express = require('express');
const logger = require('./middlewares/logger');
const { attachUser } = require('./middlewares/auth');
const { notFoundHandler, serverErrorHandler } = require('./middlewares/errorHandlers');
const pageRoutes = require('./routes/pageRoutes');
const diagramRoutes = require('./routes/diagramRoutes');

const app = express();

// Шаблонизатор EJS.
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Helper для шаблонов: форматирование даты.
app.locals.formatDate = (iso) => new Date(iso).toLocaleString('ru-RU');

// Статика подключается до маршрутов, чтобы файлы отдавались без лишних проверок.
app.use('/static', express.static(path.join(__dirname, 'public')));

app.use(logger);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(attachUser);

app.use('/', pageRoutes);
app.use('/api/diagrams', diagramRoutes);

// Обработчики ошибок идут последними.
app.use(notFoundHandler);
app.use(serverErrorHandler);

module.exports = app;
