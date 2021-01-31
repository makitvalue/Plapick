var express = require('express');
var router = express.Router();
const { isLogined, getPlatform, isNone,ntb } = require('../../lib/common');
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
        let mode = ntb(req.query.mode);
        let keyword = ntb(req.query.keyword);

        if (isNone(mode)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }
        
        if (mode != 'KEYWORD' && mode != 'FOLLOWER' && mode != 'FOLLOWING') {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }
        
        let query = "SELECT";

        // 픽 개수
        query += " IFNULL(piTab.cnt, 0) AS pickCnt,";

        // 팔로워 개수
        query += " IFNULL(mfFollowerCntTab.cnt, 0) AS followerCnt,";

        query += " uTab.u_id, uTab.u_nick_name, uTab.u_profile_image, uTab.u_connected_date";
        let params = [];
        
        if (mode == 'KEYWORD') {
            // 닉네임으로 사용자 검색
            if (isNone(keyword)) {
                res.json({ status: 'ERR_WRONG_PARAMS' });
                return;
            }

            query += " FROM t_users AS uTab";

        } else {
            query += " FROM t_maps_follow AS mfTab";
            query += " JOIN t_users AS uTab ON uTab.u_id =";
            
            if (mode == 'FOLLOWER') { // 팔로워
                query += " mfTab.mf_follower_u_id";

            } else if (mode == 'FOLLOWING') { // 팔로잉
                query += " mfTab.mf_u_id";
            }
        }

        // 픽 개수
        query += " LEFT JOIN (SELECT pi_u_id, COUNT(*) AS cnt FROM t_picks GROUP BY pi_u_id) AS piTab ON piTab.pi_u_id = uTab.u_id";
        
        // 팔로워 개수
        query += " LEFT JOIN (SELECT mf_u_id, COUNT(*) AS cnt FROM t_maps_follow GROUP BY mf_u_id) AS mfFollowerCntTab ON mfFollowerCntTab.mf_u_id = uTab.u_id";

        if (mode == 'KEYWORD') {
            query += " WHERE uTab.u_nick_name LIKE ? AND uTab.u_id != ?";
            params = [`%${keyword}%`, uId];

        } else {
            if (mode == 'FOLLOWER') {
                query += " WHERE mfTab.mf_u_id = ?";
            } else if (mode == 'FOLLOWING') {
                query += " WHERE mfTab.mf_follower_u_id = ?";
            }
            params = [uId];
        }
        
        let [result, fields] = await pool.query(query, params);

        res.json({ status: 'OK', result: result });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;