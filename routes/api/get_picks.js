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

        let page = req.query.page;
        let limit = req.query.limit;
        let uId = req.query.uId;
        let pId = req.query.pId;

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

        let query = "SELECT piTab.*,";

        // 좋아요 개수
        query += " (SELECT COUNT(*) FROM t_maps_like_pick WHERE mlpi_pi_id = piTab.pi_id) AS likeCnt,";

        // 댓글 개수
        query += " (SELECT COUNT(*) FROM t_maps_comment_pick WHERE mcpi_pi_id = piTab.pi_id) AS commentCnt";

        // query += " IFNULL(mlpiTab.cnt, 0) AS piLikeCnt,";
        // query += " IFNULL(mcpiTab.cnt, 0) AS piCommentCnt";

        // query += " uTab.u_id, uTab.u_nick_name, uTab.u_profile_image, uTab.u_connected_date";
        query += " FROM t_picks AS piTab";
        // query += " JOIN t_places AS pTab ON piTab.pi_p_id = pTab.p_id ";
        // query += " JOIN t_users AS uTab ON piTab.pi_u_id = uTab.u_id ";

        // query += " LEFT JOIN (SELECT mlpi_pi_id, COUNT(*) AS cnt FROM t_maps_like_pick GROUP BY mlpi_pi_id) AS mlpiTab ON mlpiTab.mlpi_pi_id = piTab.pi_id";
        // query += " LEFT JOIN (SELECT mcpi_pi_id, COUNT(*) AS cnt FROM t_maps_comment_pick GROUP BY mcpi_pi_id) AS mcpiTab ON mcpiTab.mcpi_pi_id = piTab.pi_id";
        let params = [];

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
        }

        query += " ORDER BY piTab.pi_created_date DESC";
        query += ` LIMIT ${(page - 1) * limit}, ${limit}`;

        let [result, fields] = await pool.query(query, params);

        res.json({ status: 'OK', result: result });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;