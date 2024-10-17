const openai = require('openai');
const fs = require('fs');
const path = require('path');
require('dotenv').config();  // .env 파일 로드

// OpenAI API 키 설정
openai.apiKey = process.env.OPENAI_API_KEY;

// GPT 요청 함수
async function generateStory(keywords, genre) {
    const objStr = keywords.join(', ');
    
    const prompt = `다음 ${keywords.length}개의 키워드들 모두 사용하여 한글 어린이 동화를 만들어주세요: ${objStr}. 
                    동화의 장르는 ${genre}입니다. 결말을 포함하여 작성해주세요.`;

    try {
        const response = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: prompt }
            ],
        });

        const story = response.data.choices[0].message.content;
        return story;
    } catch (error) {
        console.error('GPT API 호출 중 오류:', error);
        throw new Error('동화 생성에 실패했습니다.');
    }
}

// 제목 생성 함수
async function generateTitle(story) {
    const prompt = "위 동화의 제목을 작성해주세요. 답변은 [제목] 형식으로 해주세요.";

    try {
        const response = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "user", content: story },
                { role: "user", content: prompt }
            ],
        });

        const title = response.data.choices[0].message.content;
        return title;
    } catch (error) {
        console.error('제목 생성 중 오류:', error);
        throw new Error('제목 생성에 실패했습니다.');
    }
}

// 텍스트를 파일로 저장하는 함수
function saveStoryToFile(folderName, fileName, content) {
    const dir = path.join(__dirname, '../storage/book', folderName);
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, fileName);
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`${fileName} 저장 완료`);
    return filePath;
}

module.exports = {
    generateStory,
    generateTitle,
    saveStoryToFile
};
