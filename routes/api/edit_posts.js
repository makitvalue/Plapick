var express = require('express');
var router = express.Router();
const { isLogined, getPlatform, isNone, isInt, getLocCode } = require('../../lib/common');
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
        let poId = req.body.poId;
        let message = req.body.message;
        let kId = req.body.kId;
        let name = req.body.name;
        let address = req.body.address;
        let roadAddress = req.body.roadAddress;
        let lat = req.body.lat;
        let lng = req.body.lng;
        let categoryGroupCode = req.body.categoryGroupCode;
        let categoryGroupName = req.body.categoryGroupName;
        let categoryName = req.body.categoryName;
        let phone = req.body.phone;

        if (isNone(poId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (!isInt(poId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        let query = "SELECT * FROM t_posts WHERE po_id = ? AND po_u_id = ?";
        let params = [poId, uId];
        let [result, fields] = await pool.query(query, params);

        if (result.length == 0) {
            res.json({ status: 'ERR_NO_PERMISSION' });
            return;
        }

        let pId = result[0].po_p_id;

        // 플레이스가 변경됨, DB에 있는지 확인 후 추가
        if (!isNone(kId)) {
            query = "SELECT * FROM t_places WHERE p_k_id = ?";
            params = [kId];
            [result, fields] = await pool.query(query, params);

            if (result.length == 0) {
                let [plocCode, clocCode] = getLocCode(address, roadAddress);
                query = "INSERT INTO t_places";
                query += " (p_k_id, p_name, p_category_name, p_category_group_code, p_category_group_name, p_address,";
                query += " p_road_address, p_latitude, p_longitude, p_phone, p_ploc_code, p_cloc_code, p_geometry)";
                query += " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, POINT(" + lng +", " + lat + "))";
                params = [kId, name, categoryName, categoryGroupCode, categoryGroupName, address, roadAddress, lat, lng, phone, plocCode, clocCode];

                [result, fields] = await pool.query(query, params);

                pId = result.insertId;
            } else {
                pId = result[0].p_id;
            }
        }

        query = "UPDATE t_posts SET po_p_id = ?, po_message = ? WHERE po_id = ?";
        params = [pId, message, poId];
        await pool.query(query, params);

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

        query += " WHERE poTab.po_id = ?";
        params = [uId, poId];

        [result, fields] = await pool.query(query, params);

        let posts = result[0];

        res.json({ status: 'OK', result: posts });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
