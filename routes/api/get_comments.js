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

        let mode = req.query.mode;
        let id = req.query.id;
        let limit = req.query.limit;

        if (isNone(mode) || isNone(id)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (mode != 'PLACE' && mode != 'PICK') {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        let query = "";
        let params = [id];
        let [result, fields] = [null, null];

        if (mode == 'PLACE') {
            query = "SELECT";

            query += " mcpTab.mcp_id AS id, mcpTab.mcp_u_id AS u_id, mcpTab.mcp_p_id AS p_id,";
            query += " mcpTab.mcp_comment AS comment, mcpTab.mcp_created_date AS created_date,";
            query += " mcpTab.mcp_updated_date AS updated_date,";

            query += " uTab.u_nick_name, uTab.u_profile_image";

            query += " FROM t_maps_comment_place AS mcpTab";
            query += " JOIN t_users AS uTab ON uTab.u_id = mcpTab.mcp_u_id";
            query += " WHERE mcpTab.mcp_p_id = ?";

        } else if (mode == 'PICK') {
            query = "SELECT";

            query += " mcpiTab.mcpi_id AS id, mcpiTab.mcpi_u_id AS u_id, mcpiTab.mcpi_pi_id AS p_id,";
            query += " mcpiTab.mcpi_comment AS comment, mcpiTab.mcpi_created_date AS created_date,";
            query += " mcpiTab.mcpi_updated_date AS updated_date,";

            query += " uTab.u_nick_name, uTab.u_profile_image";

            query += " FROM t_maps_comment_place AS mcpiTab";
            query += " JOIN t_users AS uTab ON uTab.u_id = mcpiTab.mcpi_u_id";
            query += " WHERE mcpiTab.mcpi_pi_id = ?";
        }

        if (!isNone(limit)) {
            if (!isInt(limit)) {
                res.json({ status: 'ERR_WRONG_PARAMS' });
                return;
            }

            query += ` LIMIT ${limit}`;
        }

        [result, fields] = await pool.query(query, params);

        res.json({ status: 'OK', result: result });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
