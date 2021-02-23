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
        let title = req.body.title;
        let content = req.body.content;

        if (isNone(title) || isNone(content)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (title.length < 4 || title.length > 20) {
            res.json({ status: 'ERR_TITLE' });
            return;
        }

        if (content.length < 20 || content.length > 100) {
            res.json({ status: 'ERR_CONTENT' });
            return;
        }

        let query = "INSERT INTO t_qnas (q_u_id, q_title, q_content) VALUES (?, ?, ?)";
        let params = [uId, title, content];
        let [result, fields] = await pool.query(query, params);

        let qId = result.insertId;

        query = "SELECT * FROM t_qnas WHERE q_id = ?";
        params = [qId];
        [result, fields] = await pool.query(query, params);

        res.json({ status: 'OK', result: result[0] });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;