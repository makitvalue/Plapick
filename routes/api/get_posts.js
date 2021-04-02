var express = require('express');
var router = express.Router();
const { isLogined, getPlatform, isNone, isInt } = require('../../lib/common');
const pool = require('../../lib/database');
const GET_POSTS_LIMIT = 18;


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
        let mode = req.query.mode;
        let uId = req.query.uId;
        let pId = req.query.pId;
        let poId = req.query.poId;
        let pIdList = req.query.pIdList;
        let page = req.query.page;
        let limit = req.query.limit;

        if (isNone(mode)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        // 전체 게시물 / 특정 사용자가 게시한 게시물 / 특정 플레이스에 게시된 게시물 / 특정 사용자가 좋아요한 게시물 / 특정 게시물
        // 특정 사용자가 특정 플레이스들에 게시된 게시물
        if (mode != 'ALL' && mode != 'USER' && mode != 'PLACE' && mode != 'LIKE' && mode != 'SINGLE' && mode != 'PLACES') {
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
        if (isNone(limit)) { limit = GET_POSTS_LIMIT; }
        else {
            if (!isInt(limit)) {
                res.json({ status: 'ERR_WRONG_PARAMS' });
                return;
            }
            limit = parseInt(limit);
        }

        let query = "SET SESSION group_concat_max_len = 65535";
        await pool.query(query);

        let params = [];
        let [result, fields] = [null, null];

        let postsList = [];

        if (mode == 'ALL' ) {
            // 전체 게시물
            query = "SELECT poTab.*, pTab.p_k_id, pTab.p_name, uTab.u_nickname, uTab.u_profile_image,";

            // 게시물 사진
            query += " (";
                query += " SELECT GROUP_CONCAT(";
                    query += " CONCAT_WS(':', poiTab.poi_id, poiTab.poi_path)";
                    query += " ORDER BY poiTab.poi_order SEPARATOR '|'";
                query += " )";
                query += " FROM t_posts_images AS poiTab";
                query += " WHERE poiTab.poi_po_id = poTab.po_id";
            query += " ) AS poi,";

            // 게시물 좋아요 여부
            query += " (SELECT IF(COUNT(*) > 0, 'Y', 'N') FROM t_posts_likes WHERE pol_u_id = ? AND pol_po_id = poTab.po_id) AS po_is_like,";

            // 게시물 좋아요 개수
            query += " (SELECT COUNT(*) FROM t_posts_likes WHERE pol_po_id = poTab.po_id) AS po_like_cnt,";

            // 게시물 댓글 / 대댓글 개수
            query += " (SELECT COUNT(*) FROM t_posts_comments WHERE poc_po_id = poTab.po_id) AS po_comment_cnt,";
            query += " (SELECT COUNT(*) FROM t_posts_re_comments WHERE porc_po_id = poTab.po_id) AS po_re_comment_cnt";

            query += " FROM t_posts AS poTab";

            query += " JOIN t_places AS pTab ON pTab.p_id = poTab.po_p_id";
            query += " JOIN t_users AS uTab ON uTab.u_id = poTab.po_u_id";

            // 활성화된 사용자의 게시물만
            query += " WHERE uTab.u_status LIKE 'ACTIVATE'";

            query += " ORDER BY poTab.po_created_date DESC";
            query += ` LIMIT ${(page - 1) * GET_POSTS_LIMIT}, ${GET_POSTS_LIMIT}`;
            params = [authUId];

        } else if (mode == 'USER') {
            // 특정 사용자가 게시한 게시물
            if (isNone(uId)) {
                res.json({ status: 'ERR_WRONG_PARAMS' });
                return;
            }

            query = "SELECT poTab.*, pTab.p_k_id, pTab.p_name, uTab.u_nickname, uTab.u_profile_image,";

            // 게시물 사진
            query += " (";
                query += " SELECT GROUP_CONCAT(";
                    query += " CONCAT_WS(':', poiTab.poi_id, poiTab.poi_path)";
                    query += " ORDER BY poiTab.poi_order SEPARATOR '|'";
                query += " )";
                query += " FROM t_posts_images AS poiTab";
                query += " WHERE poiTab.poi_po_id = poTab.po_id";
            query += " ) AS poi,";

            // 게시물 좋아요 여부
            query += " (SELECT IF(COUNT(*) > 0, 'Y', 'N') FROM t_posts_likes WHERE pol_u_id = ? AND pol_po_id = poTab.po_id) AS po_is_like,";

            // 게시물 좋아요 개수
            query += " (SELECT COUNT(*) FROM t_posts_likes WHERE pol_po_id = poTab.po_id) AS po_like_cnt,";

            // 게시물 댓글 / 대댓글 개수
            query += " (SELECT COUNT(*) FROM t_posts_comments WHERE poc_po_id = poTab.po_id) AS po_comment_cnt,";
            query += " (SELECT COUNT(*) FROM t_posts_re_comments WHERE porc_po_id = poTab.po_id) AS po_re_comment_cnt";

            query += " FROM t_posts AS poTab";

            query += " JOIN t_places AS pTab ON pTab.p_id = poTab.po_p_id";
            query += " JOIN t_users AS uTab ON uTab.u_id = poTab.po_u_id";

            query += " WHERE poTab.po_u_id = ?";

            query += " ORDER BY poTab.po_created_date DESC";
            query += ` LIMIT ${(page - 1) * GET_POSTS_LIMIT}, ${GET_POSTS_LIMIT}`;
            params = [authUId, uId];

        } else if (mode == 'PLACE') {
            // 특정 플레이스의 게시물
            if (isNone(pId)) {
                res.json({ status: 'ERR_WRONG_PARAMS' });
                return;
            }

            query = "SELECT poTab.*, pTab.p_k_id, pTab.p_name, uTab.u_nickname, uTab.u_profile_image,";

            // 게시물 사진
            query += " (";
                query += " SELECT GROUP_CONCAT(";
                    query += " CONCAT_WS(':', poiTab.poi_id, poiTab.poi_path)";
                    query += " ORDER BY poiTab.poi_order SEPARATOR '|'";
                query += " )";
                query += " FROM t_posts_images AS poiTab";
                query += " WHERE poiTab.poi_po_id = poTab.po_id";
            query += " ) AS poi,";

            // 게시물 좋아요 여부
            query += " (SELECT IF(COUNT(*) > 0, 'Y', 'N') FROM t_posts_likes WHERE pol_u_id = ? AND pol_po_id = poTab.po_id) AS po_is_like,";

            // 게시물 좋아요 개수
            query += " (SELECT COUNT(*) FROM t_posts_likes WHERE pol_po_id = poTab.po_id) AS po_like_cnt,";

            // 게시물 댓글 / 대댓글 개수
            query += " (SELECT COUNT(*) FROM t_posts_comments WHERE poc_po_id = poTab.po_id) AS po_comment_cnt,";
            query += " (SELECT COUNT(*) FROM t_posts_re_comments WHERE porc_po_id = poTab.po_id) AS po_re_comment_cnt";

            query += " FROM t_posts AS poTab";

            query += " JOIN t_places AS pTab ON pTab.p_id = poTab.po_p_id";
            query += " JOIN t_users AS uTab ON uTab.u_id = poTab.po_u_id";

            query += " WHERE poTab.po_p_id = ?";

            // 활성화된 사용자의 게시물만
            query += " AND uTab.u_status LIKE 'ACTIVATE'";

            query += " ORDER BY poTab.po_created_date DESC";
            params = [authUId, pId];

        } else if (mode == 'LIKE') {
            // 특정 사용자가 좋아요한 게시물
            if (isNone(uId)) {
                res.json({ status: 'ERR_WRONG_PARAMS' });
                return;
            }

            query = "SELECT poTab.*, pTab.p_k_id, pTab.p_name, uTab.u_nickname, uTab.u_profile_image,";

            // 게시물 사진
            query += " (";
                query += " SELECT GROUP_CONCAT(";
                    query += " CONCAT_WS(':', poiTab.poi_id, poiTab.poi_path)";
                    query += " ORDER BY poiTab.poi_order SEPARATOR '|'";
                query += " )";
                query += " FROM t_posts_images AS poiTab";
                query += " WHERE poiTab.poi_po_id = poTab.po_id";
            query += " ) AS poi,";

            // 게시물 좋아요 여부
            query += " (SELECT IF(COUNT(*) > 0, 'Y', 'N') FROM t_posts_likes WHERE pol_u_id = ? AND pol_po_id = poTab.po_id) AS po_is_like,";

            // 게시물 좋아요 개수
            query += " (SELECT COUNT(*) FROM t_posts_likes WHERE pol_po_id = poTab.po_id) AS po_like_cnt,";

            // 게시물 댓글 / 대댓글 개수
            query += " (SELECT COUNT(*) FROM t_posts_comments WHERE poc_po_id = poTab.po_id) AS po_comment_cnt,";
            query += " (SELECT COUNT(*) FROM t_posts_re_comments WHERE porc_po_id = poTab.po_id) AS po_re_comment_cnt";

            query += " FROM t_posts_likes AS polTab";
            query += " JOIN t_posts AS poTab ON poTab.po_id = polTab.pol_po_id";

            query += " JOIN t_places AS pTab ON pTab.p_id = poTab.po_p_id";
            query += " JOIN t_users AS uTab ON uTab.u_id = poTab.po_u_id";

            query += " WHERE polTab.pol_u_id = ?";

            // 활성화된 사용자의 게시물만
            query += " AND uTab.u_status LIKE 'ACTIVATE'";

            query += " ORDER BY polTab.pol_created_date DESC";
            params = [authUId, uId];

        } else if (mode == 'SINGLE') {
            // 특정 게시물
            if (isNone(poId)) {
                res.json({ status: 'ERR_WRONG_PARAMS' });
                return;
            }

            query = "SELECT poTab.*, pTab.p_k_id, pTab.p_name, uTab.u_nickname, uTab.u_profile_image,";

            // 게시물 사진
            query += " (";
                query += " SELECT GROUP_CONCAT(";
                    query += " CONCAT_WS(':', poiTab.poi_id, poiTab.poi_path)";
                    query += " ORDER BY poiTab.poi_order SEPARATOR '|'";
                query += " )";
                query += " FROM t_posts_images AS poiTab";
                query += " WHERE poiTab.poi_po_id = poTab.po_id";
            query += " ) AS poi,";

            // 게시물 좋아요 여부
            query += " (SELECT IF(COUNT(*) > 0, 'Y', 'N') FROM t_posts_likes WHERE pol_u_id = ? AND pol_po_id = poTab.po_id) AS po_is_like,";

            // 게시물 좋아요 개수
            query += " (SELECT COUNT(*) FROM t_posts_likes WHERE pol_po_id = poTab.po_id) AS po_like_cnt,";

            // 게시물 댓글 / 대댓글 개수
            query += " (SELECT COUNT(*) FROM t_posts_comments WHERE poc_po_id = poTab.po_id) AS po_comment_cnt,";
            query += " (SELECT COUNT(*) FROM t_posts_re_comments WHERE porc_po_id = poTab.po_id) AS po_re_comment_cnt";

            query += " FROM t_posts AS poTab";

            query += " JOIN t_places AS pTab ON pTab.p_id = poTab.po_p_id";
            query += " JOIN t_users AS uTab ON uTab.u_id = poTab.po_u_id";

            query += " WHERE poTab.po_id = ?";
            params = [authUId, poId];

        } else if (mode == 'PLACES') {
            // 특정 사용자가 특정 플레이스들에 게시된 게시물
            if (isNone(pIdList) || isNone(uId)) {
                res.json({ status: 'ERR_WRONG_PARAMS' });
                return;
            }

            pIdList = pIdList.split('|');

            if (pIdList.length == 0) {
                res.json({ status: 'ERR_WRONG_PARAMS' });
                return;
            }

            query = "SELECT poTab.*, pTab.p_k_id, pTab.p_name, uTab.u_nickname, uTab.u_profile_image,";

            // 게시물 사진
            query += " (";
                query += " SELECT GROUP_CONCAT(";
                    query += " CONCAT_WS(':', poiTab.poi_id, poiTab.poi_path)";
                    query += " ORDER BY poiTab.poi_order SEPARATOR '|'";
                query += " )";
                query += " FROM t_posts_images AS poiTab";
                query += " WHERE poiTab.poi_po_id = poTab.po_id";
            query += " ) AS poi,";

            // 게시물 좋아요 여부
            query += " (SELECT IF(COUNT(*) > 0, 'Y', 'N') FROM t_posts_likes WHERE pol_u_id = ? AND pol_po_id = poTab.po_id) AS po_is_like,";

            // 게시물 좋아요 개수
            query += " (SELECT COUNT(*) FROM t_posts_likes WHERE pol_po_id = poTab.po_id) AS po_like_cnt,";

            // 게시물 댓글 / 대댓글 개수
            query += " (SELECT COUNT(*) FROM t_posts_comments WHERE poc_po_id = poTab.po_id) AS po_comment_cnt,";
            query += " (SELECT COUNT(*) FROM t_posts_re_comments WHERE porc_po_id = poTab.po_id) AS po_re_comment_cnt";

            query += " FROM t_posts AS poTab";

            query += " JOIN t_places AS pTab ON pTab.p_id = poTab.po_p_id";
            query += " JOIN t_users AS uTab ON uTab.u_id = poTab.po_u_id";

            query += " WHERE poTab.po_u_id = ? AND poTab.po_p_id IN (";

            params = [authUId, uId];

            for (let i = 0; i < pIdList.length; i++) {
                if (i > 0) query += " ,";
                query += " ?";
                params.push(pIdList[i]);
            }
            query += " )";
        }

        [result, fields] = await pool.query(query, params);
        postsList = result;

        // while (true) {
        //     if (postsList.length < GET_POSTS_LIMIT) {
        //         postsList.push(postsList[0]);
        //     } else {
        //         break;
        //     }
        // }

        res.json({ status: 'OK', result: postsList, mode: mode });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
