var express = require('express');
var router = express.Router();
const { isLogined, getPlatform, isNone, isInt, ntb, getLocCode } = require('../../lib/common');
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

        let kId = ntb(req.body.kId);
        let name = ntb(req.body.name);
        let categoryName = ntb(req.body.categoryName);
        let categoryGroupCode = ntb(req.body.categoryGroupCode);
        let categoryGroupName = ntb(req.body.categoryGroupName);
        let address = ntb(req.body.address);
        let roadAddress = ntb(req.body.roadAddress);
        let latitude = ntb(req.body.latitude);
        let longitude = ntb(req.body.longitude);
        let phone = ntb(req.body.phone);

        if (isNone(kId) || isNone(name)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (!isInt(kId)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        kId = parseInt(kId);

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
        
        let query = "SELECT * FROM t_places WHERE p_k_id = ?";
        let params = [kId];
        let [result, fields] = await pool.query(query, params);

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

            query = "SELECT * FROM t_places WHERE p_id = ?";
            params = [result.insertId];
            [result, fields] = await pool.query(query, params);
        }

        let place = result[0];

        // 방금 등록한 place이니 당연히 N/N일 것
        // Y를 누르고 들어온 경우 클라이언트에서 처리해줄 것
        place.isLike = 'N';
        // place.isComment = 'N';

        res.json({ status: 'OK', result: place });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
