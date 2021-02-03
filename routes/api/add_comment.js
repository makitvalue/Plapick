var express = require('express');
var router = express.Router();
const { isLogined, getPlatform, isNone, getByteLength, isInt } = require('../../lib/common');
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
        let mode = req.body.mode;
        let id = req.body.id;
        let comment = req.body.comment;

        if (isNone(mode) || isNone(id) || isNone(comment)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (mode != 'PLACE' && mode != 'PICK') {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (!isInt(id)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (getByteLength(comment) < 1 || comment.length > 50) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        let query = "";
        let params = [id];
        let [result, fields] = [null, null];

        if (mode == 'PLACE') {
            query = "SELECT * FROM t_places WHERE p_id = ?";
            [result, fields] = await pool.query(query, params);
            if (result.length == 0) {
                res.json({ status: 'ERR_NO_PLACE' });
                return;
            }

            query = "INSERT INTO t_maps_comment_place (mcp_u_id, mcp_p_id, mcp_comment) VALUES (?, ?, ?)";

        } else if (mode == 'PICK') {
            query = "SELECT * FROM t_picks WHERE pi_id = ?";
            [result, fields] = await pool.query(query, params);
            if (result.length == 0) {
                res.json({ status: 'ERR_NO_PICK' });
                return;
            }

            query = "INSERT INTO t_maps_comment_pick (mcpi_u_id, mcpi_pi_id, mcpi_comment) VALUES (?, ?, ?)";
        }

        params = [uId, id, comment];
        [result, fields] = await pool.query(query, params);

        res.json({ status: 'OK' });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;