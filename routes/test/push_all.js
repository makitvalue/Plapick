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

        // let option = {
        //     gateway: 'gateway.sandbox.push.apple.com',
        //     cert: 'certs/plapickCer.pem',
        //     key: 'certs/plapickKey.unencrypted.pem'
        // };
        let apnProvider = apn.Provider(option);

        let query = "SELECT * FROM t_users AS uTab LEFT JOIN";
        query += " (SELECT pnd_u_id, GROUP_CONCAT(CONCAT_WS(':', pnd_id, pnd_device) SEPARATOR '|') AS devices";
        query += " FROM t_push_notification_devices GROUP BY pnd_u_id)";
        query += " AS pndTab ON uTab.u_id = pndTab.pnd_u_id WHERE u_is_logined LIKE 'Y' AND u_status LIKE 'ACTIVATE'";

        let [userList, fields] = await pool.query(query);

        let iosList = [];
        let androidList = [];
        for (let i = 0; i < userList.length; i++) {
            let user = userList[i];
            let devices = user.devices;

            if (!devices) continue;

            let splittedDevices = devices.split('|');

            for (let j = 0; j < splittedDevices.length; j++) {
                let device = splittedDevices[j];
                let splittedDevice = device.split(':');
                let dId = splittedDevice[0];
                let dDevice = splittedDevice[1];

                if (dDevice == 'IOS') {
                    iosList.push(dId);
                } else if (dDevice == 'ANDROID') {
                    androidList.push(dId);
                }
            }
        }

        let note = new apn.Notification();
        note.expiry = Math.floor(Date.now() / 1000) + 3600;
        note.badge = 1;
        note.sound = 'ping.aiff';
        note.alert = alert;
        note.payload = { 'messageFrom': "메시지ㅎㅎ" };
        note.topic = 'com.logicador.Plapick';

        let result = await apnProvider.send(note, iosList);
        console.log(result);

        res.json({ status: 'OK' });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;