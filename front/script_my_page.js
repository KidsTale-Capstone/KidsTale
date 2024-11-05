// 사용자 정보 가져오기
async function fetchUserInfo() {
    try {
        const response = await fetch('/my_page/get_info', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`, // 토큰을 헤더에 추가
            },
        });

        const data = await response.json();
        console.log("Fetched User Info:", data);

        if (data.success) {
            // 사용자 정보 표시
            document.getElementById("profileImage").src = data.user.profileImage || '/img/default_profile.png';
            document.getElementById("userEmail").textContent = data.user.email;
            document.getElementById("userName").textContent = data.user.name;
            document.getElementById("userAge").textContent = `${data.user.age}살`;
            document.getElementById("userGoal").textContent = `${data.user.goal} 권`;

            // 사용자 뱃지 활성화
            activateBadges(data.userProgress);

        } else {
            console.error('사용자 정보를 불러오지 못했습니다.');
        }
    } catch (error) {
        console.error('Error fetching user info:', error);
    }
}

// 뱃지 활성화 함수
function activateBadges(userProgress = {}) {
    if (userProgress.firstAttendance && document.getElementById("badge1")) {
        document.getElementById("badge1").classList.add("active");
    }
    if (userProgress.tenDaysAttendance && document.getElementById("badge2")) {
        document.getElementById("badge2").classList.add("active");
    }
    if (userProgress.firstStoryCreated && document.getElementById("badge3")) {
        document.getElementById("badge3").classList.add("active");
    }
    if (userProgress.fiftyStoriesCreated && document.getElementById("badge4")) {
        document.getElementById("badge4").classList.add("active");
    }
    if (userProgress.hundredStoriesCreated && document.getElementById("badge5")) {
        document.getElementById("badge5").classList.add("active");
    }
    if (userProgress.oneBookEdited && document.getElementById("badge6")) {
        document.getElementById("badge6").classList.add("active");
    }
    if (userProgress.allGenresCreated && document.getElementById("badge7")) {
        document.getElementById("badge7").classList.add("active");
    }
    if (userProgress.firstLikes && document.getElementById("badge8")) {
        document.getElementById("badge8").classList.add("active");
    }
    if (userProgress.secondLikes && document.getElementById("badge9")) {
        document.getElementById("badge9").classList.add("active");
    }
    if (userProgress.thirdLikes && document.getElementById("badge10")) {
        document.getElementById("badge10").classList.add("active");
    }
}

// 페이지 로드 시
window.onload = fetchUserInfo;

// // 프로필 사진 클릭 시 이미지 변경
// document.getElementById("profileImage").addEventListener("click", function () {
//     const newImage = prompt("새 프로필 사진의 URL을 입력하세요:");
//     if (newImage) {
//         document.getElementById("profileImage").src = newImage;
//     }
// });

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
document.getElementById("saveChanges").addEventListener("click", async function () {
    const newName = document.getElementById("editName").value;
    const newAge = document.getElementById("editAge").value;
    const newTarget = document.getElementById("editTarget").value;
    const profileImageInput = document.getElementById("profileImageInput").files[0];

    console.log("수정된 정보:", { newName, newAge, newTarget });

    const formData = new FormData();
    formData.append('name', newName);
    formData.append('age', newAge);
    formData.append('goal', newTarget);

    // 프로필 이미지 파일이 있는 경우 추가
    if (profileImageInput) {
        formData.append('profileImage', profileImageInput);
    }

    try {
        const response = await fetch('/my_page/update_user', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            alert("회원 정보가 저장되었습니다.");
            document.getElementById("editModal").style.display = "none";

            fetchUserInfo();
        } else {
            alert("회원 정보 저장에 실패했습니다.");
        }
    } catch (error) {
        console.error("Error updating user info:", error);
    }
});

// 탈퇴하기 버튼 클릭 시
document.getElementById("deleteAccount").addEventListener("click", async function () {
    const confirmed = confirm("정말 탈퇴하시겠습니까?");
    if (confirmed) {
        try {
            const response = await fetch("/my_page/delete_user", {
                method: "DELETE",
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();
            if (data.success) {
                alert("계정이 성공적으로 삭제되었습니다.");
                window.location.href = "/login.html";
            } else {
                alert("계정 삭제에 실패했습니다. 다시 시도해주세요.");
            }
        } catch (error) {
            console.error("Error:", error);
        }
    }
});
