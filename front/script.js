// 회원가입 폼 이벤트 리스너 추가
// document.addEventListener('DOMContentLoaded', function() {
//     const form = document.getElementById('signup-box');

//     if (form) {
//         form.addEventListener('submit', async function(event) {
//             event.preventDefault();   // 기본 폼 제출 동작 방지

//             const name = document.getElementById('name').value;
//             const age = document.getElementById('age').value;
//             const email = document.getElementById('email').value;
//             const password = document.getElementById('password').value;
//             const confirmPassword = document.getElementById('confirm-password').value;

//             // 클라이언트 측 유효성 검사
//             // 나이 (숫자 확인)
//             if (isNaN(age) || age.trim() === "") {
//                 alert('나이는 숫자로 입력해야 합니다.');
//                 return;
//             }

//             // 이메일
//             if (!email.includes('@') || !email.includes('.')) {
//                 alert('유효한 이메일 주소를 입력해주세요.');
//                 return;
//             }

//             // 비밀번호 확인
//             if (password !== confirmPassword) {
//                 alert('비밀번호가 일치하지 않습니다.');
//                 return;
//             }

<<<<<<< HEAD
//             try {
//                 // 서버로 회원가입 데이터 전송
//                 const response = await fetch('/register', {
//                     method: 'POST',
//                     headers: { 'Content-Type': 'application/json' },
//                     body: JSON.stringify({ name, age, email, password, confirmPassword })
//                 });

//                 const result = await response.json();

//                 if (response.ok) {
//                     alert(result.message);
//                     window.location.href = 'login.html';  // 성공 시 리다이렉트
//                 } else {
//                     alert(result.message);
//                 }
//             } catch (error) {
//                 console.error('Error during signup:', error);
//                 alert('서버와의 연결에 문제가 발생했습니다.');
//             }
//         });
//     } else {
//         console.error('signup-box 요소를 찾을 수 없습니다.');
//     }
// });

// // 로그인 폼 이벤트 리스너 추가
// document.getElementById('login-box').addEventListener('submit', function(event) {
//     event.preventDefault(); // 폼 제출 기본 동작 방지

//     const email = document.getElementById('email').value;
//     const password = document.getElementById('password').value;

//     // 클라이언트 측 유효성 검사
//     if (!email || !password) {
//         alert('이메일과 비밀번호를 입력해주세요.');
//         return;
//     }
    
//     try {
//         // 서버로 로그인 요청 전송
//         const response = await fetch('/login', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({ email, password })
//         });

//         const result = await response.json();

//         if (response.ok) {
//             alert(result.message || '로그인 성공');
//             window.location.href = '/main.html';  // 로그인 성공 시 메인 페이지로 리다이렉트
//         } else {
//             alert(result.message || '로그인에 실패했습니다.');
//         }

//     } catch (error) {
//         console.error('로그인 중 오류 발생:', error);
//         alert('서버와의 연결에 문제가 발생했습니다.');
//     }
// });
=======
                if (response.ok) {
                    alert(result.message || '회원가입이 완료되었습니다.');
                    window.location.href = 'login.html';  // 성공 시 리다이렉트
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
>>>>>>> a6191f0117c47c0a09944d50f71e18d523f5d9fb


// // 사용자 이름 및 데이터베이스로부터 불러올 값들
// const userName = "홍길동"; // 예시로 '홍길동' 사용
// const userGoal = 10; // 예: 사.용자 목표 (10권)
// const userCurrent = 4; // 예: 현재 읽은 수 (4권)

// // 사용자 이름 및 목표 도서 업데이트
// document.getElementById("user-name").innerText = `${userName} 작가님,`;
// document.getElementById("remaining-books").innerText = `${userGoal - userCurrent}권`;

// // 프로그레스 바 업데이트
// const progressPercentage = Math.floor((userCurrent / userGoal) * 100);
// document.getElementById("progress-bar").style.width = `${progressPercentage}%`;
// document.getElementById("progress-percentage").innerText = `${progressPercentage}%`;

<<<<<<< HEAD
// // 고양이 이미지 위치 업데이트 (진행도에 맞게, 바 끝에 고정)
// document.getElementById("cat-img").style.left = `calc(${progressPercentage}% - 25px)`;
=======
// 사용자 이름 및 목표 도서 업데이트
document.getElementById("user-name").innerText = `${userName} 작가님,`;
document.getElementById("remaining-books").innerText = `${userGoal - userCurrent}권`;

// 프로그레스 바 업데이트
const progressPercentage = Math.floor((userCurrent / userGoal) * 100);
document.getElementById("progress-bar").style.width = `${progressPercentage}%`;
document.getElementById("progress-percentage").innerText = `${progressPercentage}%`;

// 고양이 이미지 위치 업데이트 (진행도에 맞게, 바 끝에 고정)
document.getElementById("cat-img").style.left = `calc(${progressPercentage}% - 25px)`;



// 1. 그림 업로드 페이지
// 사용자가 파일을 선택했을 때 이미지 미리보기
function previewImage(event) {
    const input = event.target;
    const uploadLabel = document.getElementById('upload-label'); // 업로드 문구 가져오기
    const previewBox = document.getElementById('preview-box');
    const uploadBox = document.querySelector('.upload-box'); // 업로드 박스 가져오기

    if (input.files && input.files[0]) {
        const reader = new FileReader();

        reader.onload = function(e) {
            // "그림을 업로드 해주세요" 문구 숨기기
            uploadLabel.style.display = 'none';
            
            // 배경색을 하얀색으로 변경
            uploadBox.style.backgroundColor = 'white';
            
            // 이미지를 보여줌
            const img = document.createElement('img');
            img.src = e.target.result;
            previewBox.innerHTML = ''; // 기존 내용 제거
            previewBox.appendChild(img); // 이미지 추가
        }

        reader.readAsDataURL(input.files[0]);
    }
}

// 다음 버튼 누르면 다음 페이지로 이동하는 함수
function goToNextPage() {
    window.location.href = "select_keywords.html"; // 이동할 페이지 경로
}
>>>>>>> a6191f0117c47c0a09944d50f71e18d523f5d9fb
