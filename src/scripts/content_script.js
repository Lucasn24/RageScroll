// Content Script for RageBreak
// Tracks user activity and displays overlay when needed

console.log("RageBreak Content Script: LOADED");

let activityTimeout;
let overlayShown = false;
let activityDetected = false;
let alarmAudioContext = null;
let alarmIntervalId = null;
let flyIntervalId = null;
let warningIntervalId = null;
let webcamStream = null;
let webcamAutoRepActive = false;
let webcamAutoRepRafId = null;
let audioUnlocked = false;

function safeSendMessage(message) {
  if (!chrome.runtime?.id) {
    return null;
  }
  try {
    const result = chrome.runtime.sendMessage(message);
    if (result && typeof result.catch === "function") {
      result.catch(() => {});
    }
    return result;
  } catch (error) {
    // Ignore errors if the extension context was reloaded/invalidated
    return null;
  }
}

// Throttle activity detection to avoid spamming service worker
const throttledActivityDetection = throttle(() => {
  console.log("RageBreak: Sending activity detected");
  safeSendMessage({ type: "ACTIVITY_DETECTED" });
}, 5000); // Send activity update every 5 seconds max

// Track user activity
function trackActivity() {
  if (overlayShown) return;

  activityDetected = true;
  unlockAudioContext();
  console.log("RageBreak Content: Activity detected");
  throttledActivityDetection();
}

function unlockAudioContext() {
  if (audioUnlocked) return;
  try {
    alarmAudioContext =
      alarmAudioContext ||
      new (window.AudioContext || window.webkitAudioContext)();
    if (alarmAudioContext.state === "suspended") {
      alarmAudioContext.resume();
    }
    audioUnlocked = true;
  } catch (error) {
    // Ignore audio unlock errors
  }
}

// Add event listeners for activity tracking
document.addEventListener("scroll", trackActivity, { passive: true });
document.addEventListener("click", trackActivity);
document.addEventListener("keypress", trackActivity);
document.addEventListener("mousemove", throttle(trackActivity, 2000), {
  passive: true,
});

// Listen for messages from service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("RageBreak Content: Received message:", message.type);

  if (message.type === "SHOW_BREAK") {
    console.log("RageBreak Content: Showing break overlay");
    if (!overlayShown) {
      showBreakOverlay();
    } else {
      console.log("RageBreak Content: Overlay already shown");
    }
  } else if (message.type === "CLOSE_OVERLAY") {
    if (overlayShown) {
      closeOverlay("webcam");
    }
  }
});

// Check on page load if we should show a break
async function checkInitialBreak() {
  try {
    const response = await safeSendMessage({
      type: "CHECK_SHOULD_SHOW_BREAK",
    });

    if (response && response.shouldShow) {
      showBreakOverlay();
    }
  } catch (error) {
    console.error("RageBreak: Error checking initial break:", error);
  }
}

