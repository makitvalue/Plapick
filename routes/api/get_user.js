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

        let query = " SELECT";
        query += " uTab.u_id, uTab.u_nick_name, uTab.u_profile_image, uTab.u_connected_date,";
        
        // 팔로우 여부
        query += " IF(mfIsFollowTab.cnt > 0, 'Y', 'N') AS isFollow,";

        // 팍고워 개수
        query += " IFNULL(mfFollowerCntTab.cnt, 0) AS followerCnt,";

        // 픽 개수
        query += " IFNULL(piTab.cnt, 0) AS pickCnt";

        query += " FROM t_users AS uTab";

        // 팔로우 여부
        query += " LEFT JOIN (SELECT mf_u_id, COUNT(*) AS cnt FROM t_maps_follow WHERE mf_follower_u_id = ? GROUP BY mf_u_id) AS mfIsFollowTab ON mfIsFollowTab.mf_u_id = uTab.u_id";

        // 팔로워 개수
        query += " LEFT JOIN (SELECT mf_u_id, COUNT(*) AS cnt FROM t_maps_follow GROUP BY mf_u_id) AS mfFollowerCntTab ON mfFollowerCntTab.mf_u_id = uTab.u_id";
        
        // 픽 개수
        query += " LEFT JOIN (SELECT pi_u_id, COUNT(*) AS cnt FROM t_picks GROUP BY pi_u_id) AS piTab ON piTab.pi_u_id = uTab.u_id";

        query += " WHERE uTab.u_id = ?";

        let params = [authUId, uId];

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