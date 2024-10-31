// 예시 데이터
let books = []; // 서버에서 받아온 책 데이터를 저장
const booksPerPage = 4;
let currentPage = 1;

document.addEventListener('DOMContentLoaded', fetchBooks);

async function fetchBooks() {
    try {

        const token = localStorage.getItem('token');
        if (!token) {
            console.error('토큰이 없습니다. 다시 로그인하세요.');
            return; // 토큰이 없으면 더 이상 진행하지 않음
        }

        const response = await fetch('/library/get_book', {
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        });

        if (!response.ok) {
            throw new Error('책 데이터를 불러오는 데 실패했습니다.');
        }

        books = await response.json(); // 책 데이터 저장
        renderBooks(); // 페이지 렌더링
    } catch (error) {
        console.error(error);
        alert('책 데이터를 불러오는 중 문제가 발생했습니다.');
    }
}


// const books = [
//     { title: '책 제목 1', author: '작가 이름 1', genre: '장르 1', keywords: ['키워드1', '키워드2', '키워드3', '키워드4'] },
//     { title: '책 제목 2', author: '작가 이름 2', genre: '장르 2', keywords: ['키워드1', '키워드2', '키워드3', '키워드4','키워드5', '키워드6', '키워드7', '키워드8'] },
//     { title: '책 제목 3', author: '작가 이름 3', genre: '장르 3', keywords: ['키워드1', '키워드2', '키워드3'] },
//     { title: '책 제목 4', author: '작가 이름 4', genre: '장르 4', keywords: ['키워드1', '키워드2', '키워드3', '키워드4', '키워드5'] },
//     { title: '책 제목 5', author: '작가 이름 4', genre: '장르 4', keywords: ['키워드1', '키워드2', '키워드3', '키워드4'] },
//     { title: '책 제목 6', author: '작가 이름 4', genre: '장르 4', keywords: ['키워드1', '키워드2', '키워드3', '키워드4','키워드5', '키워드6'] },
// ];

function renderBooks() {
    const bookList = document.getElementById('book-list');
    bookList.innerHTML = '';

    const startIndex = (currentPage - 1) * booksPerPage;
    const endIndex = startIndex + booksPerPage;
    const pageBooks = books.slice(startIndex, endIndex);

    pageBooks.forEach(book => {
        const bookItem = document.createElement('div');
        bookItem.className = 'book-item';

        bookItem.innerHTML = `
            <div class="book-cover">
                <img src="${book.cover}" alt="책 표지" class="cover-image"/>
            </div>
            <div class="book-details">
                <div class="book-title">${book.title}</div>
                <div class="book-info">지은이: ${book.author}</div>
                <div class="book-info">장르: ${book.genre}</div>
            </div>
        `;

        const keywordContainer = document.createElement('div');
        keywordContainer.className = 'keywords';
        keywordContainer.innerHTML = renderKeywords(book.keywords);
        bookItem.querySelector('.book-details').appendChild(keywordContainer);

        bookList.appendChild(bookItem);
    });

    updatePagination();
}

function renderKeywords(keywords) {
    return keywords.map(keyword => `<span class="keyword-button">${keyword}</span>`).join('');
}

// function renderKeywords(keywords) {
//     const keywordContainer = document.createElement('div');
//     keywordContainer.classList.add('keywords');

//     keywords.forEach((keyword) => {
//         const keywordButton = document.createElement('span');
//         keywordButton.classList.add('keyword-button');
//         keywordButton.innerText = keyword;
//         keywordContainer.appendChild(keywordButton);
//     });

//     return keywordContainer.innerHTML;
// }

// 다음 페이지로 넘어가는 함수
function loadNextPage() {
    if (currentPage < Math.ceil(books.length / booksPerPage)) {
        currentPage++;
        renderBooks();
    }
}

// 이전 페이지로 돌아가는 함수
function loadPreviousPage() {
    if (currentPage > 1) {
        currentPage--;
        renderBooks();
    }
}

function updatePagination() {
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');
    const paginationContainer = document.querySelector('.pagination');
    const totalPages = Math.ceil(books.length / booksPerPage);

    if (currentPage === 1) {
        prevButton.style.display = 'none';
        nextButton.style.display = 'flex';
        paginationContainer.style.justifyContent = 'flex-end';
    } else if (currentPage === totalPages) {
        prevButton.style.display = 'flex';
        nextButton.style.display = 'none';
        paginationContainer.style.justifyContent = 'flex-start';
    } else {
        prevButton.style.display = 'flex';
        nextButton.style.display = 'flex';
        paginationContainer.style.justifyContent = 'space-between';
    }
}

// 초기 데이터 로드
renderBooks();

// "이전" 버튼 이벤트 리스너
document.getElementById('prev-page').addEventListener('click', function (event) {
    event.preventDefault();
    loadPreviousPage();
});

// "다음" 버튼 이벤트 리스너
document.getElementById('next-page').addEventListener('click', function (event) {
    event.preventDefault();
    loadNextPage();
});
