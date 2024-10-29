let keywords = []; // 전역 변수로 선언
let selectedGenres = []; // 선택된 장르를 저장할 배열 (하나만 선택 가능)
let isKeywordsLoaded = false; // 전역 변수를 통해 중복 호출 방지

// 페이지가 로드되면 키워드를 불러오는 함수 실행
document.addEventListener('DOMContentLoaded', function () {
    loadImage();  // 이미지 불러오기
    loadKeywords();
});

// 이미지 불러오는 함수
async function loadImage() {
    const token = localStorage.getItem('token'); // 로컬 스토리지에 저장된 JWT 토큰 가져오기
    const drawingId = localStorage.getItem('drawingId'); // drawingId 가져오기

    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.href = 'login.html';
        return;
    }

    try {
        // 서버에서 업로드된 이미지 URL을 가져옴
        const response = await fetch(`/create_book/get_uploaded_image_url?drawing_id=${drawingId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,  // 토큰을 헤더에 추가하여 서버에 전달
            }
        });

        const result = await response.json();

        if (!result.success) {
            alert('이미지를 불러오지 못했습니다.');
            return;
        }

        // 가져온 이미지 URL을 img 태그에 설정
        const uploadedImage = document.getElementById('uploaded-image');
        uploadedImage.src = result.image_url;

    } catch (error) {
        console.error('Error:', error);
        alert('이미지를 불러오는 중 오류가 발생했습니다.');
    }
}

// 페이지 로드 시 서버에서 키워드를 불러오는 함수 호출
document.addEventListener('DOMContentLoaded', function () {
    loadKeywords();
});

// 키워드 불러오는 함수
async function loadKeywords() {
    const token = localStorage.getItem('token'); // 로컬 스토리지에 저장된 JWT 토큰 가져오기
    const userId = localStorage.getItem('userId'); //console.log('userId:', userId); // userId 값 확인

    const drawingId = localStorage.getItem('drawingId'); //console.log('drawingId:', drawingId);
    localStorage.setItem('drawingId', drawingId);
    

    // 함수 호출 검사
    if (isKeywordsLoaded) {
        console.log("loadKeywords 함수가 이미 호출되었습니다.");
        return;
    }

    isKeywordsLoaded = true; // 첫 호출 시 true로 설정
    console.log("loadKeywords 함수 호출");

    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`/select_keywords/keywords?drawing_id=${drawingId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,  // 토큰을 헤더에 추가하여 서버에 전달
            }
        });

        const result = await response.json();

        if (result.success) {
            // 서버에서 받아온 키워드를 배열에 추가하고 버튼으로 생성
            result.keywords.forEach(keyword => {
                keywords.push(keyword);
                createKeywordButton(keyword); // 수정 가능으로 설정
            });
        } else {
            alert('키워드를 불러오지 못했습니다.');
        }

    } catch (error) {
        console.error('Error:', error);
        alert('키워드를 불러오는 중 오류가 발생했습니다.');
    }
}

// DOMContentLoaded 이벤트에 loadKeywords 함수를 등록
document.addEventListener('DOMContentLoaded', loadKeywords);

// 키워드 추가 버튼 클릭 시 호출되는 함수
function addKeyword() {
    const keyword = prompt("키워드를 입력해주세요:");

    if (keyword !== null && keyword.trim() !== "") {
        keywords.push(keyword);
        createKeywordButton(keyword);
    } else {
        alert("키워드를 입력해주세요.");
    }
}

// 키워드 버튼을 생성하는 함수
function createKeywordButton(keyword) {
    const keywordContainer = document.getElementById('keyword-container');

    let lastRow = keywordContainer.lastElementChild;
    if (!lastRow || lastRow.children.length >= 4) {
        lastRow = document.createElement('div');
        lastRow.classList.add('keyword-row');
        keywordContainer.appendChild(lastRow);
    }

    const newButton = document.createElement('button');
    newButton.classList.add('keyword-button');
    newButton.textContent = keyword;

    // 버튼 클릭으로 선택/해제 가능하게
    newButton.onclick = function() {
        toggleKeyword(newButton);
    };

    // 모든 키워드 버튼에 수정 기능 추가
    newButton.ondblclick = function() {
        editKeyword(newButton);
    };

    lastRow.appendChild(newButton);
}

