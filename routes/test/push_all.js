var express = require('express');
var router = express.Router();
// const { } = require('../../lib/common');
const pool = require('../../lib/database');
const apn = require('apn');


// 푸쉬 테스트 (전체)
router.get('', async (req, res) => {
    try {
        let alert = req.query.alert;

        let option = {
            token: {
                key: 'certs/PlapickPush.p8',
                keyId: process.env.PUSH_NOTIFICATION_KEY_ID,
                teamId: process.env.PUSH_NOTIFICATION_TEAM_ID
            },
            production: false
        };
        
        let apnProvider = apn.Provider(option);

        let query = "SELECT * FROM t_users WHERE";
        query += " u_last_login_platform LIKE 'IOS' AND u_is_logined LIKE 'Y'";
        query += " AND u_device IS NOT NULL AND u_device NOT LIKE '' AND u_is_allowed_recommended_place LIKE 'Y'";
        let [result, fields] = await pool.query(query);

        let deviceList = [];
        for (let i = 0; i < result.length; i++) {
            deviceList.push(result[i].u_device);
        }

        let note = new apn.Notification();
        note.expiry = Math.floor(Date.now() / 1000) + 3600;
        note.badge = 0;
        note.sound = 'ping.aiff';
        note.alert = 'alert 제목?';
        // note.payload = { 'messageFrom': "메시지ㅎㅎ" };
        note.topic = 'com.logicador.Plapick';

        let pushResult = await apnProvider.send(note, deviceList);
        console.log(pushResult);

        res.json({ status: 'OK' });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;