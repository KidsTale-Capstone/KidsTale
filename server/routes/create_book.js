const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadImageToSupabase, supabase } = require('../../supabaseClient');
const jwt = require('jsonwebtoken');

const router = express.Router();

// 메모리 저장소로 Multer 설정
const upload = multer({ storage: multer.memoryStorage() });

// 로그 파일 경로 설정
const logFilePath = path.join(__dirname, '../../app.log');

// 로그 함수 설정
function logToFile(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    fs.appendFile(logFilePath, logMessage, (err) => {
        if (err) {
            console.error('로그 파일에 기록 중 오류 발생:', err);
        }
    });
}

// 파일 이름을 안전하게 변환하는 함수
function sanitizeFileName(fileName) {
    return fileName
        .replace(/[^a-z0-9_.-]/gi, '')  // 알파벳, 숫자, _, -, . 만 허용
        .toLowerCase();                  // 파일 이름을 소문자로 변환
}

// 이미지 업로드 처리
router.post('/upload', upload.single('image'), async (req, res) => {
    try {
        const file = req.file;

        if (!file) {
            return res.status(400).json({ success: false, message: '파일이 없습니다.' });
        }

        const token = req.headers.authorization.split(' ')[1]; // 'Bearer <token>' 형식에서 토큰 부분만 추출
        if (!token) {
            return res.status(401).json({ success: false, message: '인증 토큰이 없습니다.' });
        }

        let userID;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET); // JWT 검증
            userID = decoded.sub; // 사용자 ID 추출
        } catch (error) {
            console.error('JWT 검증 실패:', error);
            return res.status(401).json({ success: false, message: '유효하지 않은 토큰입니다.' });
        }

        console.log('파일 정보:', file);  // 파일 정보 출력

        const safeFileName = sanitizeFileName(`${Date.now()}_${file.originalname}`);;

        // Supabase에 이미지 업로드 및 경로와 URL을 가져옴
        const { filePath, publicUrl } = await uploadImageToSupabase(file, safeFileName);

        // DB에 정보 저장
        const { data, error } = await supabase
            .from('drawing')
            .insert([
                { 
                    file_name: safeFileName, 
                    file_path: filePath,  // 파일 경로 저장
                    public_url: publicUrl, // 공용 URL 저장
                    id_user: userID
                }
            ])
            .select('id_drawing');  // 삽입된 레코드의 id_drawing 값을 반환

        if (error) {
            console.error('DB 저장 중 오류:', error); // DB 오류 로그 추가
            throw error;
        }

        // 삽입된 레코드의 id_drawing 추출
        const drawingId = data[0].id_drawing;  
        
        res.json({ success: true, message: '이미지가 성공적으로 업로드되었습니다.', drawingId, imageUrl: publicUrl });
    } catch (error) {
        console.error('이미지 업로드 중 오류:', error);
        res.status(500).json({ success: false, message: '이미지 업로드 실패' });
    }
});
// 업로드된 이미지의 URL 가져오기
router.get('/get_uploaded_image_url', async (req, res) => {

    try {

        // Authorization 헤더에서 JWT 토큰 추출
        const token = req.headers.authorization?.split(' ')[1]; // 'Bearer <token>' 형식에서 토큰 부분만 추출
        if (!token) {
            return res.status(401).json({ success: false, message: '인증 토큰이 없습니다.' });
        }

        let userId;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET); // JWT 검증
            userId = decoded.sub; // JWT에서 사용자 ID 추출 (sub 필드에 userId가 있다고 가정)
            console.log('디코딩된 사용자 ID:', userId);
        } catch (error) {
            console.error('JWT 검증 실패:', error);
            return res.status(401).json({ success: false, message: '유효하지 않은 토큰입니다.' });
        }

        console.log('사용자 ID로 쿼리 실행: ', userId);

        const { data, error } = await supabase
            .from('drawing')
            .select('file_path, public_url')
            .eq('id_user', userId)
            .order('id_drawing', { ascending: false })
            .limit(1);  // 필요한 데이터만 선택

        console.log('쿼리 결과:', data);

        if (error) {
            logToFile(`DB 저장 중 오류: ${error.message}`);
            throw error;
        }

        // 데이터가 없는 경우
        if (!data || data.length === 0) {
            logToFile(`이미지 찾기 실패 - UserID: ${userId}, 데이터가 없음`);
            return res.status(404).json({ success: false, message: '이미지를 찾을 수 없습니다.' });
        }

        // 데이터가 있을 경우
        logToFile(`이미지 URL 성공적으로 가져옴 - UserID: ${userId}, URL: ${data[0].public_url}`);
        return res.status(200).json({ success: true, image_url: data[0].public_url });
        

    } catch (error) {
        console.error('이미지 URL 가져오기 중 오류:', error);
        res.status(500).json({ success: false, message: '이미지 URL을 가져오는 중 오류가 발생했습니다.' });
    }
});

// 페이지 저장 라우트
router.post('/save-page', upload.single('image'), async (req, res) => {
    try {
        const { bookId, pageIndex } = req.body;
        const file = req.file; // 파일 업로드를 위해서 req.files.image 사용

        if (!bookId || !pageIndex) {
            return res.status(400).json({ success: false, message: '필수 데이터가 누락되었습니다.' });
        }

        // 이미지가 있는 경우 Supabase storage에 저장
        let imagePath = null;
        if (file) {
            const fileName = `${bookId}_${pageIndex}.jpg`;
            const { data, error } = await supabase
                .storage
                .from('pages')
                .upload(`${bookId}/${fileName}`, file.buffer, { contentType: 'image/jpeg' });

            if (error) {
                throw new Error('이미지 저장 중 오류가 발생했습니다.');
            }

            imagePath = data.path; // 저장된 이미지의 경로
        }

        // 페이지 정보를 데이터베이스에 저장
        const { data: insertData, error: insertError } = await supabase
            .from('pages')
            .insert([
                { id_book: bookId, page_index: pageIndex, image_path: imagePath }
            ]);

        if (insertError) {
            console.error('페이지 정보를 데이터베이스에 저장 중 오류 발생:', insertError);
            throw new Error('페이지 정보를 데이터베이스에 저장 중 오류가 발생했습니다.');
        }

        res.json({ success: true, message: '페이지가 성공적으로 저장되었습니다.' });
    } catch (error) {
        console.error('페이지 저장 중 오류:', error);
        res.status(500).json({ success: false, message: '페이지 저장 중 오류가 발생했습니다.' });
    }
});


module.exports = router;
