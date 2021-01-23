var express = require('express');
var router = express.Router();
const { isLogined, isNone } = require('../../lib/common');
const pool = require('../../lib/database');


// 푸시 알림 디바이스 추가
router.post('', async (req, res) => {
    try {
        if (!isLogined(req.session)) {
            res.json({ status: 'ERR_NO_PERMISSION' });
            return;
        }

        let uId = req.session.uId;
        let pndId = req.body.pndId;
        let device = req.body.device;
    
        if (isNone(pndId) || isNone(device)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (device != 'IOS' && device != 'ANDROID') {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }
    
        let query = "SELECT * FROM t_push_notification_devices WHERE pnd_id = ? AND pnd_u_id = ? AND pnd_device = ?";
        let params = [pndId, uId, device];
        let [result, fields] = await pool.query(query, params);
    
        if (result.length == 0) {
            query = "INSERT INTO t_push_notification_devices (pnd_id, pnd_u_id, pnd_device) VALUES (?, ?, ?)";
            [result, fields] = await pool.query(query, params);
        }
    
        res.json({ status: 'OK' });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;