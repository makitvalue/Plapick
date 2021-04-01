var express = require('express');
var router = express.Router();
const {  } = require('../../lib/common');
const pool = require('../../lib/database');


router.get('', async (req, res) => {
    try {
        // let latitude = '37.1167';
        // let longitude = '127.475297636305';
        //
        // latitude = parseFloat(latitude);
        // longitude = parseFloat(longitude);
        //
        // if (isNaN(latitude)) {
        //     res.json('OK1');
        // }
        // if (isNaN(longitude)) {
        //     res.json('OK2');
        // }
        //
        // latitude = parseFloat(latitude.toFixed(6));
        // longitude = parseFloat(longitude.toFixed(6));
        //
        // res.json({ latitude: latitude, longitude: longitude });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
