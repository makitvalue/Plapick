var express = require('express');
var router = express.Router();
const { isLogined, getPlatform, isNone, isInt } = require('../../lib/common');
const pool = require('../../lib/database');


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

        let pocId = req.query.pocId;

        if (isNone(pocId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (!isInt(pocId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        let query = "SELECT porcTab.*, uTab.u_nickname, uTab.u_profile_image,";
        query += " (SELECT u_nickname FROM t_users WHERE u_id = porcTab.porc_target_u_id) AS porc_target_u_nickname";
        query += " FROM t_posts_re_comments AS porcTab";
        query += " JOIN t_users AS uTab ON uTab.u_id = porcTab.porc_u_id";
        query += " WHERE porcTab.porc_poc_id = ?";
        let params = [pocId];

        let [result, fields] = await pool.query(query, params);

        res.json({ status: 'OK', result: result });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
