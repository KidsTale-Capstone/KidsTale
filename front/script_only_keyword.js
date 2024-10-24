// 선택된 키워드를 저장할 배열
let selectedKeywords = [];
// 선택된 장르를 저장할 배열 (하나만 선택 가능)
let selectedGenres = [];

// 페이지가 로드되면 키워드를 불러오는 함수 실행
document.addEventListener('DOMContentLoaded', function () {
    loadKeywords();
});

// 키워드 추가 함수
function addKeyword() {
    const keywordContainer = document.getElementById('keyword-container');
    const rows = keywordContainer.getElementsByClassName('keyword-row');
    const lastRow = rows[rows.length - 1];

    // 새로운 행을 생성할지 여부 확인 (3개씩 넣기 위해)
    if (lastRow.children.length < 4) {
        // 마지막 행에 새로운 키워드 버튼 추가
        const newButton = document.createElement('button');
        newButton.classList.add('keyword-button');
        newButton.textContent = `키워드 ${document.getElementsByClassName('keyword-button').length + 1}`;
        newButton.onclick = function() { editKeyword(newButton) };
        lastRow.appendChild(newButton);
    } else {
        // 새로운 행을 생성하고 그 안에 키워드 버튼 추가
        const newRow = document.createElement('div');
        newRow.classList.add('keyword-row');
        
        const newButton = document.createElement('button');
        newButton.classList.add('keyword-button');
        newButton.textContent = `키워드 ${document.getElementsByClassName('keyword-button').length + 1}`;
        newButton.onclick = function() { editKeyword(newButton) };
        
        newRow.appendChild(newButton);
        keywordContainer.appendChild(newRow);
    }
}

// 키워드 수정(입력) 함수
function editKeyword(button) {
    const keyword = prompt("키워드를 입력해 주세요:", button.textContent);
    if (keyword !== null && keyword.trim() !== "") {
        button.textContent = keyword;  // 버튼 텍스트 변경
    }
}


// 키워드 선택/해제 함수
function toggleKeyword(button) {
    const keyword = button.innerText;

    // 선택된 키워드 배열에 이미 있다면 선택 해제
    if (selectedKeywords.includes(keyword)) {
        selectedKeywords = selectedKeywords.filter(item => item !== keyword);
        button.classList.remove('selected');
    } else {
        // 선택되지 않은 경우 배열에 추가
        selectedKeywords.push(keyword);
        button.classList.add('selected');
    }
}

// 장르 선택/해제 함수 (하나만 선택 가능)
function toggleGenre(button) {
    const genre = button.innerText;

    // 이미 선택된 장르가 있을 경우 다른 장르를 선택 불가
    if (selectedGenres.length >= 1 && !selectedGenres.includes(genre)) {
        alert("하나의 장르만 선택할 수 있습니다.");
        return;
    }

    // 장르 선택/해제
    if (selectedGenres.includes(genre)) {
        selectedGenres = selectedGenres.filter(item => item !== genre);
        button.classList.remove('selected');
    } else {
        // 장르 배열에 추가 (최대 1개)
        selectedGenres.push(genre);
        button.classList.add('selected');
    }
}

// 키워드 저장 함수
async function saveKeywords() {
    const token = localStorage.getItem('token'); // JWT 토큰 가져오기
    const drawingId = localStorage.getItem('drawingId');
    const drawingKwId = localStorage.getItem('drawingKwId');

    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.href = 'login.html';
        return;
    }

    if (selectedKeywords.length < 3) {
        alert('키워드를 최소 3개 선택해야 합니다.');
        return;
    }

    if (selectedGenres.length === 0) {
        alert('장르를 선택해야 합니다.');
        return;
    }

    try {
        const response = await fetch('/select_keywords/submit-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                keywords: selectedKeywords,
                genres: selectedGenres,
                drawingId: drawingId,
                drawingKwId: drawingKwId,
            }),
        });

        const result = await response.json();

        if (result.success) {
            alert('키워드와 장르가 성공적으로 저장되었습니다.');
            localStorage.setItem('selectKwId', result.selectKwId);
            // 이후 동화 생성 또는 다른 작업으로 넘어가기
        } else {
            alert('키워드와 장르 저장에 실패했습니다.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('키워드와 장르 저장 중 오류가 발생했습니다.');
    }
}

