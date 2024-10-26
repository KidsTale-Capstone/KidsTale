const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { supabase } = require('../../supabaseClient');

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

// 책 보관함 데이터를 가져오는 라우트
router.get('/get_book', async (req, res) => {
    try {
        const userId = getUserIdFromToken(req); // JWT에서 사용자 ID 추출

            // users 테이블에서 지은이 정보 가져오기
        const { data: author, error: authorError } = await supabase
            .from('users')
            .select('name')
            .eq('id_user', userId)
            .single();

        if (authorError) {
            throw authorError;
        }

        // drawing table에서 개수 설정
        const { data: books, error: booksError } = await supabase
            .from('drawing')
            .select('id_drawing')
            .eq('id_user', userId);

        if (booksError) {
            throw booksError;
        }

        // 사용자가 책을 하나도 갖고 있지 않은 경우 처리
        if (!books || books.length === 0) {
            return res.status(200).json({
                message: "나만의 책을 생성해주세요!"
            });
        }

        const bookData = await Promise.all(books.map(async (bookItem) => {

            // drawing table
            const { data: drawing, error: drawingError } = await supabase
                .from('drawing')
                .select('public_url')
                .eq('id_user', userId)
                .eq('id_drawing', bookItem.id_drawing)
                .single();

            if (drawingError) {
                throw drawingError;
            }

            // select_kw table
            const { data: keyword, error: keywordError } = await supabase
                .from('select_kw')
                .select('genre, select_kw, id_select_kw')
                .eq('id_drawing', bookItem.id_drawing)
                .single();

            if (keywordError) {
                throw keywordError;
            }

            // book table
            const { data: book, error: bookError } = await supabase
                .from('book')
                .select('title_ko, id_select_kw, id_book')
                .eq('id_user', userId)
                .eq('id_select_kw', keyword.id_select_kw)
                .single();

            if (bookError) {
                throw bookError;
            }

            // select_kw의 실제 값을 확인
            console.log('select_kw:', keyword.select_kw);
            console.log('keyword.id_select_kw', keyword.id_select_kw);
            console.log('title', book.title_ko);
            console.log('book.id_select_kw', book.id_select_kw);

            // 책 정보 결합
            return {
                title: book.title_ko,
                author: author.name,
                genre: keyword.genre, // 키워드를 배열로 변환
                keywords: keyword.select_kw, // JSON 문자열을 배열로 변환
                cover: drawing.public_url,
                bookId: book.id_book
            };
        }));

        // 책 데이터 반환
        return res.status(200).json(bookData);
    } catch (error) {
        console.error('책 목록 가져오기 실패:', error);
        return res.status(500).json({ error: '책 목록을 가져오는 중 오류가 발생했습니다.' });
    }
});

module.exports = router;

