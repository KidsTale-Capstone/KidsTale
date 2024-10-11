from flask import Flask, request, jsonify
from yolov5_inference import run_yolov5  # YOLOv5 실행 코드 가져오기

app = Flask(__name__)

# YOLOv5 이미지 처리 API 엔드포인트
@app.route('/yolov5', methods=['POST'])
def yolov5_inference():
    data = request.json
    image_url = data.get('image_url')
    
    if not image_url:
        return jsonify({'error': 'No image URL provided'}), 400
    
    # YOLOv5 모델 실행
    detected_objects = run_yolov5(image_url)
    
    # 결과 반환
    return jsonify({'detected_objects': detected_objects})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