// Show the break overlay
function showBreakOverlay() {
  if (overlayShown) {
    console.log("RageBreak: Overlay already shown, skipping");
    return;
  }

  console.log("RageBreak: Creating break overlay");
  overlayShown = true;

  // Randomly select a game
  const games = ["wordle", "sudoku", "memory", "snake", "math", "webcam", "2048"];
  const randomGame = games[Math.floor(Math.random() * games.length)];
  console.log("RageBreak: Randomly selected game:", randomGame);

  // Create overlay container
  const overlay = document.createElement("div");
  overlay.id = "ragebreak-overlay";
  overlay.className = "ragebreak-overlay";
  overlay.classList.add("annoying", "shake");

  // Create overlay content (without game selector)
  overlay.innerHTML = `
    <div class="ragebreak-content">
      <div class="ragebreak-header">
        <div class="ragebreak-siren">Solve now!</div>
        <h1>Still Scrolling?</h1>
        <h3>
            You've been here long enough.<br/>
            Prove you deserve the next scroll.<br/>
        </h3>
        <p>
            Beat this. Or stay stuck here forever.
        </p>
      </div>
      
      <div id="ragebreak-game-container"></div>
    </div>
  `;
  console.log("RageBreak: Overlay added to page");

  // Append overlay to document
  console.log("RageBreak: About to append overlay to body");
  console.log("RageBreak: document.body:", document.body);
  console.log("RageBreak: overlay element:", overlay);

  document.body.appendChild(overlay);
  console.log("RageBreak: Overlay appended to document body");

  // Check if overlay is in the DOM
  const checkOverlay = document.getElementById("ragebreak-overlay");
  console.log("RageBreak: Overlay found in DOM:", checkOverlay);
  console.log(
    "RageBreak: Overlay computed style display:",
    window.getComputedStyle(checkOverlay).display,
  );
  console.log(
    "RageBreak: Overlay computed style visibility:",
    window.getComputedStyle(checkOverlay).visibility,
  );

  // Prevent scrolling on body
  document.body.style.overflow = "hidden";
  console.log("RageBreak: Body overflow set to hidden");

  startAlarmSound();
  startFlyingStuff(overlay);
  startAnnoyances(overlay);
  
  // Add click listener to resume audio on any user interaction
  const resumeAudio = () => {
    if (alarmAudioContext && alarmAudioContext.state === 'suspended') {
      alarmAudioContext.resume().then(() => {
        console.log('RageBreak: Audio context resumed after user interaction');
      }).catch(() => {});
    }
    overlay.removeEventListener('click', resumeAudio);
    document.removeEventListener('keydown', resumeAudio);
  };
  overlay.addEventListener('click', resumeAudio);
  document.addEventListener('keydown', resumeAudio);

  // Start the randomly selected game immediately
  const container = document.getElementById("ragebreak-game-container");
  startGame(randomGame, container);
}

// Start selected game
function startGame(gameType, container) {
  if (!container) {
    container = document.getElementById("ragebreak-game-container");
  }

  if (gameType === "wordle") {
    initWordle(container);
  } else if (gameType === "sudoku") {
    initSudoku(container);
  } else if (gameType === "memory") {
    initMemoryMatch(container);
  } else if (gameType === "webcam") {
    initWebcamChallenge(container);
  } else if (gameType === "snake") {
    initSnake(container);
  } else if (gameType === "math") {
    initMath(container);
  } else if (gameType === "2048") {
    init2048(container);
  }
}

// Close overlay and notify service worker
async function closeOverlay(gameType) {
  if (gameType) {
    showCelebration(gameType);
  }
  const overlay = document.getElementById("ragebreak-overlay");
  if (overlay) {
    overlay.remove();
  }

  overlayShown = false;
  document.body.style.overflow = "";

  stopAlarmSound();
  stopFlyingStuff();
  stopAnnoyances();
  stopWebcamStream();

  // Record stats
  if (gameType) {
    await recordStats(gameType);
  }

  // Notify service worker that break is completed
  safeSendMessage({ type: "BREAK_COMPLETED" });
}

function showCelebration(gameType) {
  playCelebrationSound();
  const celebration = document.createElement("div");
  celebration.className = "ragebreak-celebration";
  celebration.innerHTML = `
    <div class="celebration-card">
      <div class="celebration-title">🎉 Break Complete!</div>
      <div class="celebration-subtitle">Nice work finishing ${gameType}.</div>
    </div>
  `;
  document.body.appendChild(celebration);

  const floaters = ["🎊", "✨", "🎉", "💫", "🥳", "⭐", "🎈"];
  for (let i = 0; i < 16; i += 1) {
    const floater = document.createElement("div");
    floater.className = "celebration-floater";
    floater.textContent = floaters[i % floaters.length];
    floater.style.left = `${Math.random() * 100}%`;
    floater.style.animationDelay = `${Math.random() * 0.4}s`;
    floater.style.fontSize = `${18 + Math.random() * 20}px`;
    celebration.appendChild(floater);
  }

  setTimeout(() => {
    celebration.remove();
  }, 1400);
}

