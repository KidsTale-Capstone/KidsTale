// 예시 데이터
const prevButton = document.getElementById('prev-page');
const nextButton = document.getElementById('next-page');
const title = document.getElementById('title');
const booksPerPage = 4;
let currentPage = 1;
let books = []; // 서버에서 받아온 책 데이터를 저장

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

function renderBooks() {
    const bookList = document.getElementById('book-list');
    bookList.innerHTML = '';

    // 책이 없을 경우 안내 문구와 링크 표시
    if (books.length === 0) {
        const noBooksMessage = document.createElement('div');

        title.style.display = 'none';
        prevButton.style.display = 'none';
        nextButton.style.display = 'none';

        noBooksMessage.className = 'no-books-message';
        noBooksMessage.innerHTML = `
            <p>아직 생성된 책이 없습니다.</p>
            <a href="create_book.html" class="create-book-link">책 만들러 가기</a>
        `;
        bookList.appendChild(noBooksMessage);
        return; // 책이 없으므로 함수 종료
    }

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
                <div class="book-keyword">선택한 키워드</div>
            </div>
        `;

        const keywordContainer = document.createElement('div');
        keywordContainer.className = 'keywords';
        keywordContainer.innerHTML = renderKeywords(book.keywords);
        bookItem.querySelector('.book-details').appendChild(keywordContainer);

        // 책 읽기 및 삭제 버튼 추가
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'button-container';

        const readButton = document.createElement('button');
        readButton.className = 'read-button';
        readButton.innerText = '책 읽기';
        readButton.onclick = () => readBook(book);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button';
        deleteButton.innerText = '삭제';
        deleteButton.onclick = () => deleteBook(book);

        buttonContainer.appendChild(readButton);
        buttonContainer.appendChild(deleteButton);
        bookItem.querySelector('.book-details').appendChild(buttonContainer);

        bookList.appendChild(bookItem);
    });

    updatePagination();
}

function renderKeywords(keywords) {
    return keywords.map(keyword => `<span class="keyword-button">${keyword}</span>`).join('');
}

// 책 읽기 기능
function readBook(book) {
    localStorage.setItem('id_book', book.bookId);
    localStorage.setItem('id_owner', book.userId); // 소유자 ID 저장
    window.location.href = 'book_ko.html'; // 책 읽기 페이지로 이동
}

async function deleteBook(book) {
    const token = localStorage.getItem('token'); // JWT 토큰 가져오기
    if (!token) {
        alert('로그인이 필요합니다.');
        return;
    }

    const drawingId = book.drawingId; // book 객체에서 drawingId 가져오기

    if (confirm('이 책을 삭제하시겠습니까?')) {
        try {
            const response = await fetch(`/library/delete_drawing?id_drawing=${drawingId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('삭제에 실패했습니다.');
            }

            alert('책이 삭제되었습니다.'); // 삭제 완료 메시지
            fetchBooks();
        } catch (error) {
            console.error('삭제 중 오류 발생:', error);
            alert('삭제 중 문제가 발생했습니다.');
        }
    }
}

// 다음 페이지로 넘어가는 함수
function loadNextPage() {
    if (currentPage < Math.ceil(books.length / booksPerPage)) {
        currentPage++;
        console.log('currentPage: ', currentPage);
        renderBooks();
    }
}

// 이전 페이지로 돌아가는 함수
function loadPreviousPage() {
    if (currentPage > 1) {
        currentPage--;
        console.log('currentPage: ', currentPage);
        renderBooks();
    }
}

function updatePagination() {
    const paginationContainer = document.querySelector('.pagination');
    const totalPages = Math.ceil(books.length / booksPerPage);

    if (books.length < 5) {
        prevButton.style.display = 'none';
        nextButton.style.display = 'none';
        paginationContainer.style.justifyContent = 'flex-end';
    } else if (currentPage === 1) {
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
