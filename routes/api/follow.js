var express = require('express');
var router = express.Router();
const { isLogined, getPlatform, isNone, isInt } = require('../../lib/common');
const pool = require('../../lib/database');
const apn = require('apn');


router.post('', async (req, res) => {
    try {
        let plapickKey = req.body.plapickKey;
        let platform = getPlatform(plapickKey);
        if (platform === '') {
            res.json({ status: 'ERR_PLAPICK_KEY' });
            return;
        }

        if (!isLogined(req.session)) {
            res.json({ status: 'ERR_NO_PERMISSION' });
            return;
        }

        let authUId = req.session.uId;
        let uId = req.body.uId;

        if (isNone(uId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (!isInt(uId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        authUId = parseInt(authUId);
        uId = parseInt(uId);
        // 자기가 자기 자신을 팔로우할 수 없음
        if (authUId == uId) {
            res.json({ status: 'ERR_AUTH_USER' });
            return;
        }

        let query = "SELECT * FROM t_users WHERE u_id = ?";
        let params = [uId];
        let [result, fields] = await pool.query(query, params);
        if (result.length == 0) {
            res.json({ status: 'ERR_NO_USER' });
            return;
        }

        query = "SELECT * FROM t_maps_follow WHERE mf_u_id = ? AND mf_follower_u_id = ?";
        params = [uId, authUId];
        [result, fields] = await pool.query(query, params);

        if (result.length > 0) {
            // 팔로우 취소
            query = "DELETE FROM t_maps_follow WHERE mf_u_id = ? AND mf_follower_u_id = ?";
            await pool.query(query, params);

        } else {
            // 팔로우
            query = "INSERT INTO t_maps_follow (mf_u_id, mf_follower_u_id) VALUES (?, ?)";
            await pool.query(query, params);

            query = "SELECT * FROM t_users WHERE";
            query += " u_is_logined LIKE 'Y' AND u_device IS NOT NULL AND u_device NOT LIKE '' AND u_is_allowed_follow LIKE 'Y'";
            query += " AND u_id = ?";
            params = [uId];
            [result, fields] = await pool.query(query, params);

            if (result.length > 0) {
                // 푸쉬
                let option = {
                    token: {
                        key: 'certs/PlapickPush.p8',
                        keyId: process.env.PUSH_NOTIFICATION_KEY_ID,
                        teamId: process.env.PUSH_NOTIFICATION_TEAM_ID
                    },
                    production: false
                };
                let apnProvider = apn.Provider(option);

                let user = result[0];

                query = "SELECT * FROM t_users WHERE u_id = ?";
                params = [authUId];
                [result, fields] = await pool.query(query, params);

                let authUser = result[0];

                let device = user.u_device;
                let lastLoginPlatform = user.u_last_login_platform;

                if (lastLoginPlatform == 'IOS') {
                    let note = new apn.Notification();
                    note.expiry = Math.floor(Date.now() / 1000) + 3600;
                    note.badge = 0;
                    note.sound = 'ping.aiff';
                    note.alert = `${authUser.u_nick_name}님께서 회원님을 팔로우합니다.`;
                    // note.payload = { 'messageFrom': "팔로우 메시지" };
                    note.topic = 'com.logicador.Plapick';
                    let pushResult = await apnProvider.send(note, device);
                    console.log(pushResult.failed);

                } else {

                }
            }
        }

        res.json({ status: 'OK' });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
