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

// 선택/해제 함수
function toggleKeyword(button) {
    // 버튼이 선택된 상태인지 확인
    if (button.classList.contains('selected')) {
        // 선택 해제: 선택된 상태를 해제하고 원래 색상으로 복구
        button.classList.remove('selected');
    } else {
        // 선택: 선택된 상태로 변경하고 보라색으로 변경
        button.classList.add('selected');
    }
}