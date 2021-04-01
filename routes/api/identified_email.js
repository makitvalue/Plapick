var express = require('express');
var router = express.Router();
const { isLogined, getPlatform, generateRandomId, getRandomCode, isNone } = require('../../lib/common');
const pool = require('../../lib/database');
const nodemailer = require('nodemailer');


router.post('', async (req, res) => {
    try {
        let plapickKey = req.body.plapickKey;
        let platform = getPlatform(plapickKey);
        if (platform === '') {
            res.json({ status: 'ERR_PLAPICK_KEY' });
            return;
        }

        let mode = req.body.mode;
        let email = req.body.email;

        if (isNone(mode) || isNone(email)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (mode != 'JOIN' && mode != 'FIND') {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        let query = "";
        let params = [];
        let [result, fields] = [null, null];

        if (mode === 'JOIN') { // 회원가입용 메일일 경우 중복검사
            query = "SELECT * FROM t_users WHERE u_type LIKE 'EMAIL' AND u_email LIKE ?";
            params = [email];
            [result, fields] = await pool.query(query, params);

            if (result.length > 0) {
                res.json({ status: 'EXISTS_EMAIL' });
                return;
            }

        } else { // 찾기용 메일일 경우 존재하는지 검사
            query = "SELECT * FROM t_users WHERE u_type LIKE 'EMAIL' AND u_email LIKE ?";
            params = [email];
            [result, fields] = await pool.query(query, params);

            if (result.length == 0) {
                res.json({ status: 'NO_EXISTS_USER' });
                return;
            }
        }

        let ieId = generateRandomId();

        while (true) {
            let ieCode = getRandomCode(6);
            query = "SELECT * FROM t_identified_email WHERE ie_email LIKE ? AND ie_code LIKE ?";
            params = [email, ieCode];
            [result, fields] = await pool.query(query, params);

            if (result.length == 0) {
                query = "INSERT INTO t_identified_email (ie_id, ie_email, ie_code) VALUES (?, ?, ?)";
                params = [ieId, email, ieCode];
                await pool.query(query, params);

                let html = '';
                html += '<div style="width: 480px; max-width: 100%; text-align: center; margin: 0 auto; border: 1px solid #DFDFDF;">';
                    html += '<h1 style="margin: 64px 0 0 0; font-size: 48px; color: #F8A13F;">PLAPICK</h1>'
                    html += '<h3 style="margin: 64px 0 0 0; font-size: 16px;">이메일 인증을 위한 인증코드 6자리를 입력해주세요.</h3>';
                    html += '<div style="display: inline-block; vertical-align: middle; margin-top: 32px; padding: 16px 32px; border: 1px solid #CCCCCC; border-radius: 8px;">';
                        html += '<p style="margin: 0; font-size: 12px; color: #AAAAAA;">인증코드</p>';
                        html += `<h1 style="margin: 0; font-size: 32px;">${ieCode}</h1>`;
                    html += '</div>';

                    html += '<div style="background: #EFEFEF; margin-top: 64px; padding: 32px 0; position: relative;">';
                        html += '<a href="http://plapick.com/mobile/terms/agreement">이용약관</a>ㆍ<a href="http://plapick.com/mobile/terms/privacy">개인정보 처리방침</a>';
                    html += '</div>';
                html += '</div>';

                let transporter = nodemailer.createTransport({
                    service: 'gmail',
                    port: 587,
                    host: 'smtp.gmail.com',
                    secure: false,
                    requireTLS: true,
                    auth: {
                        user: process.env.MAILER_EMAIL,
                        pass: process.env.MAILER_PASSWD
                    }
                });
                let options = {
                    from: process.env.MAILER_EMAIL,
                    to: [email],
                    subject: '[플레픽] 이메일 인증 확인 메일',
                    html: html
                };
                transporter.sendMail(options, (error, result) => {
                    if (error) {
                        console.log(error);
                        res.json({ status: 'ERR_MAILER' });
                        return;
                    }
                    res.json({ status: 'OK', result: ieId });
                });

                break;
            }
        }

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
