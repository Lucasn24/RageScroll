// Content Script for RageScroll
// Tracks user activity and displays overlay when needed

console.log('RageScroll Content Script: LOADED');

let activityTimeout;
let overlayShown = false;
let activityDetected = false;
let alarmAudioContext = null;
let alarmIntervalId = null;

// Throttle activity detection to avoid spamming service worker
const throttledActivityDetection = throttle(() => {
  console.log('RageScroll: Sending activity detected');
  chrome.runtime.sendMessage({ type: 'ACTIVITY_DETECTED' });
}, 5000); // Send activity update every 5 seconds max

// Track user activity
function trackActivity() {
  if (overlayShown) return;
  
  activityDetected = true;
  console.log('RageScroll Content: Activity detected');
  throttledActivityDetection();
}

// Add event listeners for activity tracking
document.addEventListener('scroll', trackActivity, { passive: true });
document.addEventListener('click', trackActivity);
document.addEventListener('keypress', trackActivity);
document.addEventListener('mousemove', throttle(trackActivity, 2000), { passive: true });

// Listen for messages from service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('RageScroll Content: Received message:', message.type);
  
  if (message.type === 'SHOW_BREAK') {
    console.log('RageScroll Content: Showing break overlay');
    if (!overlayShown) {
      showBreakOverlay();
    } else {
      console.log('RageScroll Content: Overlay already shown');
    }
  }
});

// Check on page load if we should show a break
async function checkInitialBreak() {
  try {
    const response = await chrome.runtime.sendMessage({ 
      type: 'CHECK_SHOULD_SHOW_BREAK' 
    });
    
    if (response && response.shouldShow) {
      showBreakOverlay();
    }
  } catch (error) {
    console.error('RageScroll: Error checking initial break:', error);
  }
}

// Show the break overlay
function showBreakOverlay() {
  if (overlayShown) {
    console.log('RageScroll: Overlay already shown, skipping');
    return;
  }
  
  console.log('RageScroll: Creating break overlay');
  overlayShown = true;
  
  // Randomly select a game
  const games = ['wordle', 'sudoku', 'memory'];
  const randomGame = games[Math.floor(Math.random() * games.length)];
  console.log('RageScroll: Randomly selected game:', randomGame);
  
  // Create overlay container
  const overlay = document.createElement('div');
  overlay.id = 'ragescroll-overlay';
  overlay.className = 'ragescroll-overlay';
  
  // Create overlay content (without game selector)
  overlay.innerHTML = `
    <div class="ragescroll-content">
      <div class="ragescroll-header">
        <h1>Still Scrolling?</h1>
        <h3>
            You've been here long enough.<br/>
            Prove you deserve the next scroll.<br/>
        </h3>
        <p>
            Beat this. Or stay stuck here forever.
        </p>
      </div>
      
      <div id="ragescroll-game-container"></div>
    </div>
  `;
  console.log('RageScroll: Overlay added to page');
  
  // Append overlay to document
  console.log('RageScroll: About to append overlay to body');
  console.log('RageScroll: document.body:', document.body);
  console.log('RageScroll: overlay element:', overlay);
  
  document.body.appendChild(overlay);
  console.log('RageScroll: Overlay appended to document body');
  
  // Check if overlay is in the DOM
  const checkOverlay = document.getElementById('ragescroll-overlay');
  console.log('RageScroll: Overlay found in DOM:', checkOverlay);
  console.log('RageScroll: Overlay computed style display:', window.getComputedStyle(checkOverlay).display);
  console.log('RageScroll: Overlay computed style visibility:', window.getComputedStyle(checkOverlay).visibility);
  
  // Prevent scrolling on body
  document.body.style.overflow = 'hidden';
  console.log('RageScroll: Body overflow set to hidden');

  startAlarmSound();
  
  // Start the randomly selected game immediately
  const container = document.getElementById('ragescroll-game-container');
  startGame(randomGame, container);
}

// Start selected game
function startGame(gameType, container) {
  if (!container) {
    container = document.getElementById('ragescroll-game-container');
  }
  
  if (gameType === 'wordle') {
    initWordle(container);
  } else if (gameType === 'sudoku') {
    initSudoku(container);
  } else if (gameType === 'memory') {
    initMemoryMatch(container);
  }
}

