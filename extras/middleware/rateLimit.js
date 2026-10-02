// ДОП: ограничение частоты запросов (защита от DDoS/перебора), без сторонних пакетов.
// Подключение: app.use(require('./extras/middleware/rateLimit')({ max: 100, windowMs: 60000 }));
// Для одного маршрута: router.post('/add', rateLimit({ max: 5 }), ...)
module.exports = ({ max = 100, windowMs = 60000 } = {}) => {
  const hits = new Map(); // ip -> { count, resetAt }

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || 'unknown';
    let rec = hits.get(key);
    if (!rec || rec.resetAt <= now) {
      rec = { count: 0, resetAt: now + windowMs };
      hits.set(key, rec);
    }
    rec.count++;
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - rec.count));
    if (rec.count > max) {
      res.setHeader('Retry-After', Math.ceil((rec.resetAt - now) / 1000));
      return res.status(429).json({ error: 'Слишком много запросов' });
    }
    next();
  };
};
