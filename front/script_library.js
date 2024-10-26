let currentIndex = 0; // 현재 페이지 인덱스
const itemsPerPage = 3; // 한 페이지에 보여질 책의 개수
const bookList = document.getElementById('book-list');
const itemWidth = 200; // 책의 너비 (CSS에서 설정한 값)
const marginWidth = 70; // 책과 책 사이의 마진 (각각 좌우 마진 합산 값)
const totalItemWidth = itemWidth + marginWidth; // 책 아이템과 마진을 포함한 총 너비
let totalItems = 0; // 책의 총 개수

// 책 데이터를 서버에서 불러와 슬라이더에 책 표지를 표시
async function loadBooks() {
    try {

        const token = localStorage.getItem('token'); // 로컬 스토리지에서 JWT 토큰을 가져오기

        if (!token) {
            console.error('토큰이 없습니다. 다시 로그인하세요.');
            return; // 토큰이 없으면 더 이상 진행하지 않음
        }

        const response = await fetch(`/library/get_book`, {
            headers: {
                'Authorization': `Bearer ${token}`, // Authorization 헤더에 JWT 토큰 추가
            }
        });
        const data = await response.json();

        if (data.message) {
            document.getElementById('book-list').innerHTML = `<p>${data.message}</p>`;
            return;
        }

        totalItems = data.length; // totalItems 업데이트

        bookList.innerHTML = ''; // 기존 리스트 초기화

        data.forEach(book => {
            const bookItem = document.createElement('div');
            bookItem.classList.add('book-item');

            bookItem.innerHTML = `
                <img src="${book.cover}" alt="${book.title} 표지">
            `;

            bookItem.onclick = () => openBookModal(book); // 클릭 시 모달 열기

            // bookItem에 id_book 추가 
            bookItem.setAttribute('data-id', book.bookId);

            bookList.appendChild(bookItem);
        });
    } catch (error) {
        console.error('책 데이터를 불러오는 중 오류 발생:', error);
    }
}


// 오른쪽 화살표 클릭 시
function moveRight() {
    if (currentIndex < Math.ceil(totalItems / itemsPerPage) - 1) { // 끝 페이지까지 이동할 수 있도록 조건 수정
        currentIndex++;
        updateSliderPosition();
    }
}

// 왼쪽 화살표 클릭 시
function moveLeft() {
    if (currentIndex > 0) {
        currentIndex--;
        updateSliderPosition();
    }
}

// 슬라이더 위치 업데이트
function updateSliderPosition() {
    const offset = -(currentIndex * itemsPerPage * totalItemWidth); // 3권씩 이동
    bookList.style.transform = `translateX(${offset}px)`;
}


// 모달 열기 함수
function openModal() {
    document.getElementById("bookModal").style.display = "flex";
}

// 모달 닫기 함수
function closeModal() {
    document.getElementById("bookModal").style.display = "none";
}


// 모달에 책 세부 정보 표시
function openBookModal(book) {
    document.getElementById('bookModal').style.display = 'flex';
    document.querySelector('.book-cover img').src = book.cover;
    document.querySelector('.book-details h2').textContent = book.title;
    document.querySelector('.book-details p:nth-of-type(1)').textContent = `지은이: ${book.author}`;
    document.querySelector('.book-details p:nth-of-type(2)').textContent = `장르: ${book.genre}`;
    
    // 키워드 처리: 3개 이상이면 줄바꿈
    const keywordDiv = document.getElementById('keywords');
    keywordDiv.innerHTML = ''; // 기존 내용을 초기화

    book.keywords.forEach((keyword, index) => {
        if (index > 0 && index % 3 === 0) {
            keywordDiv.innerHTML += '<br>'; // 3개마다 줄바꿈 추가
        }
        keywordDiv.innerHTML += keyword;
        if (index < book.keywords.length - 1) {
            keywordDiv.innerHTML += ', '; // 키워드 사이에 쉼표 추가
        }
    });

    // 책 읽기 버튼에 id_book 값 저장 후 이동 (script_library.js 부분)
    const readButton = document.getElementById('reading-book');
    readButton.setAttribute('data-book-id', book.id_book); // book의 id_book 설정
    readButton.onclick = function () {
        // bookId를 로컬 스토리지에 저장 (기존 코드)
        localStorage.setItem('id_book', book.bookId); 
        
        // book_ko.html로 이동 (여기서도 'bookId'를 로그로 출력하여 제대로 저장되었는지 확인)
        console.log("bookId 저장 확인: ", book.bookId);
        window.location.href = 'book_ko.html'; // 페이지 이동
    };  
}


// 페이지 로딩 시 책 데이터 로드
document.addEventListener('DOMContentLoaded', loadBooks);
