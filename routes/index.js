var express = require('express');
var router = express.Router();


router.get('/', (req, res, next) => {
    res.render('index', { title: 'Express' });
});


router.get('/mobile/terms/agreement', (req, res) => {
    res.render('agreement');
});


router.get('/mobile/terms/privacy', (req, res) => {
    res.render('privacy');
});


router.get('/support', (req, res) => {
    res.render('support');
});


module.exports = router;