function playCelebrationSound() {
  try {
    const audioUrl = chrome.runtime.getURL("assets/yay-6326.mp3");
    const audio = new Audio(audioUrl);
    audio.volume = 0.8;
    audio.play().catch(() => {
      const audioCtx =
        alarmAudioContext ||
        new (window.AudioContext || window.webkitAudioContext)();
      alarmAudioContext = audioCtx;
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }

      const now = audioCtx.currentTime;
      const master = audioCtx.createGain();
      master.gain.setValueAtTime(0.001, now);
      master.gain.exponentialRampToValueAtTime(0.22, now + 0.03);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
      master.connect(audioCtx.destination);

      const source = audioCtx.createOscillator();
      source.type = "sawtooth";
      source.frequency.setValueAtTime(220, now);
      source.frequency.exponentialRampToValueAtTime(330, now + 0.25);
      source.frequency.exponentialRampToValueAtTime(440, now + 0.7);

      const formantA = audioCtx.createBiquadFilter();
      formantA.type = "bandpass";
      formantA.frequency.setValueAtTime(700, now);
      formantA.Q.value = 9;

      const formantB = audioCtx.createBiquadFilter();
      formantB.type = "bandpass";
      formantB.frequency.setValueAtTime(1200, now);
      formantB.Q.value = 10;

      const formantC = audioCtx.createBiquadFilter();
      formantC.type = "bandpass";
      formantC.frequency.setValueAtTime(2600, now);
      formantC.Q.value = 12;

      const mixA = audioCtx.createGain();
      const mixB = audioCtx.createGain();
      const mixC = audioCtx.createGain();
      mixA.gain.value = 0.6;
      mixB.gain.value = 0.5;
      mixC.gain.value = 0.3;

      source.connect(formantA);
      source.connect(formantB);
      source.connect(formantC);
      formantA.connect(mixA);
      formantB.connect(mixB);
      formantC.connect(mixC);
      mixA.connect(master);
      mixB.connect(master);
      mixC.connect(master);

      source.start(now);
      source.stop(now + 1.6);
    });
  } catch (error) {
    console.warn("RageBreak: Unable to play celebration sound", error);
  }
}

function stopWebcamStream() {
  if (webcamAutoRepRafId) {
    cancelAnimationFrame(webcamAutoRepRafId);
    webcamAutoRepRafId = null;
  }
  webcamAutoRepActive = false;
  if (webcamStream) {
    webcamStream.getTracks().forEach((track) => track.stop());
    webcamStream = null;
  }
}

function startAnnoyances(overlay) {
  const banner = document.createElement("div");
  banner.className = "ragebreak-banner";
  banner.textContent = "Solve it now";
  overlay.appendChild(banner);

  const warningStack = document.createElement("div");
  warningStack.className = "ragebreak-warning-stack";
  warningStack.dataset.ragebreakWarningStack = "true";
  overlay.appendChild(warningStack);

  const warnings = [
    "⚠️ Focus!",
    "⏱️ Break time",
    "🚨 Stop scrolling",
    "❗ Solve the puzzle",
    "🔔 Pay attention",
  ];
  const positions = [
    { top: "8%", left: "6%" },
    { top: "8%", right: "6%" },
    { bottom: "10%", left: "6%" },
    { bottom: "10%", right: "6%" },
  ];

  const spawnWarning = () => {
    const warning = document.createElement("div");
    warning.className = "ragebreak-warning";
    warning.textContent = warnings[Math.floor(Math.random() * warnings.length)];
    const pos = positions[Math.floor(Math.random() * positions.length)];
    Object.assign(warning.style, pos);
    warningStack.appendChild(warning);
    setTimeout(() => warning.remove(), 1600);
  };

  spawnWarning();
  warningIntervalId = setInterval(spawnWarning, 800);
}

function stopAnnoyances() {
  if (warningIntervalId) {
    clearInterval(warningIntervalId);
    warningIntervalId = null;
  }
  const warningStack = document.querySelector(
    '[data-ragebreak-warning-stack="true"]',
  );
  if (warningStack) {
    warningStack.remove();
  }
  const banner = document.querySelector(".ragebreak-banner");
  if (banner) {
    banner.remove();
  }
}

