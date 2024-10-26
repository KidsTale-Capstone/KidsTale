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

// TTS 요청 및 재생 함수
async function playTTS(pageContent, bookId, lang) {
    const token = localStorage.getItem('token');
    const encodedText = encodeURIComponent(pageContent);

    console.log(pageContent);
    console.log("TTS 요청 시 bookId:", bookId, "lang:", lang);

    try {
        console.log(`TTS 요청 시작: ${encodedText}`);
        const response = await fetch(`/book/${lang}/tts?text=${encodedText}&id_book=${bookId}&page_index=${currentPage}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        if (data.success) {
            const audio = new Audio(data.audioPath);
            console.log('TTS 요청 성공: 오디오 재생 시작');
            audio.play();
        } else {
            console.error(`TTS 요청 실패: ${data.message}`);
            alert('TTS 요청 중 실패가 발생했습니다.');
        }
    } catch (error) {
        console.error('TTS 요청 중 오류:', error);
        alert('TTS 요청 중 오류가 발생했습니다.');
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

        const audioButton = document.getElementById('audio-book');
        const playAllButton = document.getElementById('audio-book-all');
        const langButton = document.getElementById('change-language');
        const modifyButton = document.getElementById('modify-content');
        const libraryButton = document.getElementById('go-library');

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

        // TTS 버튼 클릭 시 playTTS 함수에 필요한 정보 전달
        audioButton.onclick = () => {
            console.log("TTS 요청 준비 중...");
            playTTS(pageData.pageContent, bookId, lang);
        };

        prevButton.style.display = pageIndex === 0 ? 'none' : 'block';
        nextButton.style.display = pageIndex === totalPages ? 'none' : 'block';

        playAllButton.style.display =  currentPage === 0 ? 'block' : 'none';
        audioButton.style.display = currentPage === 0 ? 'none' : 'block';
        langButton.style.display = currentPage === 0 ? 'block' : 'none';
        modifyButton.style.display = currentPage === 0 ? 'none' : 'block';
        libraryButton.style.display = (totalPages - currentPage) === 0 ? 'block' : 'none';
    }).catch(error => {
        console.error("페이지 데이터를 불러오는 중 오류 발생:", error);
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

    // bookId가 없을 경우 오류 처리 (기존 코드 개선)
    if (!bookId) {
        console.error("bookId 값이 없습니다. localStorage에서 제대로 가져오지 못했습니다.");
        alert("책 정보를 불러오는 중 문제가 발생했습니다. 다시 시도해 주세요.");
        return;
    }

    console.log("bookId 확인: ", bookId); // bookId 로그 출력

    totalPages = await fetchTotalPages(bookId, lang);
    displayPage(0);
});
