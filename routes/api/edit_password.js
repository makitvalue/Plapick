var express = require('express');
var router = express.Router();
const { isLogined, getPlatform, isNone } = require('../../lib/common');
const pool = require('../../lib/database');


router.post('', async (req, res) => {
    try {
        let plapickKey = req.body.plapickKey;
        let platform = getPlatform(plapickKey);
        if (platform === '') {
            res.json({ status: 'ERR_PLAPICK_KEY' });
            return;
        }

        let password = req.body.password;
        let rpcId = req.body.rpcId;
        let phoneNumber = req.body.phoneNumber;
        let email = req.body.email;
        let checksum = req.body.checksum;

        if (isNone(rpcId) || isNone(phoneNumber) || isNone(email) || isNone(checksum) || isNone(password)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        let query = "SELECT * FROM t_users WHERE u_email LIKE ? AND u_phone_number LIKE ?";
        let params = [email, phoneNumber];
        let [result, fields] = await pool.query(query, params);

        if (result.length == 0) {
            res.json({ status: 'ERR_NO_USER' });
            return;
        }

        let user = result[0];

        query = "SELECT * FROM t_reset_password_checksum WHERE rpc_id = ? AND rpc_phone_number LIKE ? AND rpc_email LIKE ? AND rpc_checksum LIKE ?";
        params = [rpcId, phoneNumber, email, checksum];
        [result, fields] = await pool.query(query, params);

        if (result.length == 0) {
            res.json({ status: 'WRONG_CHECKSUM' });
            return;
        }

        query = "UPDATE t_users SET u_password = ? WHERE u_id = ?";
        params = [password, user.u_id];
        await pool.query(query, params);

        query = "DELETE FROM t_reset_password_checksum WHERE rpc_id = ?";
        params = [rpcId];
        await pool.query(query, params);

        res.json({ status: 'OK' });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
