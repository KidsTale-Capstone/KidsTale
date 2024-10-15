const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { supabase } = require('../../supabaseClient'); // Supabase 클라이언트 가져오기

router.get('/get_uploaded_image_url', async (req, res) => {
    const drawingId = req.query.drawing_id;

    try {
        const { data, error } = await supabase
            .from('drawing')
            .select('public_url')
            .eq('id_drawing', drawingId)
            .single();  // 단일 데이터만 가져옴

        if (error || !data) {
            return res.status(500).json({ success: false, message: '이미지를 불러오는 중 오류가 발생했습니다.' });
        }

        return res.status(200).json({ success: true, image_url: data.public_url });

    } catch (error) {
        console.error('이미지 URL 가져오기 중 오류:', error);
        res.status(500).json({ success: false, message: '이미지 URL을 가져오는 중 오류가 발생했습니다.' });
    }
});

// 키워드를 불러오는 라우트
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
            console.log(`JWT에서 가져온 userID_select: ${userId}`);
        } catch (error) {
            console.error('JWT 검증 실패:', error);
            return res.status(401).json({ success: false, message: '유효하지 않은 토큰입니다.' });
        }

        const drawingId = req.query.drawing_id;  // drawing_id가 쿼리로 전달됨

        if (!drawingId) {
            return res.status(400).json({ success: false, message: 'drawing_id가 없습니다.' });
        }

        // Supabase에서 drawing_kw 테이블에서 keywords_ko를 가져옴
        const { data, error } = await supabase
            .from('drawing_kw')
            .select('keywords_ko')
            .eq('id_user', userId)
            .eq('id_drawing', drawingId)
            .order('id_drawing_kw', { ascending: false })
            .limit(1);  // 필요한 데이터만 선택

        if (error || !data || data.length === 0) {
            return res.status(500).json({ success: false, message: '데이터를 불러오는 중 오류가 발생했습니다.', error });
        }
        console.log('쿼리 결과:', data);

        // 쉼표로 구분된 키워드를 배열로 변환하고 필터링 (_와 공백 제거)
        const keywords = data[0].keywords_ko
            .split(',')  // 쉼표로 구분된 문자열을 배열로 변환
            .map(keyword => keyword.trim())  // 공백 제거
            .filter(keyword => !keyword.includes('_') && !keyword.includes('전체'));

        // 최대 8개의 키워드를 선택
        const selectedKeywords = keywords.slice(0, 8);

        // 응답으로 키워드를 보냄
        res.status(200).json({ success: true, keywords: selectedKeywords });
    } catch (error) {
        console.error('키워드 불러오는 중 오류:', error);
        res.status(500).json({ success: false, message: '키워드를 불러오는 중 오류가 발생했습니다.', error });
    }
});

module.exports = router;