const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
 
const { diagrams } = require('../controllers/diagramController'); 

router.get('/', (req, res) => res.render('index', { items: diagrams }));
router.get('/add', auth, (req, res) => res.render('add'));
router.post('/add', auth, (req, res) => {
    diagrams.push({ id: Date.now(), title: req.body.title, dsl: req.body.dsl });
    res.redirect('/');
});
router.get('/item/:id', (req, res) => {
    const item = diagrams.find(d => d.id == req.params.id);
    if (!item) return res.status(404).render('404');
    res.render('item', { item });
});

module.exports = router;