var express = require('express');
var router = express.Router();
const { } = require('../../lib/common');
const request = require('request');


router.get('', (req, res) => {
    try {
        // let q = req.query.q;
        // let type = req.query.type;
        //
        // request.get({
        //     uri: `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURI(q)}&type=${type}&key=${process.env.GOOGLE_API_KEY}`,
        // }, (error, response) => {
        //     console.log(error, response);
        //     res.json({ status: 'OK' });
        // });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
