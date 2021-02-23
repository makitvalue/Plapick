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

        let authUId = req.session.uId;
        let uId = req.body.uId;

        if (isNone(uId)) { 
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (!isInt(uId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }
        
        authUId = parseInt(authUId);
        uId = parseInt(uId);
        // 자기가 자기 자신을 팔로우할 수 없음
        if (authUId == uId) {
            res.json({ status: 'ERR_AUTH_USER' });
            return;
        }
        
        let query = "SELECT * FROM t_users WHERE u_id = ?";
        let params = [uId];
        let [result, fields] = await pool.query(query, params);
        if (result.length == 0) {
            res.json({ status: 'ERR_NO_USER' });
            return;
        }

        query = "SELECT * FROM t_maps_follow WHERE mf_u_id = ? AND mf_follower_u_id = ?";
        params = [uId, authUId];
        [result, fields] = await pool.query(query, params);
        
        if (result.length > 0) {
            // 팔로우 취소
            query = "DELETE FROM t_maps_follow WHERE mf_u_id = ? AND mf_follower_u_id = ?";
        } else {
            // 팔로우
            query = "INSERT INTO t_maps_follow (mf_u_id, mf_follower_u_id) VALUES (?, ?)";
        }
        await pool.query(query, params);

        res.json({ status: 'OK' });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;