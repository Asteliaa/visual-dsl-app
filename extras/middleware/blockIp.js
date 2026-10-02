// ДОП: блокировка запросов с указанных IP-адресов (вопрос 28).
// Подключение (app.js, до маршрутов):
//   const blockIp = require('./extras/middleware/blockIp');
//   app.use(blockIp(['203.0.113.5', '::ffff:10.0.0.7']));
// За прокси добавьте: app.set('trust proxy', true);
module.exports = (blacklist = []) => (req, res, next) => {
  const ip = req.ip || '';
  const blocked = blacklist.some((b) => ip === b || ip === '::ffff:' + b);
  if (!blocked) return next();
  if (req.originalUrl.startsWith('/api/')) return res.status(403).json({ error: 'Доступ запрещен' });
  res.status(403).render('403', { title: 'Доступ запрещен' });
};
