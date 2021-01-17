var express = require('express');
var router = express.Router();
var formidable = require('formidable');
// const exec = require('child_process').exec;
var request = require('request');
var sharp = require('sharp');
var fs = require('fs');
var imageSize = require('image-size');
const pool = require('../lib/database');
const locations = require('../lib/locations');
const apn = require('apn');
const { pid } = require('process');


// 플레이스 검색
router.get('/get/places', (req, res) => {
    let keyword = req.query.keyword;

    let placeList = [];
    request.get({
        uri: 'https://dapi.kakao.com/v2/local/search/keyword.json?query=' + encodeURI(keyword) + '&page=1',
        headers: {
            Authorization: 'KakaoAK c3cc426e36dba5cd8dc4275cd6532bf0'
        }
    }, async (error, response) => {
        if (error) {
            console.log(error);
            res.json({ status: 'ERR_KAKAO_PLACE' });
            return;
        }

        let data = JSON.parse(response.body);
        let isEnd = data.meta.is_end;
        placeList = placeList.concat(data.documents);

        if (isEnd) {
            placeList = await contextPlaceList(placeList);
            res.json({ status: 'OK', result: placeList });
            return;
        }

        request.get({
            uri: 'https://dapi.kakao.com/v2/local/search/keyword.json?query=' + encodeURI(keyword) + '&page=2',
            headers: {
                Authorization: 'KakaoAK c3cc426e36dba5cd8dc4275cd6532bf0'
            }
        }, async (error, response) => {
            if (error) {
                console.log(error);
                res.json({ status: 'ERR_KAKAO_PLACE' });
                return;
            }

            data = JSON.parse(response.body);
            isEnd = data.meta.is_end;
            placeList = placeList.concat(data.documents);

            if (isEnd) {
                placeList = await contextPlaceList(placeList);
                res.json({ status: 'OK', result: placeList });
                return;
            }

            request.get({
                uri: 'https://dapi.kakao.com/v2/local/search/keyword.json?query=' + encodeURI(keyword) + '&page=3',
                headers: {
                    Authorization: 'KakaoAK c3cc426e36dba5cd8dc4275cd6532bf0'
                }
            }, async (error, response) => {
                if (error) {
                    console.log(error);
                    res.json({ status: 'ERR_KAKAO_PLACE' });
                    return;
                }

                data = JSON.parse(response.body);
                placeList = placeList.concat(data.documents);
                placeList = await contextPlaceList(placeList);

                res.json({ status: 'OK', result: placeList });
                return;
            });
        });
    });

});


// kakao에서 가져온 placeList들 쿼리 날려 p_id, p_like_cnt, p_pick_cnt 가져오기
async function contextPlaceList(placeList) {
    let query = "SELECT * FROM t_places";
    let params = [];
    for (let i = 0; i < placeList.length; i++) {
        let place = placeList[i];
        place.p_id = 0;
        place.p_like_cnt = 0;
        place.p_pick_cnt = 0;
        if (i == 0) query += " WHERE p_k_id = ?";
        else query += " OR p_k_id = ?";
        params.push(place.id);
    }
    let [_placeList, fields] = await pool.query(query, params);
    for (let i = 0; i < _placeList.length; i++) {
        let _place = _placeList[i];
        for (let j = 0; j < placeList.length; j++) {
            let place = placeList[j];
            if (place.id == _place.p_k_id) {
                place.p_id = _place.p_id;
                place.p_like_cnt = _place.p_like_cnt;
                place.p_pick_cnt = _place.p_pick_cnt;
                break;
            }
        }
    }
    return placeList;
}


// 사용자 픽 가져오기
router.get('/get/user/picks', async (req, res) => {
    if (!f.isLogined(req.session)) {
        res.json({ status: 'ERR_NO_PERMISSION' });
        return;
    }

    let uId = req.query.uId;

    let query = "SELECT * FROM t_picks WHERE pi_u_id = ?";
    let params = [uId];
    let [result, fields] = await pool.query(query, params);

    let pickList = result;
    res.json({ status: 'OK', result: pickList });
});


