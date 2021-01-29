var express = require('express');
var router = express.Router();
const { isLogined, isNone, isInt, getPlatform } = require('../../lib/common');
const pool = require('../../lib/database');


// 사용자 조회
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
        
        if (isNone(uId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (!isInt(uId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        // 비교를 위한 형변환
        authUId = parseInt(authUId);
        uId = parseInt(uId);
    
        let query = "SELECT";
        let params = [];
        if (authUId === uId) { // 본인
            query += " uTab.*,";
            query += " IFNULL(myMnTab.cnt, 0) AS myNewsCnt,";
            query += " IFNULL(mlpiTab.cnt, 0) AS myLikePickCnt,";
            query += " IFNULL(mlpTab.cnt, 0) AS myLikePlaceCnt,";

        } else { // 타인인 경우 유저정보 제한, 소식듣기 여부 가져오기
            query += " IF(mnUserTab.cnt > 0, 'Y', 'N') AS isNewsUser,";
            query += " uTab.u_id, uTab.u_nick_name, uTab.u_profile_image, uTab.u_connected_date,";
        }

        query += " IFNULL(mnTab.cnt, 0) AS newsCnt";
        query += " FROM t_users AS uTab";
        
        if (authUId === uId) { // 본인
            query += " LEFT JOIN (SELECT mn_s_u_id, COUNT(*) AS cnt FROM t_maps_news GROUP BY mn_s_u_id) AS myMnTab ON myMnTab.mn_s_u_id = uTab.u_id";
            query += " LEFT JOIN (SELECT mlpi_u_id, COUNT(*) AS cnt FROM t_maps_like_pick GROUP BY mlpi_u_id) AS mlpiTab ON mlpiTab.mlpi_u_id = uTab.u_id";
            query += " LEFT JOIN (SELECT mlp_u_id, COUNT(*) AS cnt FROM t_maps_like_place GROUP BY mlp_u_id) AS mlpTab ON mlpTab.mlp_u_id = uTab.u_id";
 
        } else { // 타인인 경우 소식듣기 여부 가져오기
            query += " LEFT JOIN (SELECT mn_d_u_id, COUNT(*) AS cnt FROM t_maps_news WHERE mn_s_u_id = ? GROUP BY mn_d_u_id) AS mnUserTab ON mnUserTab.mn_d_u_id = uTab.u_id";
            params.push(authUId);
        }

        // 소식을 듣는 사람 개수 가져오기
        query += " LEFT JOIN (SELECT mn_d_u_id, COUNT(*) AS cnt FROM t_maps_news GROUP BY mn_d_u_id) AS mnTab ON mnTab.mn_d_u_id = uTab.u_id";
        
        query += " WHERE uTab.u_id = ?";
        params.push(uId);

        let [result, fields] = await pool.query(query, params);
    
        if (result.length == 0) {
            res.json({ status: 'ERR_NO_USER' });
            return;
        }
    
        let user = result[0];
        res.json({ status: 'OK', result: user });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;