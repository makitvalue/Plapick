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

        let uId = req.session.uId;
        let piId = req.body.piId;
        let comment = req.body.comment;

        if (isNone(piId) || isNone(comment)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (!isInt(piId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        let query = "SELECT * FROM t_picks AS piTab JOIN t_places AS pTab ON pTab.p_id = piTab.pi_p_id WHERE piTab.pi_id = ?";
        let params = [piId];
        let [result, fields] = await pool.query(query, params);
        
        if (result.length == 0) {
            res.json({ status: 'ERR_NO_PICK' });
            return;
        }

        let pick = result[0];

        if (pick.pi_u_id != uId) {
            // 다른사람이 댓글을 남겼을 경우 푸시
            query = "INSERT INTO t_maps_comment_pick (mcpi_u_id, mcpi_pi_id, mcpi_comment) VALUES (?, ?, ?)";
            params = [uId, piId, comment];
            await pool.query(query, params);

            query = "SELECT * FROM t_users WHERE";
            query += " u_is_logined LIKE 'Y' AND u_device IS NOT NULL AND u_device NOT LIKE '' AND u_is_allowed_my_pick_comment LIKE 'Y'";
            query += " AND u_id = ?";
            params = [pick.pi_u_id];
            [result, fields] = await pool.query(query, params);

            if (result.length > 0) {
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
                params = [uId];
                [result, fields] = await pool.query(query, params);

                let authUser = result[0];

                let device = user.u_deivce;
                let lastLoginPlatform = user.u_last_login_platform;

                if (lastLoginPlatform == 'IOS') {
                    let note = new apn.Notification();
                    note.expiry = Math.floor(Date.now() / 1000) + 3600;
                    note.badge = 0;
                    note.sound = 'ping.aiff';
                    note.alert = `${authUser.u_nick_name}님께서 ${pick.p_name}에 게시한 회원님의 픽에 댓글을 남겼습니다.`;
                    // note.payload = { 'messageFrom': "팔로우 메시지" };
                    note.topic = 'com.logicador.Plapick';
                    await apnProvider.send(note, device);

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
