const express = require('express');
const multer = require('multer');
const path = require('path');
const { uploadImageToSupabase, supabase } = require('../../supabaseClient');
const jwt = require('jsonwebtoken');

const router = express.Router();

// 메모리 저장소로 Multer 설정
const upload = multer({ storage: multer.memoryStorage() });

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
            // console.log('디코딩된 JWT 정보: ', decoded);  // JWT에서 디코딩된 정보 출력
            userID = decoded.sub; // 사용자 ID 추출
            // console.log(`JWT에서 가져온 userID: ${userID}`); // JWT에서 추출한 userID 출력
        } catch (error) {
            console.error('JWT 검증 실패:', error);
            return res.status(401).json({ success: false, message: '유효하지 않은 토큰입니다.' });
        }

        //////////////////////////////////////////////////////

        console.log('파일 정보:', file);  // 파일 정보 출력


        const fileName = `${Date.now()}_${file.originalname}`;

        // Supabase에 이미지 업로드 및 경로와 URL을 가져옴
        const { filePath, publicUrl } = await uploadImageToSupabase(file, fileName);

        // DB에 정보 저장 (drawing 테이블에 저장하는 예시)
        const { error } = await supabase
            .from('drawing')
            .insert([
                { 
                    file_name: fileName, 
                    file_path: filePath,  // 파일 경로 저장
                    public_url: publicUrl, // 공용 URL 저장
                    id_user: userID
                }
            ]);

        console.log('삽입할 데이터:', {
            file_name: fileName,
            file_path: filePath,
            public_url: publicUrl,
            id_user: userID
        });

        if (error) {
            console.error('DB 저장 중 오류:', error); // DB 오류 로그 추가
            throw error;
        }

        
        res.json({ success: true, message: '이미지가 성공적으로 업로드되었습니다.', imageUrl: publicUrl });
    } catch (error) {
        console.error('이미지 업로드 중 오류:', error);
        res.status(500).json({ success: false, message: '이미지 업로드 실패' });
    }
});

module.exports = router;
