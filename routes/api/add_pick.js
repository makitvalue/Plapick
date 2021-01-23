var express = require('express');
var router = express.Router();
const { isLogined, isNone, getLocCode } = require('../../lib/common');
const pool = require('../../lib/database');


// 픽 추가
router.post('', async (req, res) => {
    try {
        if (!isLogined(req.session)) {
            res.json({ status: 'ERR_NO_PERMISSION' });
            return;
        }

        let uId = req.session.uId;
        let piId = req.body.piId;
        let piMessage = req.body.piMessage;
        let pkId = req.body.pkId;
        let pName = req.body.pName;
        let pAddress = req.body.pAddress;
        let pRoadAddress = req.body.pRoadAddress;
        let pCategoryName = req.body.pCategoryName;
        let pCategoryGroupName = req.body.pCategoryGroupName;
        let pCategoryGroupCode = req.body.pCategoryGroupCode;
        let pPhone = req.body.pPhone;
        let pLat = req.body.pLat;
        let pLng = req.body.pLng;

        if (isNone(piId) || isNone(pkId) || isNone(pName) || isNone(pLat) || isNone(pLng)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        let [result, fields] = [null, null];
        let query = "SELECT * FROM t_places WHERE p_k_id = ?";
        let params = [pkId];

        [result, fields] = await pool.query(query, params);

        let pId = 0;

        // 플레이스 새로 등록
        if (result.length == 0) {

            // 지역코드 찾기
            let [pPlocCode, pClocCode] = getLocCode(pAddress, pRoadAddress);

            query = "INSERT INTO t_places";
            query += " (p_k_id, p_name, p_category_name, p_category_group_code, p_category_group_name, p_address,";
            query += " p_road_address, p_latitude, p_longitude, p_geometry, p_phone, p_ploc_code, p_cloc_code)";
            query += " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, POINT(" + pLng +", " + pLat + "), ?, ?, ?)";
            params = [
                pkId, pName, pCategoryName, pCategoryGroupCode, pCategoryGroupName,
                pAddress, pRoadAddress, pLat, pLng, pPhone, pPlocCode, pClocCode
            ];
            [result, fields] = await pool.query(query, params);
            pId = result.insertId;
        } else {
            pId = result[0].p_id;
        }

        // 플레이스 > pickCnt 올려주고 updatedDate 갱신해주고
        query = "UPDATE t_places SET p_pick_cnt = p_pick_cnt + 1, p_updated_date = NOW() WHERE p_id = ?";
        params = [pId];
        [result, fields] = await pool.query(query, params);

        // 픽 등록
        query = "INSERT INTO t_picks (pi_id, pi_u_id, pi_p_id, pi_message) VALUES (?, ?, ?, ?)";
        params = [piId, uId, pId, piMessage];
        [result, fields] = await pool.query(query, params);

        res.json({ status: 'OK' });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;