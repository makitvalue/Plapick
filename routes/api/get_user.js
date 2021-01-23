var express = require('express');
var router = express.Router();
const { isLogined, isNone, isInt } = require('../../lib/common');
const pool = require('../../lib/database');


// 사용자 조회
router.get('', async (req, res) => {
    try {
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
    
        let user = result[0];
        res.json({ status: 'OK', result: user });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;