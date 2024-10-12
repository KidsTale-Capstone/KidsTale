const express = require('express');
const router = express.Router();
const { supabase } = require('../../supabaseClient');  // Supabase 클라이언트 불러오기
const jwt = require('jsonwebtoken');  // JWT 모듈

const JWT_SECRET = process.env.JWT_SECRET;

// 로그인 처리 라우트
router.post('/', async (req, res) => {
  const { email, password } = req.body;

  // 서버 측 유효성 검사
  if (!email || !password) {
    return res.status(400).json({ message: '이메일과 비밀번호를 입력해주세요.' });
  }

  try {
    // 이메일을 기반으로 사용자 정보 검색
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();  // 단일 레코드를 가져옴

    if (error || !email) {
      return res.status(400).json({ message: '가입되지 않은 이메일입니다.' });
    }

    // 비밀번호 일치 여부 확인
    if (user.password !== password) {
      return res.status(400).json({ message: '비밀번호가 일치하지 않습니다.' });
    }

    // JWT 생성 (유저 정보를 포함)
    const token = jwt.sign(
        { sub: user.id_user,
          email: user.email,
          name: user.name, 
          age: user.age },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }  // 토큰 만료 시간 설정 (1시간)
    );

    let userID;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET); // JWT 검증
            console.log('디코딩된 JWT 정보: ', decoded);  // JWT에서 디코딩된 정보 출력
            const userID = decoded.sub; // 사용자 ID 추출
            console.log(`JWT에서 가져온 userID: ${userID}`); // JWT에서 추출한 userID 출력
        } catch (error) {
            console.error('JWT 검증 실패:', error);
            return res.status(401).json({ success: false, message: '유효하지 않은 토큰입니다.' });
        }

    // 로그인 성공 시
    return res.status(200).json({ 
        message: '로그인 성공',
        token: token,
        user: { id: user.id, email: user.email, name: user.name }
    });

  } catch (error) {
    console.log('오류', error.message);
    return res.status(500).json({ message: '로그인 처리 중 오류 발생', error: error.message });
  }
});

module.exports = router;
