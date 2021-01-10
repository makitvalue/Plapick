var express = require('express');
var router = express.Router();
var formidable = require('formidable');
// const exec = require('child_process').exec;
// require('dotenv').config();
var request = require('request');
const pool = require('../lib/database');


// router.get('/get/place/cnt', (req, res) => {

//     let query = "SELECT * FROM t_places";
//     o.mysql.query(query, (err, result) => {
//         if (err) {
//             res.json({status: 'ERR_MYSQL'});
//             return;
//         }

//         res.json({status: "OK", cnt: result.length});
//     });
// });


// router.get('/get/locations', (req, res) => {

//     let query = "SELECT * FROM t_locations";

//     getConnection((error, conn) => { // getConnection 함수로 conn 땡겨와야됨
//         if (error) {
//             console.log(error);
//             res.json({ status: 'ERR_MYSQL_POOL' }); // 실패시 POOL 명시
//             return;
//         }

//         conn.query(query, (error, result) => {
//             if (error) {
//                 console.log(error);
//                 res.json({ status: 'ERR_MYSQL' });
//                 return;
//             }

//             let locations = result;

//             conn.query("SELECT p_id FROM t__places", (error, result) => {
//                 if (error) {
//                     console.log(error);
//                     res.json({ status: 'ERR_MYSQL' });
//                     return;
//                 }

//                 conn.release(); // 쿼리 날릴거 다 날린 후 response 주기 전 반환 필수
//                 res.json({ status: 'OK', locations: locations, places: result });
//             });
//         });
//     });
// });


// router.post('/set/location', (req, res) => {
//     let id = req.body.id;
//     let cnt = req.body.cnt;
//     if (id == 'undifined' ||id < 1 || cnt == 'undifined') {

//         res.json({status: "ERR_INVALID_PARAMS"});
//         return;
//     }

//     let query = "UPDATE t_locations SET l_find_cnt = ? WHERE l_id = ?"
//     o.mysql.query(query, [cnt, id] , (err, result) => {
//         if (err) {
//             console.log(err);
//             res.json({status: "ERR_MYSQL"});
//             return;
//         } else {
//             res.json({status: 'OK'});
//         }
//     });
// });


// router.post('/start/crwaling', (req, res) => {

//     let nId = req.body.nId;
//     if (!nId) {
//         res.json({status: "ERR_INVALID_PARAMS"});
//         return;
//     }

//     if (nId.indexOf('naver.com') != -1) {
//         let find = /\/.+?\?/g.exec(nId);
//         let reversed = [];
//         if (find) find = find[0];
//         for (let i = find.length - 2; i > 0; i--) {
//             let n = find[i];
//             if (n == '/') break;
//             reversed.push(n);
//         }
//         nId = reversed.reverse().join('');
//     }

//     let command = 'python3 ~/plapick/python/plapick.py';
//     exec(command + ' ' + nId, function(error, stdout, stderr) {
//         if (error) {
//             console.log(error);
//             console.log(stderr);
//             res.json({status: "ERR_CRAWLING"});
//             return;
//         }

//         let result = stdout.trim();
//         if (result == 'NO_PLACE') {
//             res.json({ status: 'ERR_NO_PLACE' });
//             return;
//         } else if (result == 'EXISTS') {
//             res.json({ status: 'ERR_EXISTS' });
//             return;
//         } else if (result == 'EXCEPTION') {
//             res.json({ status: 'ERR_EXCEPTION' });
//             return;
//         }

//         res.json({ status: 'OK' });
//     });

// });


// router.post('/admin/login', (req, res) => {
//     let id = req.body.id;
//     let pwd = req.body.pwd;

//     if (id === process.env.ADMIN_ID && pwd === process.env.ADMIN_PWD) {
//         req.session.is_admin = true;
//         req.session.save(function() {
//             res.json({ status: 'OK' });
//         });
//     } else {
//         res.json({ status: 'ERR_FAILED_LOGIN' });
//     }
// });


router.get('/get/places', (req, res) => {

    let keyword = req.query.keyword;

    let placeList = [];
    request.get({
        uri: 'https://dapi.kakao.com/v2/local/search/keyword.json?query=' + encodeURI(keyword) + '&page=1',
        headers: {
            Authorization: 'KakaoAK c3cc426e36dba5cd8dc4275cd6532bf0'
        }
    }, function(error, response) {
        if (error) {
            console.log(error);
            res.json({ status: 'ERR_KAKAO_PLACE' });
            return;
        }

        let result = JSON.parse(response.body);
        let isEnd = result.meta.is_end;
        placeList = placeList.concat(result.documents);

        if (isEnd) {
            res.json({ status: 'OK', result: { placeList: placeList } });
            return;
        }

        request.get({
            uri: 'https://dapi.kakao.com/v2/local/search/keyword.json?query=' + encodeURI(keyword) + '&page=2',
            headers: {
                Authorization: 'KakaoAK c3cc426e36dba5cd8dc4275cd6532bf0'
            }
        }, function(error, response) {
            if (error) {
                console.log(error);
                res.json({ status: 'ERR_KAKAO_PLACE' });
                return;
            }

            let result = JSON.parse(response.body);
            let isEnd = result.meta.is_end;
            placeList = placeList.concat(result.documents);

            if (isEnd) {
                res.json({ status: 'OK', result: { placeList: placeList } });
                return;
            }

            request.get({
                uri: 'https://dapi.kakao.com/v2/local/search/keyword.json?query=' + encodeURI(keyword) + '&page=3',
                headers: {
                    Authorization: 'KakaoAK c3cc426e36dba5cd8dc4275cd6532bf0'
                }
            }, function(error, response) {
                if (error) {
                    console.log(error);
                    res.json({ status: 'ERR_KAKAO_PLACE' });
                    return;
                }

                let result = JSON.parse(response.body);
                placeList = placeList.concat(result.documents);
                res.json({ status: 'OK', result: { placeList: placeList } });
                return;
            });
        });
    });

});


module.exports = router;
