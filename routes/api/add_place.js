var express = require('express');
var router = express.Router();
const { isLogined, getPlatform, isNone, isInt, ntb, getLocCode, getPlaceSelectWhatQuery } = require('../../lib/common');
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
        let categoryName = req.body.categoryName;
        let categoryGroupCode = req.body.categoryGroupCode;
        let categoryGroupName = req.body.categoryGroupName;
        let address = req.body.address;
        let roadAddress = req.body.roadAddress;
        let latitude = req.body.latitude;
        let longitude = req.body.longitude;
        let phone = req.body.phone;

        if (isNone(kId) || isNone(name)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (!isInt(kId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if ((!isNone(latitude) && isNone(longitude)) || (isNone(latitude) && !isNone(longitude))) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (!isNone(latitude) && !isNone(longitude)) {
            latitude = parseFloat(latitude);
            longitude = parseFloat(longitude);

            if (isNaN(latitude) || isNaN(longitude)) {
                res.json({ status: 'ERR_WRONG_PARAMS' });
                return;
            }

            latitude = latitude.toFixed(6);
            longitude = longitude.toFixed(6);
        }

        let query = "SELECT * FROM t_block_users WHERE bu_u_id = ?";
        let params = [uId];
        let [result, fields] = await pool.query(query, params);

        let blockUserList = result;

        query = "SET SESSION group_concat_max_len = 65535";
        await pool.query(query);

        query = getPlaceSelectWhatQuery(blockUserList);
        query += " FROM t_places AS pTab";
        query += " WHERE pTab.p_k_id = ?";

        params = [];
        for (let i = 0; i < blockUserList.length; i++) {
            params.push(blockUserList[i].bu_block_u_id);
        }
        params.push(uId);
        params.push(kId);

        [result, fields] = await pool.query(query, params);

        if (result.length == 0) {
            // INSERT
            let [plocCode, clocCode] = getLocCode(address, roadAddress);

            let insertQuery = "INSERT INTO t_places";
            insertQuery += " (p_k_id, p_name, p_category_name, p_category_group_code, p_category_group_name,";
            insertQuery += " p_address, p_road_address, p_latitude, p_longitude, p_phone, p_ploc_code, p_cloc_code";

            let valuesQuery = " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?";

            if (!isNone(latitude) && !isNone(longitude)) {
                insertQuery += ", p_geometry)";
                valuesQuery += ", POINT(" + longitude +", " + latitude + "))";
            } else {
                insertQuery += ")";
                valuesQuery += ")";
            }

            query = insertQuery + valuesQuery;
            params = [kId, name, categoryName, categoryGroupCode, categoryGroupName, address, roadAddress, latitude, longitude, phone, plocCode, clocCode];

            [result, fields] = await pool.query(query, params);

            let pId = result.insertId;

            query = "SET SESSION group_concat_max_len = 65535";
            await pool.query(query);

            query = getPlaceSelectWhatQuery(blockUserList);
            query += " FROM t_places AS pTab";
            query += " WHERE pTab.p_id = ?";

            params = [];
            for (let i = 0; i < blockUserList.length; i++) {
                params.push(blockUserList[i].bu_block_u_id);
            }
            params.push(uId);
            params.push(pId);

            [result, fields] = await pool.query(query, params);
        }

        let place = result[0];

        res.json({ status: 'OK', result: place });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
