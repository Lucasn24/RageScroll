// Statistics Page Script

async function loadStats() {
  const result = await chrome.storage.local.get('ragescroll_stats');
  const stats = result.ragescroll_stats || {
    totalBreaks: 0,
    gamesPlayed: { wordle: 0, sudoku: 0, memory: 0 },
    currentStreak: 0,
    longestStreak: 0,
    dailyBreaks: {}
  };

  // Update main stats
  document.getElementById('total-breaks').textContent = stats.totalBreaks;
  document.getElementById('current-streak').textContent = stats.currentStreak;
  document.getElementById('longest-streak').textContent = stats.longestStreak;

  // Today's breaks
  const today = new Date().toDateString();
  const todayBreaks = stats.dailyBreaks[today] || 0;
  document.getElementById('today-breaks').textContent = todayBreaks;

  // Games played
  document.getElementById('wordle-count').textContent = stats.gamesPlayed.wordle;
  document.getElementById('sudoku-count').textContent = stats.gamesPlayed.sudoku;
  document.getElementById('memory-count').textContent = stats.gamesPlayed.memory;

  // Achievements
  renderAchievements(stats);
}

function renderAchievements(stats) {
  const achievements = [
    {
      id: 'first-break',
      icon: '🎉',
      name: 'First Break',
      desc: 'Complete your first break',
      check: stats.totalBreaks >= 1
    },
    {
      id: 'ten-breaks',
      icon: '🔥',
      name: 'Getting Started',
      desc: 'Complete 10 breaks',
      check: stats.totalBreaks >= 10
    },
    {
      id: 'fifty-breaks',
      icon: '⭐',
      name: 'Committed',
      desc: 'Complete 50 breaks',
      check: stats.totalBreaks >= 50
    },
    {
      id: 'hundred-breaks',
      icon: '💯',
      name: 'Century Club',
      desc: 'Complete 100 breaks',
      check: stats.totalBreaks >= 100
    },
    {
      id: 'streak-3',
      icon: '🌟',
      name: 'Three Day Streak',
      desc: '3 days in a row',
      check: stats.currentStreak >= 3
    },
    {
      id: 'streak-7',
      icon: '🏆',
      name: 'Week Warrior',
      desc: '7 days in a row',
      check: stats.currentStreak >= 7
    },
    {
      id: 'wordle-master',
      icon: '📝',
      name: 'Word Wizard',
      desc: 'Play Wordle 25 times',
      check: stats.gamesPlayed.wordle >= 25
    },
    {
      id: 'sudoku-master',
      icon: '🔢',
      name: 'Sudoku Sage',
      desc: 'Play Sudoku 25 times',
      check: stats.gamesPlayed.sudoku >= 25
    },
    {
      id: 'memory-master',
      icon: '🧠',
      name: 'Memory Master',
      desc: 'Play Memory 25 times',
      check: stats.gamesPlayed.memory >= 25
    }
  ];

  const grid = document.getElementById('achievements-grid');
  grid.innerHTML = '';

  achievements.forEach(achievement => {
    const div = document.createElement('div');
    div.className = `achievement ${achievement.check ? 'unlocked' : ''}`;
    div.innerHTML = `
      <div class="achievement-icon">${achievement.icon}</div>
      <div class="achievement-name">${achievement.name}</div>
      <div class="achievement-desc">${achievement.desc}</div>
    `;
    grid.appendChild(div);
  });
}

// Back button
document.getElementById('back-btn').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// Reset button
document.getElementById('reset-btn').addEventListener('click', async () => {
  if (confirm('Are you sure you want to reset all statistics? This cannot be undone.')) {
    await chrome.storage.local.remove('ragescroll_stats');
    loadStats();
  }
});

// Load stats on page load
loadStats();
