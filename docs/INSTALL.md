# RageScroll - Quick Installation Guide

## What You Have

Your complete RageScroll Chrome Extension with all files ready to use:

✅ **Core Extension Files:**

- manifest.json (Manifest V3 configuration)
- src/scripts/service_worker.js (Background timing & state management)
- src/scripts/content_script.js (Activity tracking & game overlay)
- src/styles/overlay.css (Fullscreen break overlay styles)

✅ **User Interface:**

- src/pages/popup.html, src/scripts/popup.js, src/styles/popup.css (Extension popup with countdown)
- src/pages/options.html, src/scripts/options.js, src/styles/options.css (Settings page)

✅ **Assets:**

- icon16.png, icon48.png, icon128.png (Extension icons)

✅ **Documentation:**

- docs/README.md (Complete user guide)

## Install in 3 Steps

1. **Open Chrome** → Navigate to `chrome://extensions/`

2. **Enable Developer Mode** → Toggle switch in top-right

3. **Load Extension** → Click "Load unpacked" → Select the `RageScroll` folder

## First Use

1. Click the RageScroll icon in your toolbar
2. Toggle "Enable RageScroll" to ON
3. Set your break interval (default: 5 minutes)
4. Click "⚙️ Settings" to add websites
5. Start browsing and take healthy breaks!

## Test Mode

For quick testing:

- Set break interval to 1 minute
- Add `*` to active websites (monitors all sites)
- Scroll/click on any webpage
- Wait 1 minute for the break overlay

## Features

🎮 **Two Mini-Games:**

- Mini Wordle (guess 4-letter words)
- 4x4 Sudoku (fill the grid)

⏱️ **Smart Tracking:**

- Only tracks when you're active
- Monitors scroll, click, keypress
- Opt-in per website

🎯 **Full Control:**

- Enable/disable anytime
- Skip breaks when needed
- Choose your own schedule

## Support

If you encounter issues:

1. Check `chrome://extensions/` for error messages
2. Right-click extension icon → "Inspect popup"
3. Check browser console for errors
4. Reload the extension

---

Built with ❤️ for healthier browsing habits!
