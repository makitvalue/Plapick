var express = require('express');
var router = express.Router();
const { isLogined, getPlatform, isNone, isInt } = require('../../lib/common');
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
        let pId = req.body.pId;

        if (isNone(pId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (!isInt(pId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        let query = "SELECT * FROM t_place_likes WHERE pl_p_id = ? AND pl_u_id = ?";
        let params = [pId, uId];
        let [result, fields] = await pool.query(query, params);

        let isLike = 'Y';

        if (result.length == 0) {
            query = "INSERT INTO t_place_likes (pl_p_id, pl_u_id) VALUES (?, ?)";
        } else {
            isLike = 'N';
            query = "DELETE FROM t_place_likes WHERE pl_p_id = ? AND pl_u_id = ?";
        }
        await pool.query(query, params);

        res.json({ status: 'OK', result: isLike });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
