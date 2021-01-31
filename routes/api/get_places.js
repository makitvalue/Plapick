var express = require('express');
var router = express.Router();
const { isLogined, getPlatform, isNone } = require('../../lib/common');
const pool = require('../../lib/database');
const request = require('request');


router.get('', async (req, res) => {
    try {
        // let plapickKey = req.query.plapickKey;
        // let platform = getPlatform(plapickKey);
        // if (platform === '') {
        //     res.json({ status: 'ERR_PLAPICK_KEY' });
        //     return;
        // }

        // if (!isLogined(req.session)) {
        //     res.json({ status: 'ERR_NO_PERMISSION' });
        //     return;
        // }

        let uId = req.session.uId;
        let mode = req.query.mode;
        let keyword = req.query.keyword;

        if (isNone(mode)) {
            res.json({ status: 'ERR_WRONG_PARAMS' });
            return;
        }

        if (mode != 'KEYWORD' && mode != 'MY_LIKE_PLACE') {
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
                        return;
                    });
                });
            });

        } else if (mode == 'MY_LIKE_PLACE') {
            // 내 좋아요 플레이스
            let query = "SET SESSION group_concat_max_len = 1000000";
            let [result, fields] = await pool.query(query);

            query = "SELECT pTab.*, piTab.mostPicks AS pMostPicks,";
            query += " IFNULL(mlpCntTab.cnt, 0) AS pLikeCnt,";
            query += " IFNULL(mcpTab.cnt, 0) AS pCommentCnt,";
            query += " IFNULL(piCntTab.cnt, 0) AS pPickCnt";

            query += " FROM t_maps_like_place AS mlpTab";

            query += " JOIN t_places AS pTab ON pTab.p_id = mlpTab.mlp_p_id";

            query += " LEFT JOIN";
            query += " (SELECT pi_p_id,";
            query += " GROUP_CONCAT(";
            query += " CONCAT_WS(':', pi_id,";
            query += " CONCAT_WS(':', u_id,";
            query += " CONCAT_WS(':', u_nick_name, uTab.u_profile_image)))";
            query += " SEPARATOR '|') AS mostPicks";
            query += " FROM t_picks AS _piTab";
            query += " JOIN t_users AS uTab ON _piTab.pi_u_id = uTab.u_id";
            query += " GROUP BY pi_p_id)";
            query += " AS piTab ON pTab.p_id = piTab.pi_p_id";

            // 좋아요 개수
            query += " LEFT JOIN (SELECT mlp_p_id, COUNT(*) AS cnt FROM t_maps_like_place GROUP BY mlp_p_id) AS mlpCntTab ON mlpCntTab.mlp_p_id = pTab.p_id";

            // 댓글 개수
            query += " LEFT JOIN (SELECT mcp_p_id, COUNT(*) AS cnt FROM t_maps_comment_place GROUP BY mcp_p_id) AS mcpTab ON mcpTab.mcp_p_id = pTab.p_id";

            // 픽 개수
            query += " LEFT JOIN (SELECT pi_p_id, COUNT(*) AS cnt FROM t_picks GROUP BY pi_p_id) AS piCntTab ON piCntTab.pi_p_id = pTab.p_id";

            query += " WHERE mlpTab.mlp_u_id = ?";
            let params = [uId];
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
    let query = "SET SESSION group_concat_max_len = 1000000";
    let [result, fields] = await pool.query(query);

    query = "SELECT pTab.*, piTab.mostPicks AS pMostPicks,";
    // query += " IF(mlpTab.cnt > 0, 'Y', 'N') AS isLike";
    // query += " IF(mcpTab.cnt > 0, 'Y', 'N') AS isComment";
    query += " IFNULL(mlpTab.cnt, 0) AS pLikeCnt,";
    query += " IFNULL(mcpTab.cnt, 0) AS pCommentCnt,";
    query += " IFNULL(piCntTab.cnt, 0) AS pPickCnt";

    query += " FROM t_places AS pTab";

    // 해당 플레이스가 갖고있는 픽들 전부 가져오기
    // TODO: 나중에 mostpick만 가져오는 기능 추가해야됨 (걍 WHERE 쓰면 될듯)
    query += " LEFT JOIN";
    query += " (SELECT pi_p_id,";
    query += " GROUP_CONCAT(";
    query += " CONCAT_WS(':', pi_id,";
    // query += " CONCAT_WS(':', pi_like_cnt,";
    // query += " CONCAT_WS(':', pi_comment_cnt,";
    query += " CONCAT_WS(':', u_id,";
    query += " CONCAT_WS(':', u_nick_name, uTab.u_profile_image)))";
    query += " SEPARATOR '|') AS mostPicks";
    query += " FROM t_picks AS _piTab";
    query += " JOIN t_users AS uTab ON _piTab.pi_u_id = uTab.u_id";
    query += " GROUP BY pi_p_id)";
    query += " AS piTab ON pTab.p_id = piTab.pi_p_id";

    // 현재 사용자 좋아요 여부
    // query += " LEFT JOIN";
    // query += " (SELECT mlp_p_id, COUNT(*) AS cnt FROM t_maps_like_place WHERE mlp_u_id = ? GROUP BY mlp_p_id)";
    // query += " AS mlpTab ON pTab.p_id = mlpTab.mlp_p_id";

    // 좋아요 개수
    query += " LEFT JOIN (SELECT mlp_p_id, COUNT(*) AS cnt FROM t_maps_like_place GROUP BY mlp_p_id) AS mlpTab ON mlpTab.mlp_p_id = pTab.p_id";

    // 댓글 개수
    query += " LEFT JOIN (SELECT mcp_p_id, COUNT(*) AS cnt FROM t_maps_comment_place GROUP BY mcp_p_id) AS mcpTab ON mcpTab.mcp_p_id = pTab.p_id";

    // 픽 개수
    query += " LEFT JOIN (SELECT pi_p_id, COUNT(*) AS cnt FROM t_picks GROUP BY pi_p_id) AS piCntTab ON piCntTab.pi_p_id = pTab.p_id";

    // 현재 사용자 댓글 여부
    // query += " LEFT JOIN";
    // query += " (SELECT mcp_p_id, COUNT(*) AS cnt FROM t_maps_comment_place WHERE mcp_u_id = ? GROUP BY mcp_p_id)";
    // query += " AS mcpTab ON pTab.p_id = mcpTab.mcp_p_id";

    // let params = [uId, uId];
    let params = [];

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

            pLikeCnt: 0,
            pCommentCnt: 0,
            pPickCnt: 0
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
                // place.p_like_cnt = res.p_like_cnt;
                // place.p_pick_cnt = res.p_pick_cnt;
                // place.p_comment_cnt = res.p_comment_cnt;
                place.pMostPicks = res.pMostPicks;
                place.pLikeCnt = res.pLikeCnt;
                place.pCommentCnt = res.pCommentCnt;
                place.pPickCnt = res.pPickCnt;
                // place.isLike = res.isLike;
                // place.isComment = res.isComment;
                break;
            }
        }
    }
    return placeList;
}


module.exports = router;