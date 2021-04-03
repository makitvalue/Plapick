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
        let poId = req.body.poId;
        let pocId = req.body.pocId;
        let comment = req.body.comment;
        let targetUId = req.body.targetUId;

        if (isNone(poId) || isNone(pocId) || isNone(comment)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (!isInt(poId) || !isInt(pocId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (comment.length > 100) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        let query = "INSERT INTO t_posts_re_comments (porc_po_id, porc_poc_id, porc_u_id, porc_comment";
        if (!isNone(targetUId)) {
            if (!isInt(targetUId)) {
                res.json({ status: 'ERR_WRONG_PARAMS' });
                return;
            }
            query += " , porc_target_u_id";
        }
        query += " ) VALUES (?, ?, ?, ?";
        if (!isNone(targetUId)) {
            query += " , ?";
        }
        query += " )";

        let params = [poId, pocId, uId, comment];
        if (!isNone(targetUId)) {
            params.push(targetUId);
        }

        let [result, fields] = await pool.query(query, params);

        let porcId = result.insertId;

        query = "SELECT porcTab.*, uTab.u_nickname, uTab.u_profile_image,";
        query += " (SELECT u_nickname FROM t_users WHERE u_id = porcTab.porc_target_u_id) AS porc_target_u_nickname";
        query += " FROM t_posts_re_comments AS porcTab";
        query += " JOIN t_users AS uTab ON uTab.u_id = porcTab.porc_u_id";
        query += " WHERE porcTab.porc_id = ?";
        params = [porcId];

        [result, fields] = await pool.query(query, params);

        let porc = result[0];

        // 게시물 업로더 푸시
        query = "SELECT uTab.*, poTab.*";
        query += " FROM t_posts AS poTab";
        query += " JOIN t_users AS uTab ON uTab.u_id = poTab.po_u_id";
        query += " WHERE uTab.u_is_logined LIKE 'Y' AND uTab.u_device IS NOT NULL AND uTab.u_device NOT LIKE ''";
        query += " AND uTab.u_is_allowed_push_posts_comment LIKE 'Y' AND poTab.po_id = ?";
        params = [porc.porc_po_id];
        [result, fields] = await pool.query(query, params);
        if (result.length > 0) {
            // 푸쉬
            let posts = result[0];

            let option = {
                token: {
                    key: 'certs/PlapickPush.p8',
                    keyId: process.env.PUSH_NOTIFICATION_KEY_ID,
                    teamId: process.env.PUSH_NOTIFICATION_TEAM_ID
                },
                production: true
            };
            let apnProvider = apn.Provider(option);

            let device = posts.u_device;
            let lastLoginPlatform = posts.u_last_login_platform;
            let alert = `${porc.u_nickname}님께서 회원님의 게시글에 댓글을 남겼습니다.`;

            if (lastLoginPlatform == 'IOS') {
                let note = new apn.Notification();
                note.expiry = Math.floor(Date.now() / 1000) + 3600;
                note.badge = 0;
                note.sound = 'ping.aiff';
                note.alert = alert;
                // note.payload = { 'messageFrom': "팔로우 메시지" };
                note.topic = 'com.logicador.Plapick';
                await apnProvider.send(note, device);

            } else {

            }
        }

        // 댓글 작성자 푸시
        query = "SELECT uTab.*, pocTab.*";
        query += " FROM t_posts_comments AS pocTab";
        query += " JOIN t_users AS uTab ON uTab.u_id = pocTab.poc_u_id";
        query += " WHERE uTab.u_is_logined LIKE 'Y' AND uTab.u_device IS NOT NULL AND uTab.u_device NOT LIKE ''";
        query += " AND uTab.u_is_allowed_push_posts_comment LIKE 'Y' AND pocTab.poc_id = ?";
        params = [pocId];
        [result, fields] = await pool.query(query, params);
        if (result.length > 0) {
            // 푸쉬
            let poc = result[0];

            let option = {
                token: {
                    key: 'certs/PlapickPush.p8',
                    keyId: process.env.PUSH_NOTIFICATION_KEY_ID,
                    teamId: process.env.PUSH_NOTIFICATION_TEAM_ID
                },
                production: true
            };
            let apnProvider = apn.Provider(option);

            let device = poc.u_device;
            let lastLoginPlatform = poc.u_last_login_platform;
            let alert = `${porc.u_nickname}님께서 회원님의 댓글에 답글을 남겼습니다.`;

            if (lastLoginPlatform == 'IOS') {
                let note = new apn.Notification();
                note.expiry = Math.floor(Date.now() / 1000) + 3600;
                note.badge = 0;
                note.sound = 'ping.aiff';
                note.alert = alert;
                // note.payload = { 'messageFrom': "팔로우 메시지" };
                note.topic = 'com.logicador.Plapick';
                await apnProvider.send(note, device);

            } else {

            }
        }

        // 태그 대상자 푸시
        if (!isNone(targetUId)) {
            query = "SELECT * FROM t_users";
            query += " WHERE u_is_logined LIKE 'Y' AND u_device IS NOT NULL AND u_device NOT LIKE ''";
            query += " AND u_is_allowed_push_followed LIKE 'Y' AND u_id = ?";
            params = [targetUId];
            [result, fields] = await pool.query(query, params);
            if (result.length > 0) {
                // 푸쉬
                let user = result[0];

                let option = {
                    token: {
                        key: 'certs/PlapickPush.p8',
                        keyId: process.env.PUSH_NOTIFICATION_KEY_ID,
                        teamId: process.env.PUSH_NOTIFICATION_TEAM_ID
                    },
                    production: true
                };
                let apnProvider = apn.Provider(option);

                let device = user.u_device;
                let lastLoginPlatform = user.u_last_login_platform;
                let alert = `${porc.u_nickname}님께서 댓글에 회원님을 태그하였습니다.`;

                if (lastLoginPlatform == 'IOS') {
                    let note = new apn.Notification();
                    note.expiry = Math.floor(Date.now() / 1000) + 3600;
                    note.badge = 0;
                    note.sound = 'ping.aiff';
                    note.alert = alert;
                    // note.payload = { 'messageFrom': "팔로우 메시지" };
                    note.topic = 'com.logicador.Plapick';
                    await apnProvider.send(note, device);

                } else {

                }
            }
        }

        res.json({ status: 'OK', result: porc });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
