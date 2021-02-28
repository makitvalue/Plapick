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

        // if (!isLogined(req.session)) {
        //     res.json({ status: 'ERR_NO_PERMISSION' });
        //     return;
        // }

        let authUId = req.session.uId; // req.session.uId 2101111820031276
        let order = req.query.order; // RECENT, POPULAR
        let page = req.query.page;
        let limit = req.query.limit;
        let uId = req.query.uId; // 이게 들어오면 해당 유저의 id
        let pId = req.query.pId;
        let mlpiUId = req.query.mlpiUId; // 이건 해당 유저가 좋아요한 픽
        let bpiUId = req.query.bpiUId; // 차단한 픽

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
            limit = 30;
        }  else {
            if (!isInt(limit)) {
                res.json({ status: 'ERR_WRONG_PARAMS' });
                return;
            }
            limit = parseInt(limit);
        }

        if (isNone(order)) order = 'RECENT';

        let query = "SELECT piTab.*,";

        // 픽 > 작성자
        query += " uTab.u_id, uTab.u_nick_name, uTab.u_profile_image, uTab.u_connected_date,";

        // 픽 > 플레이스
        query += " pTab.*,";

        // 픽 좋아요 여부
        query += " IF((SELECT COUNT(*) FROM t_maps_like_pick WHERE mlpi_u_id = ? AND mlpi_pi_id = piTab.pi_id) > 0, 'Y', 'N') AS isLike,";

        // 픽 좋아요 개수
        query += " (SELECT COUNT(*) FROM t_maps_like_pick WHERE mlpi_pi_id = piTab.pi_id) AS likeCnt,";

        // 픽 댓글 개수
        query += " (SELECT COUNT(*) FROM t_maps_comment_pick WHERE mcpi_pi_id = piTab.pi_id) AS commentCnt,";

        // 픽 차단 여부
        query += " IF((SELECT COUNT(*) FROM t_block_picks WHERE bpi_u_id = ? AND bpi_pi_id = piTab.pi_id) > 0, 'Y', 'N') AS isBlocked,";
        
        // 픽 > 작성자 > 팔로우 여부
        query += " (SELECT IF(COUNT(*) > 0, 'Y', 'N') FROM t_maps_follow WHERE mf_u_id = uTab.u_id AND mf_follower_u_id = ?) AS uIsFollow,";

        // 픽 > 작성자 > 팔로워 개수
        query += " (SELECT COUNT(*) FROM t_maps_follow WHERE mf_u_id = uTab.u_id) AS uFollowerCnt,";

        // 픽 > 작성자 > 팔로잉 개수
        query += " (SELECT COUNT(*) FROM t_maps_follow WHERE mf_follower_u_id = uTab.u_id) AS uFollowingCnt,";

        // 픽 > 작성자 > 픽 개수
        query += " (SELECT COUNT(*) FROM t_picks WHERE pi_u_id = uTab.u_id) AS uPickCnt,";

        // 픽 > 작성자 > 좋아요 픽 개수
        query += " (SELECT COUNT(*) FROM t_maps_like_pick WHERE mlpi_u_id = uTab.u_id) AS uLikePickCnt,";

        // 픽 > 작성자 > 좋아요 플레이스 개수
        query += " (SELECT COUNT(*) FROM t_maps_like_place WHERE mlp_u_id = uTab.u_id) AS uLikePlaceCnt,";

        // 픽 > 작성자 > 차단 여부
        query += " (SELECT IF(COUNT(*) > 0, 'Y', 'N') FROM t_block_users WHERE bu_u_id = ? AND bu_block_u_id = uTab.u_id) AS uIsBlocked,";
        
        // 픽 > 플레이스 > 픽들 (빈문자열)
        query += " '' AS pPicks,";

        // 픽 > 플레이스 > 좋아요 여부
        query += " IF((SELECT COUNT(*) FROM t_maps_like_place WHERE mlp_u_id = ? AND mlp_p_id = pTab.p_id) > 0, 'Y', 'N') AS pIsLike,";

        // 픽 > 플레이스 > 좋아요 개수
        query += " (SELECT COUNT(*) FROM t_maps_like_place WHERE mlp_p_id = pTab.p_id) AS pLikeCnt,";

        // 픽 > 플레이스 > 댓글 개수
        query += " (SELECT COUNT(*) FROM t_maps_comment_place WHERE mcp_p_id = pTab.p_id) AS pCommentCnt,";

        // 픽 > 플레이스 > 픽 개수
        query += " (SELECT COUNT(*) FROM t_picks WHERE pi_p_id = pTab.p_id) AS pPickCnt";

        if (!isNone(mlpiUId)) {
            if (!isInt(mlpiUId)) {
                res.json({ status: 'ERR_WRONG_PARAMS' });
                return;
            }
            query += " FROM t_maps_like_pick AS mlpiTab";
            query += " JOIN t_picks AS piTab ON piTab.pi_id = mlpiTab.mlpi_pi_id";

        } else if (!isNone(bpiUId)) {
            if (!isInt(bpiUId)) {
                res.json({ status: 'ERR_WRONG_PARAMS' });
                return;
            }
            query += " FROM t_block_picks AS bpiTab";
            query += " JOIN t_picks AS piTab ON piTab.pi_id = bpiTab.bpi_pi_id";

        } else {
            query += " FROM t_picks AS piTab";
        }

        // 픽 > 플레이스
        query += " JOIN t_places AS pTab ON pTab.p_id = piTab.pi_p_id";

        // 픽 > 작성자
        query += " JOIN t_users AS uTab ON uTab.u_id = piTab.pi_u_id";
        
        let params = [authUId, authUId, authUId, authUId, authUId];

        if (!isNone(uId)) {
            if (!isInt(uId)) {
                res.json({ status: 'ERR_WRONG_PARAMS' });
                return;
            }
            query += " WHERE piTab.pi_u_id = ?";
            params.push(uId);

        } else if (!isNone(pId)) {
            if (!isInt(pId)) {
                res.json({ status: 'ERR_WRONG_PARAMS' });
                return;
            }
            query += " WHERE piTab.pi_p_id = ?";
            params.push(pId);

        } else if (!isNone(mlpiUId)) {
            query += " WHERE mlpiTab.mlpi_u_id = ?";
            params.push(mlpiUId);

        } else if (!isNone(bpiUId)) {
            query += " WHERE bpiTab.bpi_u_id = ?";
            params.push(bpiUId);

        } else {
            // ONLY RECENT
            query += " WHERE piTab.pi_u_id != ?";
            params.push(authUId);
        }

        // ORDER
        if (order == 'RECENT') {
            query += " ORDER BY piTab.pi_created_date DESC";

        } else if (order == 'POPULAR') {
            query += " ORDER BY (likeCnt + commentCnt) DESC";
        }

        query += ` LIMIT ${(page - 1) * limit}, ${limit}`;

        let [result, fields] = await pool.query(query, params);

        res.json({ status: 'OK', result: result });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;