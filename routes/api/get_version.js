var express = require('express');
var router = express.Router();
const { isLogined, getPlatform } = require('../../lib/common');
var fs = require('fs');


// 버전 확인
router.get('', (req, res) => {
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

        let [versionCode, versionName] = fs.readFileSync('mobile_app_versions/' + platform).toString().split('\n');
        res.json({ status: 'OK', result: {versionCode: parseInt(versionCode.trim()), versionName: versionName.trim()} });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;