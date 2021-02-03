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

        let uId = req.query.uId;
        let pId = req.query.pId;
        let query = "SELECT piTab.*,";

        query += " IFNULL(mlpiTab.cnt, 0) AS piLikeCnt,";
        query += " IFNULL(mcpiTab.cnt, 0) AS piCommentCnt";

        // query += " uTab.u_id, uTab.u_nick_name, uTab.u_profile_image, uTab.u_connected_date";
        query += " FROM t_picks AS piTab";
        // query += " JOIN t_places AS pTab ON piTab.pi_p_id = pTab.p_id ";
        // query += " JOIN t_users AS uTab ON piTab.pi_u_id = uTab.u_id ";

        query += " LEFT JOIN (SELECT mlpi_pi_id, COUNT(*) AS cnt FROM t_maps_like_pick GROUP BY mlpi_pi_id) AS mlpiTab ON mlpiTab.mlpi_pi_id = piTab.pi_id";
        query += " LEFT JOIN (SELECT mcpi_pi_id, COUNT(*) AS cnt FROM t_maps_comment_pick GROUP BY mcpi_pi_id) AS mcpiTab ON mcpiTab.mcpi_pi_id = piTab.pi_id";
        let params = [];

        if (!isNone(uId)) {
            if (!isInt(uId)) {
                res.json({ status: 'ERR_WRONG_PARAMS' });
                return;
            }
            query += " WHERE piTab.pi_u_id = ?";
            params.push(uId);

        } else if (!isNone(pId)) {
            if (!isInt(pId)) {
                res.json({ status: 'ERR_WRONG_PARAMS' });
                return;
            }
            query += " WHERE piTab.pi_p_id = ?";
            params.push(pId);
        }

        let [result, fields] = await pool.query(query, params);

        res.json({ status: 'OK', result: result });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;