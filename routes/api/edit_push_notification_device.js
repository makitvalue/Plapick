var express = require('express');
var router = express.Router();
const { isLogined, isNone, getPlatform } = require('../../lib/common');
const pool = require('../../lib/database');


// 푸시 알림 디바이스 수정 (허용 Y/N)
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

        let actionMode = req.body.actionMode;
        let isAllowed = req.body.isAllowed;
        let pndId = req.body.pndId;
    
        if (isNone(actionMode) || isNone(isAllowed) || isNone(pndId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (isAllowed != 'Y' && isAllowed != 'N') {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (actionMode != 'FOLLOW' && actionMode != 'MY_PICK_COMMENT' && actionMode != 'RECOMMENDED_PLACE' && 
        actionMode != 'AD' && actionMode != 'EVENT_NOTICE') {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }
        
        let query = "SELECT * FROM t_push_notification_devices WHERE pnd_id = ? AND pnd_u_id = ? AND pnd_platform = ?";
        let params = [pndId, uId, platform];
        let [result, fields] = await pool.query(query, params);

        if (result.length == 0) {
            res.json({ status: 'ERR_NO_PUSH_NOTIFICATION_DEVICE' });
            return;
        }
    
        query = "UPDATE t_push_notification_devices SET";
        
        if (actionMode == 'FOLLOW') {
            query += " pnd_is_allowed_follow";
        } else if (actionMode == 'MY_PICK_COMMENT') {
            query += " pnd_is_allowed_my_pick_comment";
        } else if (actionMode == 'RECOMMENDED_PLACE') {
            query += " pnd_is_allowed_recommended_place";
        } else if (actionMode == 'AD') {
            query += " pnd_is_allowed_ad";
        } else if (actionMode == 'EVENT_NOTICE') {
            query += " pnd_is_allowed_event_notice";
        }
        query += " = ? WHERE pnd_id = ? AND pnd_u_id = ? AND pnd_platform = ?";
        params = [isAllowed, pndId, uId, platform];
    
        [result, fields] = await pool.query(query, params);
    
        res.json({ status: 'OK' });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;