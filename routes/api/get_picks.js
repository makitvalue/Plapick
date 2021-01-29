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
        let query = "SELECT piTab.*, pTab.*,";
        query += " uTab.u_id, uTab.u_nick_name, uTab.u_profile_image, uTab.u_connected_date";
        query += " FROM t_picks AS piTab";
        query += " JOIN t_places AS pTab ON piTab.pi_p_id = pTab.p_id ";
        query += " JOIN t_users AS uTab ON piTab.pi_u_id = uTab.u_id ";
        let params = [];

        if (!isNone(uId)) {
            if (!isInt(uId)) {
                res.json({ status: 'ERR_WRONG_PARAMS' });
                return;
            }
            query += " WHERE pi_u_id = ?";
            params.push(uId);
        }

        let [result, fields] = await pool.query(query, params);

        res.json({ status: 'OK', result: result });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;