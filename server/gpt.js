const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');
const { supabase } = require('../supabaseClient');
require('dotenv').config();  // .env 파일 로드

// OpenAI 인스턴스 생성
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,  // .env 파일에 저장된 API 키 사용
});

// 1. 동화 생성 함수
async function generateStory(keywords, genre, userId) {

    // 사용자의 나이를 가져옴
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('age')
        .eq('id_user', userId)
        .single(); // 단일 데이터만 가져옴

    if (userError || !userData) {
        console.error('사용자 정보 불러오기 중 오류:', userError);
        throw new Error('사용자 정보를 불러오는 데 실패했습니다.');
    }

    console.log('사용자 ID로 쿼리 실행: ', userId);

    const age = userData.age;
    console.log('사용자 age: ', age);

    const objStr = keywords.join(', ');
    let sentenceLimitPrompt = ''; // 문장 수 제한

    // 연령대별 문장 수 제한 설정
    if (age <= 10) {
        sentenceLimitPrompt = '이 동화는 영유아 및 초등학교 저학년을 위한 것으로, 분량은 10문장에서 20문장 이하로 작성해주세요. 내용에 적절하게 문단으로 나눠서 동화를 작성해주세요. 문체도 쉽고 친근하게 작성해주세요.';
    } else if (age >= 11 && age <= 13) {
        sentenceLimitPrompt = '이 동화는 초등학교 고학년을 위한 것으로, 분량은 20문장에서 30문장로 작성해주세요. 내용에 적절하게 문단으로 나눠서 동화를 작성해주세요. 문체는 적당하게 작성해주세요.';
    } else {
        sentenceLimitPrompt = '이 동화는 중학교 이상을 위한 것으로, 분량은 30문장 이상입니다. 내용에 적절하게 문단으로 나눠서 동화를 작성해주세요. 문체는 조금 더 깊이있게 작성해주세요.';
    }

    
    const prompt = `당신은 동화 작가입니다.
                    다음 ${keywords.length}개의 키워드를 모두 사용하여 하나의 한글 동화를 만들어주세요: ${objStr}.
                    동화의 장르는 ${genre}입니다.
                    사랑, 우정, 과학, 교육 장르에서는 주인공이 사람이 되도록 작성해주세요.
                    ${sentenceLimitPrompt} 
                    동화의 제목을 포함하지 않고, 결말을 포함해 하나의 멋진 동화책을 작성해주세요.`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            frequency_penalty: 0.2,
            presence_penalty: 0.4
        });

        // console.log("API 응답_동화:", response);  // 응답을 로그로 출력

        // 응답에 choices가 있는지 확인하고 가져오기
        if (response.choices && response.choices.length > 0) {
            const story = response.choices[0].message.content;
            return story;
        } else {
            throw new Error('동화 생성에 실패했습니다. 응답에 choices가 없습니다.');
        }

    } catch (error) {
        console.error('GPT API 호출 중 오류:', error);
        throw new Error('동화 생성에 실패했습니다.');
    }
}

// 제목 생성 함수
async function generateTitle(story) {
    const prompt = "위 동화의 제목을 작성해주세요. 제목을 대괄호로 감싸 [제목] 형식으로만 출력해주세요.";

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "user", content: story },
                { role: "user", content: prompt }
            ],
        });

        console.log("API 응답_제목:", response);  // 응답을 로그로 출력

        if (response.choices && response.choices.length > 0) {
            const title = response.choices[0].message.content.trim();
            return title;
        } else {
            throw new Error('제목 생성에 실패했습니다. 응답에 choices가 없습니다.');
        }

    } catch (error) {
        console.error('제목 생성 중 오류:', error);
        throw new Error('제목 생성에 실패했습니다.');
    }
}

