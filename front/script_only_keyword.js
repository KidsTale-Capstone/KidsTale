// 선택된 키워드를 저장할 배열
let keywords = [];
// 선택된 장르를 저장할 배열 (하나만 선택 가능)
let selectedGenres = [];


// 키워드를 추가하는 함수 (알림창에서 먼저 입력을 받고 버튼 생성)
function addKeyword() {
    // 알림창에서 키워드 입력받기
    const keyword = prompt("키워드를 입력해주세요:");

    // 입력받은 키워드가 유효할 때만 버튼 생성
    if (keyword !== null && keyword.trim() !== "") {
        // 키워드를 배열에 저장
        keywords.push(keyword);

        // 입력한 키워드를 보여주는 버튼 생성
        createKeywordButton(keyword);
    } else {
        alert("키워드를 입력해주세요.");
    }
}

// 키워드 버튼을 생성하는 함수
function createKeywordButton(keyword) {
    const keywordContainer = document.getElementById('keyword-container');

    // 새로운 줄을 생성할지 여부 확인 (4개씩 줄 배치)
    let lastRow = keywordContainer.lastElementChild;
    if (!lastRow || lastRow.children.length >= 4) {
        // 새로운 행 생성
        lastRow = document.createElement('div');
        lastRow.classList.add('keyword-row'); // 스타일을 위해 새로운 클래스 적용
        keywordContainer.appendChild(lastRow);
    }

    // 키워드 버튼 생성
    const newButton = document.createElement('button');
    newButton.classList.add('keyword-button');
    newButton.textContent = keyword;

    // 버튼 클릭으로 선택/해제 가능하게
    newButton.onclick = function() {
        toggleKeyword(newButton);
    };

    // 새 키워드 버튼을 행에 추가
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

// // 키워드를 수정하는 함수
// function editKeyword(button) {
//     const newKeyword = prompt("키워드를 수정해주세요:", button.textContent);

//     if (newKeyword !== null && newKeyword.trim() !== "") {
//         // 키워드 배열에서 수정
//         const index = keywords.indexOf(button.textContent);
//         if (index !== -1) {
//             keywords[index] = newKeyword;
//             button.textContent = newKeyword;
//         }
//     } else {
//         alert("유효한 키워드를 입력해주세요.");
//     }
// }

// ======================================================================== //

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

// 다음 버튼 클릭 시 데이터 확인 후 페이지 이동
async function goToNextPage() {
    const selectedGenre = document.querySelector('input[name="genre"]:checked');
    
    if (keywords.length < 3) {
        alert('키워드를 최소 3개 이상 입력해주세요.');
        return;
    }

    if (selectedGenres.length === 0) {
        alert('장르를 선택해주세요.');
        return;
    }

    let imageFileName;
    const genreFolder = selectedGenre.value;
    console.log('장르', genreFolder)

    // 장르별로 고유한 파일 이름 설정
    if (genreFolder === '모험') {
        imageFileName = '001.jpg';
    } else if (genreFolder === '추리') {
        imageFileName = '002.jpg';
    } else if (genreFolder === '우화') {
        imageFileName = '003.jpg';
    } else if (genreFolder === '공포') {
        imageFileName = '004.jpg';
    } else if (genreFolder === '사랑') {
        imageFileName = '005.jpg';
    } else if (genreFolder === '우정') {
        imageFileName = '006.jpg';
    } else if (genreFolder === '가족') {
        imageFileName = '007.jpg';
    } else if (genreFolder === '교육') {
        imageFileName = '008.jpg';
    } else {
        alert('유효한 장르를 선택해주세요.');
        return;
    }

    const filePath = `sample/${imageFileName}`;
    const token = localStorage.getItem('token');

    try {
        
        // 1. keywords_only 장르를 통해 drawing table 저장
        const response = await fetch('/only_keywords/upload-genre-drawing', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                file_name: imageFileName,
                file_path: filePath
            })
        });

        const data = await response.json();

        if (data.success) {
            const drawingId = data.drawingId;

            // 2. 선택된 키워드와 장르를 select_kw에 저장
            const submitResponse = await fetch('/only_keywords/submit-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ 
                    keywords: keywords,
                    genres: selectedGenres,
                    drawingId: drawingId, 
                }),
            });

            const submitResult = await submitResponse.json();

            if (submitResult.success) {
                const selectKwId = submitResult.selectKwId;
                localStorage.setItem('selectKwId', selectKwId);

                // 3. 저장된 selectKwId를 기반으로 GPT API로 동화 생성 요청
                const generateResponse = await fetch('/select_keywords/generate-story', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        selectKwId: selectKwId,
                        keywords: keywords,
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
        } else {
            alert('이미지 URL 가져오기에 실패했습니다.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('제출 중 오류가 발생했습니다.');
    }
}
