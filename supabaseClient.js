// .env 파일 로드
require('dotenv').config();

// supaDB 연결
const { createClient } = require('@supabase/supabase-js');

// Supabase URL과 API 키
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_API_KEY;

// Supabase 클라이언트 생성
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;