var express = require('express');
var router = express.Router();
const { isLogined, isNone, isInt } = require('../../lib/common');
const pool = require('../../lib/database');


// 사용자 픽 가져오기
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

        if (isNone(uId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (!isInt(uId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        let query = "SELECT * FROM t_users WHERE u_id = ?";
        let params = [uId];
        let [result, fields] = await pool.query(query, params);
        if (result.length == 0) {
            res.json({ status: 'ERR_NO_USER' });
            return;
        }

        query = "SELECT * FROM t_picks AS pTab JOIN t_users AS uTab ON pTab.pi_u_id = uTab.u_id WHERE pi_u_id = ?";
        [result, fields] = await pool.query(query, params);

        let pickList = result;
        res.json({ status: 'OK', result: pickList });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;