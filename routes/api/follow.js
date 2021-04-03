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

        // 자기가 자기 자신을 팔로우할 수 없음
        if (authUId == uId) {
            res.json({ status: 'ERR_AUTH_USER' });
            return;
        }

        let query = "SELECT * FROM t_follow WHERE f_u_id = ? AND f_target_u_id = ?";
        let params = [authUId, uId];
        let [result, fields] = await pool.query(query, params);

        let isFollow = 'Y';

        if (result.length == 0) {
            query = "INSERT INTO t_follow (f_u_id, f_target_u_id) VALUES (?, ?)";
            await pool.query(query, params);

            // 대상
            query = "SELECT * FROM t_users WHERE u_id = ?";
            params = [uId];
            [result, fields] = await pool.query(query, params);
            let user = result[0];

            // 자기자신
            query = "SELECT * FROM t_users WHERE u_id = ?";
            params = [authUId];
            [result, fields] = await pool.query(query, params);
            let authUser = result[0];

            let alert = `"${authUser.u_nickname}"님께서 회원님을 팔로우합니다.`;

            // 알림
            query = "INSERT INTO t_alarms";
            query += " (a_u_id, a_target_type, a_target_id, a_alert, a_sender_u_id, a_sender_u_nickname, a_sender_u_profile_image)";
            query += " VALUES (?, ?, ?, ?, ?, ?, ?)";
            params = [user.u_id, 'USER', authUId, alert, authUId, authUser.u_nickname, authUser.u_profile_image];
            await pool.query(query, params);

            if (user.u_is_logined == 'Y' && user.u_device && user.u_is_allowed_push_followed == 'Y') {
                // 푸쉬
                let apnProvider = apn.Provider({
                    token: {
                        key: 'certs/PlapickPush.p8',
                        keyId: process.env.PUSH_NOTIFICATION_KEY_ID,
                        teamId: process.env.PUSH_NOTIFICATION_TEAM_ID
                    },
                    production: true
                });

                // 플랫폼 검사
                if (user.u_last_login_platform == 'IOS') {
                    let note = new apn.Notification();
                    note.expiry = Math.floor(Date.now() / 1000) + 3600;
                    note.badge = 0;
                    note.sound = 'ping.aiff';
                    note.alert = alert;
                    // note.payload = { 'messageFrom': "팔로우 메시지" };
                    note.topic = 'com.logicador.Plapick';
                    await apnProvider.send(note, user.u_device);

                } else {

                }
            }

        } else {
            isFollow = 'N';
            query = "DELETE FROM t_follow WHERE f_u_id = ? AND f_target_u_id = ?";
            await pool.query(query, params);
        }

        res.json({ status: 'OK', result: isFollow });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
