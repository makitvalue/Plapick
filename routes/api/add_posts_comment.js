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

        query = "SELECT pocTab.*, uTab.u_nickname, uTab.u_profile_image";
        query += " FROM t_posts_comments AS pocTab";
        query += " JOIN t_users AS uTab ON uTab.u_id = pocTab.poc_u_id";
        query += " WHERE pocTab.poc_id = ?";
        params = [pocId];

        [result, fields] = await pool.query(query, params);

        let poc = result[0];
        poc.poc_re_comment_cnt = 0;

        query = "SELECT uTab.*, poTab.*";
        query += " FROM t_posts AS poTab";
        query += " JOIN t_users AS uTab ON uTab.u_id = poTab.po_u_id";
        query += " WHERE uTab.u_is_logined LIKE 'Y' AND uTab.u_device IS NOT NULL AND uTab.u_device NOT LIKE ''";
        query += " AND uTab.u_is_allowed_push_posts_comment LIKE 'Y' AND poTab.po_id = ?";
        params = [poId];
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
            let alert = `${poc.u_nickname}님께서 회원님의 게시글에 댓글을 남겼습니다.`;

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

        res.json({ status: 'OK', result: poc });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
