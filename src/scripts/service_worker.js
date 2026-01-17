// Service Worker for RageBreak Extension
// Manages timing, state, and communication between popup and content scripts

console.log("RageBreak Service Worker: LOADED");

// Default settings
const DEFAULT_SETTINGS = {
  enabled: true,
  breakInterval: 10, // seconds
  activeDomains: ["*"], // '*' means all domains
  lastBreakTime: 0,
  activityStartTime: 0,
  isActive: false,
  lastActiveTabId: null,
};

// Initialize extension on install
chrome.runtime.onInstalled.addListener(async () => {
  console.log("RageBreak: Extension installed/updated");
  const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  if (!settings.breakInterval) {
    console.log("RageBreak: Initializing default settings");
    const now = Date.now();
    await chrome.storage.sync.set({
      ...DEFAULT_SETTINGS,
      lastBreakTime: now,
      activityStartTime: 0,
    });
  }
  updateBadge();
});

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("RageBreak: Received message:", message.type);

  if (message.type === "ACTIVITY_DETECTED") {
    handleActivityDetected(sender.tab.id);
  } else if (message.type === "OPEN_WEBCAM_WINDOW") {
    openWebcamWindow().then(sendResponse);
    return true;
  } else if (message.type === "GET_TIME_REMAINING") {
    getTimeRemaining().then((response) => {
      console.log("RageBreak: Sending time remaining:", response);
      sendResponse(response);
    });
    return true; // Async response
  } else if (message.type === "RESTART_COUNTDOWN") {
    restartCountdown().then(sendResponse);
    return true;
  } else if (message.type === "BREAK_COMPLETED") {
    handleBreakCompleted();
  } else if (message.type === "WEBCAM_COMPLETED") {
    handleBreakCompleted();
    notifyCloseOverlay();
  } else if (message.type === "CHECK_SHOULD_SHOW_BREAK") {
    checkShouldShowBreak(sender.tab.url).then(sendResponse);
    return true; // Async response
  }
});

// Handle activity detection from content script
async function handleActivityDetected(tabId) {
  const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);

  if (!settings.enabled) {
    console.log("RageBreak: Extension disabled, ignoring activity");
    return;
  }

  const now = Date.now();

  // Initialize activity start time if not set
  if (!settings.activityStartTime || settings.activityStartTime === 0) {
    console.log("RageBreak: First activity detected, starting timer");
    await chrome.storage.sync.set({
      activityStartTime: now,
      lastBreakTime: now,
      isActive: true,
      lastActiveTabId: tabId,
    });
    return;
  }

  await chrome.storage.sync.set({ lastActiveTabId: tabId });

  // Check if it's time for a break
  const timeSinceLastBreak = now - (settings.lastBreakTime || now);
  const breakIntervalMs = settings.breakInterval * 1000;

  console.log("RageBreak: Activity check -", {
    timeSinceLastBreak: Math.floor(timeSinceLastBreak / 1000) + "s",
    breakInterval: Math.floor(breakIntervalMs / 1000) + "s",
    shouldBreak: timeSinceLastBreak >= breakIntervalMs,
  });

  if (timeSinceLastBreak >= breakIntervalMs) {
    // Trigger break
    console.log("RageBreak: Triggering break for tab", tabId);
    try {
      await chrome.tabs.sendMessage(tabId, { type: "SHOW_BREAK" });
      console.log("RageBreak: Break message sent successfully");

      // Reset the break timer
      await chrome.storage.sync.set({ lastBreakTime: now });
      console.log("RageBreak: Break timer reset");
    } catch (error) {
      console.error("RageBreak: Error sending break message:", error);
    }
  }
}

// Check if break should be shown for current URL
async function checkShouldShowBreak(url) {
  const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);

  if (!settings.enabled) return { shouldShow: false };

  // Check if current domain matches active domains
  const currentDomain = new URL(url).hostname;
  const isMatched = settings.activeDomains.some((pattern) => {
    if (pattern === "*") return true;
    return currentDomain.includes(pattern);
  });

  if (!isMatched) return { shouldShow: false };

  const now = Date.now();
  const timeSinceLastBreak = now - (settings.lastBreakTime || 0);
  const breakIntervalMs = settings.breakInterval * 1000;

  return {
    shouldShow: timeSinceLastBreak >= breakIntervalMs,
    timeRemaining: Math.max(0, breakIntervalMs - timeSinceLastBreak),
  };
}

// Get time remaining until next break
async function getTimeRemaining() {
  const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);

  if (!settings.enabled) {
    return {
      timeRemaining: 0,
      isActive: false,
      enabled: false,
    };
  }

  const now = Date.now();
  const lastBreakTime = settings.lastBreakTime || now;
  const activityStartTime = settings.activityStartTime || now;
  const breakIntervalMs = settings.breakInterval * 1000;

  // If no activity has been recorded yet
  if (!settings.activityStartTime || settings.activityStartTime === 0) {
    return {
      timeRemaining: breakIntervalMs,
      isActive: false,
      enabled: true,
      breakInterval: settings.breakInterval,
    };
  }

  const timeSinceLastBreak = now - lastBreakTime;
  const timeRemaining = Math.max(0, breakIntervalMs - timeSinceLastBreak);

  return {
    timeRemaining,
    isActive: true,
    enabled: true,
    breakInterval: settings.breakInterval,
  };
}

// Handle break completion
async function handleBreakCompleted() {
  const now = Date.now();
  await chrome.storage.sync.set({
    lastBreakTime: now,
    activityStartTime: now,
  });
}

async function restartCountdown() {
  await handleBreakCompleted();
  notifyCloseOverlay();
  await updateBadge();
  return { ok: true };
}

function notifyCloseOverlay() {
  chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
    if (!settings.lastActiveTabId) return;
    chrome.tabs.sendMessage(
      settings.lastActiveTabId,
      { type: "CLOSE_OVERLAY" },
      () => void chrome.runtime.lastError,
    );
  });
}

function openWebcamWindow() {
  return new Promise((resolve) => {
    const url = chrome.runtime.getURL("src/pages/webcam.html");
    chrome.windows.create(
      {
        url,
        type: "popup",
        width: 720,
        height: 620,
      },
      () => resolve({ ok: true }),
    );
  });
}

// Update badge with time remaining
async function updateBadge() {
  const result = await getTimeRemaining();

  if (!result.enabled || !result.isActive) {
    chrome.action.setBadgeText({ text: "" });
    return;
  }

  const minutes = Math.floor(result.timeRemaining / 60000);
  if (minutes > 0) {
    chrome.action.setBadgeText({ text: `${minutes}m` });
    chrome.action.setBadgeBackgroundColor({ color: "#4CAF50" });
  } else {
    chrome.action.setBadgeText({ text: "!" });
    chrome.action.setBadgeBackgroundColor({ color: "#FF5722" });
  }
}

// Update badge every 30 seconds
setInterval(updateBadge, 30000);
updateBadge();

// Keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "toggle-extension") {
    const settings = await chrome.storage.sync.get({ enabled: true });
    const newEnabled = !settings.enabled;
    await chrome.storage.sync.set({ enabled: newEnabled });

    if (newEnabled) {
      await chrome.storage.sync.set({
        activityStartTime: Date.now(),
        lastBreakTime: Date.now(),
      });
    }

    updateBadge();
  } else if (command === "skip-next-break") {
    await restartCountdown();
  }
});
