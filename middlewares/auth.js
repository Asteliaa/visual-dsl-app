// Имитация авторизации по query-параметру ?auth=1 (без сессий и паролей).
const GUEST = { name: 'Гость', isAuth: false };
const ADMIN = { name: 'Администратор', isAuth: true };

// Определяет пользователя и передает его в шаблоны (res.locals).
const attachUser = (req, res, next) => {
  req.user = req.query.auth === '1' ? ADMIN : GUEST;
  res.locals.user = req.user;
  // Суффикс для ссылок, чтобы "авторизация" сохранялась при переходах по сайту.
  res.locals.authQuery = req.user.isAuth ? '?auth=1' : '';
  next();
};

// Защита маршрута: гость перенаправляется на /login.
const requireAuth = (req, res, next) => {
  if (req.user && req.user.isAuth) return next();
  res.redirect('/login');
};

module.exports = { attachUser, requireAuth };