// 이미지 업로드
router.post('/upload/image', (req, res) => {
    if (!f.isLogined(req.session)) {
        res.json({ status: 'ERR_NO_PERMISSION' });
        return;
    }

    let form = new formidable.IncomingForm();
    form.encoding = 'utf-8';
    form.uploadDir = 'upload/tmp';
    form.multiples = true;
    form.keepExtensions = true;
    
    let uId = req.session.uId;

    form.parse(req, (error, body, files) => {
        if (error) {
            console.log(error);
            res.json({ status: 'ERR_UPLOAD' });
            return;
        }

        let imageName = f.generateRandomId();

        // 이미지 프로세싱
        let imagePath = `public/images/users/${uId}/${imageName}.jpg`;
        let originalImagePath = `public/images/users/${uId}/original/${imageName}.jpg`;
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

                res.json({ status: 'OK', result: parseInt(imageName) });
            });
        });
    });
});


// 픽 추가
router.post('/add/pick', async (req, res) => {
    if (!f.isLogined(req.session)) {
        res.json({ status: 'ERR_NO_PERMISSION' });
        return;
    }

    let uId = req.session.uId;
    let piId = req.body.piId;
    let piMessage = req.body.piMessage;
    let pkId = req.body.pkId;
    let pName = req.body.pName;
    let pAddress = req.body.pAddress;
    let pRoadAddress = req.body.pRoadAddress;
    let pCategoryName = req.body.pCategoryName;
    let pCategoryGroupName = req.body.pCategoryGroupName;
    let pCategoryGroupCode = req.body.pCategoryGroupCode;
    let pPhone = req.body.pPhone;
    let pLat = req.body.pLat;
    let pLng = req.body.pLng;

    if (f.isNone(piId) || f.isNone(pkId) || f.isNone(pName) || f.isNone(pLat) || f.isNone(pLng)) {
        res.json({ status: 'ERR_WRONG_PARAMS' });
        return;
    }

    let [result, fields] = [null, null];
    let query = "SELECT * FROM t_places WHERE p_k_id = ?";
    let params = [pkId];

    [result, fields] = await pool.query(query, params);

    let pId = 0;
    
    // 플레이스 새로 등록
    if (result.length == 0) {

        // 지역코드 찾기
        let [pPlocCode, pClocCode] = getLocCode(pAddress, pRoadAddress);

        query = "INSERT INTO t_places";
        query += " (p_k_id, p_name, p_category_name, p_category_group_code, p_category_group_name, p_address,";
        query += " p_road_address, p_latitude, p_longitude, p_geometry, p_phone, p_ploc_code, p_cloc_code)";
        query += " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, POINT(" + pLng +", " + pLat + "), ?, ?, ?)";
        params = [
            pkId, pName, pCategoryName, pCategoryGroupCode, pCategoryGroupName,
            pAddress, pRoadAddress, pLat, pLng, pPhone, pPlocCode, pClocCode
        ];
        [result, fields] = await pool.query(query, params);
        pId = result.insertId;
    } else {
        pId = result[0].p_id;
    }

    // 플레이스 > pickCnt 올려주고 updatedDate 갱신해주고
    query = "UPDATE t_places SET p_pick_cnt = p_pick_cnt + 1, p_updated_date = NOW() WHERE p_id = ?";
    params = [pId];
    [result, fields] = await pool.query(query, params);

    // 픽 등록
    query = "INSERT INTO t_picks (pi_id, pi_u_id, pi_p_id, pi_message) VALUES (?, ?, ?, ?)";
    params = [piId, uId, pId, piMessage];
    [result, fields] = await pool.query(query, params);

    res.json({ status: 'OK' });
});


