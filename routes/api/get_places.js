var express = require('express');
var router = express.Router();
const { isLogined, getPlatform, isNone, isInt, getPlaceSelectWhatQuery, getPlaceSelectJoinQuery } = require('../../lib/common');
const pool = require('../../lib/database');
const request = require('request');


router.get('', async (req, res) => {
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

        let uId = req.session.uId;
        let mode = req.query.mode;
        let keyword = req.query.keyword;
        let latitude = req.query.latitude;
        let longitude = req.query.longitude;
        var zoom = req.query.zoom;
        let plocCode = req.query.plocCode;
        let clocCode = req.query.clocCode;

        if (isNone(mode)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (mode != 'KEYWORD' && mode != 'MY_LIKE_PLACE' && mode != 'COORD' && mode != 'LOCATION') {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (mode == 'KEYWORD') {
            // 키워드로 검색 (카카오 플레이스)
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
                    placeList = await contextPlaceList(uId, kakaoPlaceList);
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
                    kakaoPlaceList = kakaoPlaceList.concat(data.documents);

                    if (isEnd) {
                        placeList = await contextPlaceList(uId, kakaoPlaceList);
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
                        kakaoPlaceList = kakaoPlaceList.concat(data.documents);
                        placeList = await contextPlaceList(uId, kakaoPlaceList);

                        res.json({ status: 'OK', result: placeList });
                    });
                });
            });

        } else if (mode == 'MY_LIKE_PLACE') {
            // 내 좋아요 플레이스
            let query = "SET SESSION group_concat_max_len = 65535";
            let [result, fields] = await pool.query(query);

            query = getPlaceSelectWhatQuery();
            query += " FROM t_maps_like_place AS mlpTab";
            query += " JOIN t_places AS pTab ON pTab.p_id = mlpTab.mlp_p_id";
            query += getPlaceSelectJoinQuery();
            query += " WHERE mlpTab.mlp_u_id = ?";

            let params = [uId, uId];
            [result, fields] = await pool.query(query, params);
            res.json({ status: 'OK', result: result });

        } else if (mode == 'COORD') {
            // 좌표 기준 탐색

            if (isNone(latitude) || isNone(longitude) || isNone(zoom)) {
                res.json({ status: 'ERR_WRONG_PARAMS' });
                return;
            }

            let lat = parseFloat(latitude);
            let lng = parseFloat(longitude);
            if (isNaN(lat) || isNaN(lng) || !isInt(zoom)) {
                res.json({ status: 'ERR_WRONG_PARAMS' });
                return;
            }

            let dist = 2000;

            let query = "SET SESSION group_concat_max_len = 65535";
            let [result, fields] = await pool.query(query);

            query = `${getPlaceSelectWhatQuery()},`;
            query += ` ST_DISTANCE_SPHERE(POINT(${lng}, ${lat}), pTab.p_geometry) AS dist`;
            query += " FROM t_places AS pTab";
            query += getPlaceSelectJoinQuery();
            
            query += " WHERE MBRCONTAINS(ST_LINESTRINGFROMTEXT(";
            query += ` CONCAT('LINESTRING(', ${lng} -  IF(${lng} < 0, 1, -1) * `;
            query += ` ${dist} / 2 / ST_DISTANCE_SPHERE(POINT(${lng}, ${lat}), POINT(${lng} + IF(${lng} < 0, 1, -1), ${lat})), ' ', ${lat} -  IF(${lng} < 0, 1, -1) * `;
            query += ` ${dist} / 2 / ST_DISTANCE_SPHERE(POINT(${lng}, ${lat}), POINT(${lng}, ${lat} + IF(${lat} < 0, 1, -1))), ',', ${lng} +  IF(${lng} < 0, 1, -1) * `;
            query += ` ${dist} / 2 / ST_DISTANCE_SPHERE(POINT(${lng}, ${lat}), POINT(${lng} + IF(${lng} < 0, 1, -1), ${lat})), ' ', ${lat} +  IF(${lng} < 0, 1, -1) * `;
            query += ` ${dist} / 2 / ST_DISTANCE_SPHERE(POINT(${lng}, ${lat}), POINT(${lng}, ${lat} + IF(${lat} < 0, 1, -1))), ')')), pTab.p_geometry)`;
            
            // query += " ORDER BY dist";
            // 인기순
            query += " ORDER BY (pLikeCnt + pCommentCnt + pPickCnt) DESC";

            let params = [uId];
            [result, fields] = await pool.query(query, params);

            res.json({ status: 'OK', result: result });

        } else if (mode == 'LOCATION') {
            if (isNone(plocCode) || isNone(clocCode)) {
                res.json({ status: 'ERR_WRONG_PARAMS' });
                return;
            }

            if (!isInt(plocCode) || !isInt(clocCode)) {
                res.json({ status: 'ERR_WRONG_PARAMS' });
                return;
            }

            let query = "SET SESSION group_concat_max_len = 65535";
            let [result, fields] = await pool.query(query);

            query = getPlaceSelectWhatQuery();
            query += " FROM t_places AS pTab";
            query += getPlaceSelectJoinQuery();
            query += " WHERE p_ploc_code = ? AND p_cloc_code = ?";

            // 인기순
            query += " ORDER BY (pLikeCnt + pCommentCnt + pPickCnt) DESC";

            let params = [uId, plocCode, clocCode];
            [result, fields] = await pool.query(query, params);

            res.json({ status: 'OK', result: result });
        }
        

    } catch(error) {
        console.log(error);
        res.json({ status: 'ERR_INTERNAL_SERVER' });
    }
});


