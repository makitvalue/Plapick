var express = require('express');
var router = express.Router();
const { isLogined, getPlatform, getLocCode, isNone } = require('../../lib/common');
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
        let message = req.body.message;

        let pId = null;

        let query = "SELECT * FROM t_places WHERE p_k_id = ?";
        let params = [kId];
        let [result, fields] = await pool.query(query, params);

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

        query = "INSERT INTO t_posts (po_u_id, po_p_id, po_message) VALUES (?, ?, ?)";
        params = [uId, pId, message];
        [result, fields] = await pool.query(query, params);

        let poId = result.insertId;

        res.json({ status: 'OK', result: poId });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
