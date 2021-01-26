var express = require('express');
var router = express.Router();
const { isLogined, getPlatform } = require('../../lib/common');
const pool = require('../../lib/database');


// 로그아웃
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
        let query = "UPDATE t_users SET u_is_logined = 'N', u_last_login_platform = ?, u_connected_date = NOW() WHERE u_id = ?";
        let params = [platform, uId];
        let [result, fields] = await pool.query(query, params);

        req.session.destroy(() => {
            res.json({ status: 'OK' });
        });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;