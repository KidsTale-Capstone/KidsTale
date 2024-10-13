from flask import Flask, request, jsonify
from yolov5_inference import run_yolov5  # YOLOv5 실행 코드 가져오기
import os
import jwt
from supabase import create_client, Client  # Supabase 클라이언트 추가
from dotenv import load_dotenv
from flask_cors import CORS  # CORS 모듈 추가
import logging

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
    user_id = data.get('user_id')  # 사용자의 ID도 받음
    
    if not image_url:
        app.logger.error('No image URL provided.')
        return jsonify({'error': 'No image URL provided'}), 400

    
    # YOLOv5 모델 실행
    try:
        detected_objects = run_yolov5(image_url)
        app.logger.info(f"YOLOv5 모델 감지 결과: {detected_objects}")

        # 감지된 키워드를 drawing_kw 테이블에 저장
        response = supabase.from_('drawing_kw').insert({
            'id_user': user_id,  # 사용자 ID
            'keywords': detected_objects,  # 감지된 객체 리스트
            'id_drawing': data.get('id_drawing')  # 해당 그림의 id_drawing
        }).execute()

        app.logger.debug(f"키워드 저장 응답: {response}")
        
        if response.get('error'):
            app.logger.error('DB에 키워드를 저장하는 중 오류 발생.')
            return jsonify({'error': 'Error saving keywords to DB'}), 500
        
        return jsonify({
            'detected_objects': detected_objects,
            'message': 'Keywords saved to DB successfully!'
        })
    
    except Exception as e:
        app.logger.error(f"YOLOv5 모델 실행 중 오류 발생: {str(e)}")
        return jsonify({'error': f'Model Error: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
