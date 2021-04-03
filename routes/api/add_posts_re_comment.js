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

        // Sender
        query = "SELECT porcTab.*, uTab.u_nickname, uTab.u_profile_image,";
        query += " (SELECT u_nickname FROM t_users WHERE u_id = porcTab.porc_target_u_id) AS porc_target_u_nickname";
        query += " FROM t_posts_re_comments AS porcTab";
        query += " JOIN t_users AS uTab ON uTab.u_id = porcTab.porc_u_id";
        query += " WHERE porcTab.porc_id = ?";
        params = [porcId];

        [result, fields] = await pool.query(query, params);

        let porc = result[0];

        let alert = '';

        // ** 게시물 작성자
        query = "SELECT * FROM t_posts JOIN t_users ON u_id = po_u_id WHERE po_id = ?";
        params = [porc.porc_po_id];
        [result, fields] = await pool.query(query, params);
        let posts = result[0];

        if (posts.u_id != uId) {
            alert = `"${porc.u_nickname}"님께서 회원님의 게시글에 댓글을 남겼습니다.\n"${comment}"`;

            // 알림
            query = "INSERT INTO t_alarms";
            query += " (a_u_id, a_target_type, a_target_id, a_alert, a_sender_u_id, a_sender_u_nickname, a_sender_u_profile_image)";
            query += " VALUES (?, ?, ?, ?, ?, ?, ?)";
            params = [posts.u_id, 'POSTS', posts.po_id, alert, uId, porc.u_nickname, porc.u_profile_image];
            await pool.query(query, params);

            // 푸시
            if (posts.u_is_logined == 'Y' && posts.u_device && posts.u_is_allowed_push_posts_comment == 'Y') {
                let apnProvider = apn.Provider({
                    token: {
                        key: 'certs/PlapickPush.p8',
                        keyId: process.env.PUSH_NOTIFICATION_KEY_ID,
                        teamId: process.env.PUSH_NOTIFICATION_TEAM_ID
                    },
                    production: true
                });
                if (posts.u_last_login_platform == 'IOS') {
                    let note = new apn.Notification();
                    note.expiry = Math.floor(Date.now() / 1000) + 3600;
                    note.badge = 0;
                    note.sound = 'ping.aiff';
                    note.alert = alert;
                    note.topic = 'com.logicador.Plapick';
                    await apnProvider.send(note, posts.u_device);
                } else {

                }
            }
        }

        // ** 댓글 작성자
        query = "SELECT * FROM t_posts_comments JOIN t_users ON u_id = poc_u_id WHERE poc_id = ?";
        params = [pocId];
        [result, fields] = await pool.query(query, params);
        let poc = result[0];

        if (poc.u_id != uId) {
            alert = `"${porc.u_nickname}"님께서 회원님의 댓글에 답글을 남겼습니다.\n"${comment}"`;

            // 알림
            query = "INSERT INTO t_alarms";
            query += " (a_u_id, a_target_type, a_target_id, a_alert, a_sender_u_id, a_sender_u_nickname, a_sender_u_profile_image)";
            query += " VALUES (?, ?, ?, ?, ?, ?, ?)";
            params = [poc.u_id, 'POSTS', posts.po_id, alert, uId, porc.u_nickname, porc.u_profile_image];
            await pool.query(query, params);

            // 푸시
            if (poc.u_is_logined == 'Y' && poc.u_device && poc.u_is_allowed_push_posts_comment == 'Y') {
                let apnProvider = apn.Provider({
                    token: {
                        key: 'certs/PlapickPush.p8',
                        keyId: process.env.PUSH_NOTIFICATION_KEY_ID,
                        teamId: process.env.PUSH_NOTIFICATION_TEAM_ID
                    },
                    production: true
                });
                if (poc.u_last_login_platform == 'IOS') {
                    let note = new apn.Notification();
                    note.expiry = Math.floor(Date.now() / 1000) + 3600;
                    note.badge = 0;
                    note.sound = 'ping.aiff';
                    note.alert = alert;
                    note.topic = 'com.logicador.Plapick';
                    await apnProvider.send(note, poc.u_device);
                } else {

                }
            }
        }

        if (!isNone(targetUId)) {
            // ** 댓글 > 답글 대상자 (태그 대상자)
            query = "SELECT * FROM t_users WHERE u_id = ?";
            params = [targetUId];
            [result, fields] = await pool.query(query, params);
            let tagUser = result[0];

            if (targetUId != uId) {
                alert = `"${porc.u_nickname}"님께서 댓글에 회원님을 태그하였습니다.\n"${comment}"`;

                // 알림
                query = "INSERT INTO t_alarms";
                query += " (a_u_id, a_target_type, a_target_id, a_alert, a_sender_u_id, a_sender_u_nickname, a_sender_u_profile_image)";
                query += " VALUES (?, ?, ?, ?, ?, ?, ?)";
                params = [targetUId, 'POSTS', posts.po_id, alert, uId, porc.u_nickname, porc.u_profile_image];
                await pool.query(query, params);

                // 푸시
                if (tagUser.u_is_logined == 'Y' && tagUser.u_device && tagUser.u_is_allowed_push_posts_comment == 'Y') {
                    let apnProvider = apn.Provider({
                        token: {
                            key: 'certs/PlapickPush.p8',
                            keyId: process.env.PUSH_NOTIFICATION_KEY_ID,
                            teamId: process.env.PUSH_NOTIFICATION_TEAM_ID
                        },
                        production: true
                    });
                    if (tagUser.u_last_login_platform == 'IOS') {
                        let note = new apn.Notification();
                        note.expiry = Math.floor(Date.now() / 1000) + 3600;
                        note.badge = 0;
                        note.sound = 'ping.aiff';
                        note.alert = alert;
                        note.topic = 'com.logicador.Plapick';
                        await apnProvider.send(note, tagUser.u_device);
                    } else {

                    }
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
