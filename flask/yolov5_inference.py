import requests
from io import BytesIO
from PIL import Image
import torch
from models.common import DetectMultiBackend
from utils.general import non_max_suppression, scale_coords
from utils.augmentations import letterbox
import numpy as np

# YOLOv5 모델 실행 함수
def run_yolov5(image_url, weights='yolov5/yolov5s.pt'):
    # 1. 이미지 다운로드
    response = requests.get(image_url)
    img = Image.open(BytesIO(response.content))

    # 2. YOLOv5 모델 로드
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = DetectMultiBackend(weights, device=device)
    stride, names, pt = model.stride, model.names, model.pt  # 모델에서 stride, 클래스 이름 가져오기

    # 3. 이미지 전처리 (YOLOv5 모델에 맞게 리사이즈 및 전처리)
    img_resized = letterbox(np.array(img), 640, stride=stride, auto=True)[0]  # 리사이즈
    img_resized = img_resized.transpose((2, 0, 1))[::-1]  # HWC to CHW, BGR to RGB
    img_resized = np.ascontiguousarray(img_resized)
    img_tensor = torch.from_numpy(img_resized).to(device).float()
    img_tensor /= 255.0  # 0 - 255 to 0.0 - 1.0

    if img_tensor.ndimension() == 3:
        img_tensor = img_tensor.unsqueeze(0)

    # 4. 모델 추론
    pred = model(img_tensor, augment=False, visualize=False)
    pred = non_max_suppression(pred, 0.25, 0.45, agnostic=False)  # NMS 수행

    # 5. 감지된 객체 이름 추출
    detected_objects = set()  # 중복 제거를 위해 set 사용
    for det in pred:  # 감지된 객체 리스트에서 각 객체에 대해 처리
        if len(det):
            # 좌표를 원본 이미지에 맞게 변환
            det[:, :4] = scale_coords(img_tensor.shape[2:], det[:, :4], np.array(img).shape).round()
            for *xyxy, conf, cls in det:
                detected_objects.add(names[int(cls)])  # 감지된 객체의 이름 추가

    return list(detected_objects)  # 감지된 객체 이름들을 리스트로 반환
