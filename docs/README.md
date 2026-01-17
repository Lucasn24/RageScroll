# 🎮 RageScroll

A Chrome Extension (Manifest V3) that helps you take micro-breaks while browsing with fun mini-games.

## Features

- ⏱️ **Configurable Break Intervals** - Set your own break schedule (default: 5 minutes)
- 🎯 **Website-Specific Activation** - Choose which sites trigger breaks
- 🎮 **Fun Mini-Games** - Play Mini Wordle, 4x4 Sudoku, or Memory Match during breaks
- 📊 **Activity Tracking** - Monitors scrolling, clicking, and keypress activity
- 🔔 **Visual Countdown** - See time remaining until your next break
- 💪 **Opt-In Design** - You control when and where it's active
- 📈 **Statistics & Achievements** - Track your break habits and unlock achievements
- ⌨️ **Keyboard Shortcuts** - Quick commands to control the extension
- 🔔 **Break Warnings** - 30-second warning before breaks appear

## Installation

### Load Unpacked (Development Mode)

1. **Open Chrome Extensions Page**
   - Navigate to `chrome://extensions/`
   - Or: Menu → More Tools → Extensions

2. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

3. **Load the Extension**
   - Click "Load unpacked"
   - Select the `RageScroll` folder
   - The extension icon should appear in your toolbar

4. **Pin the Extension** (Optional)
   - Click the extensions puzzle icon in the toolbar
   - Find RageScroll and click the pin icon

## Usage

### Quick Start

1. **Click the RageScroll icon** in your toolbar
2. **Enable the extension** using the toggle
3. **Set your break interval** (default: 5 minutes)
4. **Configure active websites** by clicking "⚙️ Settings"
5. **Start browsing** - you'll be prompted for a break after the interval

### Settings Page

Access via the popup's "⚙️ Settings" button or right-click the extension icon → Options.

- **Enable/Disable** - Turn the extension on/off
- **Break Interval** - Choose from 1-120 minutes
- **Active Websites** - Add domains where breaks should trigger:
  - Use `*` for all websites
  - Add specific domains like `twitter.com`, `reddit.com`
  - Quick presets available for popular sites
    hree game options:

**📝 Mini Wordle**

- Guess the 4-letter word
- 6 attempts maximum
- 50 words dictionary
- Color-coded hints:
  - 🟩 Green = correct letter in correct position
  - 🟨 Yellow = correct letter in wrong position
  - ⬜ Gray = letter not in word

**🔢 4x4 Sudoku**

- Fill in numbers 1-4
- Each row, column, and 2x2 box must contain 1-4
- Pre-filled numbers cannot be changed
- Click "Check Solution" when complete

**🧠 Memory Match**

- Find all 8 matching pairs
- Click cards to reveal emojis
- Match pairs to keep them revealed
- Complete all pairs to finish

### Statistics & Achievements

View your progress by clicking "📊 View Statistics" in the settings page:
src/scripts/notification.js # Break warning notifications
├── src/styles/overlay.css # Styles for fullscreen break overlay
├── src/pages/popup.html # Extension popup UI
├── src/scripts/popup.js # Popup logic and countdown
├── src/styles/popup.css # Popup styles
├── src/pages/options.html # Settings page UI
├── src/scripts/options.js # Settings page logic
├── src/styles/options.css # Settings page styles
├── src/pages/stats.html # Statistics page UI
├── src/scripts/stats.js # Statistics tracking logic
├── src/scripts/stats-page.js # Statistics page logic
├── src/styles/stats.css # Statistics page styles
├── src/pages/shortcuts.html # Keyboard shortcuts reference
├── assets/
│ ├── icon16.png # 16x16 toolbar icon
│ ├── icon48.png # 48x48 management icon
│ ├── icon128.png # 128x128 store icon
│ └── create_simple_icons.py # Icon generation script

View all shortcuts in Settings → Keyboard Shortcuts

- Each row, column, and 2x2 box must contain 1-4
- Pre-filled numbers cannot be changed
- Click "Check Solution" when complete

## File Structure

