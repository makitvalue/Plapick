var express = require('express');
var router = express.Router();
const { isLogined, getPlatform } = require('../../lib/common');
const pool = require('../../lib/database');


router.post('', async (req, res) => {
    try {
        let plapickKey = req.body.plapickKey;
        let platform = getPlatform(plapickKey);
        if (platform === '') {
            res.json({ status: 'ERR_PLAPICK_KEY' });
            return;
        }

        let nickname = req.body.nickname;

        let query = "SELECT * FROM t_users WHERE u_nickname LIKE ?";
        let params = [nickname];

        if (isLogined(req.session)) {
            let uId = req.session.uId;
            query += " AND u_id != ?";
            params.push(uId);
        }

        let [result, fields] = await pool.query(query, params);

        if (result.length > 0) {
            res.json({ status: 'EXISTS_NICKNAME' });
            return;
        }

        res.json({ status: 'OK' });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
