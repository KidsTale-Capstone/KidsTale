// .env 파일 로드
require('dotenv').config();

// supaDB 연결
const { createClient } = require('@supabase/supabase-js');

// Supabase URL과 API 키
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_API_KEY;

// Supabase 클라이언트 생성
const supabase = createClient(supabaseUrl, supabaseKey);

const auth = supabase.auth;

// 이미지 업로드 함수
async function uploadImageToSupabase(file, fileName) {

    console.log('파일 객체:', file);  // 파일 객체가 제대로 처리되는지 확인

    // 1. Supabase 스토리지에 이미지 업로드
    const { data, error } = await supabase
        .storage
        .from('drawing')
        .upload(fileName, file.buffer, { contentType: file.mimetype });

    if (error) {
        throw new Error(`Supabase 업로드 중 오류 발생: ${error.message}`);
    }

    // 2. 파일의 경로(file_path)를 명확하게 지정
    const filePath = `drawing/${fileName}`;

    // 3. 공용 URL(public_url)을 생성하여 가져옴
    const { data: publicUrlData, error: publicUrlError } = supabase
        .storage
        .from('drawing')
        .getPublicUrl(fileName);  // 경로를 통해 공용 URL 생성

    if (publicUrlError) {
        throw new Error(`Supabase에서 공용 URL 가져오기 중 오류 발생: ${publicUrlError.message}`);
    }

    const publicUrl = publicUrlData.publicUrl;

    // 파일 경로와 공용 URL을 함께 반환
    return { filePath, publicUrl };
}

module.exports = { supabase, auth, uploadImageToSupabase };