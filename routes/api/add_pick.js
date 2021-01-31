var express = require('express');
var router = express.Router();
const { isLogined, isNone, getPlatform, isInt, ntb } = require('../../lib/common');
const pool = require('../../lib/database');


// 픽 추가
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
        let piId = ntb(req.body.piId);
        let message = ntb(req.body.message);
        let pId = ntb(req.body.pId);

        if (isNone(piId) || isNone(pId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (!isInt(piId) || !isInt(pId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        let query = "SELECT * FROM t_places WHERE p_id = ?";
        let params = [pId];
        let [result, fields] = await pool.query(query, params);

        if (result.length == 0) {
            res.json({ status: 'ERR_NO_PLACE' });
            return;
        }

        // query = "UPDATE t_places SET p_pick_cnt = p_pick_cnt + 1 WHERE p_id = ?";
        // [result, fields] = await pool.query(query, params);

        // query = "UPDATE t_users SET u_pick_cnt = u_pick_cnt + 1 WHERE u_id = ?";
        // params = [uId];
        // [result, fields] = await pool.query(query, params);

        query = "INSERT INTO t_picks (pi_id, pi_u_id, pi_p_id, pi_message) VALUES (?, ?, ?, ?)";
        params = [piId, uId, pId, message];
        [result, fields] = await pool.query(query, params);

        res.json({ status: 'OK' });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;