// 현재 페이지 인덱스
let currentPage = 0;
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

            // 책 내용을 페이지별로 나눔
            bookData = splitBookContent(bookContent);
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

// 책 내용을 페이지별로 나누는 함수 (기본 페이지 크기는 500글자로 설정)
function splitBookContent(content, pageSize = 500) {
    let pages = [];
    for (let i = 0; i < content.length; i += pageSize) {
        pages.push(content.substring(i, i + pageSize));
    }
    return pages;
}

// 페이지 이동 함수
function displayPage(pageIndex) {
    const contentPage = document.getElementById('content-page');
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');

    // 첫 페이지라면 이전 버튼 숨기기
    prevButton.style.display = pageIndex === 0 ? 'none' : 'block';
    // 마지막 페이지라면 다음 버튼 숨기기
    nextButton.style.display = pageIndex === bookData.length - 1 ? 'none' : 'block';

    // 페이지 내용 업데이트
    document.getElementById('content-text').innerText = bookData[pageIndex];
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