// 버전 확인
router.get('/get/version', (req, res) => {
    if (!f.isLogined(req.session)) {
        res.json({ status: 'ERR_NO_PERMISSION' });
        return;
    }

    let platform = req.query.platform;
    if (f.isNone(platform) || (platform != 'IOS' && platform != 'ANDROID')) {
        res.json({ status: 'ERR_WRONG_PARAMS' });
        return;
    }
    let [version, build] = fs.readFileSync('mobile_app_versions/' + platform).toString().split('\n');
    version = version.trim();
    build = build.trim();
    res.json({ status: 'OK', result: { version: version, build: parseInt(build) } });
});


// 로그인
router.post('/login', async (req, res) => {
    let type = req.body.type;
    let socialId = f.ntb(req.body.socialId); // null일 수 있음 (type: EMAIL)
    let profileImage = f.ntb(req.body.profileImage); // null일 수 있음 (type: KAKAO인 경우에만 가져옴)
    let email = f.ntb(req.body.email); // null일 수 있음
    let password = f.ntb(req.body.password); // null일 수 있음 (type: EMAIL인 경우에만 가져옴)
    let name = f.ntb(req.body.name); // null일 수 있음
    // let push = req.body.push;
    let device = req.body.device;
    // let deviceToken = req.body.deviceToken;

    if (f.isNone(type) || f.isNone(device)) {
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

        query = "INSERT INTO t_users";
        query += " (u_id, u_type, u_social_id, u_name, u_nick_name, u_email, u_profile_image, u_status, u_device)";
        query += " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        params = [uId, type, socialId, name, name, email, profileImage, 'ACTIVATE', device];
        [result, fields] = await pool.query(query, params);

        query = "SELECT * FROM t_users WHERE u_id = ?";
        params = [uId];
        [result, fields] = await pool.query(query, params);

        if (result.length == 0) {
            res.json({ status: 'ERR_NO_USER' });
            return;
        }

        user = result[0];
    
    } else { // 마지막 접속시간 / 접속 디바이스 업데이트
        user = result[0];
        query = "UPDATE t_users SET u_is_logined = 'Y', u_device = ?, u_connected_date = NOW() WHERE u_id = ?";
        params = [device, user.u_id];
        [result, fields] = await pool.query(query, params);
    }

    // 푸시 허용 / 디바이스 토큰이 왔다면
    // if (push == 'Y' && deviceToken != '') {
    //     // 디바이스 등록
    //     query = "SELECT * FROM t_devices WHERE d_id = ? AND d_u_id = ?";
    //     params = [deviceToken, user.u_id];
    //     [result, fields] = await pool.query(query, params);
    
    //     if (result.length == 0) { // 등록된 디바이스가 없다면
    //         query = "INSERT INTO t_devices (d_id, d_u_id) VALUES (?, ?)";
    //         [result, fields] = await pool.query(query, params);
    //     }
    // }

    if (!fs.existsSync(`public/images/users/${user.u_id}`)) {
        fs.mkdirSync(`public/images/users/${user.u_id}`);
    }
    if (!fs.existsSync(`public/images/users/${user.u_id}/original`)) {
        fs.mkdirSync(`public/images/users/${user.u_id}/original`);
    }

    req.session.isLogined = true;
    req.session.uId = user.u_id;
    req.session.uType = user.u_type;
    req.session.uSocialId = user.u_social_id;
    req.session.save(() => {
        res.json({ status: 'OK', result: user });
    });
});


// 로그아웃
router.post('/logout', async (req, res) => {
    if (!f.isLogined(req.session)) {
        res.json({ status: 'ERR_NO_PERMISSION' });
        return;
    }

    let uId = req.session.uId;

    let query = "UPDATE t_users SET u_is_logined = 'N' WHERE u_id = ?";
    let params = [uId];

    let [result, fields] = await pool.query(query, params);

    req.session.destroy(() => {
        res.json({ status: 'OK' });
    });
});


// 내 프로필 가져오기
router.get('/get/my/profile', async (req, res) => {
    if (!f.isLogined(req.session)) {
        res.json({ status: 'ERR_NO_PERMISSION' });
        return;
    }

    let uId = req.session.uId;

    let query = "SELECT * FROM t_users WHERE u_id = ?";
    let params = [uId];

    let [result, fields] = await pool.query(query, params);

    if (result.length == 0) {
        res.json({ status: 'ERR_NO_USER' });
        return;
    }

    let user = result[0];
    res.json({ status: 'OK', result: user });
});