// kakao에서 가져온 placeList들 쿼리 날려 p_id, p_like_cnt, p_pick_cnt 가져오기
// 속도 이슈 있음
async function contextPlaceList(uId, kakaoPlaceList) {
    let query = "SET SESSION group_concat_max_len = 65535";
    let [result, fields] = await pool.query(query);

    query = getPlaceSelectWhatQuery();
    query += " FROM t_places AS pTab";
    query += getPlaceSelectJoinQuery();

    let params = [uId];

    let placeList = [];
    for (let i = 0; i < kakaoPlaceList.length; i++) {
        let kakaoPlace = kakaoPlaceList[i];
        let place = {
            p_id: 0,

            p_k_id: parseInt(kakaoPlace.id),
            p_name: kakaoPlace.place_name,
            p_category_name: kakaoPlace.category_name,
            p_category_group_name: kakaoPlace.category_group_name,
            p_category_group_code: kakaoPlace.category_group_code,
            p_address: kakaoPlace.address_name,
            p_road_address: kakaoPlace.road_address_name,
            p_latitude: (isNone(kakaoPlace.y) ? '' : parseFloat(kakaoPlace.y).toFixed(6)),
            p_longitude: (isNone(kakaoPlace.x) ? '' : parseFloat(kakaoPlace.x).toFixed(6)),
            p_phone: kakaoPlace.phone,
            
            p_ploc_code: '',
            p_cloc_code: '',

            pMostPicks: '',
            pLikeCnt: 0,
            pCommentCnt: 0,
            pPickCnt: 0,

            pIsLike: 'N'
        };

        if (i == 0) query += " WHERE pTab.p_k_id = ?";
        else query += " OR pTab.p_k_id = ?";
        params.push(place.p_k_id);

        placeList.push(place);
    }
    [result, fields] = await pool.query(query, params);

    // get like, comment, pick 여부

    for (let i = 0; i < result.length; i++) {
        let res = result[i];
        for (let j = 0; j < placeList.length; j++) {
            let place = placeList[j];
            if (place.p_k_id == res.p_k_id) {
                place.p_id = res.p_id;

                place.p_ploc_code = res.p_ploc_code;
                place.p_cloc_code = res.p_cloc_code;

                place.pMostPicks = res.pMostPicks;
                place.pLikeCnt = res.pLikeCnt;
                place.pCommentCnt = res.pCommentCnt;
                place.pPickCnt = res.pPickCnt;

                place.pIsLike = res.pIsLike;
                
                break;
            }
        }
    }
    return placeList;
}


module.exports = router;