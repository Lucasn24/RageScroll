// Statistics Tracker for RageBreak

class StatsTracker {
  constructor() {
    this.storageKey = "ragebreak_stats";
  }

  async getStats() {
    const result = await chrome.storage.local.get(this.storageKey);
    return (
      result[this.storageKey] || {
        totalBreaks: 0,
        gamesPlayed: {
          wordle: 0,
          sudoku: 0,
          memory: 0,
          snake: 0,
          math: 0,
          webcam: 0,
        },
        totalTime: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastBreakDate: null,
        dailyBreaks: {},
      }
    );
  }

  async recordBreak(gameType) {
    const stats = await this.getStats();
    const today = new Date().toDateString();

    // Update counts
    stats.totalBreaks++;
    stats.gamesPlayed[gameType]++;

    // Update daily breaks
    if (!stats.dailyBreaks[today]) {
      stats.dailyBreaks[today] = 0;
    }
    stats.dailyBreaks[today]++;

    // Update streak
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (stats.lastBreakDate === yesterday || stats.lastBreakDate === today) {
      if (stats.lastBreakDate !== today) {
        stats.currentStreak++;
      }
    } else if (stats.lastBreakDate !== today) {
      stats.currentStreak = 1;
    }

    stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak);
    stats.lastBreakDate = today;

    await chrome.storage.local.set({ [this.storageKey]: stats });
    return stats;
  }

  async resetStats() {
    await chrome.storage.local.remove(this.storageKey);
  }
}

// Export for use in other scripts
if (typeof module !== "undefined" && module.exports) {
  module.exports = StatsTracker;
}
