let currentIndex = 0; // 현재 페이지 인덱스
const itemsPerPage = 3; // 한 페이지에 보여질 책의 개수
const totalItems = document.querySelectorAll('.book-item').length; // 전체 책의 개수
const bookList = document.getElementById('book-list');
const itemWidth = 200; // 책의 너비 (CSS에서 설정한 값)
const marginWidth = 70; // 책과 책 사이의 마진 (각각 좌우 마진 합산 값)
const totalItemWidth = itemWidth + marginWidth; // 책 아이템과 마진을 포함한 총 너비

// 예시로 사용할 책 데이터 (DB에서 받아온다고 가정)
const books = [
    {
        title: "책1",
        author: "지은이1",
        genre: "장르1",
        keywords: ["키워드1", "키워드2", "키워드3"],
        cover: "img/ex_image.jpg"
    },
    {
        title: "책2",
        author: "지은이2",
        genre: "장르2",
        keywords: ["키워드1", "키워드2", "키워드3","키워드4", "키워드5", "키워드6"],
        cover: "img/ex_image.jpg"
    },
        {
        title: "책3",
        author: "지은이1",
        genre: "장르1",
        keywords: ["키워드1", "키워드2", "키워드3"],
        cover: "img/ex_image.jpg"
    },
    {
        title: "책4",
        author: "지은이2",
        genre: "장르2",
        keywords: ["키워드1", "키워드2", "키워드3","키워드4", "키워드5", "키워드6"],
        cover: "img/ex_image.jpg"
    },
        {
        title: "책5",
        author: "지은이1",
        genre: "장르1",
        keywords: ["키워드1", "키워드2", "키워드3"],
        cover: "img/ex_image.jpg"
    },
    {
        title: "책6",
        author: "지은이2",
        genre: "장르2",
        keywords: ["키워드1", "키워드2", "키워드3","키워드4", "키워드5", "키워드6"],
        cover: "img/ex_image.jpg"
    },
    // ... 더 많은 책
];

// 슬라이더에 책 표지만 표시
function loadBooks() {
    const bookList = document.getElementById('book-list');
    bookList.innerHTML = ''; // 기존 리스트 초기화

    books.forEach(book => {
        const bookItem = document.createElement('div');
        bookItem.classList.add('book-item');
        bookItem.innerHTML = `
            <img src="${book.cover}" alt="${book.title} 표지">
        `;
        bookItem.onclick = () => openBookModal(book); // 클릭 시 모달 열기
        bookList.appendChild(bookItem);
    });
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
}


// 페이지 로딩 시 책 데이터 로드
document.addEventListener('DOMContentLoaded', loadBooks);
