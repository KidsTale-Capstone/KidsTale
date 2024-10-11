const express = require('express');
const router = express.Router();
const { supabase } = require('../../supabaseClient');  // Supabase 클라이언트 불러오기

// 회원가입 처리 라우트
router.post('/', async (req, res) => {
  const { name, age, email, password, confirmPassword } = req.body;
  console.log({ name, age, email, password, confirmPassword });

  try {

    // 이메일 중복 확인
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .maybeSingle();  // 단일 레코드 검색

    if (checkError) {
      throw new Error('이메일 확인 중 오류 발생');
    }

    if (existingUser) {
      return res.status(400).json({ message: '이미 존재하는 이메일입니다.' });
    }
    // 비밀번호 확인
    if (password !== confirmPassword) {
      return res.status(400).json({ message: '비밀번호가 일치하지 않습니다.' });
    }

    // 사용자 데이터 DB에 삽입
    const { error: insertError } = await supabase
      .from('users')
      .insert([{ email, password, name, age }]); // user.id를 id_user로 사용

    if (insertError) {
      console.error('DB 연결 오류:', insertError); // 추가된 부분
      throw new Error('db 연결 실패');
    }

    // 성공 시 메시지 전송
    res.status(200).json({ message: '회원가입에 성공했습니다.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '회원가입에 실패했습니다.' });
  }
});

module.exports = router;
