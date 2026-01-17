const video = document.getElementById('webcam-preview');
const repsEl = document.getElementById('webcam-reps');
const timeEl = document.getElementById('webcam-time');
const startBtn = document.getElementById('webcam-start');
const repBtn = document.getElementById('webcam-rep');
const finishBtn = document.getElementById('webcam-finish');
const messageEl = document.getElementById('webcam-message');

const targetReps = 67;
const maxSeconds = 25;
let reps = 0;
let started = false;
let startTime = null;
let timerId = null;
let stream = null;
let autoRepActive = false;
let autoRepRafId = null;

const updateTime = () => {
  if (!started || startTime === null) return;
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const remaining = Math.max(0, maxSeconds - elapsed);
  timeEl.textContent = remaining;
  if (remaining === 0 && reps < targetReps) {
    messageEl.textContent = 'Too slow. Try again!';
    started = false;
    startTime = null;
  }
};

const startCamera = async () => {
  if (started) return;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    video.srcObject = stream;
    await video.play().catch(() => {});
    messageEl.textContent = '';
    reps = 0;
    repsEl.textContent = reps;
    startTime = Date.now();
    started = true;
    if (timerId) clearInterval(timerId);
    timerId = setInterval(updateTime, 200);
    startAutoRepDetection();
  } catch (error) {
    messageEl.textContent = 'Camera blocked. Allow access to continue.';
  }
};

const startAutoRepDetection = () => {
  if (autoRepActive) return;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const width = 64;
  const height = 48;
  canvas.width = width;
  canvas.height = height;
  let lastFrame = null;
  let lastY = null;
  let direction = 'up';
  let lastRepAt = 0;

  autoRepActive = true;

  const detect = () => {
    if (!autoRepActive) return;
    if (!started || video.videoWidth === 0) {
      autoRepRafId = requestAnimationFrame(detect);
      return;
    }

    ctx.drawImage(video, 0, 0, width, height);
    const frame = ctx.getImageData(0, 0, width, height);
    const data = frame.data;

    if (lastFrame) {
      let motionCount = 0;
      let weightedY = 0;
      for (let i = 0; i < data.length; i += 4) {
        const diff =
          Math.abs(data[i] - lastFrame[i]) +
          Math.abs(data[i + 1] - lastFrame[i + 1]) +
          Math.abs(data[i + 2] - lastFrame[i + 2]);
        if (diff > 60) {
          const idx = i / 4;
          const y = Math.floor(idx / width);
          motionCount += 1;
          weightedY += y;
        }
      }

      if (motionCount > 40) {
        const centroidY = weightedY / motionCount;
        const normY = centroidY / height;
        if (lastY !== null) {
          const now = Date.now();
          if (direction === 'up' && normY > 0.6 && now - lastRepAt > 600) {
            direction = 'down';
            lastRepAt = now;
            incrementRep();
          } else if (direction === 'down' && normY < 0.4 && now - lastRepAt > 600) {
            direction = 'up';
            lastRepAt = now;
            incrementRep();
          }
        }
        lastY = normY;
      }
    }

    lastFrame = new Uint8ClampedArray(data);
    autoRepRafId = requestAnimationFrame(detect);
  };

  autoRepRafId = requestAnimationFrame(detect);
};

const incrementRep = () => {
  if (!started) return;
  reps += 1;
  repsEl.textContent = reps;
  if (reps >= targetReps) {
    messageEl.textContent = 'Nice! Break complete.';
    chrome.runtime.sendMessage({ type: 'WEBCAM_COMPLETED' });
    window.close();
  }
};

startBtn.addEventListener('click', startCamera);
repBtn.addEventListener('click', incrementRep);
finishBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'WEBCAM_COMPLETED' });
  window.close();
});

window.addEventListener('keydown', (event) => {
  if (event.code === 'Space') {
    event.preventDefault();
    incrementRep();
  }
});

window.addEventListener('beforeunload', () => {
  if (autoRepRafId) cancelAnimationFrame(autoRepRafId);
  autoRepActive = false;
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
});

startCamera();