// 내 프로필 정보 변경
router.post('/set/my/profile', async (req, res) => {
    if (!f.isLogined(req.session)) {
        res.json({ status: 'ERR_NO_PERMISSION' });
        return;
    }

    let uId = req.session.uId;
    let isUploadProfileImage = req.body.isUploadProfileImage;
    let isRemoveProfileImage = req.body.isRemoveProfileImage;
    let nickName = req.body.nickName;
    let imageName = req.body.imageName;

    if (f.isNone(isUploadProfileImage) || f.isNone(isRemoveProfileImage) || f.isNone(nickName)) {
        res.json({ status: 'ERR_WRONG_PARAMS' });
        return;
    }

    // TRIM
    nickName = nickName.trim();
    if (f.isNone(nickName)) {
        res.json({ status: 'ERR_WRONG_PARAMS' });
        return;
    }

    // 이미지가 업로드되면서 삭제도 되었을 때 (일어나서는 안될 상황)
    if (isUploadProfileImage == 'Y' && isRemoveProfileImage == 'Y') {
        res.json({ status: 'ERR_WRONG_PARAMS' });
        return;
    }

    // 이미지가 업로드되었는데 들어온 이미지이름이 없을 때
    if (isUploadProfileImage == 'Y' && f.isNone(imageName)) {
        res.json({ status: 'ERR_WRONG_PARAMS' });
        return;
    }

    let [result, fields] = [null, null];

    let query = "SELECT * FROM t_users WHERE u_id = ?";
    let params = [uId];
    [result, fields] = await pool.query(query, params);

    if (result.length == 0) {
        res.json({ status: 'ERR_PERMISSION' });
        return;
    }

    // query = "SELECT * FROM t_users WHERE u_id != ? AND u_nick_name LIKE ?";
    // params = [uId, nickName];
    // [result, fields] = await pool.query(query, params);

    // if (result.length > 0) {
    //     res.json({ status: 'EXISTS_NICKNAME' });
    //     return;
    // }

    let user = result[0];

    // 기존 프로필 이미지가 변경되거나 지워짐 (기존 프로필 이미지 삭제해야됨)
    if (isUploadProfileImage == 'Y' || isRemoveProfileImage == 'Y') {
        if (user.u_profile_image != '') {
            if (fs.existsSync('public' + user.u_profile_image)) {
                fs.unlinkSync('public' + user.u_profile_image);
                let imageName = user.u_profile_image.replace('/images/users/' + uId + '/', '');
                if (fs.existsSync('public/images/users/' + uId + '/original/' + imageName)) {
                    fs.unlinkSync('public/images/users/' + uId + '/original/' + imageName);
                }
            }
        }
    }
    
    query = "UPDATE t_users SET u_nick_name = ?";
    params = [nickName];

    // 새로운 프로필 이미지가 업로드되었을 경우
    if (isUploadProfileImage == 'Y') {
        query += ", u_profile_image = ?";
        params.push('/images/users/' + uId + '/' + imageName + '.jpg');
    }

    // 프로필 이미지가 삭제되었을 경우
    if (isRemoveProfileImage == 'Y') {
        query += ", u_profile_image = ''";
    }

    query += ", u_updated_date = NOW() WHERE u_id = ?";
    params.push(uId);

    [result, fields] = await pool.query(query, params);

    query = "SELECT * FROM t_users WHERE u_id = ?";
    params = [uId];

    [result, fields] = await pool.query(query, params);

    user = result[0];
    res.json({ status: 'OK', result: user });
});


