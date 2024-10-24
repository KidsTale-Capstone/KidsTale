const express = require('express');
const axios = require('axios');
const path = require('path');
const { exec } = require('child_process');

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

// 1. 이미지 업로드 라우트
const createbookRoutes = require('./routes/create_book');
app.use('/create_book', createbookRoutes);

// 2. 키워드 선택 라우트
const selectkeywordsRoutes = require('./routes/select_keywords');
app.use('/select_keywords', selectkeywordsRoutes);

// 3. 책 생성 라우트
const bookRoutes = require('./routes/book');
app.use('/book', bookRoutes);

// 키워드만 선택 라우트
const onlykeywordRoutes = require('./routes/only_keyword');
app.use('/only_keyword', onlykeywordRoutes);

// 책 보관함 선택 라우트
const libraryRoutes = require('./routes/library');
app.use('/library', libraryRoutes);

// Flask 서버 실행 함수
function startFlaskServer() {
  const flaskPath = './flask/app.py'
  exec(`python3 ${flaskPath}`, (error, stdout, stderr) => {
      if (error) {
          console.error(`Flask 서버 실행 중 오류: ${error.message}`);
          return;
      }
      if (stderr) {
          console.error(`Flask 서버 에러 출력: ${stderr}`);
          return;
      }
      console.log(`Flask 서버 실행 결과: ${stdout}`);
  });
}

// Node.js 서버 시작 시 Flask 서버도 함께 실행
startFlaskServer();

// Flask 서버로 이미지 요청
app.post('/detect', async (req, res) => {
  const imageUrl = req.body.image_url;

  if (!imageUrl) {
      return res.status(400).json({ error: '이미지 URL이 제공되지 않았습니다.' });
  }

  try {
      // Flask 서버로 이미지 URL POST 요청
      const response = await axios.post('http://localhost:5001/yolov5', { image_url: imageUrl });

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