// 페이지가 로드될 때 호출되는 함수
window.onload = function() {
    // 페이지 진입 시 이전의 drawingId를 초기화
    localStorage.removeItem('drawingId');  // 또는 localStorage.setItem('drawingId', null);
    
    // 이후 필요한 초기화 작업 수행
    console.log('페이지 로드됨, 이전 drawingId 초기화');
}


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

// 이미지 포맷을 JPEG로 변환하는 함수 (먼저 정의)
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

// 확인 버튼: 업로드한 사진을 서버로 전송하여 데이터베이스에 저장
async function confirmUpload() {
    const fileInput = document.getElementById('image-upload');
    const file = fileInput.files[0];

    if (file) {

        // 파일 확장자를 확인 (jpg 또는 jpeg가 아닌 경우에만 변환)
        const fileExtension = file.name.split('.').pop().toLowerCase();

        let fileToUpload = file;

        if (fileExtension !== 'jpg' && fileExtension !== 'jpeg') {
            // 확장자가 jpg나 jpeg가 아니면 변환
            fileToUpload = await convertImageToJpeg(file);
        }

        const formData = new FormData();
        formData.append('image', fileToUpload); // 변환된 파일 또는 원본 파일을 전송

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
                const drawingId = data.drawingId;
                localStorage.setItem('drawingId', drawingId);
                console.log('drawingId:', drawingId);

                alert('이미지가 성공적으로 업로드되었습니다.');
            } else {
                // userID 출력
                alert('이미지 업로드에 실패했습니다.');
                console.error('Error:', data.message);
            }
        } catch (error) {
            console.error('Error:', error.message);
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
// 로딩 화면 표시 후 서버에서 데이터를 받아오고 다음 페이지로 이동
async function showLoading() {
    const loadingScreen = document.getElementById('loading');
    loadingScreen.style.display = 'flex';  // 로딩 화면 표시

    const token = localStorage.getItem('token'); // 로컬 스토리지에서 토큰 가져오기
    const userId = localStorage.getItem('userId');
    const drawingId = localStorage.getItem('drawingId'); // 그림이 업로드되었는지 확인

    console.log('userId_current:', userId); // userId 값 확인
    console.log('drawingId_current:', drawingId); // userId 값 확인

    // 그림이 업로드되지 않았다면 경고 메시지 출력
    if (!drawingId) {
        loadingScreen.style.display = 'none'; // 로딩 화면 숨김
        alert('그림을 먼저 업로드 해주세요.');
        return;
    }

    if (!token) {
        alert('인증 토큰을 찾을 수 없습니다. 다시 로그인해 주세요.');
        return;
    }

    // 1. 업로드된 이미지의 URL 가져오기
    let imageUrl;
    try {
        //
        console.log('이미지 URL 가져오기 요청 중...');

        if (!drawingId || isNaN(drawingId)) {
            alert('그림 ID를 찾을 수 없습니다. 다시 업로드해 주세요.');
            return;
        }
        
        const response = await fetch(`/create_book/get_uploaded_image_url?drawingId=${drawingId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });


        if (!response.ok) {
            const errorText = await response.text();
            console.log('이미지 URL 가져오기 요청 실패:', response.status, errorText);
            throw new Error('이미지 URL을 가져오는 데 실패했습니다.');
        }

        const data = await response.json();
        console.log('서버에서 받은 데이터:', data);
        imageUrl = data.image_url;
        //
        console.log('이미지 URL 응답:', imageUrl);

        if (!imageUrl) {
            throw new Error('이미지 URL이 존재하지 않습니다.');
        }
    } catch (error) {
        console.error('이미지 URL 가져오기 중 오류 발생:', error);
        alert('이미지 URL을 가져오는 중 오류가 발생했습니다.');
        return;
    }

    // 2. YOLOv5 모델 호출
    try {
        const yolov5Response = await fetch('http://localhost:5001/yolov5', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ image_url: imageUrl, id_user: userId })
        });

        if (!yolov5Response.ok) {
            throw new Error('YOLOv5 감지 요청 실패');
        }

        const yolov5Data = await yolov5Response.json();
        
        if (yolov5Data.success) {
            const drawingKwId = yolov5Data.id_drawing_kw;
            localStorage.setItem('drawingKwId', drawingKwId);
            console.log(`drawingKwId 저장됨:`, drawingKwId);

            window.location.href = "select_keywords.html"; // 감지 후 다음 페이지로 이동
        } else {
            alert('객체 감지에 실패했습니다.');
        }
    } catch (error) {
        console.error('YOLOv5 모델 호출 중 오류 발생:', error);
        alert('객체 감지 중 오류가 발생했습니다.');
    }
}