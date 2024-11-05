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

    const today = new Date();
    const todayStr = new Date().toISOString().split('T')[0];

    // attendance와 last_login 초기화 및 업데이트 로직 추가
    let attendance = user.attendance || 0;  // null일 경우 0으로 설정
    let lastLogin = user.last_login || '';

    if (lastLogin) {
      const lastLoginDate = new Date(lastLogin);
      const dayDifference = Math.floor((today - lastLoginDate) / (1000 * 60 * 60 * 24));

      if (dayDifference === 1) {
        attendance += 1; // 연속 출석
      } else {
        attendance = 1; // 비연속 출석 시 초기화
      }
    } else {
      // 첫 로그인 시 attendance를 1로 설정
      attendance = 1;
    }

    // `attendance` 및 `last_login` 업데이트
    const { error: updateError } = await supabase
      .from('users')
      .update({
        attendance: attendance,
        last_login: todayStr
      })
      .eq('id_user', user.id_user);

    if (updateError) throw updateError;

    // JWT 생성 (유저 정보를 포함)
    const token = jwt.sign(
        { sub: user.id_user,
          email: user.email,
          name: user.name, 
          age: user.age },
        process.env.JWT_SECRET,
        { expiresIn: '24h' } // 1시간 동안 유효
    );

    // 로그인 성공 시
    return res.status(200).json({ 
        message: '로그인 성공',
        token: token,
        user: { id: user.id_user, email: user.email, name: user.name }
    });

  } catch (error) {
    console.log('오류', error.message);
    return res.status(500).json({ message: '로그인 처리 중 오류 발생', error: error.message });
  }
});

module.exports = router;
