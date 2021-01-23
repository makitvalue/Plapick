var express = require('express');
var router = express.Router();
const { isLogined, isNone } = require('../../lib/common');
const pool = require('../../lib/database');


// 사용자 정보 변경 (내정보변경)
router.post('', async (req, res) => {
    try {
        if (!isLogined(req.session)) {
            res.json({ status: 'ERR_NO_PERMISSION' });
            return;
        }

        let uId = req.session.uId;
        // let isUploadProfileImage = req.body.isUploadProfileImage;
        // let isRemoveProfileImage = req.body.isRemoveProfileImage;
        let profileImage = req.body.profileImage;
        let nickName = req.body.nickName;
        // let imageName = req.body.imageName;

        if (isNone(nickName)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        // nickName 길이 체크

        // nickName 중복 체크
        let query = "SELECT * FROM t_users WHERE u_nick_name = ? AND u_id != ?";
        let params = [nickName, uId];
        let [result, fields] = await pool.query(query, params);

        if (result.length > 0) {
            res.json({ status: 'EXISTS_NICK_NAME' });
            return;
        }
    
        // if (isNone(isUploadProfileImage) || isNone(isRemoveProfileImage) || isNone(nickName)) {
        //     res.json({ status: 'ERR_WRONG_PARAMS' });
        //     return;
        // }
    
        // 이미지가 업로드되면서 삭제도 되었을 때 (일어나서는 안될 상황)
        // if (isUploadProfileImage == 'Y' && isRemoveProfileImage == 'Y') {
        //     res.json({ status: 'ERR_WRONG_PARAMS' });
        //     return;
        // }
    
        // 이미지가 업로드되었는데 들어온 이미지이름이 없을 때
        // if (isUploadProfileImage == 'Y' && isNone(imageName)) {
        //     res.json({ status: 'ERR_WRONG_PARAMS' });
        //     return;
        // }
    
        query = "SELECT * FROM t_users WHERE u_id = ?";
        params = [uId];
        [result, fields] = await pool.query(query, params);
    
        if (result.length == 0) {
            res.json({ status: 'ERR_NO_USER' });
            return;
        }
    
        // query = "SELECT * FROM t_users WHERE u_id != ? AND u_nick_name LIKE ?";
        // params = [uId, nickName];
        // [result, fields] = await pool.query(query, params);
    
        // if (result.length > 0) {
        //     res.json({ status: 'EXISTS_NICKNAME' });
        //     return;
        // }
    
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
    
        // 기존 프로필 이미지가 변경되거나 지워짐 (기존 프로필 이미지 삭제해야됨)
        // if (isUploadProfileImage == 'Y' || isRemoveProfileImage == 'Y') {
        //     if (user.u_profile_image != '') {
        //         if (fs.existsSync('public' + user.u_profile_image)) {
        //             fs.unlinkSync('public' + user.u_profile_image);
        //             let imageName = user.u_profile_image.replace('/images/users/' + uId + '/', '');
        //             if (fs.existsSync('public/images/users/' + uId + '/original/' + imageName)) {
        //                 fs.unlinkSync('public/images/users/' + uId + '/original/' + imageName);
        //             }
        //         }
        //     }
        // }
    
        query = "UPDATE t_users SET u_nick_name = ?, u_profile_image = ?, u_updated_date = NOW() WHERE u_id = ?";
        params = [nickName, profileImage, uId];
    
        // 새로운 프로필 이미지가 업로드되었을 경우
        // if (isUploadProfileImage == 'Y') {
        //     query += ", u_profile_image = ?";
        //     params.push('/images/users/' + uId + '/' + imageName + '.jpg');
        // }
    
        // 프로필 이미지가 삭제되었을 경우
        // if (isRemoveProfileImage == 'Y') {
        //     query += ", u_profile_image = ''";
        // }
    
        // query += ", u_updated_date = NOW() WHERE u_id = ?";
        // params.push(uId);
    
        [result, fields] = await pool.query(query, params);
    
        // query = "SELECT * FROM t_users WHERE u_id = ?";
        // params = [uId];
    
        // [result, fields] = await pool.query(query, params);
    
        // user = result[0];
        // res.json({ status: 'OK', result: user });

        res.json({ status: 'OK' });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;