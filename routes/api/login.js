var express = require('express');
var router = express.Router();
const { ntb, isNone, generateRandomId, getPlatform, isValidStrLength, generateRandomNickName } = require('../../lib/common');
const pool = require('../../lib/database');
var fs = require('fs');


// 로그인
router.post('', async (req, res) => {
    try {
        let plapickKey = req.body.plapickKey;
        let platform = getPlatform(plapickKey);
        if (platform === '') {
            res.json({ status: 'ERR_PLAPICK_KEY' });
            return;
        }

        let userType = req.body.userType;
        let socialId = req.body.socialId;
        let email = req.body.email;
        let password = req.body.password;

        if (isNone(userType)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (userType != 'EMAIL' && userType != 'KAKAO' && userType != 'APPLE') {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        let query = "";
        let params = [];
        let [result, fields] = [null, null];
        let user = null;

        if (userType === 'EMAIL') {
            if (isNone(email) || isNone(password)) {
                res.json({ status: 'ERR_WRONG_PARAMS' });
                return;
            }

            query = " SELECT uTab.*,";
            query += " (SELECT COUNT(*) FROM t_follow WHERE f_target_u_id = uTab.u_id) AS u_follower_cnt,";
            query += " (SELECT COUNT(*) FROM t_follow WHERE f_u_id = uTab.u_id) AS u_following_cnt,";
            query += " (SELECT COUNT(*) FROM t_posts WHERE po_u_id = uTab.u_id) AS u_posts_cnt,";
            query += " (SELECT COUNT(DISTINCT po_p_id) FROM t_posts WHERE po_u_id = uTab.u_id) AS u_place_cnt,";
            query += " (SELECT COUNT(*) FROM t_maps_like_pick WHERE mlpi_u_id = uTab.u_id) AS u_like_pick_cnt,";
            query += " (SELECT COUNT(*) FROM t_maps_like_place WHERE mlp_u_id = uTab.u_id) AS u_like_place_cnt";
            query += " FROM t_users AS uTab";
            query += " WHERE uTab.u_email LIKE ? AND uTab.u_password LIKE ?";
            params = [email, password];

            [result, fields] = await pool.query(query, params);

            if (result.length == 0) {
                res.json({ status: 'LOGIN_FAILED' });
                return;
            }

        } else {
            if (isNone(socialId)) {
                res.json({ status: 'ERR_WRONG_PARAMS' });
                return;
            }

            query = " SELECT uTab.*,";
            query += " (SELECT COUNT(*) FROM t_follow WHERE f_target_u_id = uTab.u_id) AS u_follower_cnt,";
            query += " (SELECT COUNT(*) FROM t_follow WHERE f_u_id = uTab.u_id) AS u_following_cnt,";
            query += " (SELECT COUNT(*) FROM t_posts WHERE po_u_id = uTab.u_id) AS u_posts_cnt,";
            query += " (SELECT COUNT(DISTINCT po_p_id) FROM t_posts WHERE po_u_id = uTab.u_id) AS u_place_cnt,";
            query += " (SELECT COUNT(*) FROM t_maps_like_pick WHERE mlpi_u_id = uTab.u_id) AS u_like_pick_cnt,";
            query += " (SELECT COUNT(*) FROM t_maps_like_place WHERE mlp_u_id = uTab.u_id) AS u_like_place_cnt";
            query += " FROM t_users AS uTab";
            query += " WHERE uTab.u_social_id LIKE ?";
            params = [socialId];

            [result, fields] = await pool.query(query, params);

            if (result.length == 0) { // 신규 가입
                res.json({ status: 'JOIN_CONTINUE' });
                return;
            }
        }

        user = result[0];

        // 탈퇴한 회원
        if (user.u_status == 'LEAVE') {
            res.json({ status: 'LEAVE_USER' });
            return;
        }

        // 차단된 회원
        if (user.u_status == 'BLOCK') {
            res.json({ status: 'BLOCK_USER' });
            return;
        }

        user.u_is_follow = 'N';
        user.u_is_blocked = 'N';

        // 접속 시간 갱신
        query = "UPDATE t_users SET u_is_logined = 'Y', u_last_login_platform = ?, u_connected_date = NOW() WHERE u_id = ?";
        params = [platform, user.u_id];
        await pool.query(query, params);

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
