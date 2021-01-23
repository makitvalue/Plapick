var express = require('express');
var router = express.Router();
const { isLogined, isInt } = require('../../lib/common');
const pool = require('../../lib/database');


// 플레이스 가져오기
router.get('', async (req, res) => {
    try {
        if (!isLogined(req.session)) {
            res.json({ status: 'ERR_NO_PERMISSION' });
            return;
        }

        let pId = req.query.pId;
    
        if (isNone(pId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (!isInt(pId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }
    
        let query = "SELECT * FROM t_places WHERE p_id = ?";
        let params = [pId];
        let [result, fields] = await pool.query(query, params);
    
        if (result.length == 0) {
            res.json({ status: 'ERR_NO_PLACE' });
            return;
        }
    
        let place = result[0];
        res.json({ status: 'OK', result: place });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;