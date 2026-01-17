// Notification Helper for RageScroll
// Shows a warning notification 30 seconds before break

let notificationShown = false;
let notificationTimeout = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SCHEDULE_NOTIFICATION') {
    scheduleNotification(message.delay);
  } else if (message.type === 'CANCEL_NOTIFICATION') {
    cancelNotification();
  }
});

function scheduleNotification(delay) {
  cancelNotification();
  
  const warningTime = delay - 30000; // 30 seconds before
  
  if (warningTime > 0) {
    notificationTimeout = setTimeout(() => {
      showNotification();
    }, warningTime);
  }
}

function cancelNotification() {
  if (notificationTimeout) {
    clearTimeout(notificationTimeout);
    notificationTimeout = null;
  }
  hideNotification();
}

function showNotification() {
  if (notificationShown) return;
  
  const notification = document.createElement('div');
  notification.id = 'ragescroll-notification';
  notification.className = 'ragescroll-notification';
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-icon">⏱️</span>
      <span class="notification-text">Break in 30 seconds...</span>
      <button class="notification-close" id="notification-close">×</button>
    </div>
  `;
  
  document.body.appendChild(notification);
  notificationShown = true;
  
  // Add close button listener
  document.getElementById('notification-close').addEventListener('click', hideNotification);
  
  // Auto-hide after 10 seconds
  setTimeout(hideNotification, 10000);
}

function hideNotification() {
  const notification = document.getElementById('ragescroll-notification');
  if (notification) {
    notification.remove();
  }
  notificationShown = false;
}
