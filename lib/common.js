const moment = require('moment');
const locations = require('./locations');

const common = {};


// app key check
common.getPlatform = (plapickKey) => {
    if (plapickKey == process.env.PLAPICK_IOS_APP_KEY) {
        return 'IOS';
    } else if (plapickKey == process.env.PLAPICK_ANDROID_APP_KEY) {
        return 'ANDROID';
    } else if (plapickKey == process.env.PLAPICK_WEB_KEY) {
        return 'WEB';
    } else {
        return '';
    }
};


// random id
common.generateRandomId = () => {
    var rand = Math.floor(Math.random() * 9999) + '';
    var pad = rand.length >= 4 ? rand : new Array(4 - rand.length + 1).join('0') + rand;
    var random_id = moment().format("YYMMDDHHmmss") + pad;
    return parseInt(random_id);
};

common.generateRandomNickName = (nickName) => {
    var rand = Math.floor(Math.random() * 999) + '';
    var pad = rand.length >= 3 ? rand : new Array(3 - rand.length + 1).join('0') + rand;
    return nickName + pad;
};

// none check
common.isNone = (value) => {
    if (typeof value === 'undefined' || value === null || value === '') {
        return true;
    } else {
        if (value.trim() === '') return true;
        else return false;
    }
};

// none to blank
common.ntb = (value) => {
    if (common.isNone(value)) return '';
    else return value.trim();
};

// 권한 체크
common.isLogined = (session) => {
    if (!session.isLogined || !session.uId || !session.uType) {
        return false;
    }
    return true;
};

// utf8 byte 길이 체크
common.getByteLength = (s) => {
    if(s != undefined && s != "") {
		for(b=i=0;c=s.charCodeAt(i++);b+=c>>11?3:c>>7?2:1);
		return b;
	} else {
		return 0;
	}
};

// JSON parse 체크
common.getJSONList = (list) => {
    try {
        list = JSON.parse(list);
        return list;
    } catch(error) {
        return [];
    }
};

// 숫자 체크
common.isInt = (value) => {
    let v = parseInt(value);
    if (isNaN(v)) return false;
    return true;
};

// 문자 길이 체크
common.isValidStrLength = (max, kMin, kMax, value) => {
    let cnt = value.length;
    let utf8Cnt = common.getByteLength(value);
    if (utf8Cnt >= (kMin * 3) && utf8Cnt <= (kMax * 3)) {
        if (cnt <= max) {
            return true;
        } else { return false; }
    } else { return false; }
};

// 지역코드 가져오기
common.getLocCode = (address, roadAddress) => {
    let plocCode = '';
    let clocCode = '';

    let splittedAddress = address.split(' ');
    let splittedRoadAddress = roadAddress.split(' ');

    for (let key in locations.parentLocations) {
        if (splittedAddress.length < 1) break;

        let pname = splittedAddress[0];

        let value = locations.parentLocations[key];

        let code = key;
        let name = value.name;
        let mname = value.mname;
        let sname = value.sname;

        if (name == pname || mname == pname || sname == pname) {
            plocCode = code;
            break;
        }
    }

    if (plocCode == '') {
        for (let key in locations.parentLocations) {
            if (splittedRoadAddress.length < 1) break;

            let pname = splittedRoadAddress[0];

            let code = key;
            let name = value.name;
            let mname = value.mname;
            let sname = value.sname;

            if (name == pname || mname == pname || sname == pname) {
                plocCode = code;
                break;
            }
        }
    }

    let selectedChildLocations = locations.childLocations[plocCode];

    for (let i in selectedChildLocations) {
        if (splittedAddress.length < 2) break;

        let cloc = selectedChildLocations[i];

        let cname = splittedAddress[1];

        let code = cloc.code;
        let name = cloc.name;
        let sname = cloc.sname;

        if (name == cname || sname == cname) {
            clocCode = code;
            break;
        }
    }

    if (clocCode == '') {
        for (let i in selectedChildLocations) {
            if (splittedRoadAddress.length < 2) break;

            let cloc = selectedChildLocations[i];

            let cname = splittedRoadAddress[1];

            let code = cloc.code;
            let name = cloc.name;
            let sname = cloc.sname;

            if (name == cname || sname == cname) {
                clocCode = code;
                break;
            }
        }
    }

    return [plocCode, clocCode];
};

