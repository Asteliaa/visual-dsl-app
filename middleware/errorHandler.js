function notFoundHandler(req, res) {
  res.status(404).json({ error: `Маршрут ${req.method} ${req.originalUrl} не найден` });
}

function errorHandler(err, req, res, next) {
  res.status(500).json({ error: err.message || "Внутренняя ошибка сервера" });
}

module.exports = { notFoundHandler, errorHandler };
