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
        let pId = req.body.pId;
        let comment = req.body.comment;

        if (isNone(pId) || isNone(comment)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (!isInt(pId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (comment.length > 100) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        let query = "INSERT INTO t_place_comments (pc_p_id, pc_u_id, pc_comment) VALUES (?, ?, ?)";
        let params = [pId, uId, comment];
        let [result, fields] = await pool.query(query, params);

        let pcId = result.insertId;

        query = "SELECT pcTab.*, uTab.u_nickname, uTab.u_profile_image";
        query += " FROM t_place_comments AS pcTab";
        query += " JOIN t_users AS uTab ON uTab.u_id = pcTab.pc_u_id";
        query += " WHERE pcTab.pc_id = ?";
        params = [pcId];

        [result, fields] = await pool.query(query, params);

        let pc = result[0];
        res.json({ status: 'OK', result: pc });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
