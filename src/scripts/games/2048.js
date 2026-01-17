// Mini 2048 Game (target 512)
function init2048(container) {
  const size = 4;
  const target = 512;
  let grid = Array.from({ length: size }, () => Array(size).fill(0));
  let score = 0;
  let gameOver = false;

  container.innerHTML = `
    <div class="game-2048">
      <h2>Mini 2048</h2>
      <p class="game-subtitle">Reach score ${target} (or a ${target} tile) to clear the break</p>
      <div class="score-2048">Score: <span id="score-2048">0</span></div>
      <div class="board-2048" id="board-2048"></div>
      <div class="controls-2048">
        <button class="btn-2048" id="reset-2048">Reset</button>
      </div>
      <p class="message-2048" id="message-2048"></p>
    </div>
  `;

  const boardEl = container.querySelector("#board-2048");
  const scoreEl = container.querySelector("#score-2048");
  const messageEl = container.querySelector("#message-2048");
  const resetBtn = container.querySelector("#reset-2048");

  function render(prevGrid = null) {
    boardEl.innerHTML = "";
    grid.forEach((row, r) => {
      row.forEach((value, c) => {
        const cell = document.createElement("div");
        cell.className = "tile-2048-cell";
        if (value) {
          cell.classList.add(`tile-${value}`);
          cell.textContent = value;
          if (prevGrid && prevGrid[r][c] !== value) {
            cell.classList.add("tile-pop");
          }
        }
        boardEl.appendChild(cell);
      });
    });
    scoreEl.textContent = score;
    checkState();
  }

  function addRandomTile() {
    const empty = [];
    grid.forEach((row, r) => {
      row.forEach((val, c) => {
        if (!val) empty.push([r, c]);
      });
    });
    if (!empty.length) return;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    grid[r][c] = Math.random() < 0.9 ? 2 : 4;
  }

  function slideRowLeft(row) {
    const filtered = row.filter((n) => n !== 0);
    const result = [];
    let i = 0;
    while (i < filtered.length) {
      if (filtered[i] === filtered[i + 1]) {
        const merged = filtered[i] * 2;
        result.push(merged);
        score += merged;
        i += 2;
      } else {
        result.push(filtered[i]);
        i += 1;
      }
    }
    while (result.length < size) result.push(0);
    return result;
  }

  function moveLeft() {
    let moved = false;
    grid = grid.map((row) => {
      const newRow = slideRowLeft(row);
      if (newRow.some((val, idx) => val !== row[idx])) moved = true;
      return newRow;
    });
    return moved;
  }

  function moveRight() {
    let moved = false;
    grid = grid.map((row) => {
      const reversed = [...row].reverse();
      const newRow = slideRowLeft(reversed).reverse();
      if (newRow.some((val, idx) => val !== row[idx])) moved = true;
      return newRow;
    });
    return moved;
  }

  function moveUp() {
    let moved = false;
    for (let c = 0; c < size; c += 1) {
      const col = grid.map((row) => row[c]);
      const newCol = slideRowLeft(col);
      if (newCol.some((val, idx) => val !== col[idx])) moved = true;
      for (let r = 0; r < size; r += 1) {
        grid[r][c] = newCol[r];
      }
    }
    return moved;
  }

  function moveDown() {
    let moved = false;
    for (let c = 0; c < size; c += 1) {
      const col = grid.map((row) => row[c]).reverse();
      const newCol = slideRowLeft(col).reverse();
      if (newCol.some((val, idx) => val !== grid[idx][c])) moved = true;
      for (let r = 0; r < size; r += 1) {
        grid[r][c] = newCol[r];
      }
    }
    return moved;
  }

  function canMove() {
    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        const val = grid[r][c];
        if (!val) return true;
        if (r < size - 1 && grid[r + 1][c] === val) return true;
        if (c < size - 1 && grid[r][c + 1] === val) return true;
      }
    }
    return false;
  }

  function completeBreak() {
    messageEl.textContent = `🎉 ${target} reached! Break complete.`;
    messageEl.style.color = "#4CAF50";
    gameOver = true;
    document.removeEventListener("keydown", handleKey);
    setTimeout(() => {
      if (typeof closeOverlay === "function") {
        closeOverlay("2048");
        return;
      }
      const overlay = document.getElementById("ragebreak-overlay");
      if (overlay) overlay.remove();
      document.body.style.overflow = "";
      if (typeof chrome !== "undefined" && chrome.runtime?.id) {
        chrome.runtime.sendMessage({ type: "BREAK_COMPLETED" });
      }
    }, 600);
  }

  function checkState() {
    const reachedByTile = grid.some((row) => row.some((val) => val >= target));
    const reachedByScore = score >= target;
    const reached = reachedByTile || reachedByScore;
    if (reached && !gameOver) {
      completeBreak();
      return;
    }

    if (!canMove()) {
      messageEl.textContent = "No moves left. Try reset.";
      messageEl.style.color = "#FF5252";
      gameOver = true;
    }
  }

  function handleKey(event) {
    if (gameOver) return;
    const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();

    const prevGrid = grid.map((row) => [...row]);

    let moved = false;
    if (event.key === "ArrowLeft") moved = moveLeft();
    if (event.key === "ArrowRight") moved = moveRight();
    if (event.key === "ArrowUp") moved = moveUp();
    if (event.key === "ArrowDown") moved = moveDown();

    if (moved) {
      addRandomTile();
      render(prevGrid);
    }
  }

  function reset() {
    grid = Array.from({ length: size }, () => Array(size).fill(0));
    score = 0;
    gameOver = false;
    messageEl.textContent = "";
    addRandomTile();
    addRandomTile();
    render();
  }

  resetBtn.addEventListener("click", reset);
  document.addEventListener("keydown", handleKey);
  reset();
}
