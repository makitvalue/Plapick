var express = require('express');
var router = express.Router();
const { isLogined, getPlatform, isNone, isInt } = require('../../lib/common');
const pool = require('../../lib/database');
const fs = require('fs');


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

        if (isNone(poId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (!isInt(poId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        let query = "SELECT poTab.*,";
        query += " (SELECT GROUP_CONCAT(poi_path SEPARATOR '|') FROM t_posts_images WHERE poi_po_id = poTab.po_id) AS poiPath";
        query += " FROM t_posts AS poTab WHERE poTab.po_id = ? AND poTab.po_u_id = ?";
        let params = [poId, uId];
        let [result, fields] = await pool.query(query, params);

        if (result.length == 0) {
            res.json({ status: 'ERR_NO_PERMISSION' });
            return;
        }

        let posts = result[0];
        params = [poId];

        let poiPathList = posts.poiPath.split('|');
        for (let i = 0; i < poiPathList.length; i++) {
            let poiPath = poiPathList[i];

            if (fs.existsSync(`public${poiPath}`)) {
                fs.unlinkSync(`public${poiPath}`);
            }
            if (fs.existsSync(`public${poiPath}`.replace(uId, `${uId}/original`))) {
                fs.unlinkSync(`public${poiPath}`.replace(uId, `${uId}/original`));
            }
        }

        // 게시물 삭제
        query = "DELETE FROM t_posts WHERE po_id = ?";
        await pool.query(query, params);

        // 게시물 사진 삭제
        query = "DELETE FROM t_posts_images WHERE poi_po_id = ?";
        await pool.query(query, params);

        // 게시물 좋아요 삭제
        query = "DELETE FROM t_posts_likes WHERE pol_po_id = ?";
        await pool.query(query, params);

        // 댓글 삭제는 보류
        // query = "DELETE FROM t_posts_comments WHERE poc_po_id = ?";
        // await pool.query(query, params);
        //
        // query = "DELETE FROM t_posts_re_comments WHERE porc_po_id = ?";
        // await pool.query(query, params);

        res.json({ status: 'OK', result: posts.po_id });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
