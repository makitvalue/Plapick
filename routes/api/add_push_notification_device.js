var express = require('express');
var router = express.Router();
const { isLogined, isNone, getPlatform } = require('../../lib/common');
const pool = require('../../lib/database');


// 푸시 알림 디바이스 추가
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
        let pndId = req.body.pndId;
    
        if (isNone(pndId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (platform != 'IOS' && platform != 'ANDROID') {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }
    
        let query = "SELECT * FROM t_push_notification_devices WHERE pnd_id = ? AND pnd_u_id = ? AND pnd_platform = ?";
        let params = [pndId, uId, platform];
        let [result, fields] = await pool.query(query, params);
    
        if (result.length == 0) {
            query = "INSERT INTO t_push_notification_devices (pnd_id, pnd_u_id, pnd_platform) VALUES (?, ?, ?)";
            [result, fields] = await pool.query(query, params);
        }
    
        res.json({ status: 'OK' });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;