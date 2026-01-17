# 🎮 RageBreak

RageBreak is a Manifest V3 Chrome extension that enforces micro‑breaks while you browse. When the timer hits, a fullscreen overlay appears and you must finish a mini‑game to continue scrolling.

## Highlights

- ⏱️ **Configurable break intervals**
- 🎯 **Website targeting** (per‑domain activation)
- 🎮 **Mini‑games**: Wordle, 4×4 Sudoku, Memory Match, Snake, Math, Webcam reps, and Mini 2048 (target 512)
- 📊 **Stats & achievements**
- ⌨️ **Keyboard shortcuts**
- 🔔 **Break warnings** and overlay

## Install (Load Unpacked)

1. Git clone this Repo
2. Open `chrome://extensions/`
3. Enable **Developer mode**
4. Click **Load unpacked** and select the `RageScroll/RageBreak` folder
5. Pin the extension (optional)

## Quick Start

1. Open the extension popup
2. Enable RageBreak
3. Set your break interval
4. Add active websites in **Settings**
5. Browse — the overlay triggers after the interval

## Mini‑Games

- **Mini Wordle**: 4‑letter word, 6 tries
- **4×4 Sudoku**: fill numbers 1–4 correctly
- **Memory Match**: match all emoji pairs
- **Snake**: reach the target score
- **Math Challenge**: timed streak
- **Webcam Break**: reps counted with motion detection
- **Mini 2048**: reach **512** to clear the break

## File Structure

```
RageBreak/
├── manifest.json
├── src/
│   ├── pages/
│   ├── scripts/
│   └── styles/
├── assets/
└── docs/
```

## Key Files

- `src/scripts/service_worker.js` — timing/state
- `src/scripts/content_script.js` — activity tracking + overlay
- `src/scripts/games/*` — mini‑games
- `src/styles/overlay.css` — overlay UI styling
- `src/pages/*` — popup/options/stats

## Permissions (MV3)

- `storage`, `activeTab`, `scripting`, `alarms`, `tabs`, `videoCapture`, `windows`
- `<all_urls>` for activity detection on allowed sites

## Privacy

- No external requests
- All data stored locally or via `chrome.storage.sync`
- Activity is used only for break timing

## Troubleshooting

- Reload extension in `chrome://extensions/`
- Hard refresh the page
- Check the console for errors (popup or service worker)

---

Stay healthy and keep scrolling responsibly. 💪
