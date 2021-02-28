var express = require('express');
var router = express.Router();


// GET
router.use('/get/picks', require('./api/get_picks.js'));
router.use('/get/recent/picks', require('./api/get_recent_picks.js'));

router.use('/get/place', require('./api/get_place.js'));
router.use('/get/places', require('./api/get_places.js'));
router.use('/get/hot/places', require('./api/get_hot_places.js'));
router.use('/get/kakao/places', require('./api/get_kakao_places.js'));

router.use('/get/users', require('./api/get_users.js'));
router.use('/get/user', require('./api/get_user.js'));

router.use('/get/version', require('./api/get_version.js'));
router.use('/get/push/notification/device', require('./api/get_push_notification_device.js'));

router.use('/get/comments', require('./api/get_comments.js'));
router.use('/get/qnas', require('./api/get_qnas.js'));

router.use('/get/place/comments', require('./api/get_place_comments.js'));
router.use('/get/pick/comments', require('./api/get_pick_comments.js'));


// POST
router.use('/login', require('./api/login.js'));
router.use('/logout', require('./api/logout.js'));
router.use('/follow', require('./api/follow.js'));
router.use('/check/user/nickname', require('./api/check_user_nickname.js'));
router.use('/edit/user', require('./api/edit_user.js'));
router.use('/add/qna', require('./api/add_qna.js'));
router.use('/remove/qna', require('./api/remove_qna.js'));
router.use('/add/place/comment', require('./api/add_place_comment.js'));
router.use('/remove/place/comment', require('./api/remove_place_comment.js'));
router.use('/add/pick/comment', require('./api/add_pick_comment.js'));
router.use('/remove/pick/comment', require('./api/remove_pick_comment.js'));
router.use('/check/pick', require('./api/check_pick.js'));
router.use('/add/user/device', require('./api/add_user_device.js'));
router.use('/edit/user/push', require('./api/edit_user_push.js'));
router.use('/block/user', require('./api/block_user.js'));
router.use('/report/user', require('./api/report_user.js'));
router.use('/block/pick', require('./api/block_pick.js'));
router.use('/report/pick', require('./api/report_pick.js'));

// POST - Place
router.use('/like/place', require('./api/like_place.js'));
router.use('/add/place', require('./api/add_place.js'));

// POST - Pick
router.use('/like/pick', require('./api/like_pick.js'));
router.use('/add/pick', require('./api/add_pick.js'));

// POST - Other
router.use('/add/push/notification/device', require('./api/add_push_notification_device.js'));
router.use('/edit/push/notification/device', require('./api/edit_push_notification_device.js'));
router.use('/add/comment', require('./api/add_comment.js'));
router.use('/remove/comment', require('./api/remove_comment.js'));

router.use('/remove/pick', require('./api/remove_pick.js'));

// POST - FILE
router.use('/upload/image', require('./api/upload_image.js'));


// TEST
router.use('/test', require('./test/test.js'));
router.use('/test/push/all', require('./test/push_all.js'));
router.use('/test/upload', require('./test/upload.js'));


module.exports = router;
