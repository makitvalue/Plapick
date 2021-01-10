var express = require('express');
var router = express.Router();


// router.get('/login', function(req, res) {
//     res.render('admin/index', { menu: 'login' })
// });


// router.get('/', function(req, res) {
//     if (!req.session.is_admin) {
//         res.redirect('/admin/login');
//         return;
//     }

//     res.render('admin/index', { menu: 'main' });
// });


module.exports = router;
