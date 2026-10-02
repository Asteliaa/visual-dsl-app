// Логирование: метод, URL, статус и время обработки (мс) после отправки ответа.
// Запись попадает в журнал (таблица на странице /logs) и в консоль (кроме тестов).
const logStore = require('../models/logStore');

module.exports = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    const entry = logStore.add({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: ms,
      user: req.user ? req.user.name : 'Гость',
      ip: req.ip || '-'
    });

    if (process.env.NODE_ENV !== 'test') {
      console.log(
        `[${entry.time}] ${entry.method} ${entry.url} -> ${entry.status} (${entry.durationMs.toFixed(2)} мс)`
      );
    }
  });

  next();
};
