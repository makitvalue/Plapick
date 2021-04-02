var express = require('express');
var router = express.Router();
const { isLogined, isInt, isNone, getPlatform, getLocCode } = require('../../lib/common');
const pool = require('../../lib/database');


// 플레이스 가져오기
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

        let pId = req.query.pId;

        let kId = req.query.kId;
        let name = req.query.name;
        let address = req.query.address;
        let roadAddress = req.query.roadAddress;
        let lat = req.query.lat;
        let lng = req.query.lng;
        let categoryGroupCode = req.query.categoryGroupCode;
        let categoryGroupName = req.query.categoryGroupName;
        let categoryName = req.query.categoryName;
        let phone = req.query.phone;

        let query = "SELECT pTab.*,";

        // 플레이스 좋아요 여부
        query += " (SELECT IF(COUNT(*) > 0, 'Y', 'N') FROM t_place_likes WHERE pl_u_id = ? AND pl_p_id = pTab.p_id) AS p_is_like,";

        // 플레이스 좋아요 개수
        query += " (SELECT COUNT(*) FROM t_place_likes WHERE pl_p_id = pTab.p_id) AS p_like_cnt,";

        // 플레이스 댓글 개수
        query += " (SELECT COUNT(*) FROM t_place_comments WHERE pc_p_id = pTab.p_id) AS p_comment_cnt,";

        // 플레이스 게시물 개수
        query += " (SELECT COUNT(*) FROM t_posts WHERE po_p_id = pTab.p_id) AS p_posts_cnt";

        query += " FROM t_places AS pTab WHERE";

        let params = [uId];

        if (!isNone(pId)) { // pId 조회
            query += " pTab.p_id = ?";
            params.push(pId);

        } else if (!isNone(kId)) { // kId 조회
            query += " pTab.p_k_id = ?";
            params.push(kId);

        } else { // 둘다 없음
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        let [result, fields] = await pool.query(query, params);

        if (result.length == 0) {
            if (!isNone(pId)) { // pId로 조회했지만 결과가 없음
                res.json({ status: 'ERR_NO_PLACE' });
                return;

            } else { // 등록되지 않은 플레이스, 카카오 플레이스 등록
                let [plocCode, clocCode] = getLocCode(address, roadAddress);
                query = "INSERT INTO t_places";
                query += " (p_k_id, p_name, p_category_name, p_category_group_code, p_category_group_name, p_address,";
                query += " p_road_address, p_latitude, p_longitude, p_phone, p_ploc_code, p_cloc_code, p_geometry)";
                query += " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, POINT(" + lng +", " + lat + "))";
                params = [kId, name, categoryName, categoryGroupCode, categoryGroupName, address, roadAddress, lat, lng, phone, plocCode, clocCode];

                [result, fields] = await pool.query(query, params);

                res.json({ status: 'OK', result: {
                    p_id: result.insertId,
                    p_k_id: parseInt(kId),
                    p_name: name,
                    p_category_name: categoryName,
                    p_category_group_code: categoryGroupCode,
                    p_category_group_name: categoryGroupName,
                    p_address: address,
                    p_road_address: roadAddress,
                    p_latitude: lat,
                    p_longitude: lng,
                    p_phone: phone,
                    p_ploc_code: plocCode,
                    p_cloc_code: clocCode,
                    p_is_like: 'N',
                    p_like_cnt: 0,
                    p_comment_cnt: 0,
                    p_posts_cnt: 0
                }});
                return;
            }
        }

        let place = result[0];
        res.json({ status: 'OK', result: place });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
