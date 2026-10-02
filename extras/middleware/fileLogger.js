// ДОП: запись журнала запросов в файл (одна JSON-строка на запрос).
// Подключение (app.js, после logger):
//   app.use(require('./extras/middleware/fileLogger')('logs/requests.log'));
// Папку logs/ добавьте в .gitignore.
const fs = require('fs');
const path = require('path');

module.exports = (file = 'logs/requests.log') => {
  const target = path.resolve(file);
  fs.mkdirSync(path.dirname(target), { recursive: true });

  return (req, res, next) => {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      const line = JSON.stringify({
        time: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        ms: Number((Number(process.hrtime.bigint() - start) / 1e6).toFixed(2))
      });
      fs.appendFile(target, line + '\n', () => {});
    });
    next();
  };
};
