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
        let poId = req.body.poId;

        if (isNone(poId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (!isInt(poId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        let query = "SELECT * FROM t_posts_likes WHERE pol_po_id = ? AND pol_u_id = ?";
        let params = [poId, uId];
        let [result, fields] = await pool.query(query, params);

        let isLike = 'Y';

        if (result.length == 0) {
            query = "INSERT INTO t_posts_likes (pol_po_id, pol_u_id) VALUES (?, ?)";
        } else {
            isLike = 'N';
            query = "DELETE FROM t_posts_likes WHERE pol_po_id = ? AND pol_u_id = ?";
        }
        await pool.query(query, params);

        res.json({ status: 'OK', result: { poId: parseInt(poId), isLike: isLike } });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
