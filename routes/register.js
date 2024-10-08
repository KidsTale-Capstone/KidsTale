const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');  // Supabase 클라이언트 불러오기

// 회원가입 처리 라우트
router.post('/', async (req, res) => {
  const { name, age, email, password, confirmPassword } = req.body;

  // 비밀번호 확인
  if (password !== confirmPassword) {
    return res.status(400).json({ message: '비밀번호가 일치하지 않습니다.' });
  }

  // 이메일 중복 확인
  const { data: existingUser, error: checkError } = await supabase
    .from('users')
    .select('email')
    .eq('email', email)
    .maybeSingle();  // 단일 레코드를 검색

    if (checkError && checkError.details !== '0 rows') {
        return res.status(500).json({ message: '이메일 확인 중 오류 발생', error: checkError.message });
    }

  if (existingUser) {
    return res.status(400).json({ message: '이미 존재하는 이메일입니다.' });  // 이메일 중복 시 오류 반환
  }

  // 데이터베이스에 사용자 데이터 삽입
  const { data, error } = await supabase
    .from('users')
    .insert([{ name, age, email, password }]);

    if (error) {
        return res.status(500).json({ message: '회원가입 실패', error: error.message });
    } else {
        return res.status(200).json({ message: '회원가입 성공' });
    }
});

module.exports = router;
