// ДОП: обработка ошибок в асинхронных обработчиках без try/catch (вопрос 14).
// Использование:
//   const asyncHandler = require('./extras/middleware/asyncHandler');
//   router.get('/slow', asyncHandler(async (req, res) => { const data = await load(); res.json(data); }));
// Отклоненный промис попадет в serverErrorHandler через next(err).
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
