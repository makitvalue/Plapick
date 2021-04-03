var express = require('express');
var router = express.Router();


// GET
router.use('/get/kakao/places', require('./api/get_kakao_places.js'));
router.use('/get/posts', require('./api/get_posts.js'));
router.use('/get/user/posts/places', require('./api/get_user_posts_places.js'));
router.use('/get/user', require('./api/get_user.js'));
router.use('/get/kakao/place/cnt', require('./api/get_kakao_place_cnt.js'));
router.use('/get/version', require('./api/get_version.js'));
router.use('/get/qnas', require('./api/get_qnas.js'));
router.use('/get/posts/comments', require('./api/get_posts_comments.js'));
router.use('/get/posts/re/comments', require('./api/get_posts_re_comments.js'));
router.use('/get/place', require('./api/get_place.js'));
router.use('/get/place/comments', require('./api/get_place_comments.js'));
router.use('/get/user/comments', require('./api/get_user_comments.js'));
router.use('/get/places', require('./api/get_places.js'));
router.use('/get/users', require('./api/get_users.js'));


// 폐기예정
router.use('/get/picks', require('./api/get_picks.js'));
router.use('/get/recent/picks', require('./api/get_recent_picks.js'));
router.use('/get/hot/places', require('./api/get_hot_places.js'));
router.use('/get/push/notification/device', require('./api/get_push_notification_device.js'));
router.use('/get/comments', require('./api/get_comments.js'));
router.use('/get/pick/comments', require('./api/get_pick_comments.js'));


// POST
router.use('/identified/phone', require('./api/identified_phone.js'));
router.use('/identified/phone/code', require('./api/identified_phone_code.js'));
router.use('/identified/email', require('./api/identified_email.js'));
router.use('/identified/email/code', require('./api/identified_email_code.js'));
router.use('/check/nickname', require('./api/check_nickname.js'));
router.use('/upload/image', require('./api/upload_image.js'));
router.use('/login', require('./api/login.js'));
router.use('/join', require('./api/join.js'));
router.use('/edit/profile/image', require('./api/edit_profile_image.js'));
router.use('/find/email', require('./api/find_email.js'));
router.use('/edit/password', require('./api/edit_password.js'));
router.use('/add/posts', require('./api/add_posts.js'));
router.use('/upload/posts/image', require('./api/upload_posts_image.js'));
router.use('/remove/posts', require('./api/remove_posts.js'));
router.use('/like/posts', require('./api/like_posts.js'));
router.use('/edit/posts', require('./api/edit_posts.js'));
router.use('/remove/posts/images', require('./api/remove_posts_images.js'));
router.use('/edit/posts/images', require('./api/edit_posts_images.js'));
router.use('/logout', require('./api/logout.js'));
router.use('/edit/user/push', require('./api/edit_user_push.js'));
router.use('/edit/nickname', require('./api/edit_nickname.js'));
router.use('/add/qna', require('./api/add_qna.js'));
router.use('/remove/qna', require('./api/remove_qna.js'));
router.use('/leave', require('./api/leave.js'));
router.use('/add/posts/comment', require('./api/add_posts_comment.js'));
router.use('/remove/posts/comment', require('./api/remove_posts_comment.js'));
router.use('/add/posts/re/comment', require('./api/add_posts_re_comment.js'));
router.use('/remove/posts/re/comment', require('./api/remove_posts_re_comment.js'));
router.use('/like/place', require('./api/like_place.js'));
router.use('/add/place/comment', require('./api/add_place_comment.js'));
router.use('/remove/place/comment', require('./api/remove_place_comment.js'));
router.use('/follow', require('./api/follow.js'));
router.use('/report', require('./api/report.js'));


// 폐기예정
router.use('/check/user/nickname', require('./api/check_user_nickname.js'));
router.use('/edit/user', require('./api/edit_user.js'));
router.use('/add/pick/comment', require('./api/add_pick_comment.js'));
router.use('/remove/pick/comment', require('./api/remove_pick_comment.js'));
router.use('/check/pick', require('./api/check_pick.js'));
router.use('/add/user/device', require('./api/add_user_device.js'));
router.use('/block/user', require('./api/block_user.js'));
router.use('/report/user', require('./api/report_user.js'));
router.use('/block/pick', require('./api/block_pick.js'));
router.use('/report/pick', require('./api/report_pick.js'));
router.use('/add/place', require('./api/add_place.js'));
router.use('/like/pick', require('./api/like_pick.js'));
router.use('/add/pick', require('./api/add_pick.js'));
router.use('/add/push/notification/device', require('./api/add_push_notification_device.js'));
router.use('/edit/push/notification/device', require('./api/edit_push_notification_device.js'));
router.use('/add/comment', require('./api/add_comment.js'));
router.use('/remove/comment', require('./api/remove_comment.js'));
router.use('/remove/pick', require('./api/remove_pick.js'));


// TEST
// router.use('/test', require('./test/test.js'));
// router.use('/test/push/all', require('./test/push_all.js'));
// router.use('/test/upload', require('./test/upload.js'));
// router.use('/test/sms', require('./test/test_sms.js'));
// router.use('/test/google/places', require('./test/test_google_places.js'));
// router.use('/test/move/picks', require('./test/test_move_picks.js'));


module.exports = router;
