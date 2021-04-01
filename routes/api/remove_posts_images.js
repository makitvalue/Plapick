var express = require('express');
var router = express.Router();
const { isLogined, getPlatform, isNone, getJSONList } = require('../../lib/common');
const pool = require('../../lib/database');
const fs = require('fs');


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
        let poiIdList = req.body.poiIdList;

        if (isNone(poiIdList)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        poiIdList = getJSONList(poiIdList);

        if (poiIdList.length == 0) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        let params = [uId];
        let query = "SELECT * FROM t_posts_images WHERE poi_u_id = ? AND poi_id IN (";
        for (let i = 0; i < poiIdList.length; i++) {
            if (i > 0) query += " ,";
            query += " ?";
            params.push(poiIdList[i]);
        }
        query += " )";

        let [result, fields] = await pool.query(query, params);

        if (result.length == 0) {
            res.json({ status: 'ERR_NO_PERMISSION' });
            return;
        }

        if (result.length != poiIdList.length) {
            res.json({ status: 'ERR_NO_PERMISSION' });
            return;
        }

        for (let i = 0; i < result.length; i++) {
            let poiPath = result[i].poi_path;

            if (fs.existsSync(`public${poiPath}`)) {
                fs.unlinkSync(`public${poiPath}`);
            }
            if (fs.existsSync(`public${poiPath}`.replace(uId, `${uId}/original`))) {
                fs.unlinkSync(`public${poiPath}`.replace(uId, `${uId}/original`));
            }
        }

        query = "DELETE FROM t_posts_images WHERE poi_u_id = ? AND poi_id IN (";
        for (let i = 0; i < poiIdList.length; i++) {
            if (i > 0) query += " ,";
            query += " ?";
        }
        query += " )";
        await pool.query(query, params);

        res.json({ status: 'OK' });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
