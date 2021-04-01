var express = require('express');
var router = express.Router();
const { isLogined, getPlatform } = require('../../lib/common');
const pool = require('../../lib/database');


router.post('', async (req, res) => {
    try {
        let plapickKey = req.body.plapickKey;
        let platform = getPlatform(plapickKey);
        if (platform === '') {
            res.json({ status: 'ERR_PLAPICK_KEY' });
            return;
        }

        let phoneNumber = req.body.phoneNumber;

        let query = "SELECT u_id, u_nickname, u_email, u_profile_image, u_created_date,";
        query += " 0 AS u_follower_cnt, 0 AS u_following_cnt, 0 AS u_pick_cnt, 0 AS u_like_pick_cnt,";
        query += " 0 AS u_like_place_cnt, 'N' AS u_is_followed, 'N' AS u_is_blocked";
        query += " FROM t_users WHERE u_type LIKE 'EMAIL' AND u_phone_number LIKE ?";

        let params = [phoneNumber];

        let [result, fields] = await pool.query(query, params);

        res.json({ status: 'OK', result });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
