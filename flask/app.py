from flask import Flask, request, jsonify
from yolov5_inference import run_yolov5  # YOLOv5 실행 코드 가져오기
import os
from supabase import create_client, Client  # Supabase 클라이언트 추가
from dotenv import load_dotenv
from flask_cors import CORS  # CORS 모듈 추가

# 환경 변수 로드
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})  # 특정 도메인만 허용

# Supabase 클라이언트 설정
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_API_KEY')
supabase: Client = create_client(supabase_url, supabase_key)

@app.route('/get_uploaded_image_url', methods=['GET'])
def get_uploaded_image_url():
    id_user = request.args.get('id_user')  # 사용자 ID를 받아 해당 사용자의 이미지를 쿼리함

    if not id_user:
        return jsonify({'error': '사용자 ID가 제공되지 않았습니다.'}), 400

    try:
        # Supabase에서 해당 사용자의 이미지를 쿼리
        response = supabase.table('drawing').select('file_path').eq('id_user', id_user).single().execute()

        if response['data']:
            image_url = response['data']['file_path']  # 파일 경로 가져오기
            return jsonify({'image_url': image_url})
        else:
            return jsonify({'error': 'Image not found'}), 404
    except Exception as e:
        return jsonify({'error': f'Error retrieving image URL: {str(e)}'}), 500

# YOLOv5 이미지 처리 API 엔드포인트
@app.route('/yolov5', methods=['POST'])
def yolov5_inference():
    data = request.json
    image_url = data.get('image_url')
    user_id = data.get('user_id')  # 사용자의 ID도 받음
    
    if not image_url:
        return jsonify({'error': 'No image URL provided'}), 400
    
    # YOLOv5 모델 실행
    try:
        detected_objects = run_yolov5(image_url)
    
        # 감지된 키워드를 데이터베이스에 저장
        response = supabase.table('detected_keywords').insert({
            'user_id': user_id,  # 해당 사용자의 ID
            'image_url': image_url,  # 이미지 URL
            'keywords': detected_objects  # 감지된 객체 리스트
        }).execute()
        
        if response.get('error'):
            return jsonify({'error': 'Error saving keywords to DB'}), 500
        
        return jsonify({
            'detected_objects': detected_objects,
            'message': 'Keywords saved to DB successfully!'
        })
    
    except Exception as e:
        return jsonify({'error': f'DB Error: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
