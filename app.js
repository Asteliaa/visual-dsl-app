const express = require('express');
const diagramRoutes = require('./routes/diagramRoutes');

const app = express();

app.use(express.json());

if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

app.get('/', (req, res) => {
  res.json({ message: 'API Visual DSL App работает' });
});

app.use('/api/diagrams', diagramRoutes);

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

app.use((err, req, res, next) => {
  res.status(500).json({ error: 'Внутренняя ошибка сервера', message: err.message });
});

module.exports = app;