common.getPlaceSelectWhatQuery = (blockUserList) => {
    let query = "SELECT pTab.*,";

    // Start picks
    // 해당 플레이스가 갖고있는 픽들 id+uId만 like + comment순 (인기순) 전부 가져오기
    query += " IFNULL((SELECT";
    query += " GROUP_CONCAT(";
    query += " CONCAT_WS(':', piTab.pi_id, piTab.pi_u_id)";
    query += " ORDER BY (IFNULL(mlpiTab.cnt, 0) + IFNULL(mcpiTab.cnt, 0)) DESC SEPARATOR '|')";

    query += " FROM t_picks AS piTab";

    // query += " IFNULL((SELECT ";
    // query += " GROUP_CONCAT(";
    // query +=    " CONCAT_WS('|', piTab.pi_id,";
    // query +=        " CONCAT_WS('|', piTab.pi_u_id,";
    // query +=              " CONCAT_WS('|', uTab.u_nick_name, uTab.u_profile_image)))";
    // query += " ORDER BY (IFNULL(mlpiTab.cnt, 0) + IFNULL(mcpiTab.cnt, 0)) DESC SEPARATOR '|')";
    // query += " FROM t_picks AS piTab";

    // 픽 유저 정보
    // query += " JOIN t_users AS uTab ON piTab.pi_u_id = uTab.u_id";

    // 픽 좋아요 여부
    // query += " LEFT JOIN (SELECT mlpi_pi_id, COUNT(*) AS cnt FROM t_maps_like_pick WHERE mlpi_u_id = ? GROUP BY mlpi_pi_id) AS mlpiLikeTab ON mlpiLikeTab.pi_id = piTab.pi_id";

    // 픽 좋아요 개수
    query += " LEFT JOIN (SELECT mlpi_pi_id, COUNT(*) AS cnt FROM t_maps_like_pick GROUP BY mlpi_pi_id) AS mlpiTab ON mlpiTab.mlpi_pi_id = piTab.pi_id";

    // 픽 댓글 개수
    query += " LEFT JOIN (SELECT mcpi_pi_id, COUNT(*) AS cnt FROM t_maps_comment_pick GROUP BY mcpi_pi_id) AS mcpiTab ON mcpiTab.mcpi_pi_id = piTab.pi_id";

    query += " WHERE piTab.pi_p_id = pTab.p_id";
    if (blockUserList.length > 0) {
        query += " AND piTab.pi_u_id NOT IN (";
        for (let i = 0; i < blockUserList.length; i++) {
            if (i > 0) query += " ,";
            query += " ?";
        }
        query += " )";
    }
    query += "), '') AS picks,";
    // End picks

    // 좋아요 여부
    query += " IF((SELECT COUNT(*) FROM t_maps_like_place WHERE mlp_u_id = ? AND mlp_p_id = pTab.p_id) > 0, 'Y', 'N') AS isLike,";

    // 좋아요 개수
    query += " (SELECT COUNT(*) FROM t_maps_like_place WHERE mlp_p_id = pTab.p_id) AS likeCnt,";

    // 댓글 개수
    query += " (SELECT COUNT(*) FROM t_maps_comment_place WHERE mcp_p_id = pTab.p_id) AS commentCnt,";

    // 픽 개수
    query += " (SELECT COUNT(*) FROM t_picks WHERE pi_p_id = pTab.p_id) AS pickCnt";

    return query;
};

// common.getPlaceSelectJoinQuery = () => {
//     // 현재 사용자 좋아요 여부
//     let query = " LEFT JOIN";
//     query += " (SELECT mlp_p_id, COUNT(*) AS cnt FROM t_maps_like_place WHERE mlp_u_id = ? GROUP BY mlp_p_id)";
//     query += " AS mlpLikeTab ON pTab.p_id = mlpLikeTab.mlp_p_id";

//     // 좋아요 개수
//     query += " LEFT JOIN (SELECT mlp_p_id, COUNT(*) AS cnt FROM t_maps_like_place GROUP BY mlp_p_id) AS mlpCntTab ON mlpCntTab.mlp_p_id = pTab.p_id";

//     // 댓글 개수
//     query += " LEFT JOIN (SELECT mcp_p_id, COUNT(*) AS cnt FROM t_maps_comment_place GROUP BY mcp_p_id) AS mcpCntTab ON mcpCntTab.mcp_p_id = pTab.p_id";

//     // 픽 개수
//     query += " LEFT JOIN (SELECT pi_p_id, COUNT(*) AS cnt FROM t_picks GROUP BY pi_p_id) AS piCntTab ON piCntTab.pi_p_id = pTab.p_id";

//     return query;
// };

module.exports = common;
