// 현재 페이지 인덱스
let currentPage = 0;
let lastPageIndex = 0;
let bookData = [];
let bookContent = '';

// 서버에서 책 제목, 내용, 이미지 데이터를 받아오는 함수
async function fetchBookData() {
    const lang = 'ko'; // 한글 버전이므로 'ko' 사용
    const token = localStorage.getItem('token'); // JWT 토큰을 로컬 스토리지에서 가져옴
    const bookId = localStorage.getItem('id_book');
    const drawingId = localStorage.getItem('drawingId')
    
    try {
        // 책 정보를 서버로부터 요청 (user_id와 lang을 사용)
        const response = await fetch(`/book/${lang}?id_book=${bookId}&drawing_id=${drawingId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`, // Authorization 헤더에 JWT 토큰 추가
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            // 책 제목 및 표지 이미지 업데이트
            document.getElementById('book-title').innerText = data.title;
            document.getElementById('book-author').innerText = `지은이: ${data.author}`;
            document.getElementById('book-cover').src = data.imagePath;

            // 텍스트 파일 경로로 책 내용 가져오기
            bookContent = await fetchTextFile(data.txtPath);
            console.log(bookContent);

            // 책 내용을 페이지별로 나눔
            bookData = splitBookContent(bookContent);
            lastPageIndex = bookData.length - 1; // 문단 개수로 lastPageIndex 설정
        } else {
            throw new Error('책 정보를 불러오는데 실패했습니다.');
        }
    } catch (error) {
        console.error('데이터를 불러오는 중 오류:', error);
        alert('서버 요청 중 오류가 발생했습니다.');
    }
}

// 텍스트 파일을 읽어서 내용을 반환하는 함수
async function fetchTextFile(txtPath) {
    try {
        const response = await fetch(txtPath);
        return await response.text();
    } catch (error) {
        console.error('텍스트 파일을 불러오는 중 오류:', error);
        return '';
    }
}

function splitBookContent(content) {
    // 문단 단위로 텍스트를 나누기 (줄바꿈을 기준으로 분할)
    let paragraphs = content.split(/\r?\n+/); // \n 또는 \r\n 으로 구분
    return paragraphs;
}

function displayPage(pageIndex) {
    const contentPage = document.getElementById('content-page');
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');

    // 이전 페이지와 다음 페이지 버튼 표시 여부 결정
    prevButton.style.display = pageIndex === 0 ? 'none' : 'block';
    nextButton.style.display = pageIndex === bookData.length - 1 ? 'none' : 'block';

    // 페이지 내용 업데이트 (각 문단을 표시)
    document.getElementById('content-text').innerText = bookData[pageIndex];

    // 페이지 컨테이너 표시
    contentPage.style.display = 'block';
}

// 다음 페이지로 이동
function nextPage() {
    if (currentPage < bookData.length - 1) {
        currentPage++;
        displayPage(currentPage);
    }
}

// 이전 페이지로 이동
function prevPage() {
    if (currentPage > 0) {
        currentPage--;
        displayPage(currentPage);
    }
}

// 페이지 초기화 및 데이터 로딩
document.addEventListener('DOMContentLoaded', async function() {
    await fetchBookData();
    displayPage(0); // 첫 페이지 (표지) 표시
});


// *** 새로 추가한 기능 ***

// 첫 페이지 로드
function loadFirstPage() {
    document.getElementById('first-page-section').style.display = 'block'; // 첫 페이지 내용 표시
}

// 첫 번째 페이지 이후부터 페이지 로드
function loadNextPage() {
    currentPage++; // 페이지 증가

    if (currentPage > 0) {
        // 첫 번째 페이지 내용 숨기기
        document.getElementById('first-page-section').style.display = 'none'; // 첫 페이지 숨기기
        document.getElementById('upload-section').style.display = 'block'; // 사진 업로드 섹션 표시

        if (currentPage <= lastPageIndex) {
            // 문단별 데이터를 표시
            const pageText = bookData[currentPage];
            document.getElementById('page-text').innerText = pageText; // 페이지 텍스트 표시
        }
    }

    if (currentPage === lastPageIndex) {
        document.getElementById('complete-button-container').style.display = 'block'; // 마지막 페이지일 경우 완성하기 버튼 표시
    } else {
        document.getElementById('complete-button-container').style.display = 'none'; // 마지막 페이지가 아니면 완성하기 버튼 숨김
    }
}

// 페이지 이미지 미리보기 기능
function previewPageImage(event) {
    const input = event.target;
    const previewBox = document.getElementById('preview-box');
    const uploadLabel = document.getElementById('upload-label');

    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            uploadLabel.style.display = 'none';
            previewBox.innerHTML = `<img src="${e.target.result}" alt="Page Image">`;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// 다시 첨부하기 기능
function reuploadPageImage() {
    const fileInput = document.getElementById('page-image-upload');
    const previewBox = document.getElementById('preview-box');
    const uploadLabel = document.getElementById('upload-label');

    previewBox.innerHTML = '<p id="preview-text">사진 첨부</p>';
    uploadLabel.style.display = 'block';
    fileInput.value = ''; // 파일 선택 초기화
    fileInput.click(); // 파일 탐색 창 열기
}

// 페이지 저장 및 다음 페이지로 이동하는 기능
async function saveAndNextPage() {
    const token = localStorage.getItem('token'); // 사용자 인증을 위한 JWT 토큰
    const bookId = localStorage.getItem('id_book');
    const currentPageIndex = currentPage; // 현재 페이지 인덱스
    const fileInput = document.getElementById('page-image-upload');
    const formData = new FormData();

    if (fileInput.files[0]) {
        formData.append('image', fileInput.files[0]); // 업로드된 사진 추가
    }
    formData.append('pageText', bookData[currentPageIndex]); // 페이지 텍스트 추가
    formData.append('pageIndex', currentPageIndex); // 현재 페이지 인덱스
    formData.append('bookId', bookId); // 책 ID 추가

    try {
        const response = await fetch('/save-page', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`, // JWT 토큰 추가
            },
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            alert('페이지가 성공적으로 저장되었습니다.');
            loadNextPage(); // 다음 페이지 로드
        } else {
            alert('페이지 저장에 실패했습니다.');
        }
    } catch (error) {
        console.error('페이지 저장 중 오류:', error);
        alert('페이지 저장 중 오류가 발생했습니다.');
    }
}


// 마지막 페이지에서 책을 완성하는 기능
async function completeBook() {
    const token = localStorage.getItem('token');
    const bookId = localStorage.getItem('id_book');

    try {
        const response = await fetch('/complete-book', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ bookId: bookId })
        });

        const data = await response.json();

        if (data.success) {
            alert('책이 성공적으로 저장되었습니다.');
            window.location.href = '/my-library'; // 책 보관함으로 이동
        } else {
            alert('책 저장에 실패했습니다.');
        }
    } catch (error) {
        console.error('책 완성 중 오류:', error);
        alert('책 완성 중 오류가 발생했습니다.');
    }
}

// 첫 페이지 로드 호출
loadFirstPage();