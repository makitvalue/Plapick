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
        let comment = req.body.comment;

        if (isNone(poId) || isNone(comment)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (!isInt(poId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (comment.length > 100) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        let query = "INSERT INTO t_posts_comments (poc_po_id, poc_u_id, poc_comment) VALUES (?, ?, ?)";
        let params = [poId, uId, comment];
        let [result, fields] = await pool.query(query, params);

        let pocId = result.insertId;

        // Sender
        query = "SELECT pocTab.*, uTab.u_nickname, uTab.u_profile_image";
        query += " FROM t_posts_comments AS pocTab";
        query += " JOIN t_users AS uTab ON uTab.u_id = pocTab.poc_u_id";
        query += " WHERE pocTab.poc_id = ?";
        params = [pocId];

        [result, fields] = await pool.query(query, params);

        let poc = result[0];
        poc.poc_re_comment_cnt = 0;

        // 대상
        query = "SELECT * FROM t_posts JOIN t_users ON u_id = po_u_id WHERE po_id = ?";
        params = [poId];
        [result, fields] = await pool.query(query, params);
        let posts = result[0];

        if (posts.u_id != uId) {
            let alert = `"${poc.u_nickname}"님께서 회원님의 게시글에 댓글을 남겼습니다.\n"${comment}"`;

            // 알림
            query = "INSERT INTO t_alarms";
            query += " (a_u_id, a_target_type, a_target_id, a_alert, a_sender_u_id, a_sender_u_nickname, a_sender_u_profile_image)";
            query += " VALUES (?, ?, ?, ?, ?, ?, ?)";
            params = [posts.u_id, 'POSTS', posts.po_id, alert, uId, poc.u_nickname, poc.u_profile_image];
            await pool.query(query, params);

            if (posts.u_is_logined == 'Y' && posts.u_device && posts.u_is_allowed_push_posts_comment == 'Y') {
                // 푸쉬
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
                    // note.payload = { 'messageFrom': "팔로우 메시지" };
                    note.topic = 'com.logicador.Plapick';
                    await apnProvider.send(note, posts.u_device);

                } else {

                }
            }
        }

        res.json({ status: 'OK', result: poc });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
