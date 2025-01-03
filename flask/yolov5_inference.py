import requests
from io import BytesIO
from PIL import Image
import torch
import sys
from pathlib import Path
import numpy as np

# 현재 파일 경로를 기준으로 부모 디렉토리로 이동 후 yolov5 폴더를 경로에 추가
FILE = Path(__file__).resolve()
YOLOV5_ROOT = FILE.parents[1] / 'yolov5'  # yolov5 폴더 경로
if str(YOLOV5_ROOT) not in sys.path:
    sys.path.append(str(YOLOV5_ROOT))  # yolov5 경로를 시스템 경로에 추가

from models.common import DetectMultiBackend
from utils.general import non_max_suppression, scale_boxes, check_img_size
from utils.augmentations import letterbox
from utils.torch_utils import select_device

# YOLOv5 모델 실행 함수
def run_yolov5(image_url, weights='yolov5/best.pt', imgsz=640):
    # 1. 이미지 다운로드
    response = requests.get(image_url)
    img = Image.open(BytesIO(response.content))

    # 2. YOLOv5 모델 로드
    device = select_device('')  # CUDA 또는 CPU 자동 선택
    model = DetectMultiBackend(weights, device=device)  # 모델 로드
    stride, names, pt = model.stride, model.names, model.pt  # 모델에서 stride, 클래스 이름 가져오기

    # 이미지 크기 조정 (stride에 맞게 이미지 크기 확인)
    imgsz = check_img_size(imgsz, s=stride)

    # 3. 이미지 전처리 (YOLOv5 모델에 맞게 리사이즈 및 전처리)
    img_resized = letterbox(np.array(img), imgsz, stride=stride, auto=True)[0]  # 리사이즈
    img_resized = img_resized.transpose((2, 0, 1))[::-1]  # HWC to CHW, BGR to RGB
    img_resized = np.ascontiguousarray(img_resized)
    img_tensor = torch.from_numpy(img_resized).to(device).float() / 255.0  # 0 - 255 to 0.0 - 1.0 정규화

    if img_tensor.ndimension() == 3:
        img_tensor = img_tensor.unsqueeze(0)  # 배치 차원 추가

    # 4. 모델 추론
    try:
        pred = model(img_tensor, augment=False, visualize=False)  # YOLOv5 추론
    except Exception as e:
        print(f"YOLOv5 모델 실행 중 오류 발생: {str(e)}")
        raise

    pred = non_max_suppression(pred, 0.25, 0.45)  # NMS 적용

    # 5. 감지된 객체 이름 추출
    detected_objects = set()  # 중복 제거를 위해 set 사용
    for det in pred:  # 감지된 객체 리스트에서 각 객체에 대해 처리
        if len(det):
            # 좌표를 원본 이미지에 맞게 변환
            det[:, :4] = scale_boxes(img_tensor.shape[2:], det[:, :4], np.array(img).shape).round()
            for *xyxy, conf, cls in det:
                detected_objects.add(names[int(cls)])  # 감지된 객체의 이름 추가

    return list(detected_objects)  # 감지된 객체 이름들을 리스트로 반환
