// 사용자 데이터를 서버에서 가져오기
async function fetchUserData() {
    const token = localStorage.getItem('token'); // 로컬 스토리지에서 JWT 토큰 가져오기

    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.href = 'login.html'; // 로그인이 안되어 있으면 로그인 페이지로 이동
        return;
    }

    try {
        const response = await fetch('/main/userdata', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,  // 토큰을 헤더에 추가하여 서버에 전달
            }
        });

        const result = await response.json();
        
        if (!result.success) {
            alert('사용자 데이터를 불러오지 못했습니다.');
            return;
        }

        // 서버에서 받아온 사용자 데이터를 DOM에 반영
        const { name, goal, current_books } = result.data;
        updateUserData(name, goal, current_books);

    } catch (error) {
        console.error('사용자 데이터 가져오기 중 오류:', error);
        alert('서버와의 통신 중 오류가 발생했습니다.');
    }
}

// 사용자 데이터를 페이지에 반영하는 함수
function updateUserData(userName, userGoal, userCurrent) {
    // 사용자 이름 및 목표 도서 업데이트
    document.getElementById("user-name").innerText = `${userName} 작가님,`;
    // const remainingBooks = userGoal - userCurrent;
    // document.getElementById("remaining-books").innerText = `${userGoal - userCurrent}권`;

    // 목표 달성 여부에 따라 남은 책 수나 축하 메시지를 업데이트
    const remainingBooksElement = document.getElementById("remaining-books");
    if (userCurrent >= userGoal) {
        remainingBooksElement.innerText = "축하합니다! 목표 달성에 성공했어요!";
    } else {
        const remainingBooks = userGoal - userCurrent;
        remainingBooksElement.innerText = `${remainingBooks}권 남았어요!`;
    }


    // 프로그레스 바
    let progressPercentage;
    const progressPercentageElement = document.getElementById("progress-percentage");
    const progressBarElement = document.getElementById("progress-bar");
    if (userCurrent >= userGoal) {
        progressPercentage = 100; // 목표보다 크거나 같으면 100%로 고정
    } else {
        progressPercentage = Math.floor((userCurrent / userGoal) * 100);
    }

    if (progressPercentage === 0 || progressPercentage === 100) {
        progressPercentageElement.style.display = "none";  // 숨기기
    } else {
        progressPercentageElement.style.display = "block";  // 표시
        progressPercentageElement.innerText = `${progressPercentage}%`;  // 퍼센트 업데이트
        progressPercentageElement.style.left = `calc(${progressPercentage}% - 10px)`;  // 위치 업데이트
    }

    // 프로그레스 바의 너비 업데이트
    progressBarElement.style.width = `${progressPercentage}%`;  // 바 너비 업데이트
    // 고양이 이미지 위치 업데이트 (진행도에 맞게)
    const catImageElement = document.getElementById("cat-img");
    catImageElement.style.left = `calc(${progressPercentage}% - ${catImageElement.offsetWidth / 2}px)`;

}

// 페이지 로드 시 사용자 데이터 불러오기
window.onload = function() {
    fetchUserData();  // 페이지가 로드되면 사용자 데이터를 가져오는 함수 호출
};

// =============================================== 명예의 책 전당 섹션 =================================================

const bookList = document.getElementById('carousel');
const itemsPerPage = 2; // 한 번에 보여줄 아이템 수
let totalItems = 0;
let currentIndex = 0;

// 책 데이터를 서버에서 불러와 슬라이더에 책 표지를 표시
async function loadBooks() {
    try {
        const token = localStorage.getItem('token');

        if (!token) {
            console.error('토큰이 없습니다. 다시 로그인하세요.');
            return;
        }

        const response = await fetch(`/main/get_all_book`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        });
        const data = await response.json();

        if (!data.success || !Array.isArray(data.data)) {
            console.error('책 데이터를 불러오는 중 오류가 발생했습니다.');
            return;
        }

        const books = data.data;
        totalItems = books.length;

        bookList.innerHTML = '';

        books.forEach(book => {
            const bookItem = document.createElement('div');
            bookItem.classList.add('carousel-item');

            bookItem.innerHTML = `
                <img src="${book.cover}" alt="${book.title} 표지">
            `;

            bookItem.onclick = () => openBookModal(book);

            if (book.bookId && book.ownerId) {
                bookItem.setAttribute('data-id', book.bookId);
                bookItem.setAttribute('data-owner-id', book.ownerId);
            } else {
                console.warn("bookId 또는 ownerId가 없습니다:", book);
            }

            bookList.appendChild(bookItem);
        });

    } catch (error) {
        console.error('책 데이터를 불러오는 중 오류 발생:', error);
    }
}

