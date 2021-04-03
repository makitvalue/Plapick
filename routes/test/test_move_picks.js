var express = require('express');
var router = express.Router();
const { isLogined, getPlatform } = require('../../lib/common');
const pool = require('../../lib/database');


router.get('', async (req, res) => {
    try {

        let query = "SELECT * FROM t_picks";
        let params = [];
        let [result, fields] = await pool.query(query);

        let pickList = result;

        for (let i = 0; i < pickList.length; i++) {
            let pick = pickList[i];

            let uId = pick.pi_u_id;
            let pId = pick.pi_p_id;
            let message = pick.pi_message;
            let imagePath = `/images/users/${uId}/${pick.pi_id}.jpg`;

            query = "INSERT INTO t_posts (po_u_id, po_p_id, po_message) VALUES (?, ?, ?)";
            params = [uId, pId, message];
            // console.log(query, params);
            [result, fields] = await pool.query(query, params);

            let poId = result.insertId;

            query = "INSERT INTO t_posts_images (poi_u_id, poi_po_id, poi_path, poi_order) VALUES (?, ?, ?, ?)";
            params = [uId, poId, imagePath, 1];
            // console.log(query, params);
            await pool.query(query, params);
        }

        res.json({ status: 'OK' });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
