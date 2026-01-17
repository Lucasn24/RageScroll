// Content Script for RageScroll
// Tracks user activity and displays overlay when needed

console.log("RageScroll Content Script: LOADED");

let activityTimeout;
let overlayShown = false;
let activityDetected = false;
let alarmAudioContext = null;
let alarmIntervalId = null;
let flyIntervalId = null;
let warningIntervalId = null;

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
  console.log("RageScroll: Sending activity detected");
  safeSendMessage({ type: "ACTIVITY_DETECTED" });
}, 5000); // Send activity update every 5 seconds max

// Track user activity
function trackActivity() {
  if (overlayShown) return;

  activityDetected = true;
  console.log("RageScroll Content: Activity detected");
  throttledActivityDetection();
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
  console.log("RageScroll Content: Received message:", message.type);

  if (message.type === "SHOW_BREAK") {
    console.log("RageScroll Content: Showing break overlay");
    if (!overlayShown) {
      showBreakOverlay();
    } else {
      console.log("RageScroll Content: Overlay already shown");
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
    console.error("RageScroll: Error checking initial break:", error);
  }
}

// Show the break overlay
function showBreakOverlay() {
  if (overlayShown) {
    console.log("RageScroll: Overlay already shown, skipping");
    return;
  }

  console.log("RageScroll: Creating break overlay");
  overlayShown = true;

  // Randomly select a game
  const games = ['wordle', 'sudoku', 'memory', 'snake', 'math'];
  const randomGame = games[Math.floor(Math.random() * games.length)];
  console.log("RageScroll: Randomly selected game:", randomGame);

  // Create overlay container
  const overlay = document.createElement('div');
  overlay.id = 'ragescroll-overlay';
  overlay.className = 'ragescroll-overlay';
  overlay.classList.add('annoying', 'shake');
  
  // Create overlay content (without game selector)
  overlay.innerHTML = `
    <div class="ragescroll-content">
      <div class="ragescroll-header">
        <div class="ragescroll-siren">Solve now!</div>
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
  console.log("RageScroll: Overlay added to page");

  // Append overlay to document
  console.log("RageScroll: About to append overlay to body");
  console.log("RageScroll: document.body:", document.body);
  console.log("RageScroll: overlay element:", overlay);

  document.body.appendChild(overlay);
  console.log("RageScroll: Overlay appended to document body");

  // Check if overlay is in the DOM
  const checkOverlay = document.getElementById("ragescroll-overlay");
  console.log("RageScroll: Overlay found in DOM:", checkOverlay);
  console.log(
    "RageScroll: Overlay computed style display:",
    window.getComputedStyle(checkOverlay).display,
  );
  console.log(
    "RageScroll: Overlay computed style visibility:",
    window.getComputedStyle(checkOverlay).visibility,
  );

  // Prevent scrolling on body
  document.body.style.overflow = 'hidden';
  console.log('RageScroll: Body overflow set to hidden');

  startAlarmSound();
  startFlyingStuff(overlay);
  startAnnoyances(overlay);
  
  // Start the randomly selected game immediately
  const container = document.getElementById("ragescroll-game-container");
  startGame(randomGame, container);
}

// Start selected game
function startGame(gameType, container) {
  if (!container) {
    container = document.getElementById("ragescroll-game-container");
  }

  if (gameType === "wordle") {
    initWordle(container);
  } else if (gameType === "sudoku") {
    initSudoku(container);
  } else if (gameType === "memory") {
    initMemoryMatch(container);
  } else if (gameType === 'snake') {
    initSnake(container);
  } else if (gameType === 'math') {
    initMath(container);
  }
}

// Mini Wordle Game
function initWordle(container) {
  const words = [
    "CODE",
    "GAME",
    "PLAY",
    "WORK",
    "REST",
    "MIND",
    "TECH",
    "DATA",
    "LINK",
    "FILE",
    "BYTE",
    "CHIP",
    "DISK",
    "HASH",
    "NODE",
    "PORT",
    "SYNC",
    "USER",
    "WAVE",
    "ZOOM",
    "BLOG",
    "CHAT",
    "DRAW",
    "EDIT",
    "FONT",
    "GRID",
    "ICON",
    "LOAD",
    "MENU",
    "PAGE",
    "READ",
    "SAVE",
    "TEXT",
    "UNDO",
    "VIEW",
    "WIFI",
    "MAIL",
    "PING",
    "SCAN",
    "COPY",
    "MOCK",
    "LOOP",
    "PATH",
    "PUSH",
    "PULL",
    "FORK",
    "TREE",
    "ROOT",
    "BOOT",
    "EXIT",
  ];
  const targetWord = words[Math.floor(Math.random() * words.length)];
  let currentGuess = "";
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

  const board = container.querySelector("#wordle-board");
  const keyboard = container.querySelector("#wordle-keyboard");
  const message = container.querySelector("#wordle-message");
  const keyButtons = {};

  // Create board
  for (let i = 0; i < maxAttempts; i++) {
    const row = document.createElement("div");
    row.className = "wordle-row";
    for (let j = 0; j < 4; j++) {
      const cell = document.createElement("div");
      cell.className = "wordle-cell";
      row.appendChild(cell);
    }
    board.appendChild(row);
  }

  // Create keyboard
  const keys = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  keys.forEach((key) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = key;
    btn.className = "wordle-key";
    btn.addEventListener("mousedown", (event) => event.preventDefault());
    btn.addEventListener("click", () => handleWordleInput(key));
    keyboard.appendChild(btn);
    keyButtons[key] = btn;
  });

  // Add backspace and enter
  const backspace = document.createElement("button");
  backspace.type = "button";
  backspace.textContent = "⌫";
  backspace.className = "wordle-key wordle-key-special";
  backspace.addEventListener("mousedown", (event) => event.preventDefault());
  backspace.addEventListener("click", () => handleWordleInput("BACKSPACE"));
  keyboard.appendChild(backspace);

  const enter = document.createElement("button");
  enter.type = "button";
  enter.textContent = "✓";
  enter.className = "wordle-key wordle-key-special";
  enter.addEventListener("mousedown", (event) => event.preventDefault());
  enter.addEventListener("click", () => handleWordleInput("ENTER"));
  keyboard.appendChild(enter);

  // Handle keyboard input
  document.addEventListener("keydown", handleKeyboardInput);

  function handleKeyboardInput(e) {
    if (e.key === "Enter") {
      handleWordleInput("ENTER");
    } else if (e.key === "Backspace") {
      handleWordleInput("BACKSPACE");
    } else if (/^[a-zA-Z]$/.test(e.key)) {
      handleWordleInput(e.key.toUpperCase());
    }
  }

  function handleWordleInput(key) {
    if (attempts >= maxAttempts) return;

    if (key === "BACKSPACE") {
      currentGuess = currentGuess.slice(0, -1);
      updateBoard();
    } else if (key === "ENTER") {
      if (currentGuess.length === 4) {
        submitGuess();
      } else {
        message.textContent = "Word must be 4 letters!";
      }
    } else if (currentGuess.length < 4) {
      currentGuess += key;
      updateBoard();
    }
  }

  function updateBoard() {
    const row = board.children[attempts];
    for (let i = 0; i < 4; i++) {
      row.children[i].textContent = currentGuess[i] || "";
    }
  }

  function submitGuess() {
    const row = board.children[attempts];
    const guess = currentGuess;

    // Check each letter
    for (let i = 0; i < 4; i++) {
      const cell = row.children[i];
      const letter = guess[i];
      const keyButton = keyButtons[letter];

      if (letter === targetWord[i]) {
        cell.className = "wordle-cell wordle-correct";
        if (keyButton) {
          keyButton.classList.remove("wordle-present", "wordle-absent");
          keyButton.classList.add("wordle-correct");
          keyButton.disabled = false;
        }
      } else if (targetWord.includes(letter)) {
        cell.className = "wordle-cell wordle-present";
        if (keyButton && !keyButton.classList.contains("wordle-correct")) {
          keyButton.classList.remove("wordle-absent");
          keyButton.classList.add("wordle-present");
          keyButton.disabled = false;
        }
      } else {
        cell.className = "wordle-cell wordle-absent";
        if (
          keyButton &&
          !keyButton.classList.contains("wordle-correct") &&
          !keyButton.classList.contains("wordle-present")
        ) {
          keyButton.classList.add("wordle-absent");
          keyButton.disabled = true;
        }
      }
    }

    if (guess === targetWord) {
      message.textContent = "🎉 Correct! Break complete!";
      message.style.color = "#4CAF50";
      setTimeout(() => closeOverlay("wordle"), 1500);
      document.removeEventListener("keydown", handleKeyboardInput);
      return;
    }

    attempts++;
    currentGuess = "";

    if (attempts >= maxAttempts) {
      message.textContent = `Game Over! The word was ${targetWord}`;
      setTimeout(() => closeOverlay("wordle"), 2000);
      document.removeEventListener("keydown", handleKeyboardInput);
    } else {
      message.textContent = "";
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

  const board = container.querySelector("#sudoku-board");
  const checkBtn = container.querySelector("#check-sudoku");
  const message = container.querySelector("#sudoku-message");

  // Create board
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const cell = document.createElement("input");
      cell.type = "text";
      cell.maxLength = 1;
      cell.className = "sudoku-cell";
      cell.dataset.row = i;
      cell.dataset.col = j;

      if (puzzle[i][j] !== 0) {
        cell.value = puzzle[i][j];
        cell.disabled = true;
        cell.classList.add("sudoku-given");
      }

      // Only allow numbers 1-4
      cell.addEventListener("input", (e) => {
        const value = e.target.value;
        if (!/^[1-4]$/.test(value)) {
          e.target.value = "";
        }
      });

      board.appendChild(cell);
    }
  }

  checkBtn.addEventListener("click", () => {
    const userSolution = [];
    for (let i = 0; i < 4; i++) {
      userSolution[i] = [];
      for (let j = 0; j < 4; j++) {
        const cell = board.querySelector(`[data-row="${i}"][data-col="${j}"]`);
        userSolution[i][j] = parseInt(cell.value) || 0;
      }
    }

    if (JSON.stringify(userSolution) === JSON.stringify(solution)) {
      message.textContent = "🎉 Correct! Break complete!";
      message.style.color = "#4CAF50";
      setTimeout(() => closeOverlay("sudoku"), 1500);
    } else {
      message.textContent = "❌ Not quite right. Keep trying!";
      message.style.color = "#FF5722";
    }
  });
}

// Generate a valid 4x4 sudoku
function generateSudoku4x4() {
  // One of many valid 4x4 sudoku solutions
  const solutions = [
    [
      [1, 2, 3, 4],
      [3, 4, 1, 2],
      [2, 3, 4, 1],
      [4, 1, 2, 3],
    ],
    [
      [2, 3, 4, 1],
      [4, 1, 2, 3],
      [1, 4, 3, 2],
      [3, 2, 1, 4],
    ],
    [
      [3, 4, 1, 2],
      [1, 2, 3, 4],
      [4, 1, 2, 3],
      [2, 3, 4, 1],
    ],
    [
      [4, 1, 2, 3],
      [2, 3, 4, 1],
      [3, 2, 1, 4],
      [1, 4, 3, 2],
    ],
  ];
  return solutions[Math.floor(Math.random() * solutions.length)];
}

// Create puzzle by removing some numbers
function createPuzzle(solution) {
  const puzzle = solution.map((row) => [...row]);
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
  const emojis = ["🎮", "⏱️", "💪", "🎯", "🔥", "⭐", "🚀", "💡"];
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

  const board = container.querySelector("#memory-board");
  const moveCount = container.querySelector("#move-count");
  const pairCount = container.querySelector("#pair-count");
  const message = container.querySelector("#memory-message");

  // Create cards
  cards.forEach((emoji, index) => {
    const card = document.createElement("div");
    card.className = "memory-card";
    card.dataset.emoji = emoji;
    card.dataset.index = index;

    card.innerHTML = `
      <div class="memory-card-inner">
        <div class="memory-card-front">?</div>
        <div class="memory-card-back">${emoji}</div>
      </div>
    `;

    card.addEventListener("click", () => handleCardClick(card));
    board.appendChild(card);
  });

  function handleCardClick(card) {
    if (
      card.classList.contains("flipped") ||
      card.classList.contains("matched")
    ) {
      return;
    }

    if (flippedCards.length >= 2) {
      return;
    }

    card.classList.add("flipped");
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
          card1.classList.add("matched");
          card2.classList.add("matched");
          matchedPairs++;
          pairCount.textContent = `${matchedPairs}/8`;
          flippedCards = [];

          if (matchedPairs === 8) {
            message.textContent = `🎉 Complete! ${moves} moves`;
            message.style.color = "#4CAF50";
            setTimeout(() => closeOverlay("memory"), 2000);
          }
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          card1.classList.remove("flipped");
          card2.classList.remove("flipped");
          flippedCards = [];
        }, 1000);
      }
    }
  }
}

// Mini Snake Game
function initSnake(container) {
  const targetScore = 5; // The "Proof of Work" requirement
  let score = 0;
  let gameActive = true;
  
  // Game Configuration
  const gridSize = 20;
  const tileCount = 15; // 15x15 grid
  let snake = [{ x: 7, y: 7 }];
  let food = { x: 5, y: 5 };
  let dx = 0;
  let dy = 0;
  
  container.innerHTML = `
    <div class="snake-game">
      <h2>Snake Challenge</h2>
      <p class="game-subtitle">Reach ${targetScore} points to unlock your content</p>
      
      <div class="snake-board-wrapper">
        <canvas id="snake-canvas" width="${tileCount * gridSize}" height="${tileCount * gridSize}"></canvas>
      </div>

      <div class="game-status-bar">
        <span>Score: <strong id="snake-score">0</strong> / ${targetScore}</span>
      </div>
      
      <p class="game-message" id="snake-message">Press an Arrow Key to Start</p>
    </div>
  `;

  const canvas = container.querySelector('#snake-canvas');
  const ctx = canvas.getContext('2d');
  const scoreDisplay = container.querySelector('#snake-score');
  const message = container.querySelector('#snake-message');

  // Input Handling
  function handleKeyPress(e) {
    if (!gameActive) return;
    
    const key = e.key;
    const goingUp = dy === -1;
    const goingDown = dy === 1;
    const goingRight = dx === 1;
    const goingLeft = dx === -1;

    if (key === 'ArrowLeft' && !goingRight) { dx = -1; dy = 0; }
    if (key === 'ArrowUp' && !goingDown) { dx = 0; dy = -1; }
    if (key === 'ArrowRight' && !goingLeft) { dx = 1; dy = 0; }
    if (key === 'ArrowDown' && !goingUp) { dx = 0; dy = 1; }
    
    if (dx !== 0 || dy !== 0) {
      message.textContent = "Keep going!";
    }
  }

  document.addEventListener('keydown', handleKeyPress);

  function main() {
    if (didGameEnd()) {
      message.textContent = "💥 Crashed! Restarting...";
      setTimeout(resetGame, 1000);
      return;
    }

    setTimeout(function onTick() {
      if (!gameActive) return;
      clearCanvas();
      drawFood();
      advanceSnake();
      drawSnake();
      main();
    }, 100); // Game Speed
  }

  function clearCanvas() {
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw subtle grid
    ctx.strokeStyle = "#333";
    for(let i=0; i<canvas.width; i+=gridSize) {
      ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(canvas.width,i); ctx.stroke();
    }
  }

  function drawSnake() {
    snake.forEach((part, index) => {
      ctx.fillStyle = (index === 0) ? "#4CAF50" : "#81C784";
      ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 2, gridSize - 2);
    });
  }

  function advanceSnake() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);

    const didEatFood = snake[0].x === food.x && snake[0].y === food.y;
    if (didEatFood) {
      score++;
      scoreDisplay.textContent = score;
      createFood();
      checkWinCondition();
    } else {
      if (dx !== 0 || dy !== 0) snake.pop();
    }
  }

  function didGameEnd() {
    if (dx === 0 && dy === 0) return false;
    const hitLeftWall = snake[0].x < 0;
    const hitRightWall = snake[0].x > tileCount - 1;
    const hitTopWall = snake[0].y < 0;
    const hitBottomWall = snake[0].y > tileCount - 1;
    
    let hitSelf = false;
    for (let i = 4; i < snake.length; i++) {
      if (snake[i].x === snake[0].x && snake[i].y === snake[0].y) hitSelf = true;
    }
    return hitLeftWall || hitRightWall || hitTopWall || hitBottomWall || hitSelf;
  }

  function createFood() {
    food.x = Math.floor(Math.random() * tileCount);
    food.y = Math.floor(Math.random() * tileCount);
    // Make sure food doesn't spawn on snake body
    snake.forEach(part => {
      if (part.x === food.x && part.y === food.y) createFood();
    });
  }

  function drawFood() {
    ctx.fillStyle = "#ff4757";
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);
  }

  function checkWinCondition() {
    if (score >= targetScore) {
      gameActive = false;
      message.textContent = "🎉 Goal Reached! Content Unlocked.";
      message.style.color = "#4CAF50";
      document.removeEventListener('keydown', handleKeyPress);
      setTimeout(() => closeOverlay('snake'), 1500);
    }
  }

  function resetGame() {
    snake = [{ x: 7, y: 7 }];
    dx = 0; dy = 0;
    score = 0;
    scoreDisplay.textContent = score;
    message.textContent = "Press an Arrow Key to Start";
    createFood();
    main();
  }

  // Start the loop
  createFood();
  main();
}

// Mini Math Game - Timed Hard Mode
function initMath(container) {
  const targetStreak = 5;
  const timeLimit = 10; // Seconds per problem
  let currentStreak = 0;
  let correctAnswer;
  let timerInterval;
  let timeLeft;

  container.innerHTML = `
    <div class="math-game">
      <h2>Timed Mental Hard Mode</h2>
      <p class="game-subtitle">Solve ${targetStreak} in a row. Don't let the timer hit zero!</p>
      
      <div class="math-stats-row">
        <div class="stat-box">Streak: <strong id="math-streak">0</strong> / ${targetStreak}</div>
        <div class="stat-box timer-box">Time: <strong id="math-timer">${timeLimit}</strong>s</div>
      </div>

      <div class="math-problem-box">
        <span id="math-question">...</span>
      </div>

      <div class="math-input-wrapper">
        <input type="number" id="math-answer" placeholder="?">
        <button id="math-submit">Check</button>
      </div>
      
      <p class="game-message" id="math-message">Hurry up!</p>
    </div>
  `;

  const questionEl = container.querySelector('#math-question');
  const answerInput = container.querySelector('#math-answer');
  const submitBtn = container.querySelector('#math-submit');
  const streakDisplay = container.querySelector('#math-streak');
  const timerDisplay = container.querySelector('#math-timer');
  const message = container.querySelector('#math-message');

  function startTimer() {
    clearInterval(timerInterval);
    timeLeft = timeLimit;
    timerDisplay.textContent = timeLeft;
    timerDisplay.parentElement.style.color = "#ffffff";

    timerInterval = setInterval(() => {
      timeLeft--;
      timerDisplay.textContent = timeLeft;

      if (timeLeft <= 5) {
        timerDisplay.parentElement.style.color = "#FF5252"; // Turn red for urgency
      }

      if (timeLeft <= 0) {
        handleTimeout();
      }
    }, 1000);
  }

  function handleTimeout() {
    clearInterval(timerInterval);
    currentStreak = 0;
    streakDisplay.textContent = currentStreak;
    message.textContent = "⏰ Time Out! Streak reset.";
    message.style.color = "#FF5252";
    setTimeout(generateIntermediateProblem, 1000);
  }

  function generateIntermediateProblem() {
  const type = Math.floor(Math.random() * 3);
  let qText = "";

  if (type === 0) {
    // Harder Addition (e.g., 68 + 75) - Requires mental carry-over
    const a = Math.floor(Math.random() * 80) + 20;
    const b = Math.floor(Math.random() * 80) + 20;
    correctAnswer = a + b;
    qText = `${a} + ${b}`;
  } else if (type === 1) {
    // Larger Subtraction (e.g., 145 - 67)
    const a = Math.floor(Math.random() * 150) + 50;
    const b = Math.floor(Math.random() * 40) + 10;
    correctAnswer = a - b;
    qText = `${a} - ${b}`;
  } else {
    // Intermediate Multiplication (e.g., 14 × 6 or 12 × 12)
    const a = Math.floor(Math.random() * 14) + 2; 
    const b = Math.floor(Math.random() * 12) + 2;
    correctAnswer = a * b;
    qText = `${a} × ${b}`;
  }

  questionEl.textContent = qText;
  answerInput.value = '';
  answerInput.focus();
  startTimer();
}

  function checkAnswer() {
    const userValue = parseInt(answerInput.value);
    
    if (userValue === correctAnswer) {
      clearInterval(timerInterval);
      currentStreak++;
      streakDisplay.textContent = currentStreak;
      message.textContent = "✅ Correct!";
      message.style.color = "#4CAF50";
      
      if (currentStreak >= targetStreak) {
        message.textContent = "🎉 Brain Verified!";
        setTimeout(() => closeOverlay('math'), 1500);
      } else {
        setTimeout(generateIntermediateProblem, 600);
      }
    } else {
      handleTimeout(); // Treat wrong answer as a reset (Hard Mode)
    }
  }

  submitBtn.addEventListener('click', checkAnswer);
  answerInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') checkAnswer();
  });

  generateIntermediateProblem();
}

// Close overlay and notify service worker
async function closeOverlay(gameType) {
  const overlay = document.getElementById("ragescroll-overlay");
  if (overlay) {
    overlay.remove();
  }

  overlayShown = false;
  document.body.style.overflow = '';

  stopAlarmSound();
  stopFlyingStuff();
  stopAnnoyances();
  
  // Record stats
  if (gameType) {
    await recordStats(gameType);
  }

  // Notify service worker that break is completed
  safeSendMessage({ type: "BREAK_COMPLETED" });
}

function startAnnoyances(overlay) {
  const banner = document.createElement('div');
  banner.className = 'ragescroll-banner';
  banner.textContent = 'Solve it now';
  overlay.appendChild(banner);

  const warningStack = document.createElement('div');
  warningStack.className = 'ragescroll-warning-stack';
  warningStack.dataset.ragescrollWarningStack = 'true';
  overlay.appendChild(warningStack);

  const warnings = ['⚠️ Focus!', '⏱️ Break time', '🚨 Stop scrolling', '❗ Solve the puzzle', '🔔 Pay attention'];
  const positions = [
    { top: '8%', left: '6%' },
    { top: '8%', right: '6%' },
    { bottom: '10%', left: '6%' },
    { bottom: '10%', right: '6%' }
  ];

  const spawnWarning = () => {
    const warning = document.createElement('div');
    warning.className = 'ragescroll-warning';
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
  const warningStack = document.querySelector('[data-ragescroll-warning-stack="true"]');
  if (warningStack) {
    warningStack.remove();
  }
  const banner = document.querySelector('.ragescroll-banner');
  if (banner) {
    banner.remove();
  }
}

function startFlyingStuff(overlay) {
  if (flyIntervalId) return;
  const layer = document.createElement('div');
  layer.className = 'ragescroll-fly-layer';
  layer.dataset.ragescrollFlyLayer = 'true';
  overlay.appendChild(layer);

  const items = ['💥', '⚡', '🚨', '🔊', '💣', '👾', '🌀', '🔥', '😵', '💫', '🔔'];

  const spawn = () => {
    const item = document.createElement('div');
    item.className = 'ragescroll-fly-item';
    item.textContent = items[Math.floor(Math.random() * items.length)];
    const size = Math.floor(Math.random() * 28) + 20;
    const top = Math.floor(Math.random() * 80) + 5;
    const duration = Math.floor(Math.random() * 6) + 6;
    item.style.fontSize = `${size}px`;
    item.style.top = `${top}%`;
    item.style.animationDuration = `${duration}s`;
    layer.appendChild(item);
    item.addEventListener('animationend', () => {
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
  const layer = document.querySelector('[data-ragescroll-fly-layer="true"]');
  if (layer) {
    layer.remove();
  }
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
    const result = await chrome.storage.local.get("ragescroll_stats");
    const stats = result.ragescroll_stats || {
      totalBreaks: 0,
      gamesPlayed: { wordle: 0, sudoku: 0, memory: 0 },
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

    await chrome.storage.local.set({ ragescroll_stats: stats });
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
