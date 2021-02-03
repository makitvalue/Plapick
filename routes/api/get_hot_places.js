var express = require('express');
var router = express.Router();
const { isLogined, getPlatform, getPlaceSelectWhatQuery, getPlaceSelectJoinQuery } = require('../../lib/common');
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

        let uId = req.session.uId;

        let query = "SET SESSION group_concat_max_len = 65535";
        let [result, fields] = await pool.query(query);

        query = getPlaceSelectWhatQuery();
        query += " FROM t_places AS pTab";
        query += getPlaceSelectJoinQuery();
        query += " WHERE pTab.p_id = 1";

        let params = [uId];
        [result, fields] = await pool.query(query, params);
        let pickList = [result[0], result[0], result[0]];

        res.json({ status: 'OK', result: pickList });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;