// Options Script for RageScroll

const enabledCheckbox = document.getElementById('enabled');
const breakIntervalInput = document.getElementById('break-interval');
const domainList = document.getElementById('domain-list');
const domainInput = document.getElementById('domain-input');
const addDomainBtn = document.getElementById('add-domain-btn');
const saveBtn = document.getElementById('save-btn');
const saveStatus = document.getElementById('save-status');
const presetButtons = document.querySelectorAll('.btn-preset');

let currentDomains = [];

// Load settings
async function loadSettings() {
  const settings = await chrome.storage.sync.get({
    enabled: true,
    breakInterval: 5,
    activeDomains: ['*']
  });

  enabledCheckbox.checked = settings.enabled;
  breakIntervalInput.value = settings.breakInterval;
  currentDomains = settings.activeDomains;
  
  renderDomains();
}

// Render domain list
function renderDomains() {
  domainList.innerHTML = '';
  
  if (currentDomains.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'domain-empty';
    empty.textContent = 'No websites added. Add websites below or use "*" for all sites.';
    domainList.appendChild(empty);
    return;
  }
  
  currentDomains.forEach((domain, index) => {
    const item = document.createElement('div');
    item.className = 'domain-item';
    
    const text = document.createElement('span');
    text.className = 'domain-text';
    text.textContent = domain === '*' ? 'All Websites' : domain;
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn btn-small btn-danger';
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', () => removeDomain(index));
    
    item.appendChild(text);
    item.appendChild(removeBtn);
    domainList.appendChild(item);
  });
}

// Add domain
function addDomain(domain) {
  domain = domain.trim().toLowerCase();
  
  if (!domain) {
    showStatus('Please enter a website', 'error');
    return;
  }
  
  // Remove protocol if present
  domain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '');
  
  // Remove trailing slash
  domain = domain.replace(/\/$/, '');
  
  if (currentDomains.includes(domain)) {
    showStatus('Website already in list', 'error');
    return;
  }
  
  // If adding "*", clear other domains
  if (domain === '*') {
    currentDomains = ['*'];
  } else {
    // Remove "*" if adding specific domain
    currentDomains = currentDomains.filter(d => d !== '*');
    currentDomains.push(domain);
  }
  
  renderDomains();
  domainInput.value = '';
  showStatus('Website added', 'success');
}

// Remove domain
function removeDomain(index) {
  currentDomains.splice(index, 1);
  renderDomains();
  showStatus('Website removed', 'success');
}

// Save settings
async function saveSettings() {
  const settings = {
    enabled: enabledCheckbox.checked,
    breakInterval: parseInt(breakIntervalInput.value),
    activeDomains: currentDomains.length > 0 ? currentDomains : ['*']
  };
  
  // Validate
  if (settings.breakInterval < 1 || settings.breakInterval > 120) {
    showStatus('Break interval must be between 1 and 120 minutes', 'error');
    return;
  }
  
  try {
    await chrome.storage.sync.set(settings);
    
    // Reset break timer when settings change
    const now = Date.now();
    await chrome.storage.sync.set({ 
      lastBreakTime: now,
      activityStartTime: now
    });
    
    showStatus('Settings saved successfully!', 'success');
  } catch (error) {
    showStatus('Error saving settings', 'error');
    console.error(error);
  }
}

// Show save status
function showStatus(message, type) {
  saveStatus.textContent = message;
  saveStatus.className = `save-status ${type}`;
  saveStatus.style.opacity = '1';
  
  setTimeout(() => {
    saveStatus.style.opacity = '0';
  }, 3000);
}

// Event listeners
addDomainBtn.addEventListener('click', () => {
  addDomain(domainInput.value);
});

domainInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addDomain(domainInput.value);
  }
});

presetButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const domain = btn.dataset.domain;
    addDomain(domain);
  });
});

saveBtn.addEventListener('click', saveSettings);

// Stats button
const statsBtn = document.getElementById('stats-btn');
statsBtn.addEventListener('click', () => {
  window.location.href = 'stats.html';
});

// Auto-save on certain changes
enabledCheckbox.addEventListener('change', () => {
  showStatus('Remember to save changes', 'info');
});

breakIntervalInput.addEventListener('change', () => {
  showStatus('Remember to save changes', 'info');
});

// Initialize
loadSettings();