router.get('/check/nickname', async (req, res) => {
    if (!f.isLogined(req.session)) {
        res.json({ status: 'ERR_NO_PERMISSION' });
        return;
    }

    let uId = req.session.uId;
    let nickName = req.query.nickName;

    if (f.isNone(nickName)) {
        res.json({ status: 'ERR_WRONG_PARAMS' });
        return;
    }

    let query = "SELECT * FROM t_users WHERE u_id != ? AND u_nick_name = ?";
    let params = [uId, nickName];

    let [result, fields] = await pool.query(query, params);

    if (result.length > 0) {
        res.json({ status: 'EXISTS_NICK_NAME' });
        return;
    }

    res.json({ status: 'OK' });
});


router.post('/add/push/notification/device', async (req, res) => {
    if (!f.isLogined(req.session)) {
        res.json({ status: 'ERR_NO_PERMISSION' });
        return;
    }

    let uId = req.session.uId;
    let deviceId = req.body.deviceId;
    let device = req.body.device;

    if (f.isNone(deviceId) || f.isNone(device)) {
        res.json({ status: 'ERR_WRONG_PARAMS' });
        return;
    }

    let query = "SELECT * FROM t_push_notification_devices WHERE pnd_id = ? AND pnd_u_id = ? AND pnd_device = ?";
    let params = [deviceId, uId, device];
    let [result, fields] = await pool.query(query, params);

    if (result.length == 0) {
        query = "INSERT INTO t_push_notification_devices (pnd_id, pnd_u_id, pnd_device) VALUES (?, ?, ?)";
        params = [deviceId, uId, device];
        [result, fields] = await pool.query(query, params);
    }

    res.json({ status: 'OK' });
});


router.post('/set/push/notification', async (req, res) => {
    if (!f.isLogined(req.session)) {
        res.json({ status: 'ERR_NO_PERMISSION' });
        return;
    }

    let uId = req.session.uId;
    let action = req.body.action;
    let isAllowed = req.body.isAllowed;
    let deviceId = req.body.deviceId;
    
    if (f.isNone(action) || f.isNone(isAllowed) || f.isNone(deviceId)) {
        res.json({ status: 'ERR_WRONG_PARAMS' });
        return;
    }

    let query = "";
    query += "UPDATE t_push_notification_devices SET";
    if (action == 'MY_PICK_COMMENT') {
        query += " pnd_is_allowed_my_pick_comment";
    } else if (action == 'RECOMMENDED_PLACE') {
        query += " pnd_is_allowed_recommended_place";
    } else if (action == 'AD') {
        query += " pnd_is_allowed_ad";
    } else if (action == 'EVENT_NOTICE') {
        query += " pnd_is_allowed_event_notice";
    }
    query += " = ? WHERE pnd_u_id = ? AND pnd_id = ?";
    let params = [isAllowed, uId, deviceId];

    let [result, fields] = await pool.query(query, params);

    res.json({ status: 'OK' });
});


router.get('/get/push/notification', async (req, res) => {
    if (!f.isLogined(req.session)) {
        res.json({ status: 'ERR_NO_PERMISSION' });
        return;
    }

    let uId = req.session.uId;
    let deviceId = req.query.deviceId;

    let query = "SELECT * FROM t_push_notification_devices WHERE pnd_id = ? AND pnd_u_id = ?";
    let params = [deviceId, uId];

    let [result, fields] = await pool.query(query, params);

    if (result.length == 0) {
        res.json({ status: 'ERR_NO_PUSH_NOTIFICATION_DEVICE' });
        return;
    }

    let pushNotificationDevice = result[0];
    res.json({ status: 'OK', result: pushNotificationDevice });
});


router.get('/get/place', async (req, res) => {
    if (!f.isLogined(req.session)) {
        res.json({ status: 'ERR_NO_PERMISSION' });
        return;
    }

    let pId = req.query.pId;

    if (f.isNone(pId)) {
        res.json({ status: 'ERR_WRONG_PARAMS' });
        return;
    }

    let query = "SELECT * FROM t_places WHERE p_id = ?";
    let params = [pId];
    let [result, fields] = await pool.query(query, params);

    if (result.length == 0) {
        res.json({ status: 'ERR_NO_PLACE' });
        return;
    }

    let place = result[0];
    res.json({ status: 'OK', result: place });
});


