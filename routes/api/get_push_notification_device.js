var express = require('express');
var router = express.Router();
const { isLogined, isNone, getPlatform } = require('../../lib/common');
const pool = require('../../lib/database');


// 사용자 푸시 알림 디바이스 가져오기
router.get('', async (req, res) => {
    try {
        let plapickKey = req.query.plapickKey;
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
        let pndId = req.query.pndId;
    
        if (isNone(pndId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }
    
        let query = "SELECT * FROM t_push_notification_devices WHERE pnd_id LIKE ? AND pnd_u_id = ?";
        let params = [pndId, uId];
    
        let [result, fields] = await pool.query(query, params);
    
        if (result.length == 0) {
            res.json({ status: 'ERR_NO_PUSH_NOTIFICATION_DEVICE' });
            return;
        }
    
        let pushNotificationDevice = result[0];
        res.json({ status: 'OK', result: pushNotificationDevice });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;