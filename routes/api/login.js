var express = require('express');
var router = express.Router();
const { ntb, isNone, generateRandomId } = require('../../lib/common');
const pool = require('../../lib/database');
var fs = require('fs');


// 로그인
router.post('', async (req, res) => {
    try {
        let type = req.body.type;
        let socialId = ntb(req.body.socialId); // null일 수 있음 (type: EMAIL)
        let profileImage = ntb(req.body.profileImage); // null일 수 있음 (type: KAKAO인 경우에만 가져옴)
        let email = ntb(req.body.email); // null일 수 있음
        let password = ntb(req.body.password); // null일 수 있음 (type: EMAIL인 경우에만 가져옴)
        let name = ntb(req.body.name); // null일 수 있음
        let device = req.body.device;

        if (isNone(type) || isNone(device)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (type != 'EMAIL' && type != 'KAKAO' && type != 'NAVER' && type != 'APPLE') {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (device != 'IOS' && device != 'ANDROID') {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        let [result, fields] = [null, null];
        let query = "SELECT * FROM t_users WHERE u_type LIKE ?";
        let params = [type];

        if (type === 'APPLE' || type === 'KAKAO' || type == 'NAVER') {
            if (isNone(socialId)) {
                res.json({ status: 'ERR_WRONG_PARAMS' });
                return;
            }

            query += " AND u_social_id = ?";
            params.push(socialId);

        } else if (type === 'EMAIL') {
            if (isNone(email) || isNone(password)) {
                res.json({ status: 'ERR_WRONG_PARAMS' });
                return;
            }

            query += " AND u_email = ? AND u_password = ?";
            params.push(email);
            params.push(password);
        }

        // SELECT t_users
        [result, fields] = await pool.query(query, params);

        let user = null;

        if (result.length == 0) {
            // 신규 가입
            let nickName = name;
            let uId = generateRandomId();

            if (type == 'EMAIL') {
                // nickName 길이 체크
                // nickName 중복 체크
                // 이메일 정규식 체크
                // 비밀번호 정규식 체크

            } else {
                // nickName 길이 길면 임의변경
                // nickName 중복되면 임의변경
            }

            query = "INSERT INTO t_users";
            query += " (u_id, u_type, u_social_id, u_name, u_nick_name, u_email, u_profile_image, u_status, u_device)";
            query += " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
            params = [uId, type, socialId, name, nickName, email, profileImage, 'ACTIVATE', device];
            [result, fields] = await pool.query(query, params);

            query = "SELECT * FROM t_users WHERE u_id = ?";
            params = [uId];
            [result, fields] = await pool.query(query, params);
            user = result[0];

        } else {
            // 기존 회원임, 마지막 접속시간 / 접속 디바이스 업데이트
            user = result[0];
            query = "UPDATE t_users SET u_is_logined = 'Y', u_device = ?, u_connected_date = NOW() WHERE u_id = ?";
            params = [device, user.u_id];
            [result, fields] = await pool.query(query, params);
        }

        // 사용자 폴더 없으면 생성해주기
        if (!fs.existsSync(`public/images/users/${user.u_id}`)) {
            fs.mkdirSync(`public/images/users/${user.u_id}`);
        }
        if (!fs.existsSync(`public/images/users/${user.u_id}/original`)) {
            fs.mkdirSync(`public/images/users/${user.u_id}/original`);
        }

        // 세션 생성
        req.session.isLogined = true;
        req.session.uId = user.u_id;
        req.session.uType = user.u_type;
        req.session.save(() => {
            res.json({ status: 'OK', result: user });
        });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;