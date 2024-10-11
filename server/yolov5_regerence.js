const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// YOLOv5 모델 실행 함수
async function runYolov5(imageUrl) {
    const imagePath = path.join(__dirname, 'temp_image.jpg');
    
    // 이미지 다운로드
    const response = await axios.get(imageUrl, { responseType: 'stream' });
    const writer = fs.createWriteStream(imagePath);
    response.data.pipe(writer);

    // 다운로드 완료 후 YOLOv5 실행
    return new Promise((resolve, reject) => {
        writer.on('finish', () => {
            exec(`python yolov5/detect.py --source ${imagePath} --weights yolov5/yolov5s.pt`, (error, stdout) => {
                if (error) {
                    reject(`YOLOv5 실행 중 오류 발생: ${error.message}`);
                }
                // 결과 파싱
                const detectedObjects = parseYolov5Output(stdout);
                resolve(detectedObjects);
            });
        });
        writer.on('error', reject);
    });
}

// YOLOv5 출력 파싱 함수
function parseYolov5Output(output) {
    const detectedObjects = [];
    const lines = output.split('\n');
    for (const line of lines) {
        if (line.includes('label')) {
            const object = line.split(' ')[1];  // 감지된 객체 이름 추출
            detectedObjects.push(object);
        }
    }
    return detectedObjects;
}

module.exports = { runYolov5 };