// 업로드 테스트 (재현이용)
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


// 푸시 테스트 (전체)
router.get('/push/test/all', async (req, res) => {

    let alert = req.query.alert;

    let option = {
        gateway: 'gateway.sandbox.push.apple.com',
        cert: 'certs/plapickCer.pem',
        key: 'certs/plapickKey.unencrypted.pem'
    };
    let apnProvider = apn.Provider(option);

    let query = "SELECT * FROM t_users AS uTab LEFT JOIN";
    query += " (SELECT pnd_u_id, GROUP_CONCAT(CONCAT_WS(':', pnd_id, pnd_device) SEPARATOR '|') AS devices";
    query += " FROM t_push_notification_devices GROUP BY pnd_u_id)";
    query += " AS pndTab ON uTab.u_id = pndTab.pnd_u_id WHERE u_is_logined LIKE 'Y' AND u_status LIKE 'ACTIVATE'";

    let [userList, fields] = await pool.query(query);

    let iosList = [];
    let androidList = [];
    for (let i = 0; i < userList.length; i++) {
        let user = userList[i];
        let devices = user.devices;

        if (!devices) continue;

        let splittedDevices = devices.split('|');

        for (let j = 0; j < splittedDevices.length; j++) {
            let device = splittedDevices[j];
            let splittedDevice = device.split(':');
            let dId = splittedDevice[0];
            let dDevice = splittedDevice[1];
            
            if (dDevice == 'IOS') {
                iosList.push(dId);
            } else if (dDevice == 'ANDROID') {
                androidList.push(dId);
            }
        }
    }

    let note = new apn.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 3600;
    note.badge = 1;
    note.sound = 'ping.aiff';
    note.alert = alert;
    note.payload = { 'messageFrom': "메시지ㅎㅎ" };
    note.topic = 'com.logicador.Plapick';

    let result = await apnProvider.send(note, iosList);
    console.log(result);

    res.json({ status: 'OK' });
});


// 지역코드 가져오기
function getLocCode(address, roadAddress) {
    let pPlocCode = '';
    let pClocCode = '';

    let pAddress = '경기 가평군 상면 행현리 623-3';
    let pRoadAddress = '경기 가평군 상면 수목원로 432';
    let splitedAddress = pAddress.split(' ');
    let splitedRoadAddress = pRoadAddress.split(' ');

    for (let key in locations.parentLocations) {
        if (splitedAddress.length < 1) break;

        let pname = splitedAddress[0];

        let value = locations.parentLocations[key];

        let code = key;
        let name = value.name;
        let mname = value.mname;
        let sname = value.sname;

        if (name == pname || mname == pname || sname == pname) {
            pPlocCode = code;
            break;
        }
    }

    if (pPlocCode == '') {
        for (let key in locations.parentLocations) {
            if (splitedRoadAddress.length < 1) break;

            let pname = splitedRoadAddress[0];

            let code = key;
            let name = value.name;
            let mname = value.mname;
            let sname = value.sname;

            if (name == pname || mname == pname || sname == pname) {
                pPlocCode = code;
                break;
            }
        }
    }

    let selectedChildLocations = locations.childLocations[pPlocCode];
    
    for (let i in selectedChildLocations) {
        if (splitedAddress.length < 2) break;

        let cloc = selectedChildLocations[i];

        let cname = splitedAddress[1];

        let code = cloc.code;
        let name = cloc.name;
        let sname = cloc.sname;

        if (name == cname || sname == cname) {
            pClocCode = code;
            break;
        }
    }

    if (pClocCode == '') {
        for (let i in selectedChildLocations) {
            if (splitedRoadAddress.length < 2) break;

            let cloc = selectedChildLocations[i];
    
            let cname = splitedRoadAddress[1];

            let code = cloc.code;
            let name = cloc.name;
            let sname = cloc.sname;

            if (name == cname || sname == cname) {
                pClocCode = code;
                break;
            }
        }
    }

    return [pPlocCode, pClocCode];
}


module.exports = router;
