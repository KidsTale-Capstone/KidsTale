// 페이지가 로드되면 총 페이지 수를 가져와 첫 페이지를 표시
document.addEventListener('DOMContentLoaded', async function () {
    const bookId = localStorage.getItem('id_book');
    const ownerId = localStorage.getItem('id_owner');
    const lang = 'ko'; // 한글 버전이므로 'ko' 사용

    if (!bookId || !ownerId) {
        alert("책 정보나 소유자 정보를 불러오는 중 문제가 발생했습니다. 다시 시도해 주세요.");
        return;
    }

    console.log("DOM 로드 시 bookId 확인:", bookId); // bookId 로그 출력
    console.log("DOM 로드 시 ownerId 확인:", ownerId); // ownerId 로그 출력
    console.log("저장된 hideModifyButton:", localStorage.getItem('hideModifyButton'));

    totalPages = await fetchTotalPages(ownerId, bookId, lang);
    displayPage(0);
});

// 현재 페이지 인덱스
let currentPage = 0;
let totalPages = 0;

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

// 서버에서 책 제목, 내용, 이미지 데이터를 받아오는 함수
async function fetchBookData(ownerId, bookId, pageIndex, lang) {
    const token = localStorage.getItem('token'); // JWT 토큰을 로컬 스토리지에서 가져옴

    console.log(bookId);
    console.log(pageIndex);
    
    try {
        const response = await fetch(`/book/${lang}?id_book=${bookId}&page_index=${pageIndex}&owner_id=${ownerId}`, {
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

// 페이지 표시 함수
async function fetchTotalPages(ownerId, bookId, lang) {
    const token = localStorage.getItem('token'); // JWT 토큰을 로컬 스토리지에서 가져옴

    try {
        const response = await fetch(`/book/${lang}/total_pages?id_book=${bookId}&id_owner=${ownerId}`, {
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


let currentAudio = null;
let isPlaying = false;
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

            if (currentAudio) {
                // 이미 재생 중인 오디오가 있으면 멈추기
                currentAudio.pause();
                currentAudio.currentTime = 0; // 재생 위치 초기화
                currentAudio = null;
            }

            currentAudio = new Audio(data.audioPath);
            console.log('TTS 요청 성공: 오디오 재생 시작');
            currentAudio.play();

            isPlaying = true;
            audioButton.innerText = "듣기 중지"; // 버튼을 '듣기 중지'로 변경

            // 오디오 재생이 끝났을 때 버튼을 다시 '듣기'로 변경
            currentAudio.onended = () => {
                isPlaying = false;
                audioButton.innerText = "듣기"; // 재생 완료 후 버튼 상태 변경
                currentAudio = null;
            };

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
    const ownerId = localStorage.getItem('id_owner');

    const lang = 'ko'; // 한글 버전이므로 'ko' 사용

    if (!bookId || !ownerId) {
        console.error("bookId 또는 ownerId 값이 없습니다.");
        return;
    }
    console.log("displayPage - bookId:", bookId, "ownerId:", ownerId, "pageIndex:", pageIndex, "lang:", lang);

    fetchBookData(ownerId, bookId, pageIndex, lang).then(pageData => {
        console.log(pageData);
        if (!pageData) return;

        document.getElementById('book-title').innerText = pageData.title;
        document.getElementById('book-author').innerText = `지은이: ${pageData.author}`;

        if (pageIndex === 0) {
            coverImage.style.display = 'block';
            coverImage.src = pageData.pageImagePath;
            contentPage.innerText = '';
            pageIndicator.innerText = '';
        } else {
            coverImage.style.display = 'block';
            coverImage.src = pageData.pageImagePath;
            contentPage.innerText = pageData.pageContent;
            pageIndicator.innerText = `${pageIndex} / ${totalPages}`;
        }

        audioButton.onclick = () => {
            if (isPlaying && currentAudio) {
                // 오디오가 재생 중일 때는 멈춤
                currentAudio.pause();
                currentAudio.currentTime = 0; // 재생 위치 초기화
                currentAudio = null; // 오디오 객체 초기화
                isPlaying = false;
                audioButton.innerText = "듣기"; // 버튼을 다시 '듣기'로 변경
            } else {
                // 오디오가 재생 중이 아니면 playTTS 호출
                console.log("TTS 요청 준비 중...");
                const bookId = localStorage.getItem('id_book');
                const lang = 'ko'; // 현재 언어는 'ko'
                playTTS(contentPage.innerText, bookId, lang);
            }
        };
        

        prevButton.style.display = pageIndex === 0 ? 'none' : 'block';
        nextButton.style.display = pageIndex === totalPages ? 'none' : 'block';

        playAllButton.style.display =  currentPage === 0 ? 'none' : 'none';
        audioButton.style.display = currentPage === 0 ? 'none' : 'block';
        langButton.style.display = currentPage === 0 ? 'block' : 'none';

        // 수정 버튼
        const hideModify = localStorage.getItem('hideModifyButton');
        if (hideModify === 'true') {
            modifyButton.style.display = 'none';
        } else {
            modifyButton.style.display = currentPage === 0 ? 'none' : 'block';
        }

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

// ************************ 새로운 추가한 기능 *************************
// 수정하기 기능
document.getElementById('modify-content').onclick = () => {
    document.getElementById('book-container').style.display = 'none'; 
    document.getElementById('prev-page').style.display = 'none'; 
    document.getElementById('next-page').style.display = 'none'; 
    document.getElementById('audio-book').style.display = 'none';
    document.getElementById('modify-content').style.display = 'none';

    document.getElementById('edit-section').style.display = 'flex';  // 수정 필드 보이기
    document.getElementById('cancel-edit').style.display = 'flex'; // 취소 버튼 보이기
    document.getElementById('complete-edit').style.display = 'flex'; // 완료 버튼 보이기

    const contentText = document.getElementById('content-page').innerText;
    document.getElementById('edit-content').value = contentText;  // 기존 내용을 텍스트 입력 필드로 복사

    // **이미지 미리보기 기능에 기존 이미지 경로 적용**
    const imagePath = document.getElementById('book-cover').src;
    const preview = document.getElementById('image-preview');
    preview.src = imagePath; // 기존 이미지 미리보기에 적용
    preview.style.display = 'block';  // 이미지 미리보기 보이기
};

function cancelEdit() {
    // 수정 모드 UI 요소 숨기기
    document.getElementById('edit-section').style.display = 'none';
    document.getElementById('cancel-edit').style.display = 'none';
    document.getElementById('complete-edit').style.display = 'none';
    
    // 기존 UI 요소 다시 보이도록 설정
    document.getElementById('book-container').style.display = 'block';
    document.getElementById('prev-page').style.display = currentPage === 0 ? 'none' : 'block';
    document.getElementById('next-page').style.display = currentPage === totalPages ? 'none' : 'block';
    modifyButton.style.display = currentPage === 0 ? 'none' : 'block';
    audioButton.style.display = currentPage === 0 ? 'none' : 'block';
}

// 사진 미리보기 기능
function previewImage() {
    const fileInput = document.getElementById('new-image');
    const preview = document.getElementById('image-preview');

    const file = fileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        preview.src = '';
        preview.style.display = 'none';
    }
}


// 완료 버튼 누르면 저장
async function completeEdit() {
    const bookId = localStorage.getItem('id_book');
    const token = localStorage.getItem('token');
    const updatedContent = document.getElementById('edit-content').value;
    const newImage = document.getElementById('new-image').files[0];

    const formData = new FormData();
    formData.append('content', updatedContent);
    if (newImage) {
        formData.append('image', newImage); // 새 이미지가 있으면 추가
    }

    try {
        const response = await fetch(`/book/update_page?id_book=${bookId}&page_index=${currentPage}&lang=ko`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const data = await response.json();
        if (data.success) {
            alert('수정된 내용이 저장되었습니다.');
            // 수정모드 비활성화
            document.getElementById('edit-section').style.display = 'none';
            document.getElementById('cancel-edit').style.display = 'none';
            document.getElementById('complete-edit').style.display = 'none';
            
            // 기존 UI 다시 활성화
            document.getElementById('book-container').style.display = 'block';
            document.getElementById('prev-page').style.display = currentPage === 0 ? 'none' : 'block';
            document.getElementById('next-page').style.display = currentPage === totalPages ? 'none' : 'block';
            modifyButton.style.display = currentPage === 0 ? 'none' : 'block';
            audioButton.style.display = currentPage === 0 ? 'none' : 'block';

            // 새 데이터로 페이지 새로고침
            displayPage(currentPage);
        } else {
            throw new Error('저장 실패');
        }
    } catch (error) {
        console.error('저장 중 오류:', error);
        alert('저장 중 오류가 발생했습니다.');
    }
}



