var express = require('express');
var router = express.Router();
const { isLogined, getPlatform, isNone, isInt } = require('../../lib/common');
const pool = require('../../lib/database');


router.get('', async (req, res) => {
    try {
        // let plapickKey = req.query.plapickKey;
        // let platform = getPlatform(plapickKey);
        // if (platform === '') {
        //     res.json({ status: 'ERR_PLAPICK_KEY' });
        //     return;
        // }
        //
        // if (!isLogined(req.session)) {
        //     res.json({ status: 'ERR_NO_PERMISSION' });
        //     return;
        // }

        let uId = req.session.uId;
        let page = req.query.page;
        let limit = req.query.limit;
        let piId = req.query.piId;

        if (isNone(piId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (!isInt(piId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (isNone(page)) {
            page = 1;
        } else {
            if (!isInt(page)) {
                res.json({ status: 'ERR_WRONG_PARAMS' });
                return;
            }
            page = parseInt(page);
        }
        if (isNone(limit)) {
            limit = 20;
        }  else {
            if (!isInt(limit)) {
                res.json({ status: 'ERR_WRONG_PARAMS' });
                return;
            }
            limit = parseInt(limit);
        }

        let params = [];

        let query = "SELECT mcpiTab.*, uTab.u_nick_name, uTab.u_profile_image, uTab.u_connected_date,";

        // 팔로우 여부
        query += " (SELECT IF(COUNT(*) > 0, 'Y', 'N') FROM t_maps_follow WHERE mf_u_id = uTab.u_id AND mf_follower_u_id = ?) AS isFollow,";
        params.push(uId);

        // 팔로워 개수
        query += " (SELECT COUNT(*) FROM t_maps_follow WHERE mf_u_id = uTab.u_id) AS followerCnt,";

        // 팔로잉 개수
        query += " (SELECT COUNT(*) FROM t_maps_follow WHERE mf_follower_u_id = uTab.u_id) AS followingCnt,";

        // 픽 개수
        query += " (SELECT COUNT(*) FROM t_picks WHERE pi_u_id = uTab.u_id) AS pickCnt,";

        // 좋아요 픽 개수
        query += " (SELECT COUNT(*) FROM t_maps_like_pick WHERE mlpi_u_id = uTab.u_id) AS likePickCnt,";

        // 좋아요 플레이스 개수
        query += " (SELECT COUNT(*) FROM t_maps_like_place WHERE mlp_u_id = uTab.u_id) AS likePlaceCnt,";

        // 차단 여부
        query += " (SELECT IF(COUNT(*) > 0, 'Y', 'N') FROM t_block_users WHERE bu_u_id = ? AND bu_block_u_id = uTab.u_id) AS isBlocked";
        params.push(uId);

        query += " FROM t_maps_comment_pick AS mcpiTab";
        query += " JOIN t_users AS uTab ON uTab.u_id = mcpiTab.mcpi_u_id";
        query += " WHERE mcpiTab.mcpi_pi_id = ?";
        query += " ORDER BY mcpiTab.mcpi_created_date ASC";
        query += ` LIMIT ${(page - 1) * limit}, ${limit}`;

        params.push(piId);
        let [result, fields] = await pool.query(query, params);

        res.json({ status: 'OK', result: result });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
