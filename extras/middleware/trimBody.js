// ДОП: перехват и изменение req.body (вопрос 17): обрезает пробелы у всех строковых полей.
// Подключение (app.js, после express.urlencoded()/express.json()):
//   app.use(require('./extras/middleware/trimBody'));
module.exports = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === 'string') req.body[key] = req.body[key].trim();
    }
  }
  next();
};
