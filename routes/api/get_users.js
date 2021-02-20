var express = require('express');
var router = express.Router();
const { isLogined, getPlatform, isNone,ntb } = require('../../lib/common');
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

        let uId = 2101111820031276; // req.session.uId;
        let mode = req.query.mode;
        let keyword = req.query.keyword;

        if (isNone(mode)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }
        
        if (mode != 'KEYWORD' && mode != 'FOLLOWER' && mode != 'FOLLOWING') {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }
        
        let query = "SELECT";
        let params = [];

        query += " uTab.u_id, uTab.u_nick_name, uTab.u_profile_image, uTab.u_connected_date,";
        
        // 팔로우 여부
        query += " (SELECT IF(COUNT(*) > 0, 'Y', 'N') FROM t_maps_follow WHERE mf_u_id = uTab.u_id AND mf_follower_u_id = ?) AS isFollow,";
        params.push(uId);

        // 팔로워 개수
        query += " (SELECT COUNT(*) FROM t_maps_follow WHERE mf_u_id = uTab.u_id) AS followerCnt,";

        // 팔로잉 개수
        query += " (SELECT COUNT(*) FROM t_maps_follow WHERE mf_follower_u_id = uTab.u_id) AS followingCnt,";

        // 픽 개수
        query += " (SELECT COUNT(*) FROM t_picks WHERE pi_u_id = uTab.u_id) AS pickCnt,";

        // 좋아요 픽 개수
        query += " (SELECT COUNT(*) FROM t_maps_like_pick WHERE mlpi_u_id = uTab.u_id) AS likePickCnt,";

        // 좋아요 플레이스 개수
        query += " (SELECT COUNT(*) FROM t_maps_like_place WHERE mlp_u_id = uTab.u_id) AS likePlaceCnt";
        
        if (mode == 'KEYWORD') {
            // 닉네임으로 사용자 검색
            if (isNone(keyword)) {
                res.json({ status: 'ERR_WRONG_PARAMS' });
                return;
            }

            query += " FROM t_users AS uTab WHERE uTab.u_nick_name LIKE ? AND uTab.u_id != ?";
            params.push(`%${keyword}%`);
            params.push(uId);

        } else {
            query += " FROM t_maps_follow AS mfTab";
            query += " JOIN t_users AS uTab ON uTab.u_id =";

            query += (mode == 'FOLLOWER') ? " mfTab.mf_follower_u_id WHERE mfTab.mf_u_id = ?" : " mfTab.mf_u_id WHERE mfTab.mf_follower_u_id = ?";
            params.push(uId);
        }
        
        let [result, fields] = await pool.query(query, params);

        res.json({ status: 'OK', result: result });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;