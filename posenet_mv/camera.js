const box = document.querySelector(".box");
const currentStyle = window.getComputedStyle(box);
let currentLeft = parseInt(currentStyle.left, 10);
let currentRotation = 0;
let isRightHandRaisedPreviously = false;
const rotateBox = (angle) => {
  const box = document.getElementById('box');
  currentRotation += angle;
  box.style.transform = `rotate(${currentRotation}deg)`;
};
const loadModel = async () => {
  const net = await posenet.load();
  return net;
};

const setupCamera = async () => {
  const video = document.getElementById("video");
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;

  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video);
    };
  });
};

let lastLeftWristPosition = { x: null, y: null };
let lastRightWristPosition = { x: null, y: null };
const moveThreshold = 40;

const detectPoseInRealTime = async (video, net) => {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    let lastPoseDetectionTime = Date.now();
    const poseDetectionInterval = 200; // 인식 간격

    const poseDetectionFrame = async () => {
        requestAnimationFrame(poseDetectionFrame);
        const currentTime = Date.now();
        const pose = await net.estimateSinglePose(video, { flipHorizontal: false });
        if (currentTime - lastPoseDetectionTime > poseDetectionInterval) {
            lastPoseDetectionTime = currentTime;
            

            if (pose.score > 0.1) {
                const leftShoulder = pose.keypoints.find(point => point.part === 'leftShoulder');
                const leftElbow = pose.keypoints.find(point => point.part === 'leftElbow');
                const leftWrist = pose.keypoints.find(point => point.part === 'leftWrist');
                const rightShoulder = pose.keypoints.find(point => point.part === 'rightShoulder');
                const rightElbow = pose.keypoints.find(point => point.part === 'rightElbow');
                const rightWrist = pose.keypoints.find(point => point.part === 'rightWrist');
                const rightEye = pose.keypoints.find(point => point.part === 'rightEye');
                const leftEye = pose.keypoints.find(point => point.part === 'leftEye');
                const leftArmAngle = calculateAngle(leftShoulder.position, leftElbow.position, leftWrist.position);
                const rightArmAngle = calculateAngle(rightShoulder.position, rightElbow.position, rightWrist.position);
                const eyeAvg = (rightEye.position.y + leftEye.position.y) / 2;
                const isRightHandRaised = rightWrist.position.y < eyeAvg - 100;
                console.log(isRightHandRaised)
                if (isRightHandRaised && !isRightHandRaisedPreviously) {
                  rotateBox(30);
                  console.log('회전 드가자~');
                  isRightHandRaisedPreviously = true;
              } else if (!isRightHandRaised && isRightHandRaisedPreviously) {
                  isRightHandRaisedPreviously = false;
              }
                
                if (lastLeftWristPosition.x != null && lastLeftWristPosition.y != null) {
                    const leftMoveDistance = distance(lastLeftWristPosition, leftWrist.position);
                    if (leftArmAngle > 120 && leftArmAngle < 180 && leftMoveDistance > moveThreshold) {
                        console.log('왼쪽 으로 움직임')
                        moveLeft();
                    }
                }
                lastLeftWristPosition = leftWrist.position;

                if (lastRightWristPosition.x != null && lastRightWristPosition.y != null) {
                    const rightMoveDistance = distance(lastRightWristPosition, rightWrist.position);
                    if (rightArmAngle > 120 && rightArmAngle < 180 && rightMoveDistance > moveThreshold && !isRightHandRaised) {
                      console.log('오른쪽 으로 움직임')
                        moveRight();
                    }
                }
                lastRightWristPosition = rightWrist.position;
            }
        }
        drawCanvas(pose, video, ctx);
    };

    poseDetectionFrame();
};

const distance = (point1, point2) => {
  const xDiff = point2.x - point1.x;
  const yDiff = point2.y - point1.y;
  return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
};

const drawCanvas = (pose, video, ctx) => {
  ctx.clearRect(0, 0, video.width, video.height);
  ctx.drawImage(video, 0, 0, video.width, video.height);

  pose.keypoints.forEach((keypoint) => {
    if (keypoint.score > 0.2) {
      ctx.beginPath();
      ctx.arc(keypoint.position.x, keypoint.position.y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = "red";
      ctx.fill();
    }
  });

  const adjacentKeyPoints = posenet.getAdjacentKeyPoints(pose.keypoints, 0.2);
  adjacentKeyPoints.forEach((keypoints) => {
    ctx.beginPath();
    ctx.moveTo(keypoints[0].position.x, keypoints[0].position.y);
    ctx.lineTo(keypoints[1].position.x, keypoints[1].position.y);
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 2;
    ctx.stroke();
  });
};

const main = async () => {
  const net = await loadModel();
  const video = await setupCamera();
  video.play();
  detectPoseInRealTime(video, net);
};

main();

const moveLeft = () => {
  if (currentLeft - 10 < 0) return;
  box.style.left = `${currentLeft -= 10}px`;
};

const moveRight = () => {
  box.style.left = `${currentLeft += 10}px`;
};

const calculateAngle = (A, B, C) => {
  const AB = Math.sqrt(Math.pow(B.x - A.x, 2) + Math.pow(B.y - A.y, 2));    
  const BC = Math.sqrt(Math.pow(B.x - C.x, 2) + Math.pow(B.y - C.y, 2)); 
  const AC = Math.sqrt(Math.pow(C.x - A.x, 2) + Math.pow(C.y - A.y, 2));
  return Math.acos((BC * BC + AB * AB - AC * AC) / (2 * BC * AB)) * (180 / Math.PI);
};
