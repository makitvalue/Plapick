var express = require('express');
var router = express.Router();
const { isLogined, getPlatform } = require('../../lib/common');
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
        let profileImage = req.body.profileImage;

        let query = "SELECT * FROM t_users WHERE u_id = ?";
        let params = [uId];
        let [result, fields] = await pool.query(query, params);

        if (result.length == 0) {
            res.json({ status: 'ERR_NO_USER' });
            return;
        }

        let user = result[0];
        let originalProfileImage = user.u_profile_image;

        if (originalProfileImage) {
            if (fs.existsSync(`public${originalProfileImage}`)) {
                fs.unlinkSync(`public${originalProfileImage}`);
            }
            if (fs.existsSync(`public${originalProfileImage}`.replace(uId, `${uId}/original`))) {
                fs.unlinkSync(`public${originalProfileImage}`.replace(uId, `${uId}/original`));
            }
        }

        query = "UPDATE t_users SET u_profile_image = ?, u_updated_date = NOW(), u_connected_date = NOW() WHERE u_id = ?";
        params = [profileImage, uId];
        await pool.query(query, params);

        res.json({ status: 'OK' });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
