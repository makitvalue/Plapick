var express = require('express');
var router = express.Router();


router.get('/', (req, res, next) => {
    res.render('index', { title: 'Express' });
});


router.get('/mobile/terms/agreement', (req, res) => {
    let theme = req.query.theme;
    res.render('agreement', { theme: theme });
});


router.get('/mobile/terms/privacy', (req, res) => {
    let theme = req.query.theme;
    res.render('privacy', { theme: theme });
});


router.get('/support', (req, res) => {
    res.render('support');
});


module.exports = router;
