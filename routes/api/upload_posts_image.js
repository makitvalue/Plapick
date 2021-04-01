var express = require('express');
var router = express.Router();
const { isLogined, generateRandomId, getPlatform } = require('../../lib/common');
var formidable = require('formidable');
var sharp = require('sharp');
var fs = require('fs');
var imageSize = require('image-size');
const pool = require('../../lib/database');


// 이미지 업로드
router.post('', (req, res) => {
    try {
        if (!isLogined(req.session)) {
            res.json({ status: 'ERR_NO_PERMISSION' });
            return;
        }

        let form = new formidable.IncomingForm();
        form.encoding = 'utf-8';
        form.uploadDir = 'upload/tmp';
        form.multiples = true;
        form.keepExtensions = true;

        let uId = req.session.uId;

        form.parse(req, async (error, body, files) => {
            if (error) {
                if (fs.existsSync(files.image.path)) {
                    fs.unlinkSync(files.image.path);
                }
                res.json({ status: 'ERR_UPLOAD' });
                return;
            }

            let plapickKey = body.plapickKey;
            let platform = getPlatform(plapickKey);
            if (platform === '') {
                if (fs.existsSync(files.image.path)) {
                    fs.unlinkSync(files.image.path);
                }
                res.json({ status: 'ERR_PLAPICK_KEY' });
                return;
            }

            let poId = body.poId;
            let order = body.order;

            let imageName = generateRandomId();

            // 이미지 프로세싱
            let imagePath = `public/images/users/${uId}/${imageName}.jpg`;
            let originalImagePath = `public/images/users/${uId}/original/${imageName}.jpg`;
            await sharp(files.image.path).rotate().toFile(imagePath);
            fs.unlinkSync(files.image.path);

            fs.copyFile(imagePath, originalImagePath, async () => {

                let originalWidth = imageSize(originalImagePath).width;
                let rw = 0;
                while (true) {
                    if (fs.statSync(imagePath).size > 300000) {
                        rw += 10;
                        await sharp(originalImagePath)
                            .resize({ width: parseInt(originalWidth * ((100 - rw) / 100)) })
                            .toFile(imagePath);
                    } else { break; }
                }

                let query = "INSERT INTO t_posts_images (poi_u_id, poi_po_id, poi_path, poi_order) VALUES (?, ?, ?, ?)";
                let params = [uId, poId, imagePath.replace('public', ''), order];
                await pool.query(query, params);

                res.json({ status: 'OK' });
            });
        });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAR_SERVER' });
    }
});


module.exports = router;
