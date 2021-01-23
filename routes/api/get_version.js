var express = require('express');
var router = express.Router();
const { isLogined, isNone } = require('../../lib/common');
var fs = require('fs');


// 버전 확인
router.get('', (req, res) => {
    try {
        if (!isLogined(req.session)) {
            res.json({ status: 'ERR_NO_PERMISSION' });
            return;
        }
    
        let platform = req.query.platform;

        if (isNone(platform)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (platform != 'IOS' && platform != 'ANDROID') {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        let [version, build] = fs.readFileSync('mobile_app_versions/' + platform).toString().split('\n');
        version = version.trim();
        build = build.trim();
        res.json({ status: 'OK', result: {version: version, build: parseInt(build)} });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;