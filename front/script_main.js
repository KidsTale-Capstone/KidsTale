// 사용자 데이터를 서버에서 가져오기
async function fetchUserData() {
    const token = localStorage.getItem('token'); // 로컬 스토리지에서 JWT 토큰 가져오기

    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.href = 'login.html'; // 로그인이 안되어 있으면 로그인 페이지로 이동
        return;
    }

    try {
        const response = await fetch('/main/userdata', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,  // 토큰을 헤더에 추가하여 서버에 전달
            }
        });

        const result = await response.json();
        
        if (!result.success) {
            alert('사용자 데이터를 불러오지 못했습니다.');
            return;
        }

        // 서버에서 받아온 사용자 데이터를 DOM에 반영
        const { name, goal, current_books } = result.data;
        updateUserData(name, goal, current_books);

    } catch (error) {
        console.error('사용자 데이터 가져오기 중 오류:', error);
        alert('서버와의 통신 중 오류가 발생했습니다.');
    }
}

// 사용자 데이터를 페이지에 반영하는 함수
function updateUserData(userName, userGoal, userCurrent) {
    // 사용자 이름 및 목표 도서 업데이트
    document.getElementById("user-name").innerText = `${userName} 작가님,`;
    // const remainingBooks = userGoal - userCurrent;
    // document.getElementById("remaining-books").innerText = `${userGoal - userCurrent}권`;

    // 목표 달성 여부에 따라 남은 책 수나 축하 메시지를 업데이트
    const remainingBooksElement = document.getElementById("remaining-books");
    if (userCurrent >= userGoal) {
        remainingBooksElement.innerText = "축하합니다! 목표 달성에 성공했어요!";
    } else {
        const remainingBooks = userGoal - userCurrent;
        remainingBooksElement.innerText = `${remainingBooks}권 남았어요!`;
    }


    // 프로그레스 바
    let progressPercentage;
    const progressPercentageElement = document.getElementById("progress-percentage");
    const progressBarElement = document.getElementById("progress-bar");
    if (userCurrent >= userGoal) {
        progressPercentage = 100; // 목표보다 크거나 같으면 100%로 고정
    } else {
        progressPercentage = Math.floor((userCurrent / userGoal) * 100);
    }

    if (progressPercentage === 0 || progressPercentage === 50 || progressPercentage === 100) {
        progressPercentageElement.style.display = "none";  // 숨기기
    } else {
        progressPercentageElement.style.display = "block";  // 표시
        progressPercentageElement.innerText = `${progressPercentage}%`;  // 퍼센트 업데이트
        progressPercentageElement.style.left = `calc(${progressPercentage}% - 10px)`;  // 위치 업데이트
    }

    // // 고양이 이미지 위치 업데이트 (진행도에 맞게, 바 끝에 고정)
    // document.getElementById("cat-img").style.left = `calc(${progressPercentage}% - 25px)`;

    // // Update percentage positions
    // document.getElementById("progress-percentage").style.left = `calc(${progressPercentage}% - 10px)`;

    // 프로그레스 바의 너비 업데이트
    progressBarElement.style.width = `${progressPercentage}%`;  // 바 너비 업데이트
    // 고양이 이미지 위치 업데이트 (진행도에 맞게)
    const catImageElement = document.getElementById("cat-img");
    catImageElement.style.left = `calc(${progressPercentage}% - ${catImageElement.offsetWidth / 2}px)`;

}

// 페이지 로드 시 사용자 데이터 불러오기
window.onload = function() {
    fetchUserData();  // 페이지가 로드되면 사용자 데이터를 가져오는 함수 호출
};
