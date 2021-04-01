var express = require('express');
var router = express.Router();
const { isLogined, getPlatform, generateRandomId, isNone } = require('../../lib/common');
const pool = require('../../lib/database');
var fs = require('fs');


router.post('', async (req, res) => {
    try {
        let plapickKey = req.body.plapickKey;
        let platform = getPlatform(plapickKey);
        if (platform === '') {
            res.json({ status: 'ERR_PLAPICK_KEY' });
            return;
        }

        let userType = req.body.userType;
        let phoneNumber = req.body.phoneNumber;
        let socialId = req.body.socialId;
        let email = req.body.email;
        let password = req.body.password;
        let nickname = req.body.nickname;

        if (isNone(userType) || isNone(phoneNumber) || isNone(nickname)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (userType != 'EMAIL' && userType != 'KAKAO' && userType != 'APPLE') {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        let query = "SELECT * FROM t_users WHERE u_nickname LIKE ?";
        let params = [nickname];
        let [result, fields] = await pool.query(query, params);

        if (result.length > 0) {
            res.json({ status: 'EXISTS_NICKNAME' });
            return;
        }

        if (userType === 'EMAIL') { // 이메일 회원가입일 경우 email 중복검사
            if (isNone(email) || isNone(password)) {
                res.json({ status: 'ERR_WRONG_PARAMS' });
                return;
            }

            query = "SELECT * FROM t_users WHERE u_type LIKE 'EMAIL' AND u_email LIKE ?";
            params = [email];
            [result, fields] = await pool.query(query, params);

            if (result.length > 0) {
                res.json({ status: 'EXISTS_EMAIL' });
                return;
            }

        } else {
            if (isNone(socialId)) {
                res.json({ status: 'ERR_WRONG_PARAMS' });
                return;
            }

            query = "SELECT * FROM t_users WHERE u_social_id LIKE ?";
            pararms = [socialId];
            [result, fields] = await pool.query(query, params);

            if (result.length > 0) {
                res.json({ status: 'EXISTS_SOCIAL_ID' });
                return;
            }
        }

        let uId = generateRandomId();

        query = "INSERT INTO t_users (u_id, u_type, u_phone_number, u_social_id, u_email, u_password, u_nickname, u_last_login_platform) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        params = [uId, userType, phoneNumber, socialId, email, password, nickname, platform];
        await pool.query(query, params);

        query = "SELECT * FROM t_users WHERE u_id = ?";
        params = [uId];
        [result, fields] = await pool.query(query, params);

        if (result.length == 0) {
            res.json({ status: 'ERR_NO_USER' });
            return;
        }

        let user = result[0];
        user.u_follower_cnt = 0;
        user.u_following_cnt = 0;
        user.u_posts_cnt = 0;
        user.u_place_cnt = 0;
        user.u_like_pick_cnt = 0;
        user.u_like_place_cnt = 0;
        user.u_is_followed = 'N';
        user.u_is_blocked = 'N';

        // 폴더 생성
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
