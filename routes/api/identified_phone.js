var express = require('express');
var router = express.Router();
const { isLogined, getPlatform, generateRandomId, getRandomCode, isNone } = require('../../lib/common');
const pool = require('../../lib/database');
const request = require('request');
const crypto = require('crypto');


router.post('', async (req, res) => {
    try {
        let plapickKey = req.body.plapickKey;
        let platform = getPlatform(plapickKey);
        if (platform === '') {
            res.json({ status: 'ERR_PLAPICK_KEY' });
            return;
        }

        let email = req.body.email;
        let phoneNumber = req.body.phoneNumber;

        if (isNone(phoneNumber)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        let query = "";
        let params = [];
        let [result, fields] = [null, null];

        if (!isNone(email)) { // 이메일이 들어왔으면 이메일, 휴대폰 번호로 사용자 조회
            query = "SELECT * FROM t_users WHERE u_type LIKE 'EMAIL' AND u_email LIKE ? AND u_phone_number LIKE ?";
            params = [email, phoneNumber];
            [result, fields] = await pool.query(query, params);

            if (result.length == 0) {
                res.json({ status: 'NO_EXISTS_USER' });
                return;
            }
        }

        let ipId = generateRandomId();

        let ipCode = 999999;
        while (true) {
            ipCode = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
            query = "SELECT * FROM t_identified_phone WHERE ip_phone_number LIKE ? AND ip_code LIKE ?";
            params = [phoneNumber, ipCode];
            [result, fields] = await pool.query(query, params);

            if (result.length == 0) break;
        }

        const timestamp = Date.now().toString();
        let message = [];
        message.push('POST');
        message.push(' ');
        message.push(`/sms/v2/services/${process.env.NCP_SENS_SMS_SERVICE_ID}/messages`);
        message.push('\n');
        message.push(timestamp);
        message.push('\n');
        message.push(process.env.NCP_ACCESS_KEY);
        const signature = crypto.createHmac('sha256', process.env.NCP_SECRET_KEY).update(message.join('')).digest('base64');

        request({
            method: 'POST',
            json: true,
            uri: `https://sens.apigw.ntruss.com/sms/v2/services/${process.env.NCP_SENS_SMS_SERVICE_ID}/messages`,
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'x-ncp-iam-access-key': process.env.NCP_ACCESS_KEY,
                'x-ncp-apigw-timestamp': timestamp,
                'x-ncp-apigw-signature-v2': signature.toString()
            },
            body: {
                type: 'SMS',
                contentType: 'COMM',
                countryCode: '82',
                from: process.env.NCP_SENS_SMS_SENDER,
                content: `[플레픽] 인증번호 [${ipCode}]를 입력해주세요.`,
                messages: [{ 'to': phoneNumber }]
            }
        }, async (error, result, html) => {
            if (error) {
                console.log(error);
                res.json({ status: 'SEND_FAILED' });
                return;
            }

            query = "INSERT INTO t_identified_phone (ip_id, ip_phone_number, ip_code) VALUES (?, ?, ?)";
            params = [ipId, phoneNumber, ipCode];
            await pool.query(query, params);
            res.json({ status: 'OK', result: ipId });
        });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