```
RageScroll/
├── manifest.json              # Extension configuration (Manifest V3)
├── src/
│   ├── scripts/
│   │   ├── service_worker.js  # Background worker for timing and state
│   │   ├── content_script.js  # Activity tracking and overlay injection
│   │   ├── notification.js    # Break warning notifications
│   │   ├── popup.js           # Popup logic and countdown
│   │   ├── options.js         # Settings page logic
│   │   ├── stats.js           # Statistics tracking logic
│   │   └── stats-page.js      # Statistics page logic
│   ├── styles/
│   │   ├── overlay.css        # Styles for fullscreen break overlay
│   │   ├── popup.css          # Popup styles
│   │   ├── options.css        # Settings page styles
│   │   └── stats.css          # Statistics page styles
│   └── pages/
│       ├── popup.html         # Extension popup UI
│       ├── options.html       # Settings page UI
│       ├── stats.html         # Statistics page UI
│       ├── shortcuts.html     # Keyboard shortcuts reference
│       └── test.html          # Debug page
├── assets/
│   ├── icon16.png            # 16x16 toolbar icon
│   ├── icon48.png            # 48x48 management icon
│   └── icon128.png           # 128x128 store icon
└── docs/README.md             # This file
```

## Technical Details

### Architecture

- **Manifest V3** compliance with service workers
- **chrome.storage.sync** for cross-device settings sync
- **Content script** injection for activity monitoring
- **Fullscreen overlay** for uninterrupted break experience
- **Throttled activity detection** to minimize performance impact

### Permissions

- `storage` - Save user settings and state
- `activeTab` - Track activity on current tab
- `scripting` - Inject content scripts
- `<all_urls>` - Monitor activity across all websites (only when enabled)

### Privacy

- **No data collection** - All data stays local/synced via Chrome
- **No external requests** - Completely offline functionality
- **Opt-in by default** - You control which sites are monitored
- **No tracking** - Activity detection is used only for break timing

## Development

### Testing

1. Set break interval to 1 minute for faster testing
2. Open a website in your active domains list
3. Scroll or click to trigger activity
4. Wait for the break overlay to appear

### Customization

**Adding More Games:**

- Edit [src/scripts/content_script.js](../src/scripts/content_script.js)
- Add new game initialization function
- Update game selector in `showBreakOverlay()`

**Changing Colors:**

- Edit [src/styles/overlay.css](../src/styles/overlay.css) and [src/styles/popup.css](../src/styles/popup.css)
- Update gradient colors in `:root` or inline styles

**Modifying Break Logic:**

- Edit [src/scripts/service_worker.js](../src/scripts/service_worker.js)
- Adjust timing calculations in `handleActivityDetected()`

## Troubleshooting

**Extension not working:**

- Check that it's enabled in the popup
- Verify current website is in your active domains list
- Check Chrome DevTools console for errors

**Overlay not showing:**

- Ensure break interval has passed
- Try clicking "Skip Next" to reset timer
- Check that activity is being detected (scroll/click/type)

**Games not loading:**

- Hard refresh the page (Cmd+Shift+R / Ctrl+Shift+F5)
- Check browser console for JavaScript errors
- Reload the extension in `chrome://extensions/`

## Tips

- 💡 Start with shorter intervals (5-10 minutes) to build the habit
- [ ] More mini-games (memory match added!)
- [ ] Break statistics and streak tracking
- [ ] Keyboard shortcuts
- [ ] Customizable break duration
- [ ] Sound effects and animations
- [ ] Dark mode
- [ ] Notification before break triggers
- [ ] Export/import settings
- [ ] More Wordle words and difficulty levels
- [ ] Sudoku puzzle generator
- [ ] Typing speed test game
- [ ] Quick math challenge game
- [ ] More mini-games (memory match, quick math, typing test)
- [ ] Break statistics and streak tracking
- [ ] Customizable break duration
- [ ] Sound effects and animations
- [ ] Dark mode
- [ ] Keyboard shortcuts
- [ ] Notification before break triggers

## License

Free to use and modify. Built as a productivity tool for healthier browsing habits.

## Support

For issues or suggestions, please check the extension's error console:

1. Right-click the extension icon
2. Select "Inspect popup" or check the service worker
3. Review console errors

---

**Stay healthy, stay productive! 💪**
