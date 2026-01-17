# RageScroll (RageBreak)

RageScroll is a Manifest V3 Chrome extension that enforces micro‑breaks while you browse. When the timer hits, a fullscreen overlay appears and you must finish a mini‑game to continue scrolling. It is designed to be lightweight, fully offline, and configurable per website.

## Why RageScroll

- Reduce “doomscrolling” by adding a friendly pause.
- Keep you in control with configurable timing and site targeting.
- Make breaks fun with short, skill‑based mini‑games.

## Key Features

- ⏱️ Configurable break intervals
- 🎯 Website targeting (per‑domain activation)
- 🎮 Mini‑games: Wordle, 4×4 Sudoku, Memory Match, Snake, Math Challenge, Webcam reps, Mini 2048 (target 512)
- 📊 Stats & achievements
- ⌨️ Keyboard shortcuts
- 🔔 Break warnings and fullscreen overlay
- 🎉 Celebration screen and audio on completion

## Installation (Load Unpacked)

1. Open chrome://extensions/
2. Enable Developer mode (top‑right toggle)
3. Click Load unpacked
4. Select the RageScroll/RageBreak folder
5. Pin the extension (optional)

## Quick Start

1. Click the extension icon to open the popup.
2. Enable RageBreak.
3. Choose your break interval.
4. Add active websites in Settings (or use * for all sites).
5. Browse — a break triggers after the interval and detected activity.

## Mini‑Games (Break Tasks)

- **Mini Wordle**: 4‑letter word, 6 attempts with color hints.
- **4×4 Sudoku**: fill numbers 1–4 by row, column, and box.
- **Memory Match**: match all emoji pairs.
- **Snake**: reach a target score.
- **Math Challenge**: timed streak of correct answers.
- **Webcam Break**: reps counted via motion detection.
- **Mini 2048**: reach a 512 tile or score to clear.

## Configuration

### Break Interval

Set the interval in minutes from the popup. The timer counts only while activity is detected.

### Website Targeting

Add domains in Settings to control where breaks are enforced:

- `*` applies to all sites
- `youtube.com`, `reddit.com`, `tiktok.com` for specific sites

### Keyboard Shortcuts

Keyboard shortcuts are listed in the shortcuts page and Chrome’s shortcut settings.

## Stats & Achievements

Visit the stats page from Settings to see:

- Total breaks completed
- Daily break counts
- Streak progress
- Games played by type

## Audio

Celebration audio is played after finishing a break. If you add your own sound file in assets/, it must be exposed via web accessible resources in manifest.json.

## File Structure (High Level)

- manifest.json
- src/pages/ (popup, options, stats, shortcuts)
- src/scripts/ (service worker, content script, games)
- src/styles/ (overlay, popup, options, stats)
- assets/ (icons, sounds)
- docs/ (additional documentation)

## Core Architecture

- **Service Worker**: manages timers, break scheduling, and messaging.
- **Content Script**: injects overlay, tracks activity, runs games.
- **Storage**: chrome.storage.sync for settings, chrome.storage.local for stats.

## Permissions (MV3)

- storage, activeTab, scripting, alarms, tabs, videoCapture, windows
- <all_urls> for activity detection on enabled sites

## Privacy

- No external requests
- Data stored locally or synced in Chrome storage
- Activity is only used to measure break timing

## Development Notes

### Adding a New Game

1. Create a game script under src/scripts/games/
2. Register it in manifest.json content_scripts
3. Add a game initializer in content_script.js
4. Add styles in src/styles/overlay.css

### Customizing UI

Most UI is in src/styles/overlay.css and the page‑specific CSS files in src/styles/.

## Troubleshooting

- Reload the extension in chrome://extensions/
- Hard refresh the page after updates
- Inspect the service worker and popup console for errors

## License

MIT
