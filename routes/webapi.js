var express = require('express');
var router = express.Router();
const exec = require('child_process').exec;
require('dotenv').config();


router.get('/get/place/cnt', (req, res) => {

    let query = "SELECT * FROM t_places";
    o.mysql.query(query, (err, result) => {
        if (err) {
            res.json({status: 'ERR_MYSQL'});
            return;
        }

        res.json({status: "OK", cnt: result.length});
    })
});


router.get('/get/locations', (req, res) => {

    let query = "SELECT * FROM t_locations";
    o.mysql.query(query, (err, result) => {
        if (err) {
            res.json({ status: 'ERR_MYSQL' });
            return;
        }

        res.json({ status: 'OK', locations: result });
    });
});

router.post('/set/location', (req, res) => {
    let id = req.body.id;
    let cnt = req.body.cnt;
    if (id == 'undifined' ||id < 1 || cnt == 'undifined') {

        res.json({status: "ERR_INVALID_PARAMS"});
        return;
    }

    let query = "UPDATE t_locations SET l_find_cnt = ? WHERE l_id = ?"
    o.mysql.query(query, [cnt, id] , (err, result) => {
        if (err) {
            console.log(err);
            res.json({status: "ERR_MYSQL"});
            return;
        } else {
            res.json({status: 'OK'});
        }
    });
});


router.post('/start/crwaling', (req, res) => {

    let nId = req.body.nId;
    if (!nId) {
        res.json({status: "ERR_INVALID_PARAMS"});
        return;
    }

    let command = 'python3 ~/plapick/python/plapick.py';
    exec(command + ' ' + nId, function(error, stdout, stderr) {
        if (error) {
            console.log(error);
            console.log(stderr);
            res.json({status: "ERR_CRAWLING"});
            return;
        }

        let result = stdout.trim();
        if (result == 'NO_PLACE') {
            res.json({ status: 'ERR_NO_PLACE' });
            return;
        } else if (result == 'EXISTS') {
            res.json({ status: 'ERR_EXISTS' });
            return;
        } else if (result == 'EXCEPTION') {
            res.json({ status: 'ERR_EXCEPTION' });
            return;
        }

        res.json({ status: 'OK' });
    });

});


router.post('/admin/login', (req, res) => {
    let id = req.body.id;
    let pwd = req.body.pwd;

    if (id === process.env.ADMIN_ID && pwd === process.env.ADMIN_PWD) {
        req.session.is_admin = true;
        req.session.save(function() {
            res.json({ status: 'OK' });
        });
    } else {
        res.json({ status: 'ERR_FAILED_LOGIN' });
    }
});


module.exports = router;
