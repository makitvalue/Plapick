// var express = require('express');
// var router = express.Router();
// const { isLogined, getPlatform } = require('../../lib/common');
// const pool = require('../../lib/database');


// router.get/post('', (req, res) => {
//     try {
//         let plapickKey = req.query/body.plapickKey;
//         let platform = getPlatform(plapickKey);
//         if (platform === '') {
//             res.json({ status: 'ERR_PLAPICK_KEY' });
//             return;
//         }

//         if (!isLogined(req.session)) {
//             res.json({ status: 'ERR_NO_PERMISSION' });
//             return;
//         }

//         res.json({ status: 'OK' });

//     } catch(error) {
//         console.log(error);
//         res.json({ status: 'ERR_INTERNAL_SERVER' });
//     }
// });


// module.exports = router;