const carouselContainer = document.querySelector('.carousel-container');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const itemWidth = carouselContainer.clientWidth / 2; // 한 번에 두 개 아이템씩 보여줄 경우

prevBtn.addEventListener('click', () => {
    carouselContainer.scrollLeft -= itemWidth;
});

nextBtn.addEventListener('click', () => {
    carouselContainer.scrollLeft += itemWidth;
});

// 초기화
loadBooks();

// ========================================== 모달 창 섹션 =============================================
// 모달 열기 함수
function openModal() {
    document.getElementById("bookModal").style.display = "flex";
}

// 모달 닫기 함수
function closeModal() {
    document.getElementById("bookModal").style.display = "none";
}

let isLiked = false; // 좋아요 상태
let likeCount = 0; // 초기 좋아요 수
const likeButton = document.getElementById('like-button');
const likeCountElement = document.getElementById('like-count');

// 책 모달 열기 함수 (책 정보를 가져올 때 좋아요 수도 함께 가져옵니다)
async function openBookModal(book) {
    document.getElementById('bookModal').style.display = 'flex';
    document.querySelector('.book-cover img').src = book.cover;
    document.querySelector('.book-details h2').textContent = book.title;
    document.querySelector('.book-details p:nth-of-type(1)').textContent = `지은이: ${book.author}`;
    document.querySelector('.book-details p:nth-of-type(2)').textContent = `장르: ${book.genre}`;

    // 좋아요 수 가져오기
    await fetchLikeCount(book.id_book);
    
    // 키워드 처리
    const keywordDiv = document.getElementById('keywords');
    keywordDiv.innerHTML = ''; // 기존 내용을 초기화

    book.keywords.forEach(keyword => {
        const keywordButton = document.createElement('button');
        keywordButton.classList.add('keyword-button');
        keywordButton.textContent = keyword;
        keywordDiv.appendChild(keywordButton);
    });

    // 책 읽기 버튼에 id_book 값 저장 후 이동
    const readButton = document.getElementById('reading-book');
    readButton.setAttribute('data-book-id', book.id_book); // book의 id_book 설정
    readButton.onclick = function () {
        // bookId를 로컬 스토리지에 저장
        localStorage.setItem('id_book', book.bookId); 
        localStorage.setItem('id_owner', book.ownerId); // 책 소유자 ID 저장
        
        // book_ko.html로 이동 (여기서도 'bookId'를 로그로 출력하여 제대로 저장되었는지 확인)
        console.log("bookId 저장 확인: ", book.bookId);
        console.log("ownerId 저장 확인: ", book.ownerId);

        // main.html에서 book.html로 이동하기 전에 특정 값 저장
        localStorage.setItem('hideModifyButton', 'true');

        window.location.href = 'book_ko.html'; // 페이지 이동
    };

}

// 서버에서 좋아요 수 가져오기
async function fetchLikeCount(bookId) {
    try {
        const response = await fetch(`/api/get_like_count/${bookId}`);
        const data = await response.json();
        if (data.success) {
            likeCount = data.like_count;
            likeCountElement.textContent = likeCount;
            isLiked = data.is_liked; // 현재 사용자가 좋아요를 눌렀는지 여부
            likeButton.textContent = isLiked ? '❤️' : '♡';
            likeButton.classList.toggle('liked', isLiked);
        }
    } catch (error) {
        console.error('좋아요 수 가져오기 실패:', error);
    }
}

// 좋아요 버튼 클릭 이벤트
likeButton.addEventListener('click', async () => {
    try {
        if (isLiked) {
            // 좋아요 해제
            const response = await fetch(`/api/unlike_book/${bookId}`, { method: 'POST' });
            const data = await response.json();
            if (data.success) {
                likeCount--;
                isLiked = false;
                likeButton.textContent = '♡';
                likeButton.classList.remove('liked');
                likeCountElement.textContent = likeCount;
            }
        } else {
            // 좋아요 추가
            const response = await fetch(`/api/like_book/${bookId}`, { method: 'POST' });
            const data = await response.json();
            if (data.success) {
                likeCount++;
                isLiked = true;
                likeButton.textContent = '❤️';
                likeButton.classList.add('liked');
                likeCountElement.textContent = likeCount;
            }
        }
    } catch (error) {
        console.error('좋아요 업데이트 실패:', error);
    }
});

// 페이지 로딩 시 책 데이터 로드
document.addEventListener('DOMContentLoaded', loadBooks);

