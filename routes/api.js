var express = require('express');
var router = express.Router();


// GET
router.use('/get/recent/picks', require('./api/get_recent_picks.js'));
router.use('/get/hot/places', require('./api/get_hot_places.js'));
router.use('/get/picks/from/user', require('./api/get_picks_from_user.js'));
router.use('/get/version', require('./api/get_version.js'));
router.use('/get/user', require('./api/get_user.js'));
router.use('/get/push/notification/device', require('./api/get_push_notification_device.js'));
router.use('/get/place', require('./api/get_place.js'));
router.use('/get/places', require('./api/get_places.js'));
router.use('/get/kakao/places', require('./api/get_kakao_places.js'));


// POST
router.use('/add/pick', require('./api/add_pick.js'));
router.use('/remove/pick', require('./api/remove_pick.js'));
router.use('/login', require('./api/login.js'));
router.use('/logout', require('./api/logout.js'));
router.use('/edit/user', require('./api/edit_user.js'));
router.use('/add/push/notification/device', require('./api/add_push_notification_device.js'));
router.use('/edit/push/notification/device', require('./api/edit_push_notification_device.js'));
router.use('/edit/push/notification/device', require('./api/edit_push_notification_device.js'));
router.use('/like/place', require('./api/like_place.js'));
router.use('/add/place', require('./api/add_place.js'));


// POST - FILE
router.use('/upload/image', require('./api/upload_image.js'));


// TEST
router.use('/test', require('./test/test.js'));
router.use('/test/push/all', require('./test/push_all.js'));
router.use('/test/upload', require('./test/upload.js'));


module.exports = router;