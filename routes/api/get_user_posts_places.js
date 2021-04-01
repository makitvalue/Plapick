var express = require('express');
var router = express.Router();
const { isLogined, getPlatform, isNone, isInt } = require('../../lib/common');
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

        let authUId = req.session.uId;
        let uId = req.query.uId;

        let query = "SELECT DISTINCT pTab.p_id, pTab.*,";

        // 플레이스 좋아요 여부
        query += " IF(";
        query += " (SELECT COUNT(*) FROM t_place_likes WHERE pl_u_id = ? AND pl_p_id = pTab.p_id)"
        query += " > 0, 'Y', 'N') AS p_is_like,";

        // 플레이스 좋아요 개수
        query += " (SELECT COUNT(*) FROM t_place_likes WHERE pl_p_id = pTab.p_id) AS p_like_cnt,";

        // 플레이스 댓글 개수
        query += " (SELECT COUNT(*) FROM t_place_comments WHERE pc_p_id = pTab.p_id) AS p_comment_cnt,";

        // 플레이스 게시물 개수
        query += " (SELECT COUNT(*) FROM t_posts WHERE po_p_id = pTab.p_id) AS p_posts_cnt";

        query += " FROM t_posts AS poTab";
        query += " JOIN t_places AS pTab ON pTab.p_id = poTab.po_p_id";
        query += " WHERE poTab.po_u_id = ?";

        let params = [authUId, uId];

        let [result, fields] = await pool.query(query, params);

        let placeList = result;
        for (let i = 0; i < placeList.length; i++) { placeList[i].postsList = []; }

        query = "SET SESSION group_concat_max_len = 65535";
        await pool.query(query);

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
        query += " IF(";
        query += " (SELECT COUNT(*) FROM t_posts_likes WHERE pol_u_id = ? AND pol_po_id = poTab.po_id)"
        query += " > 0, 'Y', 'N') AS po_is_like,";

        // 게시물 좋아요 개수
        query += " (SELECT COUNT(*) FROM t_posts_likes WHERE pol_po_id = poTab.po_id) AS po_like_cnt,";

        // 게시물 댓글 / 대댓글 개수
        query += " (SELECT COUNT(*) FROM t_posts_comments WHERE poc_po_id = poTab.po_id) AS po_comment_cnt,";
        query += " (SELECT COUNT(*) FROM t_posts_re_comments WHERE porc_po_id = poTab.po_id) AS po_re_comment_cnt";

        query += " FROM t_posts AS poTab";

        query += " JOIN t_places AS pTab ON pTab.p_id = poTab.po_p_id";
        query += " JOIN t_users AS uTab ON uTab.u_id = poTab.po_u_id";

        query += " WHERE poTab.po_u_id = ? ORDER BY poTab.po_created_date DESC";
        params = [authUId, uId];

        [result, fields] = await pool.query(query, params);

        for (let i = 0; i < result.length; i++) {
            let posts = result[i];
            for (let j = 0; j < placeList.length; j++) {
                if (placeList[j].p_id == posts.po_p_id) {
                    placeList[j].postsList.push(posts);
                    break;
                }
            }
        }

        res.json({ status: 'OK', result: placeList });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
