var express = require('express');
var router = express.Router();
const { isLogined, getPlatform, isNone, isValidStrLength } = require('../../lib/common');
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
        let nickName = req.body.nickName;

        if (isNone(nickName)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        // nickName 길이 체크 (2 - 8 (12))
        if (!isValidStrLength(12, 2, 8, nickName)) {
            res.json({ status: 'WRONG_NICKNAME' });
            return;
        }

        // nickName 중복 체크
        let query = "SELECT * FROM t_users WHERE u_nick_name = ? AND u_id != ?";
        let params = [nickName, uId];
        let [result, fields] = await pool.query(query, params);

        if (result.length > 0) {
            res.json({ status: 'EXISTS_NICKNAME' });
            return;
        }

        res.json({ status: 'OK' });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;