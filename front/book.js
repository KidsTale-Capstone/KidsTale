// 현재 페이지 인덱스
let currentPage = 0;
let bookData = [];

// 서버에서 책 제목과 저자 데이터를 받아오는 함수
function fetchBookInfo() {
    return new Promise((resolve, reject) => {
        // 서버에 책 정보 요청 (예시로 /get-book-info 엔드포인트로 요청)
        fetch('/get-book-info')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    resolve(data);  // 서버에서 책 제목과 저자 데이터를 받아옴
                } else {
                    reject('책 정보를 받아오는데 실패했습니다.');
                }
            })
            .catch(error => {
                reject('서버 요청 중 오류가 발생했습니다.');
            });
    });
}

// 책 제목과 저자 정보를 화면에 표시하는 함수
function displayBookInfo(bookInfo) {
    document.getElementById('book-title').innerText = bookInfo.title;
    document.getElementById('book-author').innerText = `지은이: ${bookInfo.author}`;
}

// 책 표지 및 내용 표시 함수
function displayPage(index) {
    const coverPage = document.getElementById('cover-page');
    const contentPage = document.getElementById('content-page');
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');

    if (index === 0) {
        // 표지 페이지 표시
        coverPage.style.display = 'block';
        contentPage.style.display = 'none';
        prevButton.style.display = 'none';  // 첫 페이지에서는 이전 버튼 숨김
    } else {
        // 내용 페이지 표시
        coverPage.style.display = 'none';
        contentPage.style.display = 'block';

        // 페이지 데이터 가져오기
        const pageData = bookData[index - 1];
        document.getElementById('content-image').src = pageData.image;
        document.getElementById('content-text').innerText = pageData.text;

        prevButton.style.display = 'block';  // 이전 버튼 표시
        nextButton.style.display = index === bookData.length ? 'none' : 'block';  // 마지막 페이지에서는 다음 버튼 숨김
    }
}

// 다음 페이지로 이동
function nextPage() {
    if (currentPage < bookData.length) {
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
document.addEventListener('DOMContentLoaded', function() {
    fetchBookData()
        .then(() => {
            displayPage(0);  // 첫 페이지 (표지) 표시
        })
        .catch(error => {
            alert(error);  // 오류 발생 시 알림 표시
        });
});

// 언어 변경 버튼 클릭 이벤트
document.getElementById('change-language').addEventListener('click', function() {
    alert("언어를 영어로 변경합니다.");
    // 언어 변경 로직을 여기에 추가하세요.
});
