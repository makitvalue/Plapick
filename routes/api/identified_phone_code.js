var express = require('express');
var router = express.Router();
const { isLogined, getPlatform, isNone, getRandomCode, generateRandomId } = require('../../lib/common');
const pool = require('../../lib/database');


router.post('', async (req, res) => {
    try {
        let plapickKey = req.body.plapickKey;
        let platform = getPlatform(plapickKey);
        if (platform === '') {
            res.json({ status: 'ERR_PLAPICK_KEY' });
            return;
        }

        let mode = req.body.mode;
        let ipId = req.body.ipId;
        let email = req.body.email;
        let phoneNumber = req.body.phoneNumber;
        let code = req.body.code;

        if (isNone(mode) || isNone(ipId) || isNone(phoneNumber) || isNone(code)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (mode != 'JOIN' && mode != 'FIND' && mode != 'RESET') {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (mode === 'RESET') {
            if (isNone(email)) {
                res.json({ status: 'ERR_WRONG_PARAMS' });
                return;
            }
        }

        let query = "SELECT * FROM t_identified_phone WHERE ip_id = ? AND ip_phone_number LIKE ? AND ip_code LIKE ? AND ip_created_date >= DATE_ADD(NOW(), INTERVAL -3 MINUTE)";
        let params = [ipId, phoneNumber, code];
        let [result, fields] = await pool.query(query, params);

        if (result.length == 0) {
            res.json({ status: 'WRONG_CODE' });
            return;
        }

        query = "DELETE FROM t_identified_phone WHERE ip_id = ?";
        params = [ipId];
        await pool.query(query, params);

        let rpcId = null;
        let checksum = '';

        if (mode === 'RESET') {
            rpcId = generateRandomId();
            checksum = getRandomCode(8);
            query = "INSERT INTO t_reset_password_checksum (rpc_id, rpc_phone_number, rpc_email, rpc_checksum) VALUES (?, ?, ?, ?)";
            params = [rpcId, phoneNumber, email, checksum];
            await pool.query(query, params);
        }

        res.json({ status: 'OK', result: { rpcId: rpcId, checksum: checksum }});

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
