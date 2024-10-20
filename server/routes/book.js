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

// 책 데이터를 불러오는 함수
async function fetchBookData(userId, lang, bookId) {
    try {
        const titleField = lang === 'eng' ? 'title_eng' : 'title_ko';
        const txtPathField = lang === 'eng' ? 'txt_eng_path' : 'txt_ko_path';
        if (!bookId) {
            return res.status(400).json({ success: false, message: '책 정보가 없습니다.' });
        }

        console.log(`Fetching book data for userId: ${userId}, lang: ${lang}, bookId: ${bookId}`);

        // Supabase에서 해당 사용자의 책 데이터 가져오기
        const { data, error } = await supabase
            .from('book')
            .select(`${titleField}, ${txtPathField}, users(name)`)
            .eq('id_user', userId)
            .eq('id_book', bookId)
            .single();

        if (error || !data) {
            throw new Error('책 데이터를 불러오는 중 오류가 발생했습니다.');
        }
        const filePath = data[txtPathField]; // 파일 경로를 가져옴

        const { data: publicUrlData, error: publicUrlError } = supabase
            .storage
            .from('book')
            .getPublicUrl(filePath);

        if (publicUrlError) {
            throw new Error(`Supabase에서 공용 URL 가져오기 중 오류 발생: ${publicUrlError.message}`);
        }

        const publicUrl = publicUrlData.publicUrl;

        console.log('Book 퍼블릭 URL:', publicUrl);

        return {
            title: data[titleField],
            txtPath: publicUrl,
            author: data.users.name
        };
    } catch (error) {
        console.error('책 데이터를 불러오는 중 오류:', error);
        throw new Error('책 데이터를 불러오는 중 오류가 발생했습니다.');
    }
}

// 이미지 데이터를 불러오는 함수
async function fetchDrawingData(userId, drawingId) {
    try {
        // drawingId가 없으면 오류 처리
        if (!drawingId) {
            throw new Error('drawingId가 없습니다.');
        }

        console.log(`Fetching drawing data for userId: ${userId}, drawingId: ${drawingId}`);

        // Supabase에서 drawing 테이블에서 해당 사용자의 이미지 데이터 가져오기
        const { data, error } = await supabase
            .from('drawing')
            .select('public_url')
            .eq('id_drawing', drawingId)
            .eq('id_user', userId)
            .single();

        if (error || !data) {
            throw new Error('이미지 데이터를 불러오는 중 오류가 발생했습니다.');
        }

        console.log('drawing 퍼블릭 url: ', data.public_url)

        // public_url을 반환
        return { imagePath: data.public_url };

    } catch (error) {
        console.error('이미지 데이터를 불러오는 중 오류:', error);
        throw new Error('이미지 데이터를 불러오는 중 오류가 발생했습니다.');
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
        const drawingId = req.query.drawing_id;

        if (!bookId || !drawingId) {
            return res.status(400).json({ success: false, message: '책 정보나 그림 정보가 없습니다.' });
        }

        if (!lang) {
            return res.status(400).json({ success: false, message: '잘못된 요청입니다.' });
        }

        // 책 데이터와 이미지 데이터 가져오기
        const bookData = await fetchBookData(userId, lang, bookId);
        const drawingData = await fetchDrawingData(userId, drawingId);

        // 클라이언트에 책 정보와 이미지 경로 전달
        res.status(200).json({
            success: true,
            title: bookData.title,
            txtPath: bookData.txtPath,
            imagePath: drawingData.imagePath,
            author: bookData.author
        });
    } catch (error) {
        console.error('데이터를 불러오는 중 오류:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});


module.exports = router;
