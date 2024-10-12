const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3000;

// Body-parser 기능 (Express 내장)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 프론트엔드 파일이 위치한 디렉토리
app.use(express.static(path.join(__dirname, '../front')));

// 기본 html 라우트 설정
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../front', 'login.html'));
});

// 라우트 연결
// 회원가입 라우트
const registerRoutes = require('./routes/register');
app.use('/register', registerRoutes);

// 로그인 라우트
const loginRoutes = require('./routes/login');
app.use('/login', loginRoutes);

// 메인페이지 라우트
const mainRoutes = require('./routes/main');
app.use('/main', mainRoutes);

// 이미지 업로드 라우트
const createbookRoutes = require('./routes/create_book');
app.use('/create_book', createbookRoutes);

// Flask API 호출
app.post('/detect', async (req, res) => {
  const imageUrl = req.body.image_url;

  if (!imageUrl) {
    return res.status(400).json({ error: '이미지 URL이 제공되지 않았습니다.' });
  }

  try {
    // Flask 서버로 이미지 URL 전송
    const response = await axios.post('http://localhost:5000/yolov5', {
      image_url: imageUrl
    });

    // YOLOv5 감지 결과 반환
    res.json({
      message: 'YOLOv5 감지가 성공적으로 완료되었습니다.',
      detected_objects: response.data.detected_objects
    });
  } catch (error) {
    console.error('YOLOv5 감지 중 오류 발생:', error);
    res.status(500).json({ error: 'YOLOv5 감지 중 오류 발생' });
  }
});

// 서버 실행
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});