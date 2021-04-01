var express = require('express');
var router = express.Router();
const { isLogined, isNone, isInt, getPlatform } = require('../../lib/common');
const pool = require('../../lib/database');


// 사용자 조회
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

        let authUId = req.session.uId; // 내 uId
        let uId = req.query.uId; // 대상 uId

        if (isNone(uId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (!isInt(uId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        let query = " SELECT";
        let params = [];

        query += (parseInt(authUId) === parseInt(uId)) ? " uTab.*," : " uTab.u_id, uTab.u_nickname, uTab.u_profile_image,";

        // 팔로우 여부
        query += " (SELECT IF(COUNT(*) > 0, 'Y', 'N') FROM t_maps_follow WHERE mf_u_id = uTab.u_id AND mf_follower_u_id = ?) AS u_is_followed,";
        params.push(authUId);

        // 팔로워 개수
        query += " (SELECT COUNT(*) FROM t_maps_follow WHERE mf_u_id = uTab.u_id) AS u_follower_cnt,";

        // 팔로잉 개수
        query += " (SELECT COUNT(*) FROM t_maps_follow WHERE mf_follower_u_id = uTab.u_id) AS u_following_cnt,";

        // 게시물 개수
        query += " (SELECT COUNT(*) FROM t_posts WHERE po_u_id = uTab.u_id) AS u_posts_cnt,";

        // 플레이스 개수
        query += " (SELECT COUNT(DISTINCT po_p_id) FROM t_posts WHERE po_u_id = uTab.u_id) AS u_place_cnt,";

        // 좋아요 픽 개수
        query += " (SELECT COUNT(*) FROM t_maps_like_pick WHERE mlpi_u_id = uTab.u_id) AS u_like_pick_cnt,";

        // 좋아요 플레이스 개수
        query += " (SELECT COUNT(*) FROM t_maps_like_place WHERE mlp_u_id = uTab.u_id) AS u_like_place_cnt,";

        // 차단 여부
        query += " (SELECT IF(COUNT(*) > 0, 'Y', 'N') FROM t_block_users WHERE bu_u_id = ? AND bu_block_u_id = uTab.u_id) AS u_is_blocked";
        params.push(authUId);

        query += " FROM t_users AS uTab";

        query += " WHERE uTab.u_id = ?";
        params.push(uId);

        let [result, fields] = await pool.query(query, params);

        if (result.length == 0) {
            res.json({ status: 'ERR_NO_USER' });
            return;
        }

        let user = result[0];

        res.json({ status: 'OK', result: user });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