// Mini Wordle Game
function initWordle(container) {
  const words = [
    'CODE', 'GAME', 'PLAY', 'WORK', 'REST', 'MIND', 'TECH', 'DATA', 'LINK', 'FILE',
    'BYTE', 'CHIP', 'DISK', 'HASH', 'NODE', 'PORT', 'SYNC', 'USER', 'WAVE', 'ZOOM',
    'BLOG', 'CHAT', 'DRAW', 'EDIT', 'FONT', 'GRID', 'ICON', 'LOAD', 'MENU', 'PAGE',
    'READ', 'SAVE', 'TEXT', 'UNDO', 'VIEW', 'WIFI', 'MAIL', 'PING', 'SCAN', 'COPY',
    'MOCK', 'LOOP', 'PATH', 'PUSH', 'PULL', 'FORK', 'TREE', 'ROOT', 'BOOT', 'EXIT'
  ];
  const targetWord = words[Math.floor(Math.random() * words.length)];
  let currentGuess = '';
  let attempts = 0;
  const maxAttempts = 6;
  
  container.innerHTML = `
    <div class="wordle-game">
      <h2>Mini Wordle</h2>
      <p>Guess the 4-letter word</p>
      <div class="wordle-board" id="wordle-board"></div>
      <div class="wordle-keyboard" id="wordle-keyboard"></div>
      <p class="wordle-message" id="wordle-message"></p>
    </div>
  `;
  
  const board = container.querySelector('#wordle-board');
  const keyboard = container.querySelector('#wordle-keyboard');
  const message = container.querySelector('#wordle-message');
  
  // Create board
  for (let i = 0; i < maxAttempts; i++) {
    const row = document.createElement('div');
    row.className = 'wordle-row';
    for (let j = 0; j < 4; j++) {
      const cell = document.createElement('div');
      cell.className = 'wordle-cell';
      row.appendChild(cell);
    }
    board.appendChild(row);
  }
  
  // Create keyboard
  const keys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  keys.forEach(key => {
    const btn = document.createElement('button');
    btn.textContent = key;
    btn.className = 'wordle-key';
    btn.addEventListener('click', () => handleWordleInput(key));
    keyboard.appendChild(btn);
  });
  
  // Add backspace and enter
  const backspace = document.createElement('button');
  backspace.textContent = '⌫';
  backspace.className = 'wordle-key wordle-key-special';
  backspace.addEventListener('click', () => handleWordleInput('BACKSPACE'));
  keyboard.appendChild(backspace);
  
  const enter = document.createElement('button');
  enter.textContent = '✓';
  enter.className = 'wordle-key wordle-key-special';
  enter.addEventListener('click', () => handleWordleInput('ENTER'));
  keyboard.appendChild(enter);
  
  // Handle keyboard input
  document.addEventListener('keydown', handleKeyboardInput);
  
  function handleKeyboardInput(e) {
    if (e.key === 'Enter') {
      handleWordleInput('ENTER');
    } else if (e.key === 'Backspace') {
      handleWordleInput('BACKSPACE');
    } else if (/^[a-zA-Z]$/.test(e.key)) {
      handleWordleInput(e.key.toUpperCase());
    }
  }
  
  function handleWordleInput(key) {
    if (attempts >= maxAttempts) return;
    
    if (key === 'BACKSPACE') {
      currentGuess = currentGuess.slice(0, -1);
      updateBoard();
    } else if (key === 'ENTER') {
      if (currentGuess.length === 4) {
        submitGuess();
      } else {
        message.textContent = 'Word must be 4 letters!';
      }
    } else if (currentGuess.length < 4) {
      currentGuess += key;
      updateBoard();
    }
  }
  
  function updateBoard() {
    const row = board.children[attempts];
    for (let i = 0; i < 4; i++) {
      row.children[i].textContent = currentGuess[i] || '';
    }
  }
  
  function submitGuess() {
    const row = board.children[attempts];
    const guess = currentGuess;
    
    // Check each letter
    for (let i = 0; i < 4; i++) {
      const cell = row.children[i];
      const letter = guess[i];
      
      if (letter === targetWord[i]) {
        cell.className = 'wordle-cell wordle-correct';
      } else if (targetWord.includes(letter)) {
        cell.className = 'wordle-cell wordle-present';
      } else {
        cell.className = 'wordle-cell wordle-absent';
      }
    }
    
    if (guess === targetWord) {
      message.textContent = '🎉 Correct! Break complete!';
      message.style.color = '#4CAF50';
      setTimeout(() => closeOverlay('wordle'), 1500);
      document.removeEventListener('keydown', handleKeyboardInput);
      return;
    }
    
    attempts++;
    currentGuess = '';
    
    if (attempts >= maxAttempts) {
      message.textContent = `Game Over! The word was ${targetWord}`;
      setTimeout(() => closeOverlay('wordle'), 2000);
      document.removeEventListener('keydown', handleKeyboardInput);
    } else {
      message.textContent = '';
    }
  }
}

