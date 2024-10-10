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

// 확인 버튼: 업로드한 사진을 서버로 전송하여 데이터베이스에 저장
function confirmUpload() {
    const fileInput = document.getElementById('image-upload');
    const file = fileInput.files[0];

    if (file) {
        const formData = new FormData();
        formData.append('image', file);

        // 서버에 이미지 업로드 요청
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('이미지가 성공적으로 업로드되었습니다.');
            } else {
                alert('이미지 업로드에 실패했습니다.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('업로드 중 오류가 발생했습니다.');
        });
    } else {
        alert('파일을 선택하세요.');
    }
}

// 다시 첨부 버튼: 파일 탐색창 열기 및 미리보기 초기화
function reuploadImage() {
    const fileInput = document.getElementById('image-upload');
    const previewBox = document.getElementById('preview-box');
    const uploadLabel = document.getElementById('upload-label');
    
    // 미리보기 초기화
    previewBox.innerHTML = '<p id="preview-text">사진 첨부</p>';
    uploadLabel.style.display = 'block';
    
    // 파일 탐색창 다시 열기
    fileInput.value = '';  // 파일 선택 초기화
    fileInput.click();  // 파일 탐색창 열기
}