// 키워드 선택/해제 토글 함수
function toggleKeyword(button) {
    if (button.classList.contains('selected')) {
        // 선택 해제
        button.classList.remove('selected');
    } else {
        // 선택
        button.classList.add('selected');
    }
}

// 키워드를 수정하는 함수
function editKeyword(button) {
    const newKeyword = prompt("키워드를 수정해주세요:", button.textContent);

    if (newKeyword !== null && newKeyword.trim() !== "") {
        // 키워드 배열에서 수정
        const index = keywords.indexOf(button.textContent);
        if (index !== -1) {
            keywords[index] = newKeyword;
            button.textContent = newKeyword;
        }
    }
}


// 장르 선택 함수 (하나만 선택 가능)
function toggleGenre(button) {
    const genre = button.innerText;

    // 이미 선택된 장르가 있을 경우 다른 장르를 선택 불가
    if (selectedGenres.length >= 1 && !selectedGenres.includes(genre)) {
        alert("하나의 장르만 선택할 수 있습니다.");
        return;
    }

    // 장르 선택/해제
    if (selectedGenres.includes(genre)) {
        // 선택 해제
        selectedGenres = selectedGenres.filter(item => item !== genre);
        button.classList.remove('selected');
    } else {
        // 장르 배열에 추가 (최대 1개)
        selectedGenres.push(genre);
        button.classList.add('selected');
    }
}

// 다음 페이지로 이동 (3개 이상 키워드 선택 필요)
async function showLoading() {

    const loadingScreen = document.getElementById('loading');
    loadingScreen.style.display = 'flex';  // 로딩 화면 표시

    const token = localStorage.getItem('token'); // 로컬 스토리지에 저장된 JWT 토큰 가져오기
    const drawingId = localStorage.getItem('drawingId');
    console.log('drawingId:', drawingId);

    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.href = 'login.html';
        return;
    }

    if (!drawingId) {
        alert('drawingId가 없습니다. 다시 시도해주세요.');
        return;
    }

    // 선택된 키워드 개수 확인
    const selectedKeywordElements = document.querySelectorAll('.keyword-button.selected');
    if (selectedKeywordElements.length < 3) {
        return alert('키워드를 최소 3개 이상 선택해주세요.');
    }

    // 선택된 키워드를 배열로 변환
    const selectedKeywords = Array.from(selectedKeywordElements).map(button => button.textContent);

    if (selectedGenres.length === 0) {
        return alert('장르를 선택해주세요.');
    }

    try {
        // 1. 선택된 키워드와 장르를 서버에 전송
        const submitResponse = await fetch('/select_keywords/submit-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ 
                keywords: selectedKeywords,
                genres: selectedGenres,
                drawingId: drawingId
            }),
        });

        const submitResult = await submitResponse.json();

        if (submitResult.success) {
            const selectKwId = submitResult.selectKwId;
            localStorage.setItem('selectKwId', selectKwId);

            // 2. 저장된 selectKwId를 기반으로 GPT API로 동화 생성 요청
            const generateResponse = await fetch('/select_keywords/generate-story', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    selectKwId: selectKwId,
                    keywords: selectedKeywords,
                    genre: selectedGenres[0], // 선택된 첫 번째 장르
                    drawingId: drawingId,
                })
            });

            const generateResult = await generateResponse.json();

            if (generateResult.success) {
                console.log('동화 생성 성공:', generateResult);

                // 동화 생성 후 반환된 id_book을 localStorage에 저장
                const bookId = generateResult.id_book;
                localStorage.setItem('id_book', bookId);
                console.log('book_id: ', bookId)

                // 동화 생성 후 book_ko.html 페이지로 이동
                window.location.href = 'book_ko.html';
            } else {
                alert('동화 생성에 실패했습니다.');
            }
        } else {
            alert('키워드 및 장르를 저장하는 데 실패했습니다.');
        }

    } catch (error) {
        console.error('Error:', error);
        alert('제출 중 오류가 발생했습니다.');
    }
}