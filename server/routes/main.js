const express = require('express');
const jwt = require('jsonwebtoken');
const { supabase } = require('../../supabaseClient');

const router = express.Router();

// 사용자 데이터 불러오기 라우트
router.get('/userdata', async (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1]; // 'Bearer <token>' 형식에서 토큰 부분만 추출
        if (!token) {
            return res.status(401).json({ success: false, message: '인증 토큰이 없습니다.' });
        }

        let userID;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET); // JWT 검증
            userID = decoded.sub; // 사용자 ID 추출
            console.log(`JWT에서 가져온 userID: ${userID}`);
        } catch (error) {
            console.error('JWT 검증 실패:', error);
            return res.status(401).json({ success: false, message: '유효하지 않은 토큰입니다.' });
        }

        // 사용자 정보 가져오기 (예: 사용자 이름, 목표, 현재 책 수)
        const { data: userData, error } = await supabase
            .from('users')
            .select('name, goal')
            .eq('id_user', userID)
            .single();

        if (error) {
            console.error('DB에서 사용자 정보 불러오기 오류:', error);
            return res.status(500).json({ success: false, message: '사용자 정보를 불러오지 못했습니다.' });
        }

        // 현재 작성한 책 개수 (SQL COUNT 연산 사용)
        const { data: bookCount, error: bookCountError } = await supabase
            .from('book')
            .select('*', { count: 'exact' })
            .eq('id_user', userID);

        if (bookCountError) {
            console.error('DB에서 책 개수 불러오기 오류:', bookCountError);
            return res.status(500).json({ success: false, message: '책 개수를 불러오지 못했습니다.' });
        }

        // 사용자 데이터를 클라이언트로 전송
        res.json({ 
            success: true, 
            data: { 
                name: userData.name, 
                goal: userData.goal, 
                current_books: bookCount  // SQL로 계산된 책 개수
            } 
        });
    } catch (error) {
        console.error('서버 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
});

module.exports = router;
