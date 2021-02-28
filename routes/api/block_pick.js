var express = require('express');
var router = express.Router();
const { isLogined, getPlatform } = require('../../lib/common');
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
        let blockPiId = req.body.blockPiId;

        let query = "SELECT * FROM t_block_picks WHERE bpi_u_id = ? AND bpi_pi_id = ?";
        let params = [uId, blockPiId];
        let [result, fields] = await pool.query(query, params);

        if (result.length == 0) {
            query = "INSERT INTO t_block_picks (bpi_u_id, bpi_pi_id) VALUES (? ,?)";
            await pool.query(query, params);

        } else {
            query = "DELETE FROM t_block_picks WHERE bpi_u_id = ? AND bpi_pi_id = ?";
            await pool.query(query, params);
        }

        res.json({ status: 'OK' });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;