var express = require('express');
var router = express.Router();
const { isLogined, isNone } = require('../../lib/common');
const pool = require('../../lib/database');


// 푸시 알림 디바이스 수정 (허용 Y/N)
router.post('', async (req, res) => {
    try {
        if (!isLogined(req.session)) {
            res.json({ status: 'ERR_NO_PERMISSION' });
            return;
        }

        let uId = req.session.uId;
        let action = req.body.action;
        let isAllowed = req.body.isAllowed;
        let pndId = req.body.pndId;
        let device = req.body.device;
    
        if (isNone(action) || isNone(isAllowed) || isNone(pndId) || isNone(device)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (isAllowed != 'Y' && isAllowed != 'N') {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }
        
        let query = "SELECT * FROM t_push_notification_devices WHERE pnd_id = ? AND pnd_u_id = ? AND pnd_device = ?";
        let params = [pndId, uId, device];
        let [result, fields] = await pool.query(query, params);

        if (result.length == 0) {
            res.json({ status: 'ERR_NO_PUSH_NOTIFICATION_DEVICE' });
            return;
        }
    
        query = "UPDATE t_push_notification_devices SET";
        if (action == 'MY_PICK_COMMENT') {
            query += " pnd_is_allowed_my_pick_comment";
        } else if (action == 'RECOMMENDED_PLACE') {
            query += " pnd_is_allowed_recommended_place";
        } else if (action == 'AD') {
            query += " pnd_is_allowed_ad";
        } else if (action == 'EVENT_NOTICE') {
            query += " pnd_is_allowed_event_notice";
        }
        query += " = ? WHERE pnd_id = ? AND pnd_u_id = ? AND pnd_device = ?";
        params = [isAllowed, pndId, uId, device];
    
        [result, fields] = await pool.query(query, params);
    
        res.json({ status: 'OK' });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;