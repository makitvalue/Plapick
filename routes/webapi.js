var express = require('express');
var router = express.Router();
var formidable = require('formidable');
// const exec = require('child_process').exec;
var request = require('request');
var sharp = require('sharp');
var fs = require('fs');
var imageSize = require('image-size');
const pool = require('../lib/database');
const { pid } = require('process');


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


// 포스팅
router.post('/posting', (req, res) => {
    let form = new formidable.IncomingForm();
    form.encoding = 'utf-8';
    form.uploadDir = 'upload/tmp';
    form.multiples = true;
    form.keepExtensions = true;

    form.parse(req, async (error, body, files) => {
        if (error) {
            console.log(error);
            res.json({ status: 'ERR_UPLOAD' });
            return;
        }

        let uId = body.uId;
        let uType = body.uType;
        let uSocialId = body.uSocialId;
        let pId = body.pId;
        let pkId = body.pkId;
        let pName = body.pName;
        let pAddress = body.pAddress;
        let pRoadAddress = body.pRoadAddress;
        let pCategoryName = body.pCategoryName;
        let pCategoryGroupName = body.pCategoryGroupName;
        let pCategoryGroupCode = body.pCategoryGroupCode;
        let pPhone = body.pPhone;
        let pLat = body.pLat;
        let pLng = body.pLng;

        // 유저 확인
        let [result, fields] = [null, null];
        let query = "SELECT * FROM t_users WHERE u_id = ? AND u_type = ? AND u_social_id = ?";
        let params = [uId, uType, uSocialId];

        [result, fields] = await pool.query(query, params);
        if (result.length == 0) { // 존재하지 않는 유저 > 에러
            res.json({ status: 'ERR_NO_PERMISSION' });
            return;
        }

        let piId = f.generateRandomId();

        // 이미지 프로세싱
        let imagePath = `public/images/users/${uId}/${piId}.jpg`;
        let originalImagePath = `public/images/users/${uId}/original/${piId}.jpg`;
        fs.rename(files.image.path, imagePath, () => {
            fs.copyFile(imagePath, originalImagePath, async () => {

                let originalWidth = imageSize(originalImagePath).width;
                let rw = 0;
                while (true) {
                    if (fs.statSync(imagePath).size > 100000) {
                        rw += 2;
                        await sharp(originalImagePath)
                            .resize({ width: parseInt(originalWidth * ((100 - rw) / 100)) })
                            .toFile(imagePath);
                    } else { break; }
                }

                let [result, fields] = [null, null];
                query = "SELECT * FROM t_places WHERE p_k_id = ?";
                params = [pkId];

                [result, fields] = await pool.query(query, params);

                // 플레이스 새로 등록
                if (result.length == 0) {
                    query = "INSERT INTO t_places";
                    query += " (p_k_id, p_name, p_category_name, p_category_group_code, p_category_group_name,";
                    query += " p_address, p_road_address, p_latitude, p_longitude, p_geometry, p_phone)";
                    query += " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, POINT(" + pLng +", " + pLat + "), ?)";
                    params = [
                        pkId, pName, pCategoryName, pCategoryGroupCode, pCategoryGroupName,
                        pAddress, pRoadAddress, pLat, pLng, pPhone
                    ];
                    [result, fields] = await pool.query(query, params);
                    pId = result.insertId;
                }

                // 플레이스 > pickCnt 올려주고 updatedDate 갱신해주고
                query = "UPDATE t_places SET p_pick_cnt = p_pick_cnt + 1, p_updated_date = NOW() WHERE p_id = ?";
                params = [pId];
                [result, fields] = await pool.query(query, params);

                // 픽 등록
                query = "INSERT INTO t_picks (pi_id, pi_u_id, pi_p_id) VALUES (?, ?, ?)";
                params = [piId, uId, pid];
                [result, fields] = await pool.query(query, params);

                res.json({ status: 'OK' });
            });
        });
    });
});


// 로그인
router.post('/login', async (req, res) => {
    let type = req.body.type;
    let socialId = f.ntb(req.body.socialId); // null일 수 있음 (type: EMAIL)
    let profileImage = f.ntb(req.body.profileImage); // null일 수 있음 (type: KAKAO인 경우에만 가져옴)
    let email = f.ntb(req.body.email); // null일 수 있음
    let password = f.ntb(req.body.password); // null일 수 있음 (type: EMAIL인 경우에만 가져옴)
    let name = f.ntb(req.body.name); // null일 수 있음

    if (f.isNone(type)) {
        res.json({ status: 'ERR_WRONG_PARAMS' });
        return;
    }

    let [result, fields] = [null, null];
    let query = "SELECT * FROM t_users WHERE u_type LIKE ?";
    let params = [type];

    if (type === 'APPLE' || type === 'KAKAO') {
        if (f.isNone(socialId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        query += " AND u_social_id = ?";
        params.push(socialId);

    } else if (type === 'EMAIL') {
        if (f.isNone(email)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        query += " AND u_email = ?";
        params.push(email);
    }

    [result, fields] = await pool.query(query, params);

    let user = null;
    
    if (result.length == 0) { // 신규 가입
        let uId = f.generateRandomId();

        query = "";
        query += "INSERT INTO t_users";
        query += " (u_id, u_type, u_social_id, u_name, u_nick_name, u_email, u_profile_image, u_status)";
        query += " VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        params = [uId, type, socialId, name, name, email, profileImage, 'ACTIVATE'];
        [result, fields] = await pool.query(query, params);

        query = "SELECT * FROM t_users WHERE u_id = ?";
        params = [uId];
        [result, fields] = await pool.query(query, params);

        if (result.length == 0) {
            res.json({ status: 'ERR_USER' });
            return;
        }
    }

    user = result[0];

    if (!fs.existsSync('public/images/users/' + user.u_id)) {
        fs.mkdirSync('public/images/users/' + user.u_id);
    }
    if (!fs.existsSync('public/images/users/' + user.u_id + '/original')) {
        fs.mkdirSync('public/images/users/' + user.u_id + '/original');
    }

    res.json({ status: 'OK', result: { user: user } });
});


// 포스팅
router.post('/upload/test', (req, res) => {
    let form = new formidable.IncomingForm();
    form.encoding = 'utf-8';
    form.uploadDir = 'upload/tmp';
    form.multiples = true;
    form.keepExtensions = true;

    form.parse(req, (error, body, files) => {
        if (error) {
            console.log(error);
            res.json({ status: 'ERR_UPLOAD' });
            return;
        }

        res.json({ status: 'OK' });
    });
});


module.exports = router;
