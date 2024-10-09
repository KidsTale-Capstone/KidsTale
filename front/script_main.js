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