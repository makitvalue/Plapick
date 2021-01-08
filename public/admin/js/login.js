
const inputId = document.querySelector('.js-input-id');
const inputPwd = document.querySelector('.js-input-pwd');
const buttonLogin = document.querySelector('.js-button-login');


function login() {

    id = inputId.value.trim();
    pwd = inputPwd.value.trim();

    if (id === '' || pwd === '') {
        alert('아이디 또는 비밀번호를 입력해주세요.');
        return;
    }

    fetch('/webapi/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: id,
            pwd: pwd
        })
    })
    .then(function(data) {
        return data.json();
    })
    .then(function(response) {
        alert(response.status);

        if (response.status == 'OK') {
            location.href = '/admin';
            return;
        }
    });
}


function enterKey() {
    if (window.event.keyCode == 13) {
        adminLogin();
    }
}


function initLogin() {

    buttonLogin.addEventListener('click', login);
    inputId.addEventListener('keyup', enterKey);
    inputPwd.addEventListener('keyup', enterKey);

}
initLogin();
