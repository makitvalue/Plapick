var express = require('express');
var router = express.Router();


// GET
router.use('/get/places', require('./api/get_places.js'));
router.use('/get/picks/from/user', require('./api/get_picks_from_user.js'));
router.use('/get/version', require('./api/get_version.js'));
router.use('/get/user', require('./api/get_user.js'));
router.use('/get/push/notification/device', require('./api/get_push_notification_device.js'));
router.use('/get/place', require('./api/get_place.js'));


// POST
router.use('/add/pick', require('./api/add_pick.js'));
router.use('/remove/pick', require('./api/remove_pick.js'));
router.use('/login', require('./api/login.js'));
router.use('/logout', require('./api/logout.js'));
router.use('/edit/user', require('./api/edit_user.js'));
router.use('/add/push/notification/device', require('./api/add_push_notification_device.js'));
router.use('/edit/push/notification/device', require('./api/edit_push_notification_device.js'));
router.use('/edit/push/notification/device', require('./api/edit_push_notification_device.js'));


// POST - FILE
router.use('/upload/image', require('./api/upload_image.js'));


module.exports = router;