# 🎧 MixTape DJ — Crossfade Edition

A slick dual-deck DJ web interface with smooth crossfade transitions between YouTube tracks.

![Synthwave DJ Aesthetic](https://img.shields.io/badge/aesthetic-synthwave-ff2d75)
![Made with Love](https://img.shields.io/badge/made%20with-❤️-b14fff)

## ✨ Features

### Core
- **Dual Deck System** — Two virtual turntables (Deck A & B)
- **Smooth Crossfade** — Real DJ-style transitions (3-12 second fade durations)
- **YouTube Playback** — Play any YouTube video via URL
- **Playlist Management** — Add, remove, and click to play tracks

### DJ Controls
- **Crossfader Slider** — Manual mix between decks
- **Auto-Crossfade** — Automatic transition before track ends
- **Speed Control** — 0.5x to 1.5x playback on each deck
- **Volume Control** — Independent volume per deck
- **BPM Display** — Simulated BPM for each track

### Visual
- **Spinning Vinyl** — Animated turntables when playing
- **Audio Visualizer** — Reactive frequency bars
- **Progress Bars** — Track position with time display
- **Synthwave Aesthetic** — Neon pink/cyan/purple color scheme

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `Space` | Play/Pause |
| `→` | Next Track (with crossfade) |
| `←` | Previous Track (with crossfade) |
| `C` | Toggle Auto-Crossfade |
| `A` | Crossfade to Deck A |
| `B` | Crossfade to Deck B |
| `1-4` | Set crossfade duration |

## 🚀 Quick Start

### Option 1: Python HTTP Server
```bash
cd dj-mixtape
python -m http.server 8000
```
Then open: http://localhost:8000

### Option 2: Node.js (npx serve)
```bash
cd dj-mixtape
npx serve .
```

### Option 3: VS Code Live Server
1. Install "Live Server" extension
2. Right-click `index.html` → "Open with Live Server"

### Option 4: Direct File (Limited)
Just double-click `index.html` — works but some features may be limited due to CORS.

## 🎵 How to Use

1. **Add Tracks** — Paste YouTube URLs in the input box, press Enter
2. **Play** — Click the ▶ button or press Space
3. **Crossfade** — Use the slider, keyboard shortcuts, or enable Auto
4. **Mix** — Adjust speed/volume per deck for live mixing

### Sample YouTube URLs to Try
```
https://www.youtube.com/watch?v=dQw4w9WgXcQ
https://www.youtube.com/watch?v=fJ9rUzIMcZQ
https://www.youtube.com/watch?v=kJQP7kiw5Fk
```

## 🔧 How Crossfade Works

The app uses two hidden YouTube iFrame players:
1. When you trigger next track, it loads on the inactive deck
2. The crossfade algorithm simultaneously:
   - Fades OUT the current deck's volume (100% → 0%)
   - Fades IN the new deck's volume (0% → 100%)
3. The transition is smooth with no silence gap
4. After fade completes, the old deck pauses

This mimics real DJ hardware where you have two decks and a crossfader.

## 📁 Project Structure

```
dj-mixtape/
├── index.html    # Main HTML structure
├── styles.css    # Synthwave styling
├── app.js        # DJ logic & YouTube API
└── README.md     # You are here
```

## 🎨 Customization Ideas

- Change colors in CSS variables (`:root` section)
- Adjust visualizer bar count in `app.js`
- Add more keyboard shortcuts
- Implement actual BPM detection
- Add waveform display
- Drag-to-reorder playlist

## ⚠️ Notes

- Requires internet (YouTube API loads from CDN)
- Some videos may not play due to YouTube restrictions
- Audio visualization is simulated (can't access actual audio data from YouTube)
- Best experience in Chrome/Firefox

*"Every great DJ knows: it's all about the transition."* 🎧
