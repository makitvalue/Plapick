var express = require('express');
var router = express.Router();
var formidable = require('formidable');


router.post('', (req, res) => {
    try {
        // let form = new formidable.IncomingForm();
        // form.encoding = 'utf-8';
        // form.uploadDir = 'upload/tmp';
        // form.multiples = true;
        // form.keepExtensions = true;
        //
        // form.parse(req, (error, body, files) => {
        //     if (error) {
        //         console.log(error);
        //         res.json({ status: 'ERR_UPLOAD' });
        //         return;
        //     }
        //
        //     res.json({ status: 'OK' });
        // });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
