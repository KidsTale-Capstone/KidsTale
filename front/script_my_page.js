// 프로필 사진 클릭 시 이미지 변경
document.getElementById("profileImage").addEventListener("click", function () {
    const newImage = prompt("새 프로필 사진의 URL을 입력하세요:");
    if (newImage) {
        document.getElementById("profileImage").src = newImage;
    }
});

// 모달 열기
document.getElementById("editButton").addEventListener("click", function () {
    document.getElementById("editModal").style.display = "flex";
});

// 모달 닫기
document.getElementById("closeModal").addEventListener("click", function () {
    document.getElementById("editModal").style.display = "none";
});

// 프로필 이미지 파일 변경 시 미리보기 업데이트
document.getElementById("profileImageInput").addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById("modalProfileImage").src = e.target.result;
            document.getElementById("profileImage").src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// 저장 버튼 클릭 시
document.getElementById("saveChanges").addEventListener("click", function () {
    const newName = document.getElementById("editName").value;
    const newAge = document.getElementById("editAge").value;
    const newTarget = document.getElementById("editTarget").value;

    // 이곳에 DB 업데이트 로직을 추가하세요
    console.log("수정된 정보:", { newName, newAge, newTarget });

    alert("회원 정보가 저장되었습니다.");
    document.getElementById("editModal").style.display = "none";
});

// 탈퇴하기 버튼 클릭 시
document.getElementById("deleteAccount").addEventListener("click", function () {
    const confirmed = confirm("정말 탈퇴하시겠습니까?");
    if (confirmed) {
        // 탈퇴 확인 시 서버에 삭제 요청
        fetch("/delete_account", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ user_id: 1 }), // 현재 사용자 ID를 포함
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("계정이 성공적으로 삭제되었습니다.");
                window.location.href = "/login.html"; // 로그인 페이지로 리다이렉트
            } else {
                alert("계정 삭제에 실패했습니다. 다시 시도해주세요.");
            }
        })
        .catch(error => console.error("Error:", error));
    }
});

// 사용자 활동 데이터 (예시)
const userProgress = {
    firstAttendance: true,       // 첫번째 출석
    tenDaysAttendance: false,    // 10번 연속 출석
    firstStoryCreated: true,     // 첫번째 동화 생성
    fiftyStoriesCreated: false,  // 50번째 동화 생성
    hundredStoriesCreated: false,// 100번째 동화 생성
    oneBookEdited: true,         // 책 한권 수정 완료
    allGenresCreated: false,     // 모든 장르 책 생성
    firstLikes: false,           // 좋아요 1등
    secondLikes: false,          // 좋아요 2등
    thirdLikes: true             // 좋아요 3등
};

// 뱃지 활성화 함수
function activateBadges() {
    if (userProgress.firstAttendance) {
        document.getElementById("badge1").classList.add("active");
    }
    if (userProgress.tenDaysAttendance) {
        document.getElementById("badge2").classList.add("active");
    }
    if (userProgress.firstStoryCreated) {
        document.getElementById("badge3").classList.add("active");
    }
    if (userProgress.fiftyStoriesCreated) {
        document.getElementById("badge4").classList.add("active");
    }
    if (userProgress.hundredStoriesCreated) {
        document.getElementById("badge5").classList.add("active");
    }
    if (userProgress.oneBookEdited) {
        document.getElementById("badge6").classList.add("active");
    }
    if (userProgress.allGenresCreated) {
        document.getElementById("badge7").classList.add("active");
    }
    if (userProgress.firstLikes) {
        document.getElementById("badge8").classList.add("active");
    }
    if (userProgress.secondLikes) {
        document.getElementById("badge9").classList.add("active");
    }
    if (userProgress.thirdLikes) {
        document.getElementById("badge10").classList.add("active");
    }
}

// 페이지 로드 시 뱃지 활성화 함수 호출
window.onload = activateBadges;
