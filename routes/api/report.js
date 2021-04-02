var express = require('express');
var router = express.Router();
const { isLogined, getPlatform, isNone, isInt } = require('../../lib/common');
const pool = require('../../lib/database');


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
        let type = req.body.type;
        let targetType = req.body.targetType;
        let targetId = req.body.targetId;
        let description = req.body.description;

        if (isNone(type) || isNone(targetType) || isNone(targetId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (!isInt(targetId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (type != 'ABUSE' && type != 'SEXUAL' && type != 'STEAL' && type != 'WRONG') {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (targetType != 'POSTS' && targetType != 'POSTS_COMMENT' && targetType != 'POSTS_RE_COMMENT' && targetType != 'PLACE' && targetType != 'PLACE_COMMENT') {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        let query = "INSERT INTO t_reports (r_u_id, r_type, r_target_type, r_target_id, r_description) VALUES (?, ?, ?, ?, ?)";
        let params = [uId, type, targetType, targetId, description];
        await pool.query(query, params);

        res.json({ status: 'OK' });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
