// Popup Script for RageScroll

const countdownEl = document.getElementById('countdown');
const statusIconEl = document.getElementById('status-icon');
const enabledToggle = document.getElementById('enabled-toggle');
const intervalSelect = document.getElementById('interval-select');
const optionsBtn = document.getElementById('options-btn');
const skipBtn = document.getElementById('skip-btn');

// Load settings on popup open
async function loadSettings() {
  console.log('RageScroll Popup: Loading settings...');
  const settings = await chrome.storage.sync.get({
    enabled: true,
    breakInterval: 5,
    lastBreakTime: 0,
    activityStartTime: 0,
    isActive: false
  });

  console.log('RageScroll Popup: Current settings:', settings);
  enabledToggle.checked = settings.enabled;
  intervalSelect.value = settings.breakInterval;
  
  updateCountdown();
}

// Update countdown display
async function updateCountdown() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_TIME_REMAINING' });
    
    if (!response) {
      countdownEl.textContent = 'Click a website';
      statusIconEl.textContent = '💤';
      return;
    }
    
    if (!response.enabled) {
      countdownEl.textContent = 'Disabled';
      statusIconEl.textContent = '⏸️';
      return;
    }
    
    if (!response.isActive) {
      countdownEl.textContent = 'No activity yet';
      statusIconEl.textContent = '💤';
      return;
    }
    
    const timeRemaining = response.timeRemaining;
    
    if (timeRemaining <= 0) {
      countdownEl.textContent = 'Ready!';
      statusIconEl.textContent = '🎮';
    } else {
      const minutes = Math.floor(timeRemaining / 60000);
      const seconds = Math.floor((timeRemaining % 60000) / 1000);
      countdownEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      statusIconEl.textContent = '⏱️';
    }
  } catch (error) {
    console.error('Error updating countdown:', error);
    countdownEl.textContent = 'Reload extension';
    statusIconEl.textContent = '⚠️';
  }
}

// Toggle enabled state
enabledToggle.addEventListener('change', async (e) => {
  const enabled = e.target.checked;
  await chrome.storage.sync.set({ enabled });
  
  if (enabled) {
    // Reset activity start time when re-enabling
    await chrome.storage.sync.set({ 
      activityStartTime: Date.now(),
      lastBreakTime: Date.now()
    });
  }
  
  updateCountdown();
});

// Change break interval
intervalSelect.addEventListener('change', async (e) => {
  const breakInterval = parseInt(e.target.value);
  await chrome.storage.sync.set({ breakInterval });
  updateCountdown();
});

// Open options page
optionsBtn.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// Skip next break
skipBtn.addEventListener('click', async () => {
  const now = Date.now();
  await chrome.storage.sync.set({ 
    lastBreakTime: now,
    activityStartTime: now
  });
  updateCountdown();
});

// Update countdown every second
setInterval(updateCountdown, 1000);

// Initialize
loadSettings();
