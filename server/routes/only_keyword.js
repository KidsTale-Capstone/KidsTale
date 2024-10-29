const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { supabase } = require('../../supabaseClient'); // Supabase 클라이언트 가져오기
const gpt = require('../gpt');

// 장르 선택 시 해당 이미지 경로와 URL을 drawing 테이블에 저장하는 라우트
router.post('/upload-genre-drawing', async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1]; // 'Bearer <token>' 형식에서 토큰 부분만 추출
        if (!token) {
            return res.status(401).json({ success: false, message: '인증 토큰이 없습니다.' });
        }

        let userId;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET); // JWT 검증
            userId = decoded.sub; // 사용자 ID 추출
        } catch (error) {
            console.error('JWT 검증 실패:', error);
            return res.status(401).json({ success: false, message: '유효하지 않은 토큰입니다.' });
        }

        const { file_name, file_path } = req.body;

        // Supabase에서 장르에 맞는 이미지의 공용 URL 가져오기
        const { data: publicUrlData, error: publicUrlError } = supabase
            .storage
            .from('drawing')
            .getPublicUrl(file_path);

        if (publicUrlError) {
            console.error('Supabase에서 공용 URL 가져오기 중 오류 발생:', publicUrlError.message);
            return res.status(500).json({ success: false, message: '이미지 URL 가져오기에 실패했습니다.' });
        }

        const publicUrl = publicUrlData.publicUrl;

        // drawing 테이블에 정보 저장
        const { data, error } = await supabase
            .from('drawing')
            .insert([
                {
                    id_user: userId,
                    file_name: file_name,
                    file_path: file_path,
                    public_url: publicUrl
                }
            ])
            .select('id_drawing');

        if (error) {
            console.error('DB 저장 중 오류:', error.message);
            return res.status(500).json({ success: false, message: 'DB 저장 중 오류가 발생했습니다.' });
        }

        const drawingId = data[0].id_drawing;

        res.status(200).json({
            success: true,
            message: '이미지가 성공적으로 업로드 및 저장되었습니다.',
            drawingId,
            imageUrl: publicUrl
        });
    } catch (error) {
        console.error('이미지 업로드 및 저장 중 오류:', error);
        res.status(500).json({ success: false, message: '이미지 업로드 및 저장 중 오류가 발생했습니다.' });
    }
});

// 선택된 키워드와 장르를 저장하는 라우트
router.post('/submit-data', async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1]; // 'Bearer <token>' 형식에서 토큰 부분만 추출
        if (!token) {
            return res.status(401).json({ success: false, message: '인증 토큰이 없습니다.' });
        }

        let userId;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET); // JWT 검증
            userId = decoded.sub; // 사용자 ID 추출
            console.log(`JWT에서 가져온 userID: ${userId}`);
        } catch (error) {
            console.error('JWT 검증 실패:', error);
            return res.status(401).json({ success: false, message: '유효하지 않은 토큰입니다.' });
        }

        // POST 요청에서 받은 키워드와 장르 추출
        const { keywords, genres, drawingId  } = req.body;

        if (!drawingId || !keywords || !genres) {
            return res.status(400).json({ success: false, message: '필수 데이터가 누락되었습니다.' });
        }

        // keywords가 배열인지 확인
        if (!Array.isArray(keywords)) {
            return res.status(400).json({ success: false, message: 'Keywords should be an array' });
        }

        // Supabase에 키워드와 장르 저장
        const { data, error } = await supabase
            .from('select_kw')
            .insert([
                {
                    id_user: userId,
                    id_drawing: drawingId,
                    select_kw: keywords,
                    genre: genres[0],
                }
            ])
            .select('id_select_kw');

        if (error) {
            console.error('Supabase에 저장하는 중 오류 발생:', error);
            return res.status(500).json({ success: false, message: '키워드 및 장르 저장 중 오류가 발생했습니다.' });
        }

        // 삽입된 레코드의 id_drawing 추출
        const selectKwId = data[0].id_select_kw;  

        // 성공적인 응답
        res.status(200).json({ success: true, message: '키워드와 장르가 성공적으로 저장되었습니다.', selectKwId });
    } catch (error) {
        console.error('데이터 제출 중 오류:', error);
        res.status(500).json({ success: false, message: '데이터 제출 중 오류가 발생했습니다.' });
    }
});

// 동화 생성 및 저장 라우트
router.post('/generate-story', async (req, res) => {
    const { selectKwId, keywords, genre, drawingId } = req.body;

    if (!selectKwId || !keywords || !genre || !drawingId) {
        return res.status(400).json({ error: '필수 데이터가 누락되었습니다.' });
    }

    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.sub;

        if (!drawingId) {
            console.error('drawingId가 undefined입니다.');
            return res.status(400).json({ error: 'drawingId가 필요합니다.' });
        }

        // GPT API로 동화 생성 및 저장
        const bookData = await gpt.saveBookData(keywords, genre, userId, selectKwId, drawingId);

        res.json({ success: true, id_book: bookData.id_book });

    } catch (error) {
        console.error('동화 생성 및 저장 중 오류:', error);
        res.status(500).json({ error: '동화 생성 및 저장 중 오류가 발생했습니다.' });
    }
});

module.exports = router;