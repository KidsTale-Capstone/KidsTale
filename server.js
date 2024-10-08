const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Body-parser 기능 (Express 내장)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 프론트엔드 파일이 위치한 디렉토리
app.use(express.static(path.join(__dirname, 'front')));

// 기본 html 라우트 설정
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'front', 'login.html'));
});

// 라우트 연결
const registerRoutes = require('./routes/register');
app.use('/register', registerRoutes);   // 로그인 라우트 연결

// 서버 실행
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});