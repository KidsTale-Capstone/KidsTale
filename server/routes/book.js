const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { supabase } = require('../../supabaseClient');
const textToSpeech = require('@google-cloud/text-to-speech');
const multer = require('multer');
require('dotenv').config();


// multer 인메모리 저장소 설정
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// JWT에서 사용자 ID를 추출하는 함수
function getUserIdFromToken(req) {
    const token = req.headers.authorization.split(' ')[1]; // 'Bearer <token>' 형식에서 토큰 부분만 추출
    if (!token) {
        throw new Error('인증 토큰이 없습니다.');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // JWT 검증
        return decoded.sub; // 사용자 ID 추출
    } catch (error) {
        console.error('JWT 검증 실패:', error);
        throw new Error('유효하지 않은 토큰입니다.');
    }
}

// book table 가져오기
async function fetchBookData(ownerId, lang, bookId) {
    try {
        const titleField = lang === 'eng' ? 'title_eng' : 'title_ko';

        console.log(`router fetchBookData ownerId: ${ownerId}, lang: ${lang}, bookId: ${bookId}`);
        
        if (!bookId) {
            throw new Error('책 정보가 없습니다.');
        }

        // Supabase에서 해당 사용자의 책 데이터 가져오기
        const { data, error } = await supabase
            .from('book')
            .select(`${titleField}, author`)
            .eq('id_user', ownerId)
            .eq('id_book', bookId)
            .single();

        if (error) {
            console.error('Supabase error:', error); // 구체적인 에러 정보 출력
            throw new Error('책 데이터를 불러오는 중 오류가 발생했습니다.');
        }
        if (!data) {
            throw new Error('책 데이터가 존재하지 않습니다.');
        }

        return {
            title: data[titleField],
            author: data.author
        };
    } catch (error) {
        console.error('책 정보를 불러오는 중 오류:', error);
        throw new Error('책 정보를 불러오는 중 오류가 발생했습니다.');
    }
}

// 페이지별 내용 가져오기
async function fetchPageData(bookId, pageIndex, lang) {
    try {
        // pages 테이블에서 페이지 인덱스에 맞는 내용 가져오기
        const { data, error } = await supabase
            .from('pages')
            .select('page_content, page_image_path')
            .eq('id_book', bookId)
            .eq('page_index', pageIndex)
            .eq('page_lang', lang)
            .single();

        if (error || !data) {
            throw new Error('페이지 데이터를 불러오는 중 오류가 발생했습니다.');
        }

        return data;
    } catch (error) {
        console.error('페이지 데이터를 불러오는 중 오류:', error);
        throw new Error('페이지 데이터를 불러오는 중 오류가 발생했습니다.');
    }
}


