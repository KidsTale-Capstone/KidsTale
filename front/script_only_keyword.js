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

// 키워드 저장 함수
function saveKeywords() {
    const keywordButtons = document.getElementsByClassName('keyword-button');
    const keywords = [];

    // 각 키워드 버튼에서 텍스트를 추출하여 배열에 저장
    for (let button of keywordButtons) {
        keywords.push(button.textContent);
    }

    // 키워드를 서버에 전송 (예시)
    fetch('/save-keywords', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keywords: keywords }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('키워드가 성공적으로 저장되었습니다.');
        } else {
            alert('키워드 저장에 실패했습니다.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('서버와 통신하는 중 오류가 발생했습니다.');
    });
}


// 선택된 장르를 저장할 배열 (하나만 선택 가능)
let selectedGenres = [];

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

