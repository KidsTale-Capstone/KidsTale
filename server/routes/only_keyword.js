const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { supabase } = require('../../supabaseClient'); // Supabase 클라이언트 가져오기
const gpt = require('../gpt');

// 키워드 불러오는 라우트
router.get('/keywords', async (req, res) => {
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

        const drawingId = req.query.drawing_id;  // drawing_id가 쿼리로 전달됨

        if (!drawingId) {
            return res.status(400).json({ success: false, message: 'drawing_id가 없습니다.' });
        }

        // Supabase에서 drawing_kw 테이블에서 keywords_ko 가져오기
        const { data, error } = await supabase
            .from('drawing_kw')
            .select('keywords_ko')
            .eq('id_user', userId)
            .eq('id_drawing', drawingId)
            .order('id_drawing_kw', { ascending: false })
            .limit(1);  // 최신 데이터만 선택

        if (error || !data || data.length === 0) {
            return res.status(500).json({ success: false, message: '키워드를 불러오는 중 오류가 발생했습니다.', error });
        }

        // 쉼표로 구분된 키워드를 배열로 변환하고 불필요한 데이터를 필터링
        const keywords = data[0].keywords_ko
            .split(',')
            .map(keyword => keyword.trim())
            .filter(keyword => !keyword.includes('_') && !keyword.includes('전체'));

        const selectedKeywords = keywords.slice(0, 8); // 최대 8개의 키워드 선택

        // 키워드를 응답으로 반환
        res.status(200).json({ success: true, keywords: selectedKeywords });
    } catch (error) {
        console.error('키워드 불러오는 중 오류:', error);
        res.status(500).json({ success: false, message: '키워드를 불러오는 중 오류가 발생했습니다.', error });
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
        } catch (error) {
            console.error('JWT 검증 실패:', error);
            return res.status(401).json({ success: false, message: '유효하지 않은 토큰입니다.' });
        }

        const { keywords, genres, drawingId, drawingKwId } = req.body;

        if (!drawingId || !drawingKwId || !keywords || !genres) {
            return res.status(400).json({ success: false, message: '필수 데이터가 누락되었습니다.' });
        }

        // 선택된 키워드와 장르를 select_kw 테이블에 저장
        const { data, error } = await supabase
            .from('select_kw')
            .insert([
                {
                    id_user: userId,
                    id_drawing: drawingId,
                    id_drawing_kw: drawingKwId,
                    select_kw: keywords,
                    genre: genres[0],
                }
            ])
            .select('id_select_kw');

        if (error) {
            console.error('Supabase에 저장하는 중 오류 발생:', error);
            return res.status(500).json({ success: false, message: '키워드와 장르 저장 중 오류가 발생했습니다.' });
        }

        const selectKwId = data[0].id_select_kw;

        // 성공적인 응답 반환
        res.status(200).json({ success: true, message: '키워드와 장르가 성공적으로 저장되었습니다.', selectKwId });
    } catch (error) {
        console.error('데이터 제출 중 오류:', error);
        res.status(500).json({ success: false, message: '데이터 제출 중 오류가 발생했습니다.' });
    }
});

// 동화 생성 및 저장 라우트
router.post('/generate-story', async (req, res) => {
    const { selectKwId, keywords, genre } = req.body;

    if (!selectKwId || !keywords || !genre) {
        return res.status(400).json({ error: '필수 데이터가 누락되었습니다.' });
    }

    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.sub;

        // GPT API를 사용하여 동화 생성 및 저장
        const bookData = await gpt.saveBookData(keywords, genre, userId, selectKwId);
        
        res.json({ success: true, id_book: bookData.id_book });
    } catch (error) {
        console.error('동화 생성 및 저장 중 오류:', error);
        res.status(500).json({ error: '동화 생성 및 저장 중 오류가 발생했습니다.' });
    }
});

module.exports = router;