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
        let mode = req.body.mode;
        let id = req.body.id;

        if (isNone(mode) || isNone(id)) {
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

        let query = "";
        let params = [id, uId];
        let [result, fields] = [null, null];

        console.log(id, uId);

        if (mode == 'PLACE') {
            query = "SELECT * FROM t_maps_comment_place WHERE mcp_id = ? AND mcp_u_id = ?";
            [result, fields] = await pool.query(query, params);
            if (result.length == 0) {
                res.json({ status: 'ERR_NO_COMMENT' });
                return;
            }

            query = "DELETE FROM t_maps_comment_place WHERE mcp_id = ? AND mcp_u_id = ?";

        } else if (mode == 'PICK') {
            query = "SELECT * FROM t_maps_comment_pick WHERE mcpi_id = ? AND mcpi_u_id = ?";
            [result, fields] = await pool.query(query, params);
            if (result.length == 0) {
                res.json({ status: 'ERR_NO_COMMENT' });
                return;
            }

            query = "DELETE FROM t_maps_comment_pick WHERE mcpi_id = ? AND mcpi_u_id = ?";
        }

        [result, fields] = await pool.query(query, params);

        res.json({ status: 'OK' });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;