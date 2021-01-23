var express = require('express');
var router = express.Router();
const { isLogined, isNone, isInt } = require('../../lib/common');
const pool = require('../../lib/database');


// 픽 삭제
router.post('', async (req, res) => {
    try {
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
            res.json({ status: 'ERR_NO_PICK' });
            return;
        }
    
        let pick = result[0];
    
        query = "DELETE FROM t_picks WHERE pi_id = ? AND pi_u_id = ?";
        [result, fields] = await pool.query(query, params);
    
        if (fs.existsSync(`public/images/users/${uId}/${piId}.jpg`)) {
            fs.unlinkSync(`public/images/users/${uId}/${piId}.jpg`);
            if (fs.existsSync(`public/images/users/${uId}/original/${piId}.jpg`)) {
                fs.unlinkSync(`public/images/users/${uId}/original/${piId}.jpg`);
            }
        }
    
        query = "UPDATE t_places SET p_pick_cnt = p_pick_cnt - 1 WHERE p_id = ?";
        params = [pick.pi_p_id];
        [result, fields] = await pool.query(query, params);
    
        res.json({ status: 'OK' });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;