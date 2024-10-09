// 로그인 폼 이벤트 리스너 추가
document.getElementById('login-box').addEventListener('submit', async function(event) {
    event.preventDefault(); // 폼 제출 기본 동작 방지

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // 클라이언트 측 유효성 검사
    if (!email || !password) {
        alert('이메일과 비밀번호를 입력해주세요.');
        return;
    }
    
    try {
        // 서버로 로그인 요청 전송
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        const result = await response.json();

        if (response.ok) {
            window.location.href = 'main.html';
        } else {
            alert(result.message);
        }

    } catch (error) {
        console.error('로그인 중 오류 발생:', error);
        alert('서버와의 연결에 문제가 발생했습니다.');
    }
});