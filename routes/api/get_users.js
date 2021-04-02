var express = require('express');
var router = express.Router();
const { isLogined, getPlatform, isNone, isInt } = require('../../lib/common');
const pool = require('../../lib/database');
const GET_USERS_LIMIT = 15;


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

        let authUId = req.session.uId;
        let mode = req.query.mode; // FOLLOWER, FOLLOWING, BLOCK
        let uId = req.query.uId;
        let page = req.query.page;
        let limit = req.query.limit;

        if (isNone(mode) || isNone(uId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (mode != 'FOLLOWER' && mode != 'FOLLOWING' && mode != 'BLOCK') {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (!isInt(uId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (isNone(page)) { page = 1; }
        else {
            if (!isInt(page)) {
                res.json({ status: 'ERR_WRONG_PARAMS' });
                return;
            }
            page = parseInt(page);
        }
        if (isNone(limit)) { limit = GET_USERS_LIMIT; }
        else {
            if (!isInt(limit)) {
                res.json({ status: 'ERR_WRONG_PARAMS' });
                return;
            }
            limit = parseInt(limit);
        }

        let query = "";
        let params = [];
        let [result, fields] = [null, null];

        let userList = [];

        if (mode == 'FOLLOWER') {
            query = "SELECT uTab.u_id, uTab.u_nickname, uTab.u_profile_image,";

            // 팔로우 여부
            query += " (SELECT IF(COUNT(*) > 0, 'Y', 'N') FROM t_follow WHERE f_target_u_id = uTab.u_id AND f_u_id = ?) AS u_is_follow,";

            // 팔로워 개수
            query += " (SELECT COUNT(*) FROM t_follow WHERE f_target_u_id = uTab.u_id) AS u_follower_cnt,";

            // 팔로잉 개수
            query += " (SELECT COUNT(*) FROM t_follow WHERE f_u_id = uTab.u_id) AS u_following_cnt,";

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

            query += " FROM t_follow AS fTab";
            query += " JOIN t_users AS uTab ON uTab.u_id = fTab.f_u_id";

            query += " WHERE fTab.f_target_u_id = ?";

            query += " ORDER BY fTab.f_created_date DESC";
            query += ` LIMIT ${(page - 1) * GET_USERS_LIMIT}, ${GET_USERS_LIMIT}`;

            params = [authUId, authUId, uId];

        } else if (mode == 'FOLLOWING') {
            query = "SELECT uTab.u_id, uTab.u_nickname, uTab.u_profile_image,";

            // 팔로우 여부
            query += " (SELECT IF(COUNT(*) > 0, 'Y', 'N') FROM t_follow WHERE f_target_u_id = uTab.u_id AND f_u_id = ?) AS u_is_follow,";

            // 팔로워 개수
            query += " (SELECT COUNT(*) FROM t_follow WHERE f_target_u_id = uTab.u_id) AS u_follower_cnt,";

            // 팔로잉 개수
            query += " (SELECT COUNT(*) FROM t_follow WHERE f_u_id = uTab.u_id) AS u_following_cnt,";

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

            query += " FROM t_follow AS fTab";
            query += " JOIN t_users AS uTab ON uTab.u_id = fTab.f_target_u_id";

            query += " WHERE fTab.f_u_id = ?";

            query += " ORDER BY fTab.f_created_date DESC";
            query += ` LIMIT ${(page - 1) * GET_USERS_LIMIT}, ${GET_USERS_LIMIT}`;

            params = [authUId, authUId, uId];

        } else if (mode == 'BLOCK') {

        }

        [result, fields] = await pool.query(query, params);
        userList = result;

        res.json({ status: 'OK', result: userList });

        // if (isNone(mode)) {
        //     res.json({ status: 'ERR_WRONG_PARAMS' });
        //     return;
        // }
        //
        // if (mode != 'KEYWORD' && mode != 'FOLLOWER' && mode != 'FOLLOWING' && mode != 'BLOCK') {
        //     res.json({ status: 'ERR_WRONG_PARAMS' });
        //     return;
        // }
        //
        // authUId = parseInt(authUId);
        //
        // let query = "SELECT";
        // let params = [];
        //
        // query += " uTab.u_id, uTab.u_nick_name, uTab.u_profile_image, uTab.u_connected_date,";
        //
        // // 팔로우 여부
        // query += " (SELECT IF(COUNT(*) > 0, 'Y', 'N') FROM t_maps_follow WHERE mf_u_id = uTab.u_id AND mf_follower_u_id = ?) AS isFollow,";
        // params.push(authUId);
        //
        // // 팔로워 개수
        // query += " (SELECT COUNT(*) FROM t_maps_follow WHERE mf_u_id = uTab.u_id) AS followerCnt,";
        //
        // // 팔로잉 개수
        // query += " (SELECT COUNT(*) FROM t_maps_follow WHERE mf_follower_u_id = uTab.u_id) AS followingCnt,";
        //
        // // 픽 개수
        // query += " (SELECT COUNT(*) FROM t_picks WHERE pi_u_id = uTab.u_id) AS pickCnt,";
        //
        // // 좋아요 픽 개수
        // query += " (SELECT COUNT(*) FROM t_maps_like_pick WHERE mlpi_u_id = uTab.u_id) AS likePickCnt,";
        //
        // // 좋아요 플레이스 개수
        // query += " (SELECT COUNT(*) FROM t_maps_like_place WHERE mlp_u_id = uTab.u_id) AS likePlaceCnt,";
        //
        // // 차단 여부
        // query += " (SELECT IF(COUNT(*) > 0, 'Y', 'N') FROM t_block_users WHERE bu_u_id = ? AND bu_block_u_id = uTab.u_id) AS isBlocked";
        // params.push(authUId);
        //
        // if (mode == 'KEYWORD') {
        //     // 닉네임으로 사용자 검색
        //     if (isNone(keyword)) {
        //         res.json({ status: 'ERR_WRONG_PARAMS' });
        //         return;
        //     }
        //
        //     query += " FROM t_users AS uTab WHERE uTab.u_nick_name LIKE ? AND uTab.u_id != ?";
        //     params.push(`%${keyword}%`);
        //     params.push(authUId); // 본인은 제외하고
        //
        // } else if (mode == 'FOLLOWER' || mode == 'FOLLOWING') {
        //     // 팔로워 혹은 팔로잉
        //     if (isNone(uId)) {
        //         res.json({ status: 'ERR_WRONG_PARAMS' });
        //         return;
        //     }
        //
        //     query += " FROM t_maps_follow AS mfTab";
        //     query += " JOIN t_users AS uTab ON uTab.u_id =";
        //
        //     query += (mode == 'FOLLOWER') ? " mfTab.mf_follower_u_id WHERE mfTab.mf_u_id = ?" : " mfTab.mf_u_id WHERE mfTab.mf_follower_u_id = ?";
        //     params.push(uId);
        // } else {
        //     // 차단한 사용자
        //     query += " FROM t_block_users AS buTab";
        //     query += " JOIN t_users AS uTab ON uTab.u_id = buTab.bu_block_u_id";
        //     query += " WHERE buTab.bu_u_id = ?";
        //     params.push(authUId);
        // }
        //
        // let [result, fields] = await pool.query(query, params);
        //
        // res.json({ status: 'OK', result: result });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
