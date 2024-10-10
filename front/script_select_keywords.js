// 선택된 키워드를 저장할 배열
let selectedKeywords = [];
// 선택된 장르를 저장할 배열 (하나만 선택 가능)
let selectedGenres = [];

// 키워드 선택/해제 함수 (3개 이상 선택 가능)
function toggleKeyword(button) {
    const keyword = button.innerText;

    // 선택된 키워드 배열에 이미 있다면 선택 해제
    if (selectedKeywords.includes(keyword)) {
        selectedKeywords = selectedKeywords.filter(item => item !== keyword);
        button.classList.remove('selected');  // 선택 해제 시 색상 원래대로
    } else {
        // 선택되지 않은 경우 배열에 추가
        selectedKeywords.push(keyword);
        button.classList.add('selected');  // 선택 시 색상 변경
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
function goToNextPage() {
    if (selectedKeywords.length < 3) {
        alert('키워드를 최소 3개 선택해야 합니다.');
        return;
    }

    if (selectedGenres.length === 0) {
        alert('장르를 선택해야 합니다.');
        return;
    }

    // 선택된 키워드와 장르를 서버에 전송 (예시)
    fetch('/submit-data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keywords: selectedKeywords, genres: selectedGenres }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // 다음 페이지로 이동
            window.location.href = 'nextpage.html';
        } else {
            alert('데이터 제출에 실패했습니다.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('제출 중 오류가 발생했습니다.');
    });
}
