const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { supabase } = require('../../supabaseClient');
const multer = require('multer');
const sharp = require('sharp');
const upload = multer({ storage: multer.memoryStorage() });

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

router.get('/get_info', async (req, res) => {
    try{
        const userId = getUserIdFromToken(req);

        // users table
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('email, name, age, goal, profileImage, attendance')
            .eq('id_user', userId)
            .single();

        if (userError) {
            throw userError;
        }
        // 뱃지 조건 확인
        const userProgress = {};

        // 출석 뱃지
        userProgress.firstAttendance = user.attendance > 0;
        userProgress.tenDaysAttendance = user.attendance >= 10;

        // 첫 번째 동화 생성 여부
        const { count: storyCount, error: storyError } = await supabase
            .from('book')
            .select('*', { count: 'exact' })
            .eq('id_user', userId)

        if (storyError) throw storyError;

        userProgress.firstStoryCreated = storyCount > 0;
        userProgress.fiftyStoriesCreated = storyCount >= 50;
        userProgress.hundredStoriesCreated = storyCount > 100;

        // 모든 장르 책 생성 여부 (중복 제거 후 8개인지 확인)
        const { data: genreData, error: genreError } = await supabase
            .from('select_kw')
            .select('genre')
            .eq('id_user', userId)
            .neq('genre', null);

        if (genreError) throw genreError;

        // JavaScript Set을 사용하여 고유한 장르 필터링
        const uniqueGenres = [...new Set(genreData.map(item => item.genre))];
        userProgress.allGenresCreated = uniqueGenres.length === 8;

        // 책 한권 전체 수정 여부 (version_num 조건)
        const { data: userBooks, error: bookError } = await supabase
            .from('book')
            .select('id_book')
            .eq('id_user', userId);

        if (bookError) throw bookError;

        let oneBookEdited = false;
        for (const book of userBooks) {
            const { data: pages, error: pageError } = await supabase
                .from('pages')
                .select('version_num')
                .eq('id_book', book.id_book);

            if (pageError) throw pageError;

            if (pages.every(page => page.version_num >= 1)) {
                oneBookEdited = true;
                break;
            }
        }
        userProgress.oneBookEdited = oneBookEdited;

        userProgress.firstLikes = false,           // 좋아요 1등
        userProgress.secondLikes = false,          // 좋아요 2등
        userProgress.thirdLikes = true             // 좋아요 3등

        // 사용자 정보와 뱃지 조건 반환
        res.status(200).json({ success: true, user, userProgress });

    } catch (error) {
        console.error('사용자 정보 가져오기 오류:', error);
        res.status(500).json({ success: false, message: '사용자 정보를 가져오는 데 실패했습니다.' });
    }

});

// 파일 이름을 안전하게 변환하는 함수
function sanitizeFileName(fileName) {
    return fileName
        .replace(/[^a-z0-9_.-]/gi, '')  // 알파벳, 숫자, _, -, . 만 허용
        .toLowerCase();                  // 파일 이름을 소문자로 변환
}

// 사용자 정보 업데이트
router.post('/update_user', upload.single('profileImage'), async (req, res) => {

    try {
        const userId = getUserIdFromToken(req);
        const { name, age, goal } = req.body;
        let profileImageUrl = null;

        // 프로필 이미지가 업로드된 경우
        if (req.file) {
            const safeFileName = sanitizeFileName(`${userId}/${Date.now()}_${req.file.originalname}`);

            // 이미지 파일을 JPEG로 변환 (sharp 사용)
            const jpegBuffer = await sharp(req.file.buffer)
                .jpeg({ quality: 80 })
                .toBuffer();

            const { data, error: uploadError } = await supabase.storage
                .from('user')
                .upload(safeFileName, jpegBuffer, { contentType: 'image/jpeg' });

            if (uploadError) throw uploadError;

            // 업로드된 파일의 URL 가져오기
            const { publicURL, error: urlError } = supabase.storage
                .from('user')
                .getPublicUrl(data.path);

            if (urlError) throw urlError;

            profileImageUrl = publicURL;
        }

        const { error } = await supabase
            .from('users')
            .update({ name, age, goal, profileImage: profileImageUrl })
            .eq('id_user', userId);

        if (error) throw error;

        res.status(200).json({ success: true, message: '회원 정보가 업데이트되었습니다.' });
    } catch (error) {
        console.error('사용자 정보 업데이트 오류:', error);
        res.status(500).json({ success: false, message: '회원 정보 업데이트에 실패했습니다.' });
    }
});

router.delete('delete_user', async (req, res) => {
    try {
        const userId = getUserIdFromToken(req);
        console.log('delete_user', userId);

        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id_user', userId);

        if (error) {
            throw error;
        }

        res.status(200).json({ success: true, message: '계정이 삭제되었습니다.' });
    } catch (error) {
        console.error('사용자 삭제 오류:', error);
        res.status(500).json({ success: false, message: '사용자 삭제에 실패했습니다.' });
    }
});

module.exports = router;