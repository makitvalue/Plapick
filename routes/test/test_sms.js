var express = require('express');
var router = express.Router();
const { isLogined, getPlatform } = require('../../lib/common');
const pool = require('../../lib/database');
const request = require('request');
const crypto = require('crypto');


router.get('', (req, res) => {
    try {
        // const phoneNumber = '01051009234';
        //
        // const timestamp = Date.now().toString();
        // let message = [];
        // message.push('POST');
        // message.push(' ');
        // message.push(`/sms/v2/services/${process.env.NCP_SENS_SMS_SERVICE_ID}/messages`);
        // message.push('\n');
        // message.push(timestamp);
        // message.push('\n');
        // message.push(process.env.NCP_ACCESS_KEY);
        // const signature = crypto.createHmac('sha256', process.env.NCP_SECRET_KEY).update(message.join('')).digest('base64');
        //
        // const code = Math.floor(Math.random() * (999999 - 100000)) + 100000;
        // request({
        //     method: 'POST',
        //     json: true,
        //     uri: `https://sens.apigw.ntruss.com/sms/v2/services/${process.env.NCP_SENS_SMS_SERVICE_ID}/messages`,
        //     headers: {
        //         'Content-Type': 'application/json; charset=utf-8',
        //         'x-ncp-iam-access-key': process.env.NCP_ACCESS_KEY,
        //         'x-ncp-apigw-timestamp': timestamp,
        //         'x-ncp-apigw-signature-v2': signature.toString()
        //     },
        //     body: {
        //         type: 'SMS',
        //         contentType: 'COMM',
        //         countryCode: '82',
        //         from: process.env.NCP_SENS_SMS_SENDER,
        //         content: `플레픽 인증번호 [${code}]를 입력해주세요.`,
        //         messages: [{ 'to': phoneNumber }]
        //     }
        // }, (error, result, html) => {
        //     if (error) {
        //         console.log(error);
        //         res.json({ status: 'ERR_SMS' });
        //         return;
        //     }
        //
        //     res.json({ status: 'OK' });
        // });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;
