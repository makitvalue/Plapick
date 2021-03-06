var express = require('express');
var router = express.Router();
const { isLogined, getPlatform, isNone } = require('../../lib/common');
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
        let question = req.body.question;

        if (isNone(question)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        let query = "INSERT INTO t_qnas (q_u_id, q_question) VALUES (?, ?)";
        let params = [uId, question];
        let [result, fields] = await pool.query(query, params);

        let qId = result.insertId;

        query = "SELECT * FROM t_qnas WHERE q_id = ?";
        params = [qId];
        [result, fields] = await pool.query(query, params);

        let qna = result[0];
        res.json({ status: 'OK', result: qna });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