// 4x4 Sudoku Game
function initSudoku(container) {
  // Generate a simple 4x4 sudoku puzzle
  const solution = generateSudoku4x4();
  const puzzle = createPuzzle(solution);
  
  container.innerHTML = `
    <div class="sudoku-game">
      <h2>4x4 Sudoku</h2>
      <p>Fill in the numbers 1-4</p>
      <div class="sudoku-board" id="sudoku-board"></div>
      <div class="sudoku-controls">
        <button class="sudoku-btn" id="check-sudoku">Check Solution</button>
      </div>
      <p class="sudoku-message" id="sudoku-message"></p>
    </div>
  `;
  
  const board = container.querySelector('#sudoku-board');
  const checkBtn = container.querySelector('#check-sudoku');
  const message = container.querySelector('#sudoku-message');
  
  // Create board
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const cell = document.createElement('input');
      cell.type = 'text';
      cell.maxLength = 1;
      cell.className = 'sudoku-cell';
      cell.dataset.row = i;
      cell.dataset.col = j;
      
      if (puzzle[i][j] !== 0) {
        cell.value = puzzle[i][j];
        cell.disabled = true;
        cell.classList.add('sudoku-given');
      }
      
      // Only allow numbers 1-4
      cell.addEventListener('input', (e) => {
        const value = e.target.value;
        if (!/^[1-4]$/.test(value)) {
          e.target.value = '';
        }
      });
      
      board.appendChild(cell);
    }
  }
  
  checkBtn.addEventListener('click', () => {
    const userSolution = [];
    for (let i = 0; i < 4; i++) {
      userSolution[i] = [];
      for (let j = 0; j < 4; j++) {
        const cell = board.querySelector(`[data-row="${i}"][data-col="${j}"]`);
        userSolution[i][j] = parseInt(cell.value) || 0;
      }
    }
    
    if (JSON.stringify(userSolution) === JSON.stringify(solution)) {
      message.textContent = '🎉 Correct! Break complete!';
      message.style.color = '#4CAF50';
      setTimeout(() => closeOverlay('sudoku'), 1500);
    } else {
      message.textContent = '❌ Not quite right. Keep trying!';
      message.style.color = '#FF5722';
    }
  });
}

// Generate a valid 4x4 sudoku
function generateSudoku4x4() {
  // One of many valid 4x4 sudoku solutions
  const solutions = [
    [[1,2,3,4],[3,4,1,2],[2,3,4,1],[4,1,2,3]],
    [[2,3,4,1],[4,1,2,3],[1,4,3,2],[3,2,1,4]],
    [[3,4,1,2],[1,2,3,4],[4,1,2,3],[2,3,4,1]],
    [[4,1,2,3],[2,3,4,1],[3,2,1,4],[1,4,3,2]]
  ];
  return solutions[Math.floor(Math.random() * solutions.length)];
}

// Create puzzle by removing some numbers
function createPuzzle(solution) {
  const puzzle = solution.map(row => [...row]);
  const cellsToRemove = 6; // Remove 6 cells for moderate difficulty
  
  for (let i = 0; i < cellsToRemove; i++) {
    const row = Math.floor(Math.random() * 4);
    const col = Math.floor(Math.random() * 4);
    puzzle[row][col] = 0;
  }
  
  return puzzle;
}

