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
        let pocId = req.body.pocId;
        let comment = req.body.comment;
        let targetUId = req.body.targetUId;

        if (isNone(poId) || isNone(pocId) || isNone(comment)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (!isInt(poId) || !isInt(pocId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (comment.length > 100) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        let query = "INSERT INTO t_posts_re_comments (porc_po_id, porc_poc_id, porc_u_id, porc_comment";
        if (!isNone(targetUId)) {
            if (!isInt(targetUId)) {
                res.json({ status: 'ERR_WRONG_PARAMS' });
                return;
            }
            query += " , porc_target_u_id";
        }
        query += " ) VALUES (?, ?, ?, ?";
        if (!isNone(targetUId)) {
            query += " , ?";
        }
        query += " )";

        let params = [poId, pocId, uId, comment];
        if (!isNone(targetUId)) {
            params.push(targetUId);
        }

        let [result, fields] = await pool.query(query, params);

        let porcId = result.insertId;

        query = "SELECT porcTab.*, uTab.u_nickname, uTab.u_profile_image,";
        query += " (SELECT u_nickname FROM t_users WHERE u_id = porcTab.porc_target_u_id) AS porc_target_u_nickname";
        query += " FROM t_posts_re_comments AS porcTab";
        query += " JOIN t_users AS uTab ON uTab.u_id = porcTab.porc_u_id";
        query += " WHERE porcTab.porc_id = ?";
        params = [porcId];

        [result, fields] = await pool.query(query, params);

        let porc = result[0];
        res.json({ status: 'OK', result: porc });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
