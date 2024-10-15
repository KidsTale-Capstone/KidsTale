from flask import Flask, request, jsonify
from yolov5_inference import run_yolov5  # YOLOv5 실행 코드 가져오기
import os
import jwt
from supabase import create_client, Client  # Supabase 클라이언트
from dotenv import load_dotenv
from flask_cors import CORS  # CORS 모듈
import logging
from deep_translator import GoogleTranslator  # 번역기
import json  # json 처리 모듈

# 환경 변수 로드
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # 모든 요청을 허용

# 로깅 설정 (파일에 로그 기록)
logging.basicConfig(filename='app.log', level=logging.DEBUG,
                    format='%(asctime)s %(levelname)s %(message)s')

# Supabase 클라이언트 설정
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_API_KEY')
supabase: Client = create_client(supabase_url, supabase_key)

# 번역 함수 정의
def translate_keywords(keywords):
    translator = GoogleTranslator(source='en', target='ko')
    translated_keywords = [translator.translate(word) for word in keywords]
    return translated_keywords

# YOLOv5 이미지 처리 API 엔드포인트
@app.route('/yolov5', methods=['POST'])
def yolov5_inference():
    app.logger.info('yolov5_inference 호출됨')  # 로그 추가
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        app.logger.error('인증 토큰이 제공되지 않았습니다.')
        return jsonify({'error': '인증 토큰이 제공되지 않았습니다.'}), 401

    token = auth_header.split(' ')[1]  # Authorization: Bearer <token>

    try:
        decoded_token = jwt.decode(token, os.getenv('JWT_SECRET'), algorithms=["HS256"])
        user_id = decoded_token['sub']
    except Exception as e:
        app.logger.error(f"JWT 인증 실패: {str(e)}")
        return jsonify({'error': '유효하지 않은 토큰입니다.'}), 401
    
    data = request.json
    image_url = data.get('image_url')
    
    if not image_url:
        app.logger.error('No image URL provided.')
        return jsonify({'error': 'No image URL provided'}), 400

    app.logger.info(f"요청된 image_url: {image_url}")
    
    # YOLOv5 모델 실행
    try:
        detected_objects = run_yolov5(image_url)
        app.logger.info(f"YOLOv5 모델 감지 결과: {detected_objects}")

        # 감지된 객체들을 번역
        translated_objects = translate_keywords(detected_objects)
        app.logger.info(f"감지된 객체 번역 결과: {translated_objects}")

        # drawing 테이블에서 해당 이미지 URL에 맞는 id_drawing 가져오기
        drawing_response = supabase \
            .from_('drawing') \
            .select('id_drawing') \
            .eq('id_user', user_id) \
            .eq('public_url', image_url)\
            .limit(1) \
            .execute()
        
        app.logger.info(f"drawing 테이블 조회 결과: {drawing_response}")
        
        if drawing_response.data and len(drawing_response.data) > 0:
            id_drawing = drawing_response.data[0]['id_drawing']
            app.logger.info(f"가져온 id_drawing: {id_drawing}")
        else:
            raise Exception('해당 사용자와 이미지의 drawing 데이터를 찾을 수 없습니다.')

        # 감지된 키워드를 drawing_kw 테이블에 저장
        response = supabase.from_('drawing_kw').insert({
            'id_user': user_id,  # 사용자 ID
            'keywords': detected_objects,  # 감지된 객체 리스트
            'keywords_ko': ', '.join(translated_objects),  # 감지된 객체 리스트 (한국어 번역본을 쉼표로 구분한 문자열로 저장)
            'id_drawing': id_drawing  # 해당 그림의 id_drawing
        }).execute()
        
        inserted_data = response.data
        # 저장된 데이터 확인
        if inserted_data:
            app.logger.debug(f"키워드 저장 응답_eng: {inserted_data}")
        else:
            app.logger.error(f"DB에 키워드를 저장하는 중 오류 발생: {response}")
            return jsonify({'error': 'Error saving keywords to DB'}), 500
        
        # 한글 키워드가 제대로 출력되도록 수정
        return jsonify({
            'detected_objects': detected_objects,
            'translated_objects': translated_objects,
            'message': 'Keywords saved to DB successfully!'
        })
    
    except Exception as e:
        app.logger.error(f"YOLOv5 모델 실행 중 오류 발생: {str(e)}")
        return jsonify({'error': f'Model Error: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
