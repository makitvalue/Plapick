var express = require('express');
var router = express.Router();
const { isLogined, getPlatform, isNone } = require('../../lib/common');
const request = require('request');


router.get('', (req, res) => {
    try {
        let plapickKey = req.query.plapickKey;
        let platform = getPlatform(plapickKey);
        if (platform === '') {
            res.json({ status: 'ERR_PLAPICK_KEY' });
            return;
        }

        if (!isLogined(req.session)) {
            res.json({ status: 'ERR_NO_PERMISSION' });
            return;
        }

        let keyword = req.query.keyword;

        if (isNone(keyword)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        const kakaoUrl = 'https://dapi.kakao.com/v2/local/search/keyword.json';
        let kakaoPlaceList = [];

        request.get({
            uri: `${kakaoUrl}?query=${encodeURI(keyword)}&page=1`,
            headers: {
                Authorization: `KakaoAK ${process.env.KAKAO_PLACE_KEY}`
            }
        }, async (error, response) => {
            if (error) {
                res.json({ status: 'ERR_KAKAO_PLACE' });
                return;
            }

            let data = JSON.parse(response.body);
            let isEnd = data.meta.is_end;
            kakaoPlaceList = kakaoPlaceList.concat(data.documents);

            if (isEnd) {
                res.json({ status: 'OK', result: kakaoPlaceList });
                return;
            }

            request.get({
                uri: `${kakaoUrl}?query=${encodeURI(keyword)}&page=2`,
                headers: {
                    Authorization: `KakaoAK ${process.env.KAKAO_PLACE_KEY}`
                }
            }, async (error, response) => {
                if (error) {
                    res.json({ status: 'ERR_KAKAO_PLACE' });
                    return;
                }

                data = JSON.parse(response.body);
                isEnd = data.meta.is_end;
                kakaoPlaceList = kakaoPlaceList.concat(data.documents);

                if (isEnd) {
                    res.json({ status: 'OK', result: kakaoPlaceList });
                    return;
                }

                request.get({
                    uri: `${kakaoUrl}?query=${encodeURI(keyword)}&page=3`,
                    headers: {
                        Authorization: `KakaoAK ${process.env.KAKAO_PLACE_KEY}`
                    }
                }, async (error, response) => {
                    if (error) {
                        res.json({ status: 'ERR_KAKAO_PLACE' });
                        return;
                    }

                    data = JSON.parse(response.body);
                    kakaoPlaceList = kakaoPlaceList.concat(data.documents);

                    res.json({ status: 'OK', result: kakaoPlaceList });
                });
            });
        });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


module.exports = router;