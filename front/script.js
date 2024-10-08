// 로그인 폼 이벤트 리스너 추가
document.getElementById('login-box').addEventListener('submit', function(event) {
    event.preventDefault(); // 폼 제출 기본 동작 방지
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // 여기에 실제 로그인 로직을 추가하세요 (예: 서버로 요청 전송)
    alert(`로그인 시도 - 이메일: ${email}, 비밀번호: ${password}`);
});

// 회원가입 폼 이벤트 리스너 추가
document.addEventListener('DOMContentLoaded', function() {
    console.log("script.js 로드됨");

    const form = document.getElementById('signup-box');
    console.log(form);  // signup-form 요소가 잘 불러와지는지 확인하는 로그

    if (form) {
        form.addEventListener('submit', async function(event) {
            event.preventDefault();

            const name = document.getElementById('name').value;
            const age = document.getElementById('age').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            try {
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name, age, email, password, confirmPassword }),
                });

                const result = await response.json();

                if (response.ok) {
                    alert(result.message || '회원가입이 완료되었습니다.');
                    window.location.href = '/login.html';  // 성공 시 리다이렉트
                } else {
                    alert(result.message || '회원가입에 실패했습니다.');
                }
            } catch (error) {
                console.error('Error during signup:', error);
                alert('서버와의 연결에 문제가 발생했습니다.');
            }
        });
    } else {
        console.error('signup-box 요소를 찾을 수 없습니다.');
    }
});




// 사용자 이름 및 데이터베이스로부터 불러올 값들
const userName = "홍길동"; // 예시로 '홍길동' 사용
const userGoal = 10; // 예: 사.용자 목표 (10권)
const userCurrent = 4; // 예: 현재 읽은 수 (4권)

// 사용자 이름 및 목표 도서 업데이트
document.getElementById("user-name").innerText = `${userName} 작가님,`;
document.getElementById("remaining-books").innerText = `${userGoal - userCurrent}권`;

// 프로그레스 바 업데이트
const progressPercentage = Math.floor((userCurrent / userGoal) * 100);
document.getElementById("progress-bar").style.width = `${progressPercentage}%`;
document.getElementById("progress-percentage").innerText = `${progressPercentage}%`;

// 고양이 이미지 위치 업데이트 (진행도에 맞게, 바 끝에 고정)
document.getElementById("cat-img").style.left = `calc(${progressPercentage}% - 25px)`;
