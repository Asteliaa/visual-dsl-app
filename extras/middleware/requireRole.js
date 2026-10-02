// ДОП: проверка роли (имитация): ?role=admin или ?role=editor.
// Подключение к маршруту: router.get('/admin', requireRole('admin'), handler)
// Для страницы 403 используйте extras/views/403.ejs (скопируйте в views/).
module.exports = (...roles) => (req, res, next) => {
  const role = req.query.role || (req.user && req.user.isAuth ? 'admin' : 'guest');
  req.role = role;
  if (roles.includes(role)) return next();
  res.status(403).render('403', { title: 'Доступ запрещен' });
};
