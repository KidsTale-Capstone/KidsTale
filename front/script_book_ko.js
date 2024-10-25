// 현재 페이지 인덱스
let currentPage = 0;
let totalPages = 0;

// 서버에서 책 제목, 내용, 이미지 데이터를 받아오는 함수
async function fetchBookData(bookId, pageIndex, lang) {
    const token = localStorage.getItem('token'); // JWT 토큰을 로컬 스토리지에서 가져옴

    console.log(bookId);
    console.log(pageIndex);
    
    try {
        const response = await fetch(`/book/${lang}?id_book=${bookId}&page_index=${pageIndex}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {

            return data;

        } else {
            throw new Error('책 정보를 불러오는데 실패했습니다.');
        }
    } catch (error) {
        console.error('데이터를 불러오는 중 오류:', error);
        alert('서버 요청 중 오류가 발생했습니다.');
    }
}

// 서버에서 책의 총 페이지 수를 받아오는 함수
async function fetchTotalPages(bookId, lang) {
    const token = localStorage.getItem('token'); // JWT 토큰을 로컬 스토리지에서 가져옴

    try {
        const response = await fetch(`/book/${lang}/total_pages?id_book=${bookId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`Response status: ${response.status}`);  // 응답 상태 코드 확인
        const data = await response.json();
        console.log('Total pages response data:', data);

        if (data.success) {
            return data.totalPages;
        } else {
            throw new Error('총 페이지 수를 불러오는데 실패했습니다.');
        }
    } catch (error) {
        console.error('총 페이지 수를 가져오는 중 오류:', error);
        alert('서버 요청 중 오류가 발생했습니다.');
    }
}

// 페이지 표시 함수
function displayPage(pageIndex) {
    const bookId = localStorage.getItem('id_book');
    const lang = 'ko'; // 한글 버전이므로 'ko' 사용

    if (!bookId) {
        console.error("bookId 값이 없습니다.");
        return;
    }


    fetchBookData(bookId, pageIndex, lang).then(pageData => {
        if (!pageData) return;

        document.getElementById('book-title').innerText = pageData.title;
        document.getElementById('book-author').innerText = `지은이: ${pageData.author}`;
        const coverImage = document.getElementById('book-cover');
        const contentPage = document.getElementById('content-page');
        const pageIndicator = document.getElementById('page');

        const prevButton = document.getElementById('prev-page');
        const nextButton = document.getElementById('next-page');

        const langButton = document.getElementById('change-language');
        const modifyButton = document.getElementById('modify-content');

        if (pageIndex === 0) {
            coverImage.style.display = 'block';
            coverImage.src = pageData.pageImagePath;
            contentPage.innerText = pageData.pageContent;
            pageIndicator.innerText = '';
        } else {
            coverImage.style.display = 'block';
            coverImage.src = pageData.pageImagePath;
            contentPage.innerText = pageData.pageContent;
            pageIndicator.innerText = `${pageIndex} / ${totalPages}`;
        }

        prevButton.style.display = pageIndex === 0 ? 'none' : 'block';
        nextButton.style.display = pageIndex === totalPages ? 'none' : 'block';

        langButton.style.display = currentPage === 0 ? 'block' : 'none';
        modifyButton.style.display = currentPage === 0 ? 'none' : 'block';
    });
}


// 다음 페이지로 이동
function nextPage() {
    if (currentPage <= totalPages) {
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

// 페이지가 로드되면 총 페이지 수를 가져와 첫 페이지를 표시
document.addEventListener('DOMContentLoaded', async function () {
    const bookId = localStorage.getItem('id_book');
    const lang = 'ko'; // 한글 버전이므로 'ko' 사용

    totalPages = await fetchTotalPages(bookId, lang);
    displayPage(0);
});
