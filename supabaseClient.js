// .env 파일 로드
require('dotenv').config();

// supaDB 연결
const { createClient } = require('@supabase/supabase-js');

// Supabase URL과 API 키
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_API_KEY;

// Supabase 클라이언트 생성
const supabase = createClient(supabaseUrl, supabaseKey);

// auth 객체 내보내기
const auth = supabase.auth;

// 이미지 업로드 함수
async function uploadImageToSupabase(file, fileName) {
    const { data, error } = await supabase
        .storage
        .from('drawing')
        .upload(fileName, file, { contentType: file.mimetype });

    if (error) {
        throw new Error(`Supabase 업로드 중 오류 발생: ${error.message}`);
    }

    // 파일 업로드 후 해당 파일의 공용 URL을 가져옴
    const { data: publicUrlData, error: publicUrlError } = supabase
        .storage
        .from('drawing') // drawing 버킷에서 경로 가져오기
        .getPublicUrl(data.path);

    if (publicUrlError) {
        throw new Error(`Supabase에서 URL 가져오기 중 오류 발생: ${publicUrlError.message}`);
    }

    return publicUrlData.publicUrl; // 파일의 전체 공용 URL 반환

}

// 이미지 경로 가져오기 함수
// async function getImageUrl(filePath) {
//     const { data, error } = await supabase
//         .storage
//         .from('drawing')
//         .getPublicUrl(filePath);

//     if (error) {
//         throw new Error(`이미지 URL 가져오기 오류: ${error.message}`);
//     }

//     return data.publicUrl;
// }

module.exports = { supabase, auth, uploadImageToSupabase };