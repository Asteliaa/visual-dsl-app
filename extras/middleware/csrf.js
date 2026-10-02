// ДОП: простая защита от CSRF по схеме double-submit cookie (вопрос 25).
// Подключение (app.js, после express.urlencoded()):
//   app.use(require('./extras/middleware/csrf'));
// В форму добавьте скрытое поле:  <input type="hidden" name="_csrf" value="<%= csrfToken %>">
const crypto = require('crypto');

const readCookie = (req, name) => {
  const m = (req.headers.cookie || '').match(new RegExp('(?:^|; )' + name + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]) : null;
};

module.exports = (req, res, next) => {
  let token = readCookie(req, 'csrf');
  if (!token) {
    token = crypto.randomBytes(16).toString('hex');
    res.setHeader('Set-Cookie', `csrf=${token}; HttpOnly; SameSite=Strict; Path=/`);
  }
  res.locals.csrfToken = token;

  const unsafe = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  if (unsafe && !(req.body && req.body._csrf === token)) {
    return res.status(403).send('Неверный CSRF-токен');
  }
  next();
};
