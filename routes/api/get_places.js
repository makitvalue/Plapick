var express = require('express');
var router = express.Router();
const { isLogined, isNone } = require('../../lib/common');
const pool = require('../../lib/database');
var request = require('request');


// 플레이스 검색
router.get('', (req, res) => {
    try {
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

        let placeList = [];
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
            placeList = placeList.concat(data.documents);

            if (isEnd) {
                placeList = await contextPlaceList(placeList);
                res.json({ status: 'OK', result: placeList });
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
                placeList = placeList.concat(data.documents);

                if (isEnd) {
                    placeList = await contextPlaceList(placeList);
                    res.json({ status: 'OK', result: placeList });
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
                    placeList = placeList.concat(data.documents);
                    placeList = await contextPlaceList(placeList);

                    res.json({ status: 'OK', result: placeList });
                    return;
                });
            });
        });

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


// kakao에서 가져온 placeList들 쿼리 날려 p_id, p_like_cnt, p_pick_cnt 가져오기
// 속도 이슈 있음
async function contextPlaceList(placeList) {
    let query = "SELECT * FROM t_places";
    let params = [];
    for (let i = 0; i < placeList.length; i++) {
        let place = placeList[i];
        place.p_id = 0;
        place.p_like_cnt = 0;
        place.p_pick_cnt = 0;
        if (i == 0) query += " WHERE p_k_id = ?";
        else query += " OR p_k_id = ?";
        params.push(place.id);
    }
    let [_placeList, fields] = await pool.query(query, params);
    for (let i = 0; i < _placeList.length; i++) {
        let _place = _placeList[i];
        for (let j = 0; j < placeList.length; j++) {
            let place = placeList[j];
            if (place.id == _place.p_k_id) {
                place.p_id = _place.p_id;
                place.p_like_cnt = _place.p_like_cnt;
                place.p_pick_cnt = _place.p_pick_cnt;
                break;
            }
        }
    }
    return placeList;
}


module.exports = router;