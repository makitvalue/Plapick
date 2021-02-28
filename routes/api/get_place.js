var express = require('express');
var router = express.Router();
const { isLogined, isInt, isNone, getPlatform, getPlaceSelectWhatQuery } = require('../../lib/common');
const pool = require('../../lib/database');


// 플레이스 가져오기
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

        let uId = req.session.uId;
        let pId = req.query.pId;
    
        if (isNone(pId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (!isInt(pId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        let query = "SELECT * FROM t_block_users WHERE bu_u_id = ?";
        let params = [uId];
        let [result, fields] = await pool.query(query, params);

        let blockUserList = result;

        query = "SET SESSION group_concat_max_len = 65535";
        await pool.query(query);
    
        query = getPlaceSelectWhatQuery(blockUserList);
        query += " FROM t_places AS pTab";
        // query += getPlaceSelectJoinQuery();
        query += " WHERE p_id = ?";

        params = [];
        for (let i = 0; i < blockUserList.length; i++) {
            params.push(blockUserList[i].bu_block_u_id);
        }
        params.push(uId);
        params.push(pId);

        [result, fields] = await pool.query(query, params);
    
        if (result.length == 0) {
            res.json({ status: 'ERR_NO_PLACE' });
            return;
        }
    
        let place = result[0];
        res.json({ status: 'OK', result: place });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;