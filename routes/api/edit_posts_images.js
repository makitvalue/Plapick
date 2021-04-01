var express = require('express');
var router = express.Router();
const { isLogined, getPlatform, isNone, getJSONList } = require('../../lib/common');
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
        let poiList = req.body.poiList;

        if (isNone(poiList)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        poiList = getJSONList(poiList);

        if (poiList.length == 0) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        for (let i = 0; i < poiList.length; i++) {
            let splittedPoi = poiList[i].split('|');
            let poiId = splittedPoi[0];
            let order = splittedPoi[1];

            let query = "UPDATE t_posts_images SET poi_order = ? WHERE poi_id = ? AND poi_u_id = ?";
            let params = [order, poiId, uId];
            await pool.query(query, params);
        }

        res.json({ status: 'OK' });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