// 책 데이터를 클라이언트로 반환하는 라우트
router.get('/:lang', async (req, res) => {
    try {
        // JWT 토큰에서 사용자 ID 추출
        const userId = getUserIdFromToken(req);

        // JWT 토큰에서 사용자 ID 추출
        const lang = req.params.lang; // 'ko' 또는 'eng' 언어 정보
        const bookId = req.query.id_book; // 클라이언트에서 전달한 id_book
        const pageIndex = parseInt(req.query.page_index, 10);
        const ownerId = req.query.owner_id;

        console.log("lang:", lang, "bookId:", bookId, "pageIndex:", pageIndex);  // 각 변수 확인


        if (!bookId || isNaN(pageIndex)) {
            console.error("유효하지 않은 요청 데이터 - bookId 또는 pageIndex 없음");
            return res.status(400).json({ success: false, message: '책 정보나 페이지 정보가 없습니다.' });
        }

        if (!lang) {
            return res.status(400).json({ success: false, message: '잘못된 요청입니다.' });
        }

        // book table 가져오기
        const bookData = await fetchBookData(ownerId, lang, bookId);

        // page table 가져오기
        const pageData = await fetchPageData(bookId, pageIndex, lang);

        res.status(200).json({
            success: true,
            title: bookData.title,
            author: bookData.author,
            pageContent: pageData.page_content,
            pageImagePath: pageData.page_image_path
        });

    } catch (error) {
        console.error('데이터를 불러오는 중 오류:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// 서버의 라우트
router.get('/:lang/total_pages', async (req, res) => {

    const lang = req.params.lang; // 'ko' 또는 'eng' 언어 정보
    const bookId = req.query.id_book; // 클라이언트에서 전달한 id_book

    console.log(`bookId: ${bookId}, lang: ${lang}`)

    try {
        const { data, error } = await supabase
            .from('pages')
            .select('page_index')
            .eq('id_book', bookId)
            .eq('page_lang', lang)
            .order('page_index', { ascending: false })
            .limit(1);

        if (error || !data) {
            console.error('Supabase 오류 또는 데이터 없음:', error); // 오류 로그 추가
            return res.status(500).json({ success: false, message: '총 페이지 수를 가져오는 중 오류가 발생했습니다.' });
        }

        console.log(`Fetched total pages successfully. Highest page_index: ${data[0].page_index}`);
        res.status(200).json({ success: true, totalPages: data[0].page_index });
    } catch (error) {
        console.error('총 페이지 수를 가져오는 중 오류:', error);
        res.status(500).json({ success: false, message: '총 페이지 수를 가져오는 중 오류가 발생했습니다.' });
    }
});

const BUCKET_NAME = 'tts';

// TTS 오디오 파일 생성 및 전송 라우트
router.get('/:lang/tts', async (req, res) => {
    const { lang } = req.params;
    const bookId = req.query.id_book;
    const pageIndex = req.query.page_index;
    const text = decodeURIComponent(req.query.text);

    // 요청 로그 확인
    console.log('TTS 요청 텍스트:', text);
    console.log('bookId:', bookId, 'pageIndex', pageIndex, 'lang', lang);
    if (!text || !bookId || isNaN(pageIndex)) {
        return res.status(400).json({ success: false, message: '유효하지 않은 요청 데이터입니다.' });
    }

    try {

        // JWT에서 사용자 ID 추출
        const userId = getUserIdFromToken(req);

        // 사용자 음성 설정 가져오기
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('voice_preference')
            .eq('id_user', userId)
            .single();

        if (userError || !userData) {
            console.error('사용자 음성 설정 가져오기 실패:', userError);
            return res.status(500).json({ success: false, message: '사용자 음성 설정을 가져오지 못했습니다.' });
        }

        // 음성 설정 값 확인
        const voicePreference = userData.voice_preference

        const { data: pageData, error: pageError } = await supabase
            .from('pages')
            .select('version_num')
            .eq('id_book', bookId)
            .eq('page_index', pageIndex)
            .eq('page_lang', lang)
            .single();

        if (pageError || !pageData) {
            throw new Error('페이지 데이터 가져오기 중 오류가 발생했습니다.');
        }
        const versionNum = pageData.version_num;

        // 기존 TTS 데이터 확인
        const { data: existingAudio, error } = await supabase
            .from('book_tts')
            .select('path, voice_preference')
            .eq('id_book', bookId)
            .eq('page_index', pageIndex)
            .eq('page_lang', lang)
            .order('id_book_tts', { ascending: false })
            .limit(1);

        if (error) console.error("기존 오디오 경로 가져오기 중 오류:", error);

        if (existingAudio && existingAudio.length > 0) {
            const audioPath = existingAudio[0].path;
            const existingVersionNum = parseInt(audioPath.split('_').pop().replace('.mp3', ''), 10); // 경로에서 version_num 추출
    
            console.log('기존 오디오 경로:', audioPath, 'version_num:', existingVersionNum, 'voice_preference:', storedVoicePreference);

            // 저장된 음성 설정이 동일하고 version_num도 동일한 경우 기존 경로 반환
            if (existingVersionNum === versionNum && storedVoicePreference === voicePreference) {
                return res.json({ success: true, audioPath: audioPath });
            }

        }

        // 음성 설정에 따라 음성 이름 설정
        const voiceName =
            lang === 'eng'
                ? voicePreference === 'male'
                    ? 'en-US-Wavenet-B' // 남성 영어 음성
                    : 'en-US-Wavenet-F' // 여성 영어 음성
                : voicePreference === 'male'
                ? 'ko-KR-Wavenet-C' // 남성 한국어 음성
                : 'ko-KR-Wavenet-B'; // 여성 한국어 음성

        // 새 오디오 생성
        const client = new textToSpeech.TextToSpeechClient();
        const request = {
            input: { text },
            voice: { languageCode: lang === 'eng' ? 'en-US' : 'ko-KR', 
            name:voiceName },
            audioConfig: { audioEncoding: 'MP3' },
        };

        const [response] = await client.synthesizeSpeech(request);

        const filePath = `${bookId}/${lang}_${pageIndex}_${pageData.version_num}.mp3`;

        console.log("오디오 파일을 Supabase 버킷에 업로드 중...");

        // Supabase에 파일 업로드
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, response.audioContent, {
                cacheControl: '3600',
                upsert: true,
                contentType: 'audio/mpeg',
            });

        if (uploadError) {
            console.error('Supabase bucket 업로드 중 오류:', uploadError);
            return res.status(500).json({ success: false, message: 'Supabase 업로드 중 오류가 발생했습니다.' });
        }
        console.log("오디오 파일 업로드 성공:", uploadData);

        // publicURL 설정
        const publicURL = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath).data.publicUrl;
        console.log("publicURL 생성 성공:", publicURL);

        // 2. 새로 생성된 경로를 Supabase `book_tts` 테이블에 저장
        console.log("오디오 경로를 book_tts 테이블에 저장 중...");
        const { data: insertData, error: insertError } = await supabase.from('book_tts').insert({
            id_book: bookId,
            page_index: pageIndex,
            page_lang: lang,
            path: publicURL,
            voice_preference: voicePreference
        })
        .select();

        if (insertError) {
            console.error("book_tts 테이블에 경로 저장 중 오류:", insertError);
            return res.status(500).json({ success: false, message: 'book_tts 테이블 저장 중 오류가 발생했습니다.' });
        } else {
            console.log("book_tts 테이블에 경로 저장 성공:", insertData);
        }

        res.json({ success: true, audioPath: publicURL });

    } catch (error) {
        console.error("TTS 생성 중 오류:", error);
        res.status(500).json({ success: false, message: 'TTS 생성 중 오류 발생' });
    }
});


// 페이지 내용 및 이미지 업데이트 라우트
router.post('/update_page', upload.single('image'), async (req, res) => {
    const { id_book, page_index, lang } = req.query;
    const { content } = req.body;
    const newImage = req.file; // multer로 받아온 새 이미지

    try {
        // Supabase에서 해당 페이지 찾기
        const { data: page, error } = await supabase
            .from('pages')
            .select('*')
            .eq('id_book', id_book)
            .eq('page_index', page_index)
            .eq('page_lang', lang)
            .single();

        if (error || !page) {
            return res.status(404).json({ success: false, message: '페이지를 찾을 수 없습니다.' });
        }

        // version_num 증가
        const currentVersionNum = (page.version_num || 0) + 1; // 현재 버전이 없으면 0에서 시작

        // 새 이미지가 있을 경우 처리
        let publicUrl = page.page_image_path;
        if (newImage) {
            const imagePath = `${id_book}/${id_book}_${page_index}_${currentVersionNum}.jpeg`; // 이미지 경로 설정
            const { data: uploadData, error: uploadError } = await supabase
                .storage
                .from('pages') // Supabase 버킷에 저장
                .upload(imagePath, newImage.buffer, { contentType: newImage.mimetype });

            if (uploadError) {
                console.error('이미지 업로드 중 오류:', uploadError);
                throw new Error('이미지 업로드 중 오류가 발생했습니다.');
            }

            publicUrl = supabase.storage.from('pages').getPublicUrl(imagePath).data.publicUrl;

        }

        const { error: updateError } = await supabase
            .from('pages')
            .update({ page_content: content, page_image_path: publicUrl, version_num: currentVersionNum })
            .eq('id_book', id_book)
            .eq('page_index', page_index)
            .eq('page_lang', lang);

        if (updateError) {
            throw new Error('페이지 업데이트 중 오류가 발생했습니다.');
        }

        res.json({ success: true, message: '페이지가 성공적으로 업데이트되었습니다.' });
    } catch (error) {
        console.error('페이지 업데이트 중 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
});

module.exports = router;
