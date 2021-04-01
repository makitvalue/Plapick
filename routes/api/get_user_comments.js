var express = require('express');
var router = express.Router();
const { isLogined, getPlatform } = require('../../lib/common');
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

        let query = "SELECT 'POC' AS targetType, poc_id AS id, poc_po_id AS targetId, poc_u_id AS uId,";
        	query += " poc_comment AS comment, poc_created_date AS createdDate, poc_updated_date AS updatedDate";
        	query += " FROM t_posts_comments WHERE poc_u_id = ?";
        query += " UNION";
        query += " SELECT 'PORC' AS targetType, porc_id AS id, porc_po_id AS targetId, porc_u_id AS uId,";
        	query += " porc_comment AS comment, porc_created_date AS createdDate, porc_updated_date AS updatedDate";
        	query += " FROM t_posts_re_comments WHERE porc_u_id = ?";
        query += " UNION";
        query += " SELECT 'PC' AS targetType, pc_id AS id, pc_p_id AS targetId, pc_u_id AS uId,";
        	query += " pc_comment AS comment, pc_created_date AS createdDate, pc_updated_date AS updatedDate";
        	query += " FROM t_place_comments WHERE pc_u_id = ?";
        query += " ORDER BY createdDate DESC";

        let params = [uId, uId, uId];

        let [result, fields] = await pool.query(query, params);

        res.json({ status: 'OK', result: result });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
