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
        let poId = req.body.poId;
        let comment = req.body.comment;

        if (isNone(poId) || isNone(comment)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (!isInt(poId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (comment.length > 100) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        let query = "INSERT INTO t_posts_comments (poc_po_id, poc_u_id, poc_comment) VALUES (?, ?, ?)";
        let params = [poId, uId, comment];
        let [result, fields] = await pool.query(query, params);

        let pocId = result.insertId;

        query = "SELECT pocTab.*, uTab.u_nickname, uTab.u_profile_image";
        query += " FROM t_posts_comments AS pocTab";
        query += " JOIN t_users AS uTab ON uTab.u_id = pocTab.poc_u_id";
        query += " WHERE pocTab.poc_id = ?";
        params = [pocId];

        [result, fields] = await pool.query(query, params);

        let poc = result[0];
        poc.poc_re_comment_cnt = 0;
        res.json({ status: 'OK', result: poc });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