function startFlyingStuff(overlay) {
  if (flyIntervalId) return;
  const layer = document.createElement("div");
  layer.className = "ragebreak-fly-layer";
  layer.dataset.ragebreakFlyLayer = "true";
  overlay.appendChild(layer);

  const items = [
    "💥",
    "⚡",
    "🚨",
    "🔊",
    "💣",
    "👾",
    "🌀",
    "🔥",
    "😵",
    "💫",
    "🔔",
  ];

  const spawn = () => {
    const item = document.createElement("div");
    item.className = "ragebreak-fly-item";
    item.textContent = items[Math.floor(Math.random() * items.length)];
    const size = Math.floor(Math.random() * 28) + 20;
    const top = Math.floor(Math.random() * 80) + 5;
    const duration = Math.floor(Math.random() * 6) + 6;
    item.style.fontSize = `${size}px`;
    item.style.top = `${top}%`;
    item.style.animationDuration = `${duration}s`;
    layer.appendChild(item);
    item.addEventListener("animationend", () => {
      item.remove();
    });
  };

  spawn();
  flyIntervalId = setInterval(spawn, 700);
}

function stopFlyingStuff() {
  if (flyIntervalId) {
    clearInterval(flyIntervalId);
    flyIntervalId = null;
  }
  const layer = document.querySelector('[data-ragebreak-fly-layer="true"]');
  if (layer) {
    layer.remove();
  }
}

async function startAlarmSound() {
  if (alarmIntervalId) return;
  try {
    alarmAudioContext =
      alarmAudioContext ||
      new (window.AudioContext || window.webkitAudioContext)();
    
    // Resume AudioContext if suspended (required for autoplay policy)
    if (alarmAudioContext.state === 'suspended') {
      await alarmAudioContext.resume();
    }
    
    let toggle = false;
    const beep = () => {
      // Check if context is running before playing
      if (alarmAudioContext.state !== 'running') {
        alarmAudioContext.resume().catch(() => {});
      }
      
      toggle = !toggle;
      const oscillator = alarmAudioContext.createOscillator();
      const gainNode = alarmAudioContext.createGain();
      oscillator.type = "sawtooth";
      oscillator.frequency.value = toggle ? 1600 : 900;
      gainNode.gain.value = 0.3;
      oscillator.connect(gainNode);
      gainNode.connect(alarmAudioContext.destination);
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        oscillator.disconnect();
        gainNode.disconnect();
      }, 1500);
    };

    beep();
    alarmIntervalId = setInterval(beep, 2200);
  } catch (error) {
    console.warn("RageBreak: Unable to play alarm sound", error);
  }
}

function stopAlarmSound() {
  if (alarmIntervalId) {
    clearInterval(alarmIntervalId);
    alarmIntervalId = null;
  }
  if (alarmAudioContext && alarmAudioContext.state === "running") {
    alarmAudioContext.suspend();
  }
}

// Record statistics
async function recordStats(gameType) {
  try {
    const result = await chrome.storage.local.get("ragebreak_stats");
    const stats = result.ragebreak_stats || {
      totalBreaks: 0,
      gamesPlayed: {
        wordle: 0,
        sudoku: 0,
        memory: 0,
        snake: 0,
        math: 0,
        webcam: 0,
        "2048": 0,
      },
      currentStreak: 0,
      longestStreak: 0,
      lastBreakDate: null,
      dailyBreaks: {},
    };

    const today = new Date().toDateString();

    // Update counts
    stats.totalBreaks++;
    stats.gamesPlayed[gameType] = (stats.gamesPlayed[gameType] || 0) + 1;

    // Update daily breaks
    if (!stats.dailyBreaks[today]) {
      stats.dailyBreaks[today] = 0;
    }
    stats.dailyBreaks[today]++;

    // Update streak
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (stats.lastBreakDate === yesterday) {
      stats.currentStreak++;
    } else if (stats.lastBreakDate !== today) {
      stats.currentStreak = 1;
    }

    stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak);
    stats.lastBreakDate = today;

    await chrome.storage.local.set({ ragebreak_stats: stats });
  } catch (error) {
    console.error("Error recording stats:", error);
  }
}

// Utility: Throttle function
function throttle(func, delay) {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

// Initialize
checkInitialBreak();
