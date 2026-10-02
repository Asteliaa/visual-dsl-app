// Обработчики ошибок: 404 (маршрут не найден) и 500 (исключение в приложении).
const wantsJson = (req) => req.originalUrl.startsWith('/api/');

const notFoundHandler = (req, res) => {
  if (wantsJson(req)) return res.status(404).json({ error: 'Маршрут не найден' });
  res.status(404).render('404', { title: 'Ошибка 404' });
};

// Четыре параметра - признак error-handling middleware в Express.
const serverErrorHandler = (err, req, res, next) => {
  console.error(err.stack || err);
  if (res.headersSent) return next(err);
  if (wantsJson(req)) {
    return res.status(500).json({ error: 'Внутренняя ошибка сервера', message: err.message });
  }
  res.status(500).render('500', { title: 'Ошибка 500' });
};

module.exports = { notFoundHandler, serverErrorHandler };
