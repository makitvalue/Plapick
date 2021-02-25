var express = require('express');
var router = express.Router();
const { isLogined, isNone, isInt, getPlatform } = require('../../lib/common');
const pool = require('../../lib/database');
var fs = require('fs');


// 픽 삭제
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
        let piId = req.body.piId;
    
        if (isNone(piId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (!isInt(piId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }
    
        let query = "SELECT * FROM t_picks WHERE pi_id = ? AND pi_u_id = ?";
        let params = [piId, uId];
        let [result, fields] = await pool.query(query, params);
    
        if (result.length == 0) {
            res.json({ status: 'ERR_NO_PERMISSION' });
            return;
        }
    
        query = "DELETE FROM t_picks WHERE pi_id = ? AND pi_u_id = ?";
        await pool.query(query, params);

        params = [piId];

        query = "DELETE FROM t_maps_like_pick WHERE mlpi_pi_id = ?";
        await pool.query(query, params);

        query = "DELETE FROM t_maps_comment_pick WHERE mcpi_pi_id = ?";
        await pool.query(query, params);
    
        if (fs.existsSync(`public/images/users/${uId}/${piId}.jpg`)) {
            fs.unlinkSync(`public/images/users/${uId}/${piId}.jpg`);
            if (fs.existsSync(`public/images/users/${uId}/original/${piId}.jpg`)) {
                fs.unlinkSync(`public/images/users/${uId}/original/${piId}.jpg`);
            }
        }
    
        res.json({ status: 'OK' });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;