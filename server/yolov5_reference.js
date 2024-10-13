const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// YOLOv5 모델 실행 함수
async function runYolov5(imageUrl) {
    const imagePath = path.join(__dirname, 'temp_image.jpg');
    
    // 이미지 다운로드
    try {
        const response = await axios.get(imageUrl, { responseType: 'stream' });
        const writer = fs.createWriteStream(imagePath);
        
        response.data.pipe(writer);

        // 다운로드 완료 후 YOLOv5 실행
        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                const yolov5Path = path.resolve(__dirname, './flask/yolov5_inference.py');
                
                // YOLOv5 실행
                exec(`python ${yolov5Path} --source ${imagePath} --weights ./yolov5/yolov5s.pt`, (error, stdout, stderr) => {
                    if (error) {
                        const errMessage = `YOLOv5 실행 중 오류 발생: ${error.message}`;
                        console.error(errMessage);
                        return reject(errMessage);
                    }
                    if (stderr) {
                        const errMessage = `YOLOv5 오류 출력: ${stderr}`;
                        console.error(errMessage);
                        return reject(errMessage);
                    }

                    // 결과 파싱
                    try {
                        const detectedObjects = parseYolov5Output(stdout);
                        resolve(detectedObjects);
                    } catch (parseError) {
                        const errMessage = `YOLOv5 출력 파싱 중 오류 발생: ${parseError.message}`;
                        console.error(errMessage);
                        reject(errMessage);
                    }
                });
            });
            writer.on('error', (writeError) => {
                const errMessage = `이미지 파일 작성 중 오류 발생: ${writeError.message}`;
                console.error(errMessage);
                reject(errMessage);
            });
        });

    } catch (downloadError) {
        const errMessage = `이미지 다운로드 중 오류 발생: ${downloadError.message}`;
        console.error(errMessage);
        throw new Error(errMessage);
    }
}

// YOLOv5 출력 파싱 함수
function parseYolov5Output(output) {
    const detectedObjects = [];
    const lines = output.split('\n');


    // 출력 파싱 중 에러 발생 시 예외 처리
    try {
        for (const line of lines) {
            if (line.includes('label')) {
                const object = line.split(' ')[1];  // 감지된 객체 이름 추출
                detectedObjects.push(object);
            }
        }
    } catch (parseError) {
        throw new Error(`출력 파싱 중 오류 발생: ${parseError.message}`);
    }

    if (detectedObjects.length === 0) {
        throw new Error('YOLOv5 감지 결과에서 객체를 찾을 수 없습니다.');
    }

    return detectedObjects;
}

module.exports = { runYolov5 };
