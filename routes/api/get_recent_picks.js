var express = require('express');
var router = express.Router();
const { isLogined, getPlatform } = require('../../lib/common');
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
 
        let query = "SELECT piTab.*, pTab.*,";
        query += " uTab.u_id, uTab.u_nick_name, uTab.u_profile_image, uTab.u_like_cnt,";
        query += " uTab.u_follower_cnt, uTab.u_following_cnt, uTab.u_connected_date";
        query += " FROM t_picks AS piTab";
        query += " JOIN t_places AS pTab ON piTab.pi_p_id = pTab.p_id ";
        query += " JOIN t_users AS uTab ON piTab.pi_u_id = uTab.u_id ";
        query += " WHERE piTab.pi_id = 2101181242061767 OR piTab.pi_id = 2101180709242291 OR piTab.pi_id = 2101181310377708";
        [result, fields] = await pool.query(query);

        let pickList = [
            result[0], result[2], result[2], result[1], result[2],
            result[1], result[0], result[2], result[0], result[0],
            result[2], result[1], result[1], result[1], result[0]
        ];

        res.json({ status: 'OK', result: pickList });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;