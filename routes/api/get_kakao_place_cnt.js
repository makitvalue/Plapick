var express = require('express');
var router = express.Router();
const { isLogined, getPlatform, isNone, getJSONList } = require('../../lib/common');
const pool = require('../../lib/database');


router.get('', async (req, res) => {
    try {
        let plapickKey = req.query.plapickKey;
        let platform = getPlatform(plapickKey);
        if (platform === '') {
            res.json({ status: 'ERR_PLAPICK_KEY' });
            return;
        }

        if (!isLogined(req.session)) {
            res.json({ status: 'ERR_NO_PERMISSION' });
            return;
        }

        let kakaoId = req.query.kakaoId;

        if (isNone(kakaoId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        let kakaoIdList = kakaoId.split('|');

        let kakaoCntList = [];

        if (kakaoIdList.length > 0) {
            let query = "SELECT pTab.p_k_id,";

            // 플레이스 좋아요 개수
            query += " (SELECT COUNT(*) FROM t_place_likes WHERE pl_p_id = pTab.p_id) AS p_like_cnt,";

            // 플레이스 댓글 개수
            query += " (SELECT COUNT(*) FROM t_place_comments WHERE pc_p_id = pTab.p_id) AS p_comment_cnt,";

            // 플레이스 게시물 개수
            query += " (SELECT COUNT(*) FROM t_posts WHERE po_p_id = pTab.p_id) AS p_posts_cnt";

            query += " FROM t_places AS pTab";
            let params = [];

            query += " WHERE p_k_id IN (";
            for (let i = 0; i < kakaoIdList.length; i++) {
                if (i > 0) query += " ,";
                query += " ?";
                params.push(kakaoIdList[i]);
            }
            query += " )";

            let [result, fields] = await pool.query(query, params);
            kakaoCntList = result;
        }

        res.json({ status: 'OK', result: kakaoCntList });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
