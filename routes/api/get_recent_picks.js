var express = require('express');
var router = express.Router();
const { isLogined, getPlatform } = require('../../lib/common');
const pool = require('../../lib/database');


router.get('', async (req, res) => {
    try {
        // let plapickKey = req.query.plapickKey;
        // let platform = getPlatform(plapickKey);
        // if (platform === '') {
        //     res.json({ status: 'ERR_PLAPICK_KEY' });
        //     return;
        // }

        // if (!isLogined(req.session)) {
        //     res.json({ status: 'ERR_NO_PERMISSION' });
        //     return;
        // }
 
        let query = "SELECT piTab.*, pTab.*,";

        query += " IFNULL(mlpiTab.cnt, 0) AS piLikeCnt,";
        query += " IFNULL(mcpiTab.cnt, 0) AS piCommentCnt,";
        
        query += " uTab.u_id, uTab.u_nick_name, uTab.u_profile_image, uTab.u_connected_date";
        query += " FROM t_picks AS piTab";
        query += " JOIN t_places AS pTab ON piTab.pi_p_id = pTab.p_id ";
        query += " JOIN t_users AS uTab ON piTab.pi_u_id = uTab.u_id ";

        query += " LEFT JOIN (SELECT mlpi_pi_id, COUNT(*) AS cnt FROM t_maps_like_pick GROUP BY mlpi_pi_id) AS mlpiTab ON mlpiTab.mlpi_pi_id = piTab.pi_id";
        query += " LEFT JOIN (SELECT mcpi_pi_id, COUNT(*) AS cnt FROM t_maps_comment_pick GROUP BY mcpi_pi_id) AS mcpiTab ON mcpiTab.mcpi_pi_id = piTab.pi_id";

        query += " WHERE piTab.pi_id = 2101282342287394 OR piTab.pi_id = 2101180709242291 OR piTab.pi_id = 2101282343079009";
        [result, fields] = await pool.query(query);

        console.log(result.length);

        let pickList = [
            result[0], result[1], result[2],
            result[1], result[1], result[0],
            result[0], result[2], result[2],
            result[2], result[0], result[2],
            result[0], result[1], result[1]
        ];

        res.json({ status: 'OK', result: pickList });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;