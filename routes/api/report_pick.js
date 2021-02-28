var express = require('express');
var router = express.Router();
const { isLogined, getPlatform, isNone } = require('../../lib/common');
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

        let authUId = req.session.uId;
        let piId = req.body.piId;
        let reason = req.body.reason;

        if (isNone(piId) || isNone(reason)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        let query = "INSERT INTO t_report_picks (rpi_u_id, rpi_pi_id, rpi_reason) VALUES (?, ?, ?)";
        let params = [authUId, piId, reason];
        await pool.query(query, params);

        res.json({ status: 'OK' });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;