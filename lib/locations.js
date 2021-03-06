const locations = {
    parentLocations: {
        "101": { "name": "서울특별시", "mname": "서울시", "sname": "서울" },
        "102": { "name": "경기도", "mname": "경기시", "sname": "경기" },
        "103": { "name": "광주광역시", "mname": "광주시", "sname": "광주" },
        "104": { "name": "대구광역시", "mname": "대구시", "sname": "대구" },
        "105": { "name": "대전광역시", "mname": "대전시", "sname": "대전" },
        "106": { "name": "부산광역시", "mname": "부산시", "sname": "부산" },
        "107": { "name": "울산광역시", "mname": "울산시", "sname": "울산" },
        "108": { "name": "인천광역시", "mname": "인천시", "sname": "인천" },
        "109": { "name": "강원도", "mname": "강원시", "sname": "강원" },
        "110": { "name": "경상남도", "mname": "경남시", "sname": "경남" },
        "111": { "name": "경상북도", "mname": "경북시", "sname": "경북" },
        "112": { "name": "전라남도", "mname": "전남시", "sname": "전남" },
        "113": { "name": "전라북도", "mname": "전북시", "sname": "전북" },
        "114": { "name": "충청북도", "mname": "충북시", "sname": "충북" },
        "115": { "name": "충청남도", "mname": "충남시", "sname": "충남" },
        "116": { "name": "제주특별자치도", "mname": "제주도", "sname": "제주" },
        "118": { "name": "세종특별자치시", "mname": "세종시", "sname": "세종" }
    },
    childLocations: {
        "101": [
            { "code": "101010", "name": "강남구", "sname": "강남" },
            { "code": "101020", "name": "강동구", "sname": "강동" },
            { "code": "101030", "name": "강북구", "sname": "강북" },
            { "code": "101040", "name": "강서구", "sname": "강서" },
            { "code": "101050", "name": "관악구", "sname": "관악" },
            { "code": "101060", "name": "광진구", "sname": "광진" },
            { "code": "101070", "name": "구로구", "sname": "구로" },
            { "code": "101080", "name": "금천구", "sname": "금천" },
            { "code": "101090", "name": "노원구", "sname": "노원" },
            { "code": "101100", "name": "도봉구", "sname": "도봉" },
            { "code": "101110", "name": "동대문구", "sname": "동대문" },
            { "code": "101120", "name": "동작구", "sname": "동작" },
            { "code": "101130", "name": "마포구", "sname": "마포" },
            { "code": "101140", "name": "서대문구", "sname": "서대문" },
            { "code": "101150", "name": "서초구", "sname": "서초" },
            { "code": "101160", "name": "성동구", "sname": "성동" },
            { "code": "101170", "name": "성북구", "sname": "성북" },
            { "code": "101180", "name": "송파구", "sname": "송파" },
            { "code": "101190", "name": "양천구", "sname": "양천" },
            { "code": "101200", "name": "영등포구", "sname": "영등포" },
            { "code": "101210", "name": "용산구", "sname": "용산" },
            { "code": "101220", "name": "은평구", "sname": "은평" },
            { "code": "101230", "name": "종로구", "sname": "종로" },
            { "code": "101240", "name": "중구", "sname": "중구" },
            { "code": "101250", "name": "중랑구", "sname": "중랑" }
        ],
        "102": [
            { "code": "102010", "name": "가평군", "sname": "가평" },
            { "code": "102020", "name": "고양시", "sname": "고양" },
            { "code": "102060", "name": "과천시", "sname": "과천" },
            { "code": "102070", "name": "광명시", "sname": "광명" },
            { "code": "102080", "name": "광주시", "sname": "광주" },
            { "code": "102090", "name": "구리시", "sname": "구리" },
            { "code": "102100", "name": "군포시", "sname": "군포" },
            { "code": "102110", "name": "김포시", "sname": "김포" },
            { "code": "102120", "name": "남양주시", "sname": "남양주" },
            { "code": "102130", "name": "동두천시", "sname": "동두천" },
            { "code": "102140", "name": "부천시", "sname": "부천" },
            { "code": "102180", "name": "성남시", "sname": "성남" },
            { "code": "102220", "name": "수원시", "sname": "수원" },
            { "code": "102270", "name": "시흥시", "sname": "시흥" },
            { "code": "102280", "name": "안산시", "sname": "안산" },
            { "code": "102310", "name": "안성시", "sname": "안성" },
            { "code": "102320", "name": "안양시", "sname": "안양" },
            { "code": "102350", "name": "양주시", "sname": "양주" },
            { "code": "102360", "name": "양평군", "sname": "양평" },
            { "code": "102370", "name": "여주시", "sname": "여주" },
            { "code": "102380", "name": "연천군", "sname": "연천" },
            { "code": "102390", "name": "오산시", "sname": "오산" },
            { "code": "102400", "name": "용인시", "sname": "용인" },
            { "code": "102440", "name": "의왕시", "sname": "의왕" },
            { "code": "102450", "name": "의정부시", "sname": "의정부" },
            { "code": "102460", "name": "이천시", "sname": "이천" },
            { "code": "102470", "name": "파주시", "sname": "파주" },
            { "code": "102480", "name": "평택시", "sname": "평택" },
            { "code": "102490", "name": "포천시", "sname": "포천" },
            { "code": "102500", "name": "하남시", "sname": "하남" },
            { "code": "102510", "name": "화성시", "sname": "화성" }
        ],
        "103": [
            { "code": "103010", "name": "광산구", "sname": "광산" },
            { "code": "103020", "name": "남구", "sname": "남구" },
            { "code": "103030", "name": "동구", "sname": "동구" },
            { "code": "103040", "name": "북구", "sname": "북구" },
            { "code": "103050", "name": "서구", "sname": "서구" }
        ],
        "104": [
            { "code": "104010", "name": "남구", "sname": "남구" },
            { "code": "104020", "name": "달서구", "sname": "달서" },
            { "code": "104030", "name": "달성군", "sname": "달성" },
            { "code": "104040", "name": "동구", "sname": "동구" },
            { "code": "104050", "name": "북구", "sname": "북구" },
            { "code": "104060", "name": "서구", "sname": "서구" },
            { "code": "104070", "name": "수성구", "sname": "수성" },
            { "code": "104080", "name": "중구", "sname": "중구" }
        ],
        "105": [
            { "code": "105010", "name": "대덕구", "sname": "대덕" },
            { "code": "105020", "name": "동구", "sname": "동구" },
            { "code": "105030", "name": "서구", "sname": "서구" },
            { "code": "105040", "name": "유성구", "sname": "유성" },
            { "code": "105050", "name": "중구", "sname": "중구" }
        ],
        "106": [
            { "code": "106010", "name": "강서구", "sname": "강서" },
            { "code": "106020", "name": "금정구", "sname": "금정" },
            { "code": "106030", "name": "기장군", "sname": "기장" },
            { "code": "106040", "name": "남구", "sname": "남구" },
            { "code": "106050", "name": "동구", "sname": "동구" },
            { "code": "106060", "name": "동래구", "sname": "동래" },
            { "code": "106070", "name": "부산진구", "sname": "부산진" },
            { "code": "106080", "name": "북구", "sname": "북구" },
            { "code": "106090", "name": "사상구", "sname": "사상" },
            { "code": "106100", "name": "사하구", "sname": "사하" },
            { "code": "106110", "name": "서구", "sname": "서구" },
            { "code": "106120", "name": "수영구", "sname": "수영" },
            { "code": "106130", "name": "연제구", "sname": "연제" },
            { "code": "106140", "name": "영도구", "sname": "영도" },
            { "code": "106150", "name": "중구", "sname": "중구" },
            { "code": "106160", "name": "해운대구", "sname": "해운대" }
        ],
        "107": [
            { "code": "107010", "name": "남구", "sname": "남구" },
            { "code": "107020", "name": "동구", "sname": "동구" },
            { "code": "107030", "name": "북구", "sname": "북구" },
            { "code": "107040", "name": "울주군", "sname": "울주" },
            { "code": "107050", "name": "중구", "sname": "중구" }
        ],
        "108": [
            { "code": "108010", "name": "강화군", "sname": "강화" },
            { "code": "108020", "name": "계양구", "sname": "계양" },
            { "code": "108030", "name": "남구", "sname": "남구" },
            { "code": "108040", "name": "남동구", "sname": "남동" },
            { "code": "108050", "name": "동구", "sname": "동구" },
            { "code": "108060", "name": "부평구", "sname": "부평" },
            { "code": "108070", "name": "서구", "sname": "서구" },
            { "code": "108080", "name": "연수구", "sname": "연수" },
            { "code": "108090", "name": "옹진군", "sname": "옹진" },
            { "code": "108100", "name": "중구", "sname": "중구" }
        ],
        "109": [
            { "code": "109010", "name": "강릉시", "sname": "강릉" },
            { "code": "109020", "name": "고성군", "sname": "고성" },
            { "code": "109030", "name": "동해시", "sname": "동해" },
            { "code": "109040", "name": "삼척시", "sname": "삼척" },
            { "code": "109050", "name": "속초시", "sname": "속초" },
            { "code": "109060", "name": "양구군", "sname": "양구" },
            { "code": "109070", "name": "양양군", "sname": "양양" },
            { "code": "109080", "name": "영월군", "sname": "영월" },
            { "code": "109090", "name": "원주시", "sname": "원주" },
            { "code": "109100", "name": "인제군", "sname": "인제" },
            { "code": "109110", "name": "정선군", "sname": "정선" },
            { "code": "109120", "name": "철원군", "sname": "철원" },
            { "code": "109130", "name": "춘천시", "sname": "춘천" },
            { "code": "109140", "name": "태백시", "sname": "태백" },
            { "code": "109150", "name": "평창군", "sname": "평창" },
            { "code": "109160", "name": "홍천군", "sname": "홍천" },
            { "code": "109170", "name": "화천군", "sname": "화천" },
            { "code": "109180", "name": "횡성군", "sname": "횡성" }
        ],
        "110": [
            { "code": "110010", "name": "거제시", "sname": "거제" },
            { "code": "110020", "name": "거창군", "sname": "거창" },
            { "code": "110030", "name": "고성군", "sname": "고성" },
            { "code": "110040", "name": "김해시", "sname": "김해" },
            { "code": "110050", "name": "남해군", "sname": "남해" },
            { "code": "110070", "name": "밀양시", "sname": "밀양" },
            { "code": "110080", "name": "사천시", "sname": "사천" },
            { "code": "110090", "name": "산청군", "sname": "산청" },
            { "code": "110100", "name": "양산시", "sname": "양산" },
            { "code": "110110", "name": "의령군", "sname": "의령" },
            { "code": "110120", "name": "진주시", "sname": "진주" },
            { "code": "110140", "name": "창녕군", "sname": "창녕" },
            { "code": "110150", "name": "창원시", "sname": "창원" },
            { "code": "110160", "name": "통영시", "sname": "통영" },
            { "code": "110170", "name": "하동군", "sname": "하동" },
            { "code": "110180", "name": "함안군", "sname": "함안" },
            { "code": "110190", "name": "함양군", "sname": "함양" },
            { "code": "110200", "name": "합천군", "sname": "합천" }
        ],
        "111": [
            { "code": "111010", "name": "경산시", "sname": "경산" },
            { "code": "111020", "name": "경주시", "sname": "경주" },
            { "code": "111030", "name": "고령군", "sname": "고령" },
            { "code": "111040", "name": "구미시", "sname": "구미" },
            { "code": "111050", "name": "군위군", "sname": "군위" },
            { "code": "111060", "name": "김천시", "sname": "김천" },
            { "code": "111070", "name": "문경시", "sname": "문경" },
            { "code": "111080", "name": "봉화군", "sname": "봉화" },
            { "code": "111090", "name": "상주시", "sname": "상주" },
            { "code": "111100", "name": "성주군", "sname": "성주" },
            { "code": "111110", "name": "안동시", "sname": "안동" },
            { "code": "111120", "name": "영덕군", "sname": "영덕" },
            { "code": "111130", "name": "영양군", "sname": "영양" },
            { "code": "111140", "name": "영주시", "sname": "영주" },
            { "code": "111150", "name": "영천시", "sname": "영천" },
            { "code": "111160", "name": "예천군", "sname": "예천" },
            { "code": "111170", "name": "울릉군", "sname": "울릉" },
            { "code": "111180", "name": "울진군", "sname": "울진" },
            { "code": "111190", "name": "의성군", "sname": "의성" },
            { "code": "111200", "name": "청도군", "sname": "청도" },
            { "code": "111210", "name": "청송군", "sname": "청송" },
            { "code": "111220", "name": "칠곡군", "sname": "칠곡" },
            { "code": "111230", "name": "포항시", "sname": "포항" }
        ],
        "112": [
            { "code": "112010", "name": "강진군", "sname": "강진" },
            { "code": "112020", "name": "고흥군", "sname": "고흥" },
            { "code": "112030", "name": "곡성군", "sname": "곡성" },
            { "code": "112040", "name": "광양시", "sname": "광양" },
            { "code": "112050", "name": "구례군", "sname": "구례" },
            { "code": "112060", "name": "나주시", "sname": "나주" },
            { "code": "112070", "name": "담양군", "sname": "담양" },
            { "code": "112080", "name": "목포시", "sname": "목포" },
            { "code": "112090", "name": "무안군", "sname": "무안" },
            { "code": "112100", "name": "보성군", "sname": "보성" },
            { "code": "112110", "name": "순천시", "sname": "순천" },
            { "code": "112120", "name": "신안군", "sname": "신안" },
            { "code": "112130", "name": "여수시", "sname": "여수" },
            { "code": "112140", "name": "영광군", "sname": "영광" },
            { "code": "112150", "name": "영암군", "sname": "영암" },
            { "code": "112160", "name": "완도군", "sname": "완도" },
            { "code": "112170", "name": "장성군", "sname": "장성" },
            { "code": "112180", "name": "장흥군", "sname": "장흥" },
            { "code": "112190", "name": "진도군", "sname": "진도" },
            { "code": "112200", "name": "함평군", "sname": "함평" },
            { "code": "112210", "name": "해남군", "sname": "해남" },
            { "code": "112220", "name": "화순군", "sname": "화순" }
        ],
        "113": [
            { "code": "113010", "name": "고창군", "sname": "고창" },
            { "code": "113020", "name": "군산시", "sname": "군산" },
            { "code": "113030", "name": "김제시", "sname": "김제" },
            { "code": "113040", "name": "남원시", "sname": "남원" },
            { "code": "113050", "name": "무주군", "sname": "무주" },
            { "code": "113060", "name": "부안군", "sname": "부안" },
            { "code": "113070", "name": "순창군", "sname": "순창" },
            { "code": "113080", "name": "완주군", "sname": "완주" },
            { "code": "113090", "name": "익산시", "sname": "익산" },
            { "code": "113100", "name": "임실군", "sname": "임실" },
            { "code": "113110", "name": "장수군", "sname": "장수" },
            { "code": "113120", "name": "전주시", "sname": "전주" },
            { "code": "113150", "name": "정읍시", "sname": "정읍" },
            { "code": "113160", "name": "진안군", "sname": "진안" }
        ],
        "114": [
            { "code": "114010", "name": "괴산군", "sname": "괴산군" },
            { "code": "114020", "name": "단양군", "sname": "단양군" },
            { "code": "114030", "name": "보은군", "sname": "보은군" },
            { "code": "114040", "name": "영동군", "sname": "영동군" },
            { "code": "114050", "name": "옥천군", "sname": "옥천군" },
            { "code": "114060", "name": "음성군", "sname": "음성군" },
            { "code": "114070", "name": "제천시", "sname": "제천시" },
            { "code": "114080", "name": "증평군", "sname": "증평군" },
            { "code": "114090", "name": "진천군", "sname": "진천군" },
            { "code": "114100", "name": "청원군", "sname": "청원군" },
            { "code": "114110", "name": "청주시", "sname": "청주시" },
            { "code": "114140", "name": "충주시", "sname": "충주시" }
        ],
        "115": [
            { "code": "115010", "name": "계룡시", "sname": "계룡" },
            { "code": "115020", "name": "공주시", "sname": "공주" },
            { "code": "115030", "name": "금산군", "sname": "금산" },
            { "code": "115040", "name": "논산시", "sname": "논산" },
            { "code": "115050", "name": "당진시", "sname": "당진" },
            { "code": "115060", "name": "보령시", "sname": "보령" },
            { "code": "115070", "name": "부여군", "sname": "부여" },
            { "code": "115080", "name": "서산시", "sname": "서산" },
            { "code": "115090", "name": "서천군", "sname": "서천" },
            { "code": "115100", "name": "아산시", "sname": "아산" },
            { "code": "115110", "name": "연기군", "sname": "연기" },
            { "code": "115120", "name": "예산군", "sname": "예산" },
            { "code": "115130", "name": "천안시", "sname": "천안" },
            { "code": "115140", "name": "청양군", "sname": "청양" },
            { "code": "115150", "name": "태안군", "sname": "태안" },
            { "code": "115160", "name": "홍성군", "sname": "홍성" }
        ],
        "116": [
            { "code": "116030", "name": "서귀포시", "sname": "서귀포" },
            { "code": "116040", "name": "제주시", "sname": "제주" }
        ],
        "118": [
            { "code": "118010", "name": "세종시", "sname": "세종" }
        ]
    }
};

module.exports = locations;
