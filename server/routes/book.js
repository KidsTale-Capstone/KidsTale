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

// book table 가져오기
async function fetchBookData(userId, lang, bookId) {
    try {
        const titleField = lang === 'eng' ? 'title_eng' : 'title_ko';

        console.log(`userId: ${userId}, lang: ${lang}, bookId: ${bookId}`);
        
        if (!bookId) {
            throw new Error('책 정보가 없습니다.');
        }

        // Supabase에서 해당 사용자의 책 데이터 가져오기
        const { data, error } = await supabase
            .from('book')
            .select(`${titleField}, author`)
            .eq('id_user', userId)
            .eq('id_book', bookId)
            .single();

        if (error || !data) {
            throw new Error('책 데이터를 불러오는 중 오류가 발생했습니다.');
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

        if (!bookId || isNaN(pageIndex)) {
            return res.status(400).json({ success: false, message: '책 정보나 페이지 정보가 없습니다.' });
        }

        if (!lang) {
            return res.status(400).json({ success: false, message: '잘못된 요청입니다.' });
        }

        // book table 가져오기
        const bookData = await fetchBookData(userId, lang, bookId);

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

// 서버의 라우트 예시 (Express)
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


module.exports = router;
