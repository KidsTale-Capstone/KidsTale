document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('signup-box');

    if (form) {
        form.addEventListener('submit', async function(event) {
            event.preventDefault();   // 기본 폼 제출 동작 방지

            const name = document.getElementById('name').value;
            const age = document.getElementById('age').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            // 클라이언트 측 유효성 검사
            // 나이 (숫자 확인)
            if (isNaN(age) || age.trim() === "") {
                alert('나이는 숫자로 입력해야 합니다.');
                return;
            }

            // 이메일
            if (!email.includes('@') || !email.includes('.')) {
                alert('유효한 이메일 주소를 입력해주세요.');
                return;
            }

            // 비밀번호 확인
            if (password !== confirmPassword) {
                alert('비밀번호가 일치하지 않습니다.');
                return;
            }

            try {
                // 서버로 회원가입 데이터 전송
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, age, email, password, confirmPassword })
                });

                const result = await response.json();

                if (response.ok) {
                    alert(result.message);
                    window.location.href = 'login.html';  // 성공 시 리다이렉트
                } else {
                    alert(result.message);
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