// Memory Match Game
function initMemoryMatch(container) {
  const emojis = ['🎮', '⏱️', '💪', '🎯', '🔥', '⭐', '🚀', '💡'];
  const cards = [...emojis, ...emojis].sort(() => Math.random() - 0.5);
  let flippedCards = [];
  let matchedPairs = 0;
  let moves = 0;
  
  container.innerHTML = `
    <div class="memory-game">
      <h2>Memory Match</h2>
      <p>Find all 8 pairs</p>
      <div class="memory-stats">
        <span>Moves: <strong id="move-count">0</strong></span>
        <span>Pairs: <strong id="pair-count">0/8</strong></span>
      </div>
      <div class="memory-board" id="memory-board"></div>
      <p class="memory-message" id="memory-message"></p>
    </div>
  `;
  
  const board = container.querySelector('#memory-board');
  const moveCount = container.querySelector('#move-count');
  const pairCount = container.querySelector('#pair-count');
  const message = container.querySelector('#memory-message');
  
  // Create cards
  cards.forEach((emoji, index) => {
    const card = document.createElement('div');
    card.className = 'memory-card';
    card.dataset.emoji = emoji;
    card.dataset.index = index;
    
    card.innerHTML = `
      <div class="memory-card-inner">
        <div class="memory-card-front">?</div>
        <div class="memory-card-back">${emoji}</div>
      </div>
    `;
    
    card.addEventListener('click', () => handleCardClick(card));
    board.appendChild(card);
  });
  
  function handleCardClick(card) {
    if (card.classList.contains('flipped') || card.classList.contains('matched')) {
      return;
    }
    
    if (flippedCards.length >= 2) {
      return;
    }
    
    card.classList.add('flipped');
    flippedCards.push(card);
    
    if (flippedCards.length === 2) {
      moves++;
      moveCount.textContent = moves;
      
      const [card1, card2] = flippedCards;
      const emoji1 = card1.dataset.emoji;
      const emoji2 = card2.dataset.emoji;
      
      if (emoji1 === emoji2) {
        // Match found
        setTimeout(() => {
          card1.classList.add('matched');
          card2.classList.add('matched');
          matchedPairs++;
          pairCount.textContent = `${matchedPairs}/8`;
          flippedCards = [];
          
          if (matchedPairs === 8) {
            message.textContent = `🎉 Complete! ${moves} moves`;
            message.style.color = '#4CAF50';
            setTimeout(() => closeOverlay('memory'), 2000);
          }
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          card1.classList.remove('flipped');
          card2.classList.remove('flipped');
          flippedCards = [];
        }, 1000);
      }
    }
  }
}

// Close overlay and notify service worker
async function closeOverlay(gameType) {
  const overlay = document.getElementById('ragescroll-overlay');
  if (overlay) {
    overlay.remove();
  }
  
  overlayShown = false;
  document.body.style.overflow = '';

  stopAlarmSound();
  
  // Record stats
  if (gameType) {
    await recordStats(gameType);
  }
  
  // Notify service worker that break is completed
  chrome.runtime.sendMessage({ type: 'BREAK_COMPLETED' });
}

function startAlarmSound() {
  if (alarmIntervalId) return;
  try {
    alarmAudioContext = alarmAudioContext || new (window.AudioContext || window.webkitAudioContext)();
    let toggle = false;
    const beep = () => {
      toggle = !toggle;
      const oscillator = alarmAudioContext.createOscillator();
      const gainNode = alarmAudioContext.createGain();
      oscillator.type = 'sawtooth';
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
    console.warn('RageScroll: Unable to play alarm sound', error);
  }
}

function stopAlarmSound() {
  if (alarmIntervalId) {
    clearInterval(alarmIntervalId);
    alarmIntervalId = null;
  }
  if (alarmAudioContext && alarmAudioContext.state === 'running') {
    alarmAudioContext.suspend();
  }
}

// Record statistics
async function recordStats(gameType) {
  try {
    const result = await chrome.storage.local.get('ragescroll_stats');
    const stats = result.ragescroll_stats || {
      totalBreaks: 0,
      gamesPlayed: { wordle: 0, sudoku: 0, memory: 0 },
      currentStreak: 0,
      longestStreak: 0,
      lastBreakDate: null,
      dailyBreaks: {}
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
    
    await chrome.storage.local.set({ ragescroll_stats: stats });
  } catch (error) {
    console.error('Error recording stats:', error);
  }
}

// Utility: Throttle function
function throttle(func, delay) {
  let lastCall = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

// Initialize
checkInitialBreak();
