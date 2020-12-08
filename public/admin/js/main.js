
const spanPlaceCnt = document.querySelector('.js-span-place-cnt');
const tbodyPlaceList = document.querySelector('.js-tbody-place-list');


function start(button) {
    let lId = button.parentElement.parentElement.getAttribute('l_id');
    let nId = button.parentElement.parentElement.querySelector('input');
    let cnt = button.parentElement.parentElement.querySelector('td.cnt');

    fetch('/webapi/start/crwaling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            nId: nId.value
        })
    })
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {
        alert(data.status);
        if (data.status == 'OK') {
            nId.value = '';
            nId.focus();


            // 수집한 총 Place 개수 다시 가져오기
            fetch('/webapi/get/place/cnt')
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                spanPlaceCnt.innerText = data.cnt;
            });

            // FIND CNT 올려주기
            fetch('/webapi/set/location', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: lId,
                    cnt: parseInt(cnt.innerText) + 1
                })
            })
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                cnt.innerText = parseInt(cnt.innerText) + 1;
            });
        }
    });
}


function init() {

    fetch('/webapi/get/place/cnt')
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {
        spanPlaceCnt.innerText = data.cnt;
    });

    fetch('/webapi/get/locations')
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {
        let locations = data.locations;

        let html = '';
        for (let i = 0; i < locations.length; i++) {
            let location = locations[i];
            let findCnt = parseInt(location.l_find_cnt);

            html += '<tr l_id="' + location.l_id + '">';
                html += '<td>' + location.l_id + '</td>';
                html += '<td>' + location.l_name + '</td>';
                html += '<td class="cnt">' + location.l_find_cnt + '</td>';
                html += '<td><input type="text" /></td>';
                html += '<td><button onclick="start(this)">START</button></td>';
            html += '</tr>';
        }
        tbodyPlaceList.innerHTML = html;

    });

}
init();
