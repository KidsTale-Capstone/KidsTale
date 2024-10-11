import requests
from io import BytesIO
from PIL import Image
import torch
from models.common import DetectMultiBackend
from utils.general import non_max_suppression
import numpy as np

# 감지된 객체를 저장할 셋
OBJ_SET = set()

# Supabase에서 다운로드한 이미지 처리 함수
def download_image_from_url(url):
    response = requests.get(url)
    img = Image.open(BytesIO(response.content))
    return img

# YOLOv5 모델 실행 함수
def run_yolov5(image_url, weights='yolov5/yolov5s.pt'):
    # 이미지 다운로드
    img = download_image_from_url(image_url)

    # YOLOv5 모델 로드
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = DetectMultiBackend(weights, device=device)

    # 이미지 전처리 (YOLOv5 모델에 맞게 640x640으로 리사이징)
    img_resized = img.resize((640, 640))
    img_tensor = torch.from_numpy(np.array(img_resized)).float().div(255.0).permute(2, 0, 1).unsqueeze(0).to(device)

    # 모델을 이용해 예측 수행
    pred = model(img_tensor)
    pred = non_max_suppression(pred)

    # 감지된 객체 이름을 OBJ_SET에 저장
    for det in pred:
        if len(det):
            for c in det[:, 5].unique():
                OBJ_SET.add(model.names[int(c)])

    return list(OBJ_SET)  # 리스트 형태로 반환
