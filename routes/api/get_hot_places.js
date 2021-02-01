var express = require('express');
var router = express.Router();
const { isLogined, getPlatform } = require('../../lib/common');
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

        let uId = req.session.uId;

        let query = "SET SESSION group_concat_max_len = 1000000";
        let [result, fields] = await pool.query(query);

        query = " SELECT pTab.*, piTab.mostPicks AS pMostPicks,";
        // query += " IF(mlpTab.cnt > 0, 'Y', 'N') AS pIsLike,";
        query += " IFNULL(mlpCntTab.cnt, 0) AS pLikeCnt,";
        query += " IFNULL(mcpTab.cnt, 0) AS pCommentCnt,";
        query += " IFNULL(piCntTab.cnt, 0) AS pPickCnt";

        query += " FROM t_places AS pTab";

        // 해당 플레이스가 갖고있는 픽들 전부 가져오기
        // TODO: 나중에 mostpick만 가져오는 기능 추가해야됨 (걍 WHERE 쓰면 될듯)
        query += " LEFT JOIN";
        query += " (SELECT pi_p_id,";
        query += " GROUP_CONCAT(";
        query += " CONCAT_WS(':', pi_id,";
        query += " CONCAT_WS(':', u_id,";
        query += " CONCAT_WS(':', u_nick_name, uTab.u_profile_image)))";
        query += " SEPARATOR '|') AS mostPicks";
        query += " FROM t_picks AS _piTab";
        query += " JOIN t_users AS uTab ON _piTab.pi_u_id = uTab.u_id";
        query += " GROUP BY pi_p_id)";
        query += " AS piTab ON pTab.p_id = piTab.pi_p_id";

        // 현재 사용자 좋아요 여부
        // query += " LEFT JOIN";
        // query += " (SELECT mlp_p_id, COUNT(*) AS cnt FROM t_maps_like_place WHERE mlp_u_id = ? GROUP BY mlp_p_id)";
        // query += " AS mlpTab ON pTab.p_id = mlpTab.mlp_p_id";

        // 좋아요 개수
        query += " LEFT JOIN (SELECT mlp_p_id, COUNT(*) AS cnt FROM t_maps_like_place GROUP BY mlp_p_id) AS mlpCntTab ON mlpCntTab.mlp_p_id = pTab.p_id";

        // 댓글 개수
        query += " LEFT JOIN (SELECT mcp_p_id, COUNT(*) AS cnt FROM t_maps_comment_place GROUP BY mcp_p_id) AS mcpTab ON mcpTab.mcp_p_id = pTab.p_id";

        // 픽 개수
        query += " LEFT JOIN (SELECT pi_p_id, COUNT(*) AS cnt FROM t_picks GROUP BY pi_p_id) AS piCntTab ON piCntTab.pi_p_id = pTab.p_id";

        query += " WHERE pTab.p_id = 1";

        // let params = [uId];
        [result, fields] = await pool.query(query);
        let pickList = [result[0], result[0], result[0]];

        res.json({ status: 'OK', result: pickList });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;