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

    let splitedAddress = address.split(' ');
    let splitedRoadAddress = roadAddress.split(' ');

    for (let key in locations.parentLocations) {
        if (splitedAddress.length < 1) break;

        let pname = splitedAddress[0];

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
            if (splitedRoadAddress.length < 1) break;

            let pname = splitedRoadAddress[0];

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
        if (splitedAddress.length < 2) break;

        let cloc = selectedChildLocations[i];

        let cname = splitedAddress[1];

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
            if (splitedRoadAddress.length < 2) break;

            let cloc = selectedChildLocations[i];

            let cname = splitedRoadAddress[1];

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

module.exports = common;