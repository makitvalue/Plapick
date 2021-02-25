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
        let piId = req.body.piId;
        
        if (isNone(piId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (!isInt(piId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        // 존재하는 플레이스인지 확인
        let query = "SELECT * FROM t_picks WHERE pi_id = ?";
        let params = [piId];
        let [result, fields] = await pool.query(query, params);
        if (result.length == 0) {
            res.json({ status: 'ERR_NO_PICK' });
            return;
        }

        query = "SELECT * FROM t_maps_like_pick WHERE mlpi_u_id = ? AND mlpi_pi_id = ?";
        params = [uId, piId];
        [result, fields] = await pool.query(query, params);
        
        if (result.length > 0) {
            // 좋아요 취소
            query = "DELETE FROM t_maps_like_pick WHERE mlpi_u_id = ? AND mlpi_pi_id = ?";
            await pool.query(query, params);
            // query = "UPDATE t_places SET p_like_cnt = p_like_cnt - 1 WHERE p_id = ?";

        } else {
            // 좋아요
            query = "INSERT INTO t_maps_like_pick (mlpi_u_id, mlpi_pi_id) VALUES (?, ?)";
            await pool.query(query, params);
            // query = "UPDATE t_places SET p_like_cnt = p_like_cnt + 1 WHERE p_id = ?";
        }

        // params = [pId];
        // [result, fields] = await pool.query(query, params);

        res.json({ status: 'OK' });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;