// 3. 동화 번역 함수
async function generateEng(story, title) {
    const prompt = "위에 작성된 한글 동화를 영어로 번역해 주세요. 어려운 단어가 있을 경우 알아듣기 쉬운 영어 단어로 바꿔 주세요.";

    try {
        const responseStory = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", // gpt-4도 사용 가능
            messages: [
                { role: "user", content: story },
                { role: "user", content: prompt }
            ]
        });

        if (responseStory.choices && responseStory.choices.length > 0) {
            const translatedStory = responseStory.choices[0].message.content;

            const promptTitle = `위 동화의 제목을 영어로 번역해 주세요.`;

            const responseTitle = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "user", content: title },
                    { role: "user", content: promptTitle }
                ]
            });

            if (responseTitle.choices && responseTitle.choices.length > 0) {
                const translatedTitle = responseTitle.choices[0].message.content;

                return { translatedStory, translatedTitle };
            } else {
                throw new Error('제목 번역에 실패했습니다. 응답에 choices가 없습니다.');
            }
        } else {
            throw new Error('동화 번역에 실패했습니다. 응답에 choices가 없습니다.');
        }

    } catch (error) {
        console.error('영어 번역 중 오류:', error);
        throw new Error('동화를 영어로 번역하는 데 실패했습니다.');
    }
}

// 파일을 Supabase 버킷에 저장하는 함수
async function saveStoryToBucket(selectKwId, title, content, isKorean = true) {

    const safeTitle = title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');

    console.log(`safeTitle: ${safeTitle}`)

    const folderPath = `${selectKwId}`;

    // 파일명 설정
    const fileName = isKorean ? `${safeTitle}_ko.txt` : `${safeTitle}_eng.txt`;

    // 최종 파일 경로
    const filePath = `${folderPath}/${fileName}`;

    console.log(`Supabase에 업로드할 경로: ${filePath}`);

    try {
        // 텍스트 데이터를 UTF-8로 인코딩하여 버퍼에 담음
        const { data, error } = await supabase.storage
            .from('book')
            .upload(filePath, Buffer.from(content, 'utf-8'), {
                cacheControl: '3600',
                upsert: false // 이미 있으면 덮어쓰지 않도록 설정
            });

    if (error) {
        console.error('Supabase 버킷 저장 중 오류:', error);
        throw new Error('파일 저장에 실패했습니다.');
    }

    console.log(`${fileName} 저장 완료`);
    return filePath;

} catch (uploadError) {
    console.error('파일 저장 오류 발생:', uploadError);
    throw new Error('파일 저장 중 문제가 발생했습니다.');
}
}

// 동화 및 번역 저장, 경로 및 제목 테이블에 저장
async function saveBookData(keywords, genre, userId, selectKwId) {
    try {

        // 생성
        const storyKo = await generateStory(keywords, genre, userId);
        const titleKo = await generateTitle(storyKo);
        const { translatedStory, translatedTitle } = await generateEng(storyKo, titleKo);

        // 저장
        const txtKoPath = await saveStoryToBucket(selectKwId, translatedTitle, storyKo, true);
        const txtEngPath = await saveStoryToBucket(selectKwId, translatedTitle, translatedStory, false);

        // 테이블에 저장
        const { data, error } = await supabase.from('book').insert({
            id_user: userId,
            id_select_kw: selectKwId,
            title_ko: titleKo,
            title_eng: translatedTitle,
            txt_ko_path: txtKoPath,
            txt_eng_path: txtEngPath
        })
        .select('id_book')
        .single();


        if (error) {
            console.error('책 정보 저장 중 오류:', error);
            throw new Error('책 정보를 저장하는 중 오류가 발생했습니다.');
        }

        console.log('책 정보가 성공적으로 저장되었습니다.');
        return data;
    } catch (error) {
        console.error('책 저장 중 오류:', error);
        throw new Error('책 생성 및 저장에 실패했습니다.');
    }
}
module.exports = {
    generateStory,
    generateTitle,
    generateEng,
    saveStoryToBucket,
    saveBookData
};
