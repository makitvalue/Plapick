var express = require('express');
var router = express.Router();
const { isLogined, isNone, getPlatform, isValidStrLength } = require('../../lib/common');
const pool = require('../../lib/database');
var fs = require('fs');


// 사용자 정보 변경 (내정보변경)
router.post('', async (req, res) => {
    try {
        let plapickKey = req.body.plapickKey;
        let platform = getPlatform(plapickKey);
        if (platform === '') {
            res.json({ status: 'ERR_PLAPICK_KEY' });
            return;
        }

        if (!isLogined(req.session)) {
            res.json({ status: 'ERR_NO_PERMISSION' });
            return;
        }

        let uId = req.session.uId;
        let profileImage = req.body.profileImage;
        let nickName = req.body.nickName;

        if (isNone(nickName)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        // nickName 길이 체크
        if (!isValidStrLength(12, 2, 8, nickName)) {
            res.json({ status: 'WRONG_NICKNAME' });
            return;
        }

        // nickName 중복 체크
        let query = "SELECT * FROM t_users WHERE u_nick_name = ? AND u_id != ?";
        let params = [nickName, uId];
        let [result, fields] = await pool.query(query, params);

        if (result.length > 0) {
            res.json({ status: 'EXISTS_NICKNAME' });
            return;
        }
    
        query = "SELECT * FROM t_users WHERE u_id = ?";
        params = [uId];
        [result, fields] = await pool.query(query, params);
    
        if (result.length == 0) {
            res.json({ status: 'ERR_NO_USER' });
            return;
        }
    
        let user = result[0];

        // 프로필 이미지 수정함 (기존 파일 삭제)
        let originalProfileImage = user.u_profile_image;
        if (profileImage != originalProfileImage) {
            if (fs.existsSync(`public${originalProfileImage}`)) {
                fs.unlinkSync(`public${originalProfileImage}`);
                let imageName = originalProfileImage.replace(`/images/users/${uId}/`, '');
                if (fs.existsSync(`public/images/users/${uId}/original/${imageName}`)) {
                    fs.unlinkSync(`public/images/users/${uId}/original/${imageName}`);
                }
            }
        }
    
        query = "UPDATE t_users SET u_nick_name = ?, u_profile_image = ?, u_updated_date = NOW() WHERE u_id = ?";
        params = [nickName, profileImage, uId];
    
        [result, fields] = await pool.query(query, params);

        res.json({ status: 'OK' });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;