# 📼 MixTape DJ — Retro Cassette Player

A retro boombox-style DJ web interface with smooth crossfade transitions between YouTube tracks.

![Retro Boombox](https://img.shields.io/badge/aesthetic-retro%20cassette-d94848)
![Made with Love](https://img.shields.io/badge/made%20with-❤️-e8c545)

## ✨ Features

### Core
- **Dual Cassette Decks** — Two tape compartments (Deck A & B)
- **Smooth Crossfade** — Real DJ-style transitions (3-12 second fade durations)
- **YouTube Playback** — Play any YouTube video via URL
- **Tape Collection** — Build your mixtape playlist

### DJ Controls
- **Crossfader Slider** — Manual mix between decks
- **Auto-Crossfade** — Automatic transition before track ends
- **Rotary Knobs** — Speed and volume control per deck
- **Transport Buttons** — Play, Stop, REW, FF, A→B

### Visual
- **Spinning Tape Reels** — Animated cassette reels when playing
- **VU Meters** — Retro LED segment meters
- **LED Display** — Green-glow now playing screen
- **Boombox Design** — Speakers, handle, chrome accents
- **Retro Aesthetic** — Warm colors, cassette labels with colorful stripes

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

```bash
# Clone
git clone https://github.com/dprrwt/dj-mixtape.git
cd dj-mixtape

# Serve locally
npx serve .
# or
python -m http.server 8000
```

Open `http://localhost:8000` in your browser.

## 🎵 How to Use

1. **Add Tapes** — Paste YouTube URLs in the input box, press Enter
2. **Play** — Click the ▶ PLAY button or press Space
3. **Crossfade** — Use the slider, keyboard shortcuts, or enable A→B auto mode
4. **Mix** — Adjust speed/volume with the rotary knobs

## 🔧 How Crossfade Works

The app uses two hidden YouTube iFrame players:
1. When you trigger next track, it loads on the inactive deck
2. The crossfade algorithm simultaneously fades between decks
3. No silence gap — smooth transitions like real DJ hardware

## 📁 Project Structure

```
dj-mixtape/
├── index.html    # Boombox layout
├── styles.css    # Retro cassette styling
├── app.js        # DJ logic & YouTube API
└── README.md
```

## ⚠️ Notes

- Requires internet (YouTube API loads from CDN)
- Some videos may not play due to YouTube restrictions
- Best experience in Chrome/Firefox

*"Every great DJ knows: it's all about the transition."* 🎧
