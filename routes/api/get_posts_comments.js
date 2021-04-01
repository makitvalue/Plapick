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

        let poId = req.query.poId;

        if (isNone(poId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (!isInt(poId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        let query = "SELECT pocTab.*, uTab.u_nickname, uTab.u_profile_image,";
        query += " (SELECT COUNT(*) FROM t_posts_re_comments WHERE porc_poc_id = pocTab.poc_id) AS poc_re_comment_cnt";
        query += " FROM t_posts_comments AS pocTab";
        query += " JOIN t_users AS uTab ON uTab.u_id = pocTab.poc_u_id";
        query += " WHERE pocTab.poc_po_id = ? ORDER BY pocTab.poc_created_date ASC";
        let params = [poId];

        let [result, fields] = await pool.query(query, params);

        res.json({ status: 'OK', result: result });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
