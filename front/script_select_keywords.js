// 선택된 키워드를 저장할 배열
let selectedKeywords = [];
// 선택된 장르를 저장할 배열 (하나만 선택 가능)
let selectedGenres = [];

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

// 키워드 불러오는 함수
async function loadKeywords() {
    const token = localStorage.getItem('token'); // 로컬 스토리지에 저장된 JWT 토큰 가져오기
    const userId = localStorage.getItem('userId');
    console.log('userId:', userId); // userId 값 확인
    const drawingId = localStorage.getItem('drawingId');
    localStorage.setItem('drawingId', drawingId);
    console.log('drawingId:', drawingId);
    const drawingKwId = localStorage.getItem('drawingKwId');
    localStorage.setItem('drawingKwId', drawingKwId);
    console.log('drawingKwId:', drawingKwId);

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
            const keywordButtons = document.querySelectorAll('.keyword-button');
            result.keywords.forEach((keyword, index) => {
                if (index < keywordButtons.length) {
                    keywordButtons[index].innerText = keyword;
                }
            });
        } else {
            alert('키워드를 불러오지 못했습니다.');
        }
        
    } catch (error) {
        console.error('Error:', error);
        alert('키워드를 불러오는 중 오류가 발생했습니다.');
    }
}

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
async function goToNextPage() {
    const token = localStorage.getItem('token'); // 로컬 스토리지에 저장된 JWT 토큰 가져오기
    const drawingId = localStorage.getItem('drawingId');
    const drawingKwId = localStorage.getItem('drawingKwId');

    console.log('drawingId:', drawingId, 'drawingKwId:', drawingKwId);

    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.href = 'login.html';
        return;
    }

    if (!drawingId) {
        alert('drawingId가 없습니다. 다시 시도해주세요.');
        return;
    }
    if (!drawingKwId) {
        alert('drawingKwId가 없습니다. 다시 시도해주세요.');
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

    // 1. 선택된 키워드와 장르를 서버에 전송
    fetch('/select_keywords/submit-data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
            keywords: selectedKeywords, 
            genres: selectedGenres,
            drawingId: localStorage.getItem('drawingId'), 
            drawingKwId: localStorage.getItem('drawingKwId'),
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const selectKwId = data.selectKwId;
            localStorage.setItem('selectKwId', selectKwId);
            console.log('selectKwId:', selectKwId);
            
            // 2. 저장된 selectKwId를 기반으로 GPT API로 동화 생성 요청
            return fetch('/select_keywords/generate-story', {
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
                    drawingKwId: drawingKwId
                })
            });
        } else {
            alert('키워드 및 장르를 저장하는 데 실패했습니다.');
            throw new Error('키워드 및 장르 저장 실패');
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('동화 생성 성공:', data);
            window.location.href = 'book.html';  // 생성 후 book 페이지로 이동
        } else {
            alert('동화 생성에 실패했습니다.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('제출 중 오류가 발생했습니다.');
    });
}
