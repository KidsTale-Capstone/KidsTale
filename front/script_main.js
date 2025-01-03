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

        // 서버에서 받아온 사용자 데이터를 콘솔에 출력하여 확인
        console.log("Fetched User Data:", result.data);

        // 서버에서 받아온 사용자 데이터를 DOM에 반영
        const { name, goal, current_books } = result.data;
        // goal 값 확인
        console.log("User Goal:", goal);
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

    // 목표 달성 여부에 따라 남은 책 수나 축하 메시지를 업데이트
    const remainingBooksElement = document.getElementById("remaining-books");
    if (userCurrent >= userGoal) {
        remainingBooksElement.innerText = "축하합니다! 목표 달성에 성공했어요!";
    } else {
        const remainingBooks = userGoal - userCurrent;
        remainingBooksElement.innerText = `이번달 목표까지 ${remainingBooks}권 남았어요!`;
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

// =================================== 책 둘러보기 섹션 =======================================

const bookList = document.getElementById('carousel');
const maxBooksToShow = 9; // 최대 표시할 책 수

// 책 데이터를 서버에서 불러와 책을 표시
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

        // 책 데이터에서 최대 9권만 가져오기
        const books = data.data.slice(0, maxBooksToShow);
        totalItems = books.length;

        bookList.innerHTML = ''; // 기존 리스트 초기화

        books.forEach((book, index) => {
            // 새로운 행 생성 (3권씩 나눠서 표시)
            if (index % 3 === 0) {
                const row = document.createElement('div');
                row.classList.add('shelf');
                bookList.appendChild(row);
            }

            // 책 항목 생성
            const bookItem = document.createElement('div');
            bookItem.classList.add('book');

            // 첫 세 개의 책에만 순위 배지를 추가
            let rankBadge = '';
            if (index === 0) {
                rankBadge = `<div class="book-rank rank-1">1등</div>`;
            } else if (index === 1) {
                rankBadge = `<div class="book-rank rank-2">2등</div>`;
            } else if (index === 2) {
                rankBadge = `<div class="book-rank rank-3">3등</div>`;
            }

            bookItem.innerHTML = `
                ${rankBadge}
                <img src="${book.cover}" alt="${book.title} 표지">
            `;

            bookItem.onclick = () => openBookModal(book);

            // 현재 행에 책 항목 추가
            bookList.lastChild.appendChild(bookItem);
        });

    } catch (error) {
        console.error('책 데이터를 불러오는 중 오류 발생:', error);
    }
}

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    loadBooks();
});

// ========================================== 모달 창 섹션 =============================================
// 모달 열기 함수
function openModal() {
    document.getElementById("bookModal").style.display = "flex";
}

// 모달 닫기 함수
function closeModal() {
    document.getElementById("bookModal").style.display = "none";
    bookId = null;
}

async function fetchLikeCount(bookId, likeCountElement, likeButton) {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`/main/get_book_like/${bookId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (data.success) {
            const { isLiked, like } = data;
            likeCountElement.textContent = like; // 좋아요 수 업데이트
            likeButton.textContent = isLiked ? '❤️' : '♡'; // 버튼 상태 업데이트
            likeButton.classList.toggle('liked', isLiked); // 클래스 업데이트

            // fetchLikeCount가 isLiked 값을 반환
            return isLiked;
        } else {
            throw new Error('좋아요 상태를 가져오지 못했습니다.');
        }
    } catch (error) {
        console.error('좋아요 수 가져오기 실패:', error);
        return false; // 기본값으로 false 반환
    }
}



// 책 모달 열기 함수
async function openBookModal(book) {
    document.getElementById('bookModal').style.display = 'flex';
    document.querySelector('.book-cover img').src = book.cover;
    document.querySelector('.book-details h2').textContent = book.title;
    document.querySelector('.book-details p:nth-of-type(1)').textContent = `지은이: ${book.author}`;
    document.querySelector('.book-details p:nth-of-type(2)').textContent = `장르: ${book.genre}`;

    // 현재 책의 ID를 bookId로 설정
    const bookId = book.bookId;

    // 모달이 열릴 때 좋아요 버튼과 카운트를 가져옵니다
    const likeButton = document.getElementById('like-button');
    const likeCountElement = document.getElementById('like-count');

    // 서버에서 좋아요 상태와 수 가져오기
    let isLiked = await fetchLikeCount(bookId, likeCountElement, likeButton);

    // 좋아요 버튼 클릭 이벤트 핸들러
    likeButton.onclick = async () => {
        const token = localStorage.getItem('token');
        try {
            // 좋아요 추가/해제 API 호출
            const response = await fetch(`/main/${isLiked ? 'unlike_book' : 'like_book'}/${bookId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
    
            const data = await response.json();
    
            if (data.success) {
                // 서버에서 최신 상태를 받아와 업데이트
                isLiked = !isLiked; // 서버 동기화를 기반으로 상태 변경
                likeButton.textContent = isLiked ? '❤️' : '♡';
                likeButton.classList.toggle('liked', isLiked);
                likeCountElement.textContent = data.like; // 최신 좋아요 수 업데이트
            } else {
                console.error('좋아요 업데이트 실패:', data.message);
            }
        } catch (error) {
            console.error('좋아요 업데이트 실패:', error);
        }
    };

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
    readButton.setAttribute('data-book-id', book.bookId); // book의 id_book 설정
    readButton.onclick = function () {
        // bookId를 로컬 스토리지에 저장
        localStorage.setItem('id_book', book.bookId); 
        localStorage.setItem('id_owner', book.ownerId); // 책 소유자 ID 저장

        // main.html에서 book.html로 이동하기 전에 특정 값 저장
        localStorage.setItem('hideModifyButton', 'true');
        window.location.href = 'book_ko.html'; // 페이지 이동
    };
}


// 페이지 로딩 시 책 데이터 로드
document.addEventListener('DOMContentLoaded', loadBooks);

