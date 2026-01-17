# RageScroll Icons

This folder contains the extension icons in multiple sizes.

You'll need to create PNG icons in the following sizes:
- icon16.png (16x16 pixels) - for extension toolbar
- icon48.png (48x48 pixels) - for extension management page
- icon128.png (128x128 pixels) - for Chrome Web Store

## Creating Icons

You can create simple icons using:
1. An online icon generator
2. Design tools like Figma, Canva, or Photoshop
3. Use emoji as placeholder icons

### Quick Placeholder Icons

For testing purposes, you can use these emoji-based icons:
- 🎮 (game controller emoji)
- ⏱️ (timer clock emoji)
- 💪 (flexed bicep emoji)

### Recommended Icon Design

The icon should represent:
- Taking breaks (⏸️, ⏱️)
- Gaming/fun (🎮, 🎯)
- Health/wellness (💪, 🧘)
- Scrolling awareness (📜, 🔄)

A simple design combining a clock or timer with a game element would work well.

## Using ImageMagick to Create Icons

If you have ImageMagick installed, you can create simple colored icons:

```bash
# Create a gradient icon (requires ImageMagick)
convert -size 128x128 gradient:#667eea-#764ba2 icon128.png
convert icon128.png -resize 48x48 icon48.png
convert icon128.png -resize 16x16 icon16.png
```

Or use an emoji-to-image converter online and resize the outputs.
