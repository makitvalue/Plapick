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
        let isAllowed = req.body.isAllowed;
        let actionMode = req.body.actionMode;

        if (isNone(isAllowed) || isNone(actionMode)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (isAllowed != 'Y' && isAllowed != 'N') {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (actionMode != 'AD' && actionMode != 'POSTS_COMMENT' && actionMode != 'FOLLOWED' && actionMode != 'RE_COMMENT') {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        let query = "UPDATE t_users SET ";

        if (actionMode == 'AD') query += " u_is_allowed_push_ad = ?";
        else if (actionMode == 'POSTS_COMMENT') query += " u_is_allowed_push_posts_comment = ?";
        else if (actionMode == 'FOLLOWED') query += " u_is_allowed_push_followed = ?";
        else if (actionMode == 'RE_COMMENT') query += " u_is_allowed_push_re_comment = ?";

        query += " WHERE u_id = ?";
        let params = [isAllowed, uId];
        await pool.query(query, params);

        res.json({ status: 'OK' });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
