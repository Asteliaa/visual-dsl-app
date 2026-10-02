// ДОП: общие заголовки ответа (вопрос 20) и измерение времени запроса (вопрос 24).
// Подключение (app.js, до маршрутов):
//   const { poweredBy, responseTime } = require('./extras/middleware/headers');
//   app.use(poweredBy('VisualDSL'));
//   app.use(responseTime());          // добавит заголовок X-Response-Time: 3.21ms
const poweredBy = (name = 'VisualDSL') => (req, res, next) => {
  res.setHeader('X-Powered-By', name);
  next();
};

const responseTime = () => (req, res, next) => {
  const start = process.hrtime.bigint();
  const writeHead = res.writeHead;
  // Заголовок нужно выставить до отправки, поэтому перехватываем writeHead.
  res.writeHead = function (...args) {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    if (!res.headersSent) res.setHeader('X-Response-Time', ms.toFixed(2) + 'ms');
    return writeHead.apply(this, args);
  };
  next();
};

module.exports = { poweredBy, responseTime };
