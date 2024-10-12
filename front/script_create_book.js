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

// 확인 버튼: 업로드한 사진을 서버로 전송하여 데이터베이스에 저장
async function confirmUpload() {
    const fileInput = document.getElementById('image-upload');
    const file = fileInput.files[0];

    if (file) {
        const formData = new FormData();
        formData.append('image', file);

        // 로컬 스토리지에서 토큰을 제대로 가져오는지 확인
        const token = localStorage.getItem('token');
        if (!token) {
            alert('인증 토큰을 찾을 수 없습니다. 다시 로그인해 주세요.');
            return;
        }

        try {
            // 서버에 이미지 업로드 요청
            const response = await fetch('/create_book/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,  // 토큰을 헤더에 추가
                },
                body: formData
            });
            const data = await response.json();

            if (data.success) {
                alert('이미지가 성공적으로 업로드되었습니다.');
            } else {
                // userID 출력
                alert('이미지 업로드에 실패했습니다.');
                console.error('Error:', data.message);
            }
        } catch (error) {
            console.error('Error:', data.message);
            alert('업로드 중 오류가 발생했습니다.');
        }
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

// 다음 버튼 누르면 YOLOv5 감지 작업을 수행
async function goToNextPage() {
    const token = localStorage.getItem('token'); // 로컬 스토리지에서 토큰 가져오기
    if (!token) {
        alert('인증 토큰을 찾을 수 없습니다. 다시 로그인해 주세요.');
        return;
    }

    // 1. 업로드된 이미지의 URL 가져오기
    let imageUrl;
    try {
        //
        console.log('이미지 URL 가져오기 요청 중...');
        const response = await fetch('http://localhost:5000/get_uploaded_image_url?id_user=${userId}', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        imageUrl = data.image_url;
        //
        console.log('이미지 URL 응답:', imageUrl);

        if (!imageUrl) {
            console.error('이미지 URL 가져오기 중 오류 발생:', error);
            alert('이미지 URL을 가져오는 중 오류가 발생했습니다. 1');
            return;
        }
    } catch (error) {
        console.error('이미지 URL 가져오기 중 오류 발생:', error);
        alert('이미지 URL을 가져오는 중 오류가 발생했습니다. 2');
        return;
    }

    // 2. YOLOv5 모델 호출
    try {
        const yolov5Response = await fetch('http://localhost:5000/yolov5', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ image_url: imageUrl })
        });

        const yolov5Data = await yolov5Response.json();
        
        if (yolov5Data.detected_objects) {
            alert(`감지된 객체: ${yolov5Data.detected_objects.join(', ')}`);
            window.location.href = "select_keywords.html"; // 감지 후 다음 페이지로 이동
        } else {
            alert('객체 감지에 실패했습니다.');
        }
    } catch (error) {
        console.error('YOLOv5 모델 호출 중 오류 발생:', error);
        alert('객체 감지 중 오류가 발생했습니다.');
    }
}