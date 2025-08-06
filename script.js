// URL สำหรับโมเดล (ปรับเปลี่ยนตามที่คุณโฮสต์ไฟล์)
const modelURL = 'model/model.json';
const metadataURL = 'metadata.json';

let model, maxPredictions;
let webcamElement = document.getElementById('webcam');
let webcamBtn = document.getElementById('webcamBtn');
let captureBtn = document.getElementById('captureBtn');
let toggleWebcamBtn = document.getElementById('toggleWebcamBtn');
let webcamActive = false;
let webcamStream = null;

// โหลดโมเดลเมื่อหน้าเว็บโหลดเสร็จ
window.addEventListener('DOMContentLoaded', async () => {
    const modelInfo = await fetch(metadataURL).then(response => response.json());
    maxPredictions = modelInfo.labels.length;
    
    model = await tmImage.load(modelURL, metadataURL);
    console.log('Model loaded successfully');
    
    // ตั้งค่าการอัปโหลดไฟล์
    document.getElementById('imageUpload').addEventListener('change', handleImageUpload);
    
    // ตั้งค่าปุ่มกล้อง
    webcamBtn.addEventListener('click', enableWebcam);
    captureBtn.addEventListener('click', captureImage);
    toggleWebcamBtn.addEventListener('click', toggleWebcamMode);
});

// ฟังก์ชันจัดการการอัปโหลดภาพ
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('imagePreview');
        preview.src = e.target.result;
        preview.style.display = 'block';
        
        // ทำนายภาพเมื่อโหลดเสร็จ
        preview.onload = function() {
            predict(preview);
        };
    };
    reader.readAsDataURL(file);
}

// ฟังก์ชันทำนายภาพ
async function predict(imageElement) {
    if (!model) {
        console.error('Model not loaded yet');
        return;
    }
    
    const prediction = await model.predict(imageElement);
    displayResults(prediction);
}

// แสดงผลลัพธ์การทำนาย
function displayResults(predictions) {
    const resultsContainer = document.getElementById('predictionResults');
    resultsContainer.innerHTML = '';
    
    // เรียงลำดับความน่าจะเป็นจากมากไปน้อย
    predictions.sort((a, b) => b.probability - a.probability);
    
    predictions.forEach(pred => {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'result-item';
        
        const labelSpan = document.createElement('span');
        labelSpan.className = 'label';
        labelSpan.textContent = pred.className;
        
        const probSpan = document.createElement('span');
        probSpan.className = 'probability';
        probSpan.textContent = `${(pred.probability * 100).toFixed(1)}%`;
        
        const barContainer = document.createElement('div');
        barContainer.className = 'bar-container';
        
        const bar = document.createElement('div');
        bar.className = 'bar';
        bar.style.width = `${pred.probability * 100}%`;
        
        barContainer.appendChild(bar);
        resultDiv.appendChild(labelSpan);
        resultDiv.appendChild(probSpan);
        resultDiv.appendChild(barContainer);
        
        resultsContainer.appendChild(resultDiv);
    });
}

// เปิดใช้งานกล้อง
async function enableWebcam() {
    try {
        webcamStream = await navigator.mediaDevices.getUserMedia({ video: true });
        webcamElement.srcObject = webcamStream;
        webcamBtn.style.display = 'none';
        captureBtn.style.display = 'block';
    } catch (err) {
        console.error('Error accessing webcam:', err);
        alert('ไม่สามารถเข้าถึงกล้องได้: ' + err.message);
    }
}

// ถ่ายภาพจากกล้อง
function captureImage() {
    const preview = document.getElementById('imagePreview');
    const canvas = document.createElement('canvas');
    canvas.width = webcamElement.videoWidth;
    canvas.height = webcamElement.videoHeight;
    canvas.getContext('2d').drawImage(webcamElement, 0, 0);
    
    preview.src = canvas.toDataURL('image/png');
    preview.style.display = 'block';
    
    // ทำนายภาพที่ถ่าย
    preview.onload = function() {
        predict(preview);
    };
}

// สลับโหมดระหว่างอัปโหลดไฟล์และกล้อง
function toggleWebcamMode() {
    const uploadContainer = document.querySelector('.upload-container');
    const webcamContainer = document.querySelector('.webcam-container');
    
    webcamActive = !webcamActive;
    
    if (webcamActive) {
        uploadContainer.style.display = 'none';
        webcamContainer.style.display = 'block';
        toggleWebcamBtn.textContent = 'อัปโหลดไฟล์แทน';
    } else {
        uploadContainer.style.display = 'block';
        webcamContainer.style.display = 'none';
        toggleWebcamBtn.textContent = 'ใช้กล้องแทน';
        
        // ปิดสตรีมกล้องถ้ามี
        if (webcamStream) {
            webcamStream.getTracks().forEach(track => track.stop());
            webcamStream = null;
            webcamElement.srcObject = null;
            webcamBtn.style.display = 'block';
            captureBtn.style.display = 'none';
        }
    }
}