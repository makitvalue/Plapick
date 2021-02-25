var express = require('express');
var router = express.Router();
const { ntb, isNone, generateRandomId, getPlatform, isValidStrLength, generateRandomNickName } = require('../../lib/common');
const pool = require('../../lib/database');
var fs = require('fs');


// 로그인
router.post('', async (req, res) => {
    try {
        let plapickKey = req.body.plapickKey;
        let platform = getPlatform(plapickKey);
        if (platform === '') {
            res.json({ status: 'ERR_PLAPICK_KEY' });
            return;
        }

        let type = req.body.type;
        let socialId = ntb(req.body.socialId); // null일 수 있음 (type: EMAIL)
        let profileImage = ntb(req.body.profileImage); // null일 수 있음 (type: KAKAO인 경우에만 가져옴)
        let email = ntb(req.body.email); // null일 수 있음
        let password = ntb(req.body.password); // null일 수 있음 (type: EMAIL인 경우에만 가져옴)
        let name = ntb(req.body.name); // null일 수 있음

        if (isNone(type)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (type != 'EMAIL' && type != 'KAKAO' && type != 'NAVER' && type != 'APPLE') {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        let [result, fields] = [null, null];
        let query = "SELECT * FROM t_users WHERE u_type LIKE ?";
        let params = [type];

        if (type === 'APPLE' || type === 'KAKAO' || type == 'NAVER') {
            if (isNone(socialId)) {
                res.json({ status: 'ERR_WRONG_PARAMS' });
                return;
            }

            query += " AND u_social_id = ?";
            params.push(socialId);

        } else if (type === 'EMAIL') {
            if (isNone(email) || isNone(password)) {
                res.json({ status: 'ERR_WRONG_PARAMS' });
                return;
            }

            query += " AND u_email = ? AND u_password = ?";
            params.push(email);
            params.push(password);
        }

        // SELECT t_users
        [result, fields] = await pool.query(query, params);

        let uId = null;

        if (result.length == 0) {
            // 신규 가입
            uId = generateRandomId();
            let nickName = name;

            if (type == 'EMAIL') {
                // nickName 길이 체크
                // nickName 중복 체크
                // 이메일 정규식 체크
                // 비밀번호 정규식 체크

            } else {
                // nickName 길이 길면 임의변경
                // nickName 중복되면 임의변경
                let newNickName = nickName;
                let cutCnt = 0;
                while (true) {
                    if (!isValidStrLength(16, 1, 8, newNickName)) {
                        cutCnt++;
                        newNickName = newNickName.substring(0, nickName.length - cutCnt);
                        continue;
                    }
                    query = "SELECT * FROM t_users WHERE u_nick_name = ?";
                    params = [newNickName];
                    [result, fields] = await pool.query(query, params);
                    if (result.length > 0) {
                        newNickName = generateRandomNickName(nickName);
                        continue;
                    }
                    break;
                }
                nickName = newNickName;
            }

            query = "INSERT INTO t_users";
            query += " (u_id, u_type, u_social_id, u_name, u_nick_name, u_email, u_profile_image, u_status, u_last_login_platform)";
            query += " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
            params = [uId, type, socialId, name, nickName, email, profileImage, 'ACTIVATE', platform];
            [result, fields] = await pool.query(query, params);

            // query = "SELECT * FROM t_users WHERE u_id = ?";
            // params = [uId];
            // [result, fields] = await pool.query(query, params);
            // authUser = result[0];

        } else {
            // 기존 회원임, 마지막 접속시간 / 접속 디바이스 업데이트
            uId = result[0].u_id;
            query = "UPDATE t_users SET u_is_logined = 'Y', u_last_login_platform = ?, u_connected_date = NOW() WHERE u_id = ?";
            params = [platform, uId];
            [result, fields] = await pool.query(query, params);
        }

        query = " SELECT uTab.*,";
        params = [];

        // 팔로워 개수
        query += " (SELECT COUNT(*) FROM t_maps_follow WHERE mf_u_id = uTab.u_id) AS followerCnt,";

        // 팔로잉 개수
        query += " (SELECT COUNT(*) FROM t_maps_follow WHERE mf_follower_u_id = uTab.u_id) AS followingCnt,";

        // 픽 개수
        query += " (SELECT COUNT(*) FROM t_picks WHERE pi_u_id = uTab.u_id) AS pickCnt,";

        // 좋아요 픽 개수
        query += " (SELECT COUNT(*) FROM t_maps_like_pick WHERE mlpi_u_id = uTab.u_id) AS likePickCnt,";

        // 좋아요 플레이스 개수
        query += " (SELECT COUNT(*) FROM t_maps_like_place WHERE mlp_u_id = uTab.u_id) AS likePlaceCnt";

        query += " FROM t_users AS uTab";
        
        query += " WHERE uTab.u_id = ?";
        params.push(uId);

        [result, fields] = await pool.query(query, params);
    
        if (result.length == 0) {
            res.json({ status: 'ERR_NO_USER' });
            return;
        }

        let user = result[0];
        user.isFollow = "N"; // 자기 자신이니 N

        // 사용자 폴더 없으면 생성해주기
        if (!fs.existsSync(`public/images/users/${user.u_id}`)) {
            fs.mkdirSync(`public/images/users/${user.u_id}`);
        }
        if (!fs.existsSync(`public/images/users/${user.u_id}/original`)) {
            fs.mkdirSync(`public/images/users/${user.u_id}/original`);
        }

        console.log(user.u_id);

        // 세션 생성
        req.session.isLogined = true;
        req.session.uId = user.u_id;
        req.session.uType = user.u_type;
        req.session.save(() => {
            res.json({ status: 'OK', result: user });
        });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;