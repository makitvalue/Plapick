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
        let mcpId = req.body.mcpId;

        if (isNone(mcpId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (!isInt(mcpId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        let query = "SELECT * FROM t_maps_comment_place WHERE mcp_id = ? AND mcp_u_id = ?";
        let params = [mcpId, uId];
        let [result, fields] = await pool.query(query, params);

        if (result.length == 0) {
            res.json({ status: 'ERR_NO_PERMISSION' });
            return;
        }

        query = "DELETE FROM t_maps_comment_place WHERE mcp_id = ? AND mcp_u_id = ?";
        await pool.query(query, params);

        res.json({ status: 'OK' });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
