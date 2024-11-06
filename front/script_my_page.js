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
            document.getElementById("userGoal").textContent = `${data.user.goal}권`;
            // document.getElementById("userVoice").textContent = `${data.user.voice}`;

            document.getElementById("profileImageInput").addEventListener("change", function (event) {
                const file = event.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        document.getElementById("profilePreview").src = e.target.result; // 미리 보기 업데이트
                    };
                    reader.readAsDataURL(file);
                }
            });

            // 오디오북 음성 설정 표시
            const voiceSetting = data.user.voice || '남성';
            document.getElementById("userVoice").textContent = `오디오북 음성: ${voiceSetting}`;

            // 수정 모달의 토글 버튼 설정
            if (voiceSetting === '남성') {
                document.getElementById("maleVoice").checked = true;
            } else if (voiceSetting === '여성') {
                document.getElementById("femaleVoice").checked = true;
            }

            // 사용자 뱃지 활성화
            console.log("User Progress for Badges:", data.userProgress); // 데이터 확인
            activateBadges(data.userProgress);

        } else {
            console.error('사용자 정보를 불러오지 못했습니다.');
        }
    } catch (error) {
        console.error('Error fetching user info:', error);
    }
}

// 오디오북 음성 설정 저장하기
async function saveUserSettings() {
    const selectedVoice = document.querySelector('input[name="voice"]:checked').value;
    
    try {
        const response = await fetch('/my_page/update_info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({
                voice: selectedVoice,
            }),
        });

        const data = await response.json();
        if (data.success) {
            alert('회원 정보가 성공적으로 업데이트되었습니다.');
            fetchUserInfo(); // 업데이트된 정보를 다시 가져와 화면에 반영
        } else {
            alert('회원 정보 업데이트에 실패했습니다.');
        }
    } catch (error) {
        console.error('Error updating user info:', error);
    }
}

// 뱃지 활성화 함수
function activateBadges(userProgress = {}) {
    // 각 뱃지 활성화 상태를 콘솔에 출력하여 확인
    if (userProgress.firstAttendance) {
        console.log("Activating Badge 1 (First Attendance)");
        document.getElementById("badge1").classList.add("active");
    }
    if (userProgress.tenDaysAttendance) {
        console.log("Activating Badge 2 (Ten Days Attendance)");
        document.getElementById("badge2").classList.add("active");
    }
    if (userProgress.firstStoryCreated) {
        console.log("Activating Badge 3 (First Story Created)");
        document.getElementById("badge3").classList.add("active");
    }
    if (userProgress.fiftyStoriesCreated) {
        console.log("Activating Badge 4 (Fifty Stories Created)");
        document.getElementById("badge4").classList.add("active");
    }
    if (userProgress.hundredStoriesCreated) {
        console.log("Activating Badge 5 (Hundred Stories Created)");
        document.getElementById("badge5").classList.add("active");
    }
    if (userProgress.oneBookEdited) {
        console.log("Activating Badge 6 (One Book Edited)");
        document.getElementById("badge6").classList.add("active");
    }
    if (userProgress.allGenresCreated) {
        console.log("Activating Badge 7 (All Genres Created)");
        document.getElementById("badge7").classList.add("active");
    }
    if (userProgress.firstLikes) {
        console.log("Activating Badge 8 (First Likes)");
        document.getElementById("badge8").classList.add("active");
    }
    if (userProgress.secondLikes) {
        console.log("Activating Badge 9 (Second Likes)");
        document.getElementById("badge9").classList.add("active");
    }
    if (userProgress.thirdLikes) {
        console.log("Activating Badge 10 (Third Likes)");
        document.getElementById("badge10").classList.add("active");
    }
}

// 이미지 포맷을 JPEG로 변환하는 함수
function convertImageToJpeg(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function(event) {
            const img = new Image();
            img.src = event.target.result;

            img.onload = function() {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                // JPEG 포맷으로 변환
                canvas.toBlob(function(blob) {
                    const jpegFile = new File([blob], file.name.replace(/\..+$/, '.jpg'), { type: 'image/jpeg' });
                    resolve(jpegFile); // 변환된 JPEG 파일 반환
                }, 'image/jpeg', 0.8); // 세 번째 인자는 이미지 품질 (0.0 ~ 1.0)
            };

            img.onerror = function() {
                reject(new Error('이미지를 로드할 수 없습니다.'));
            };
        };

        reader.readAsDataURL(file);
    });
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

    // 프로필 이미지 파일이 있는 경우 JPEG로 변환 후 추가
    if (profileImageInput) {
        try {
            const jpegFile = await convertImageToJpeg(profileImageInput);
            formData.append('profileImage', jpegFile);
        } catch (error) {
            console.error("이미지 변환 오류:", error);
        }
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
