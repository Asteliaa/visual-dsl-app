const express = require('express');
const { requireAuth } = require('../middlewares/auth');
const pages = require('../controllers/pageController');

const router = express.Router();

router.get('/', pages.index);
router.get('/item/:id', pages.item);
router.get('/login', pages.login);
router.get('/logs', pages.logs);
// Middleware requireAuth выполняется только для этих маршрутов.
router.get('/add', requireAuth, pages.addForm);
router.post('/add', requireAuth, pages.addSubmit);

if (process.env.NODE_ENV !== 'production') {
  router.get('/debug/error', pages.crash);
}

module.exports = router;
