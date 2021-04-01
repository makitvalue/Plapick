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

        let ieId = req.body.ieId;
        let email = req.body.email;
        let code = req.body.code;

        if (isNone(ieId) || isNone(email) || isNone(code)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        let query = "SELECT * FROM t_identified_email WHERE ie_id = ? AND ie_email LIKE ? AND ie_code LIKE ? AND ie_created_date >= DATE_ADD(NOW(), INTERVAL -3 MINUTE)";
        let params = [ieId, email, code];
        let [result, fields] = await pool.query(query, params);

        if (result.length == 0) {
            res.json({ status: 'WRONG_CODE' });
            return;
        }

        query = "DELETE FROM t_identified_email WHERE ie_id = ?";
        params = [ieId];
        await pool.query(query, params);

        res.json({ status: 'OK' });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
