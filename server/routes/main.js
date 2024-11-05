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

        // 사용자 정보 가져오기
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
            .select('*')
            .eq('id_user', userID);

        if (bookCountError) {
            console.error('DB에서 책 개수 불러오기 오류:', bookCountError);
            return res.status(500).json({ success: false, message: '책 개수를 불러오지 못했습니다.' });
        }

        // 책 개수를 bookCount.length로 계산
        const bookCountValue = bookCount.length;

        // 책 개수 로그 출력
        console.log('책 개수:', bookCountValue); // 실제 책 개수 확인을 위한 로그

        // 사용자 데이터를 클라이언트로 전송
        res.json({ 
            success: true, 
            data: { 
                name: userData.name, 
                goal: userData.goal, 
                current_books: bookCountValue  // SQL로 계산된 책 개수
            } 
        });
    } catch (error) {
        console.error('서버 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
});

// 책 명예의 전당 데이터를 가져오는 라우트
router.get('/get_all_book', async (req, res) => {
    try {

        // book 테이블에서 모든 책 가져오기, like 내림차순으로 정렬
        const { data: books, error: booksError } = await supabase
            .from('book')
            .select('title_ko, id_select_kw, id_book, like')
            .order('like', { ascending: false });

        if (booksError) throw booksError;

        // 사용자가 책을 하나도 갖고 있지 않은 경우 처리
        // if (!books || books.length === 0) {
        //     return res.status(200).json({
        //         message: "나만의 책을 생성해주세요!"
        //     });
        // }

        const bookData = await Promise.all(books.map(async (book) => {

            // select_kw table
            const { data: keyword, error: keywordError } = await supabase
                .from('select_kw')
                .select('genre, select_kw, id_drawing')
                .eq('id_select_kw', book.id_select_kw)
                .single();

            if (keywordError) {
                throw keywordError;
            }

            // drawing table
            const { data: drawing, error: drawingError } = await supabase
                .from('drawing')
                .select('id_user, public_url')
                .eq('id_drawing', keyword.id_drawing)
                .single();

            if (drawingError) throw drawingError;

            // 각 책의 지은이 정보 가져오기
            const { data: author, error: authorError } = await supabase
                .from('users')
                .select('name')
                .eq('id_user', drawing.id_user)
                .single();

            if (authorError) {
                throw authorError;
            }

            // select_kw의 실제 값을 확인
            console.log('title', book.title_ko);
            console.log('select_kw:', keyword.select_kw);
            console.log('keyword.id_select_kw', keyword.id_select_kw);
            console.log('book.id_select_kw', book.id_select_kw);

            // 책 정보 결합
            return {
                title: book.title_ko,
                author: author.name,
                genre: keyword.genre, // 키워드를 배열로 변환
                keywords: keyword.select_kw, // JSON 문자열을 배열로 변환
                cover: drawing.public_url,
                bookId: book.id_book,
                like: book.like,
                ownerId: drawing.id_user
            };
        }));

        // 모든 책 데이터 반환
        return res.status(200).json({ success: true, data: bookData });
    } catch (error) {
        console.error('책 목록 가져오기 실패:', error);
        return res.status(500).json({ error: '책 목록을 가져오는 중 오류가 발생했습니다.' });
    }
});

router.get('/get_book_like/:bookId', async (req, res) => {
    const { bookId } = req.params;

    try {
        const { data, error } = await supabase
            .from('book')
            .select('like')
            .eq('id_book', bookId)
            .single();

        if (error) throw error;

        res.status(200).json({ success: true, like: data.like });
    } catch (error) {
        console.error('좋아요 수 가져오기 실패:', error);
        res.status(500).json({ success: false, message: '좋아요 수 가져오기 실패' });
    }
});


// 좋아요 추가 라우트
router.post('/like_book/:bookId', async (req, res) => {
    const { bookId } = req.params;

    try {
        // 현재 좋아요 수 가져오기
        const { data: bookData, error: fetchError } = await supabase
            .from('book')
            .select('like')
            .eq('id_book', bookId)
            .single();

        if (fetchError) throw fetchError;

        // 좋아요 수 증가
        const newLikeCount = (bookData.like || 0) + 1;

        // 좋아요 수 업데이트
        const { data, error: updateError } = await supabase
            .from('book')
            .update({ like: newLikeCount })
            .eq('id_book', bookId)
            .select();

        if (updateError) throw updateError;

        res.status(200).json({ success: true, like: data[0].like });
    } catch (error) {
        console.error('좋아요 추가 오류:', error);
        res.status(500).json({ success: false, message: '좋아요 추가 실패' });
    }
});

// 좋아요 해제 라우트
router.post('/unlike_book/:bookId', async (req, res) => {
    const { bookId } = req.params;

    try {
        // 현재 좋아요 수 가져오기
        const { data: bookData, error: fetchError } = await supabase
            .from('book')
            .select('like')
            .eq('id_book', bookId)
            .single();

        if (fetchError) throw fetchError;

        // 좋아요 수 감소, 최소값 0으로 설정
        const newLikeCount = Math.max((bookData.like || 0) - 1, 0);

        // 좋아요 수 업데이트
        const { data, error: updateError } = await supabase
            .from('book')
            .update({ like: newLikeCount })
            .eq('id_book', bookId)
            .select();

        if (updateError) throw updateError;

        res.status(200).json({ success: true, like: data[0].like });
    } catch (error) {
        console.error('좋아요 해제 오류:', error);
        res.status(500).json({ success: false, message: '좋아요 해제 실패' });
    }
});


module.exports = router;
