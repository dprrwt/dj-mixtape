/**
 * 📼 MixTape DJ — Retro Cassette Player Edition
 * A dual-deck DJ interface with smooth crossfade transitions
 * Now with authentic boombox vibes!
 */

// === YouTube IFrame API Loader ===
const tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';
document.head.appendChild(tag);

// === App State ===
const state = {
    playlist: [],
    currentIndex: 0,
    activeDeck: 'A',
    isPlaying: false,
    crossfadeValue: 50,
    crossfadeDuration: 5,
    autoCrossfade: false,
    isCrossfading: false,
    players: { A: null, B: null },
    playerReady: { A: false, B: false },
    volumes: { A: 100, B: 100 },
    speeds: { A: 1, B: 1 },
};

// === DOM Elements ===
const els = {
    // Decks
    deckA: document.getElementById('deckA'),
    deckB: document.getElementById('deckB'),
    tapeTitleA: document.getElementById('tapeTitleA'),
    tapeTitleB: document.getElementById('tapeTitleB'),
    timeCurrentA: document.getElementById('timeCurrentA'),
    timeCurrentB: document.getElementById('timeCurrentB'),
    timeTotalA: document.getElementById('timeTotalA'),
    timeTotalB: document.getElementById('timeTotalB'),
    progressA: document.getElementById('progressA'),
    progressB: document.getElementById('progressB'),
    deckAStatus: document.getElementById('deckAStatus'),
    deckBStatus: document.getElementById('deckBStatus'),
    
    // Tape reels
    reelALeft: document.getElementById('reelALeft'),
    reelARight: document.getElementById('reelARight'),
    reelBLeft: document.getElementById('reelBLeft'),
    reelBRight: document.getElementById('reelBRight'),
    
    // Controls
    speedA: document.getElementById('speedA'),
    speedB: document.getElementById('speedB'),
    speedValueA: document.getElementById('speedValueA'),
    speedValueB: document.getElementById('speedValueB'),
    volumeA: document.getElementById('volumeA'),
    volumeB: document.getElementById('volumeB'),
    volumeValueA: document.getElementById('volumeValueA'),
    volumeValueB: document.getElementById('volumeValueB'),
    
    // Knobs
    knobSpeedA: document.getElementById('knobSpeedA'),
    knobSpeedB: document.getElementById('knobSpeedB'),
    knobVolumeA: document.getElementById('knobVolumeA'),
    knobVolumeB: document.getElementById('knobVolumeB'),
    
    // Mixer
    crossfader: document.getElementById('crossfader'),
    btnPlayPause: document.getElementById('btnPlayPause'),
    btnStop: document.getElementById('btnStop'),
    btnPrev: document.getElementById('btnPrev'),
    btnNext: document.getElementById('btnNext'),
    btnAutoCrossfade: document.getElementById('btnAutoCrossfade'),
    playIcon: document.getElementById('playIcon'),
    
    // VU Meters
    vuMeterL: document.getElementById('vuMeterL'),
    vuMeterR: document.getElementById('vuMeterR'),
    
    // LED Display
    nowPlayingText: document.getElementById('nowPlayingText'),
    indicatorPlay: document.getElementById('indicatorPlay'),
    indicatorRec: document.getElementById('indicatorRec'),
    indicatorStereo: document.getElementById('indicatorStereo'),
    
    // Playlist
    urlInput: document.getElementById('urlInput'),
    btnAddTrack: document.getElementById('btnAddTrack'),
    queue: document.getElementById('queue'),
    trackCount: document.getElementById('trackCount'),
    
    // Toast
    toast: document.getElementById('toast'),
};

// === YouTube API Ready Callback ===
window.onYouTubeIframeAPIReady = () => {
    console.log('📼 YouTube API Ready');
    initPlayers();
};

function initPlayers() {
    state.players.A = new YT.Player('playerA', {
        height: '1',
        width: '1',
        playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
        },
        events: {
            onReady: () => onPlayerReady('A'),
            onStateChange: (e) => onPlayerStateChange('A', e),
            onError: (e) => onPlayerError('A', e),
        }
    });
    
    state.players.B = new YT.Player('playerB', {
        height: '1',
        width: '1',
        playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
        },
        events: {
            onReady: () => onPlayerReady('B'),
            onStateChange: (e) => onPlayerStateChange('B', e),
            onError: (e) => onPlayerError('B', e),
        }
    });
}

function onPlayerReady(deck) {
    console.log(`📼 Deck ${deck} ready`);
    state.playerReady[deck] = true;
    applyVolume(deck);
}

function onPlayerStateChange(deck, event) {
    const statusEl = deck === 'A' ? els.deckAStatus : els.deckBStatus;
    const deckEl = deck === 'A' ? els.deckA : els.deckB;
    
    switch (event.data) {
        case YT.PlayerState.PLAYING:
            statusEl.textContent = 'PLAY';
            statusEl.classList.add('playing');
            deckEl.classList.add('playing');
            if (deck === state.activeDeck) {
                els.indicatorPlay.classList.add('active');
            }
            break;
        case YT.PlayerState.PAUSED:
            statusEl.textContent = 'PAUSE';
            statusEl.classList.remove('playing');
            deckEl.classList.remove('playing');
            break;
        case YT.PlayerState.ENDED:
            statusEl.textContent = 'END';
            statusEl.classList.remove('playing');
            deckEl.classList.remove('playing');
            if (deck === state.activeDeck && !state.isCrossfading) {
                handleTrackEnd();
            }
            break;
        case YT.PlayerState.BUFFERING:
            statusEl.textContent = 'LOAD';
            break;
        default:
            statusEl.textContent = 'STOP';
            statusEl.classList.remove('playing');
    }
}

function onPlayerError(deck, event) {
    console.error(`❌ Deck ${deck} error:`, event.data);
    showToast(`Error loading tape on Deck ${deck}`);
}

// === Utility Functions ===
function extractVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /^([a-zA-Z0-9_-]{11})$/
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add('show');
    setTimeout(() => els.toast.classList.remove('show'), 3000);
}

function truncateTitle(title, maxLen = 20) {
    if (title.length <= maxLen) return title;
    return title.substring(0, maxLen - 3) + '...';
}

// === Playlist Management ===
async function addTrack(url) {
    const videoId = extractVideoId(url.trim());
    if (!videoId) {
        showToast('Invalid YouTube URL');
        return false;
    }
    
    if (state.playlist.some(t => t.videoId === videoId)) {
        showToast('Tape already in collection');
        return false;
    }
    
    let title = `Video ${videoId}`;
    let thumbnail = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    
    try {
        const resp = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
        const data = await resp.json();
        if (data.title) title = data.title;
        if (data.thumbnail_url) thumbnail = data.thumbnail_url;
    } catch (e) {
        console.warn('Could not fetch video info');
    }
    
    const track = {
        videoId,
        title,
        thumbnail,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        bpm: Math.floor(Math.random() * 50) + 100,
    };
    
    state.playlist.push(track);
    renderPlaylist();
    showToast(`Recorded: ${truncateTitle(title)}`);
    
    if (state.playlist.length === 1) {
        loadTrackToDeck('A', 0);
    }
    if (state.playlist.length === 2) {
        loadTrackToDeck('B', 1);
    }
    
    return true;
}

function removeTrack(index) {
    state.playlist.splice(index, 1);
    if (state.currentIndex >= state.playlist.length) {
        state.currentIndex = Math.max(0, state.playlist.length - 1);
    }
    renderPlaylist();
}

function renderPlaylist() {
    els.trackCount.textContent = `${state.playlist.length} tape${state.playlist.length !== 1 ? 's' : ''}`;
    
    if (state.playlist.length === 0) {
        els.queue.innerHTML = `
            <div class="empty-rack">
                <span class="empty-icon">📻</span>
                <p>No tapes in collection</p>
                <p class="hint">Add YouTube URLs to build your mixtape!</p>
            </div>
        `;
        els.nowPlayingText.textContent = 'INSERT TAPE TO BEGIN';
        return;
    }
    
    const nextIndex = (state.currentIndex + 1) % state.playlist.length;
    
    els.queue.innerHTML = state.playlist.map((track, i) => `
        <div class="queue-item ${i === state.currentIndex ? 'active' : ''} ${i === nextIndex && state.playlist.length > 1 ? 'next' : ''}" 
             data-index="${i}" onclick="playFromQueue(${i})">
            <span class="queue-number">${String(i + 1).padStart(2, '0')}</span>
            <div class="queue-tape-icon"></div>
            <div class="queue-info">
                <div class="queue-title">${track.title}</div>
                <div class="queue-duration">${track.bpm} BPM</div>
            </div>
            <button class="queue-remove" onclick="event.stopPropagation(); removeTrack(${i})">×</button>
        </div>
    `).join('');
}

function playFromQueue(index) {
    if (index === state.currentIndex && state.isPlaying) return;
    
    if (state.isPlaying && index !== state.currentIndex) {
        crossfadeToTrack(index);
    } else {
        state.currentIndex = index;
        loadTrackToDeck(state.activeDeck, index);
        play();
    }
}

// === Deck Loading & Control ===
function loadTrackToDeck(deck, index) {
    if (!state.playerReady[deck] || index >= state.playlist.length || index < 0) return;
    
    const track = state.playlist[index];
    const player = state.players[deck];
    
    player.cueVideoById(track.videoId);
    
    const titleEl = deck === 'A' ? els.tapeTitleA : els.tapeTitleB;
    titleEl.textContent = truncateTitle(track.title, 15);
    
    if (deck === state.activeDeck) {
        els.nowPlayingText.textContent = truncateTitle(track.title, 35);
    }
    
    console.log(`📼 Loaded "${track.title}" to Deck ${deck}`);
}

function play() {
    if (state.playlist.length === 0) {
        showToast('Add some tapes first!');
        return;
    }
    
    const player = state.players[state.activeDeck];
    if (player && state.playerReady[state.activeDeck]) {
        player.playVideo();
        state.isPlaying = true;
        els.playIcon.textContent = '⏸';
        els.btnPlayPause.querySelector('.btn-text').textContent = 'PAUSE';
        els.indicatorPlay.classList.add('active');
        els.indicatorStereo.classList.add('active');
    }
}

function pause() {
    state.players.A.pauseVideo();
    state.players.B.pauseVideo();
    state.isPlaying = false;
    els.playIcon.textContent = '▶';
    els.btnPlayPause.querySelector('.btn-text').textContent = 'PLAY';
    els.indicatorPlay.classList.remove('active');
}

function stop() {
    pause();
    // Reset to beginning
    try {
        state.players.A.seekTo(0);
        state.players.B.seekTo(0);
    } catch (e) {}
    els.deckA.classList.remove('playing');
    els.deckB.classList.remove('playing');
    els.deckAStatus.textContent = 'STOP';
    els.deckBStatus.textContent = 'STOP';
}

function togglePlayPause() {
    if (state.isPlaying) {
        pause();
    } else {
        play();
    }
}

// === Crossfade Logic ===
function crossfadeToTrack(newIndex) {
    if (state.isCrossfading || newIndex >= state.playlist.length) return;
    
    state.isCrossfading = true;
    const oldDeck = state.activeDeck;
    const newDeck = oldDeck === 'A' ? 'B' : 'A';
    
    loadTrackToDeck(newDeck, newIndex);
    
    setTimeout(() => {
        state.players[newDeck].playVideo();
        performCrossfade(oldDeck, newDeck, () => {
            state.activeDeck = newDeck;
            state.currentIndex = newIndex;
            state.isCrossfading = false;
            
            const nextIndex = (newIndex + 1) % state.playlist.length;
            if (state.playlist.length > 1) {
                loadTrackToDeck(oldDeck, nextIndex);
            }
            
            renderPlaylist();
            els.nowPlayingText.textContent = truncateTitle(state.playlist[newIndex].title, 35);
        });
    }, 500);
}

function performCrossfade(fromDeck, toDeck, onComplete) {
    const duration = state.crossfadeDuration * 1000;
    const steps = 50;
    const interval = duration / steps;
    let step = 0;
    
    const fromVolume = state.volumes[fromDeck];
    const toVolume = state.volumes[toDeck];
    
    showToast(`Crossfading... ${state.crossfadeDuration}s`);
    els.indicatorRec.classList.add('active');
    
    const fadeInterval = setInterval(() => {
        step++;
        const progress = step / steps;
        
        const oldVol = Math.round(fromVolume * (1 - progress));
        const newVol = Math.round(toVolume * progress);
        
        state.players[fromDeck].setVolume(oldVol);
        state.players[toDeck].setVolume(newVol);
        
        const crossfadePos = fromDeck === 'A' 
            ? Math.round(progress * 100)
            : Math.round(100 - progress * 100);
        els.crossfader.value = crossfadePos;
        
        if (step >= steps) {
            clearInterval(fadeInterval);
            state.players[fromDeck].pauseVideo();
            state.players[fromDeck].setVolume(fromVolume);
            els.indicatorRec.classList.remove('active');
            onComplete();
        }
    }, interval);
}

function handleTrackEnd() {
    if (state.playlist.length === 0) return;
    
    const nextIndex = (state.currentIndex + 1) % state.playlist.length;
    
    if (state.autoCrossfade || state.playlist.length > 1) {
        crossfadeToTrack(nextIndex);
    }
}

function nextTrack() {
    if (state.playlist.length === 0) return;
    const nextIndex = (state.currentIndex + 1) % state.playlist.length;
    crossfadeToTrack(nextIndex);
}

function prevTrack() {
    if (state.playlist.length === 0) return;
    const prevIndex = (state.currentIndex - 1 + state.playlist.length) % state.playlist.length;
    crossfadeToTrack(prevIndex);
}

function manualCrossfade(targetDeck) {
    if (state.activeDeck === targetDeck || state.isCrossfading) return;
    
    const nextIndex = targetDeck === 'A' 
        ? state.currentIndex 
        : (state.currentIndex + 1) % state.playlist.length;
    
    crossfadeToTrack(nextIndex);
}

// === Volume & Speed Control ===
function applyVolume(deck) {
    if (!state.playerReady[deck]) return;
    
    const baseVolume = state.volumes[deck];
    const crossfade = state.crossfadeValue;
    
    let effectiveVolume;
    if (deck === 'A') {
        effectiveVolume = baseVolume * (1 - crossfade / 100);
    } else {
        effectiveVolume = baseVolume * (crossfade / 100);
    }
    
    if (!state.isCrossfading) {
        state.players[deck].setVolume(Math.round(effectiveVolume));
    }
}

function applySpeed(deck) {
    if (!state.playerReady[deck]) return;
    state.players[deck].setPlaybackRate(state.speeds[deck]);
}

// === Knob Rotation ===
function updateKnobRotation(knobEl, value, min, max) {
    const range = max - min;
    const normalized = (value - min) / range;
    const rotation = -135 + (normalized * 270); // -135 to 135 degrees
    const indicator = knobEl.querySelector('.knob-indicator');
    if (indicator) {
        knobEl.style.transform = `rotate(${rotation}deg)`;
    }
}

// === VU Meters ===
const vuCtxL = els.vuMeterL.getContext('2d');
const vuCtxR = els.vuMeterR.getContext('2d');
let vuLevels = { L: 0, R: 0 };

function drawVUMeter(ctx, level) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);
    
    const segments = 12;
    const segmentWidth = (width - 20) / segments;
    const segmentGap = 2;
    
    for (let i = 0; i < segments; i++) {
        const x = 10 + i * segmentWidth;
        const isLit = (i / segments) < level;
        
        let color;
        if (i < 7) {
            color = isLit ? '#39ff14' : '#1a3a1a';
        } else if (i < 10) {
            color = isLit ? '#ffbf00' : '#3a3a1a';
        } else {
            color = isLit ? '#ff3131' : '#3a1a1a';
        }
        
        ctx.fillStyle = color;
        ctx.fillRect(x, 5, segmentWidth - segmentGap, height - 10);
        
        if (isLit) {
            ctx.shadowColor = color;
            ctx.shadowBlur = 5;
            ctx.fillRect(x, 5, segmentWidth - segmentGap, height - 10);
            ctx.shadowBlur = 0;
        }
    }
}

function animateVUMeters() {
    if (state.isPlaying) {
        // Simulate audio levels with some randomness
        const target = 0.4 + Math.random() * 0.4;
        vuLevels.L += (target - vuLevels.L) * 0.3;
        vuLevels.R += (target + (Math.random() - 0.5) * 0.1 - vuLevels.R) * 0.3;
    } else {
        vuLevels.L *= 0.92;
        vuLevels.R *= 0.92;
    }
    
    drawVUMeter(vuCtxL, vuLevels.L);
    drawVUMeter(vuCtxR, vuLevels.R);
    
    requestAnimationFrame(animateVUMeters);
}

// === Progress Updates ===
function updateProgress() {
    ['A', 'B'].forEach(deck => {
        if (!state.playerReady[deck]) return;
        
        const player = state.players[deck];
        try {
            const current = player.getCurrentTime() || 0;
            const total = player.getDuration() || 0;
            
            const currentEl = deck === 'A' ? els.timeCurrentA : els.timeCurrentB;
            const totalEl = deck === 'A' ? els.timeTotalA : els.timeTotalB;
            const progressEl = deck === 'A' ? els.progressA : els.progressB;
            
            currentEl.textContent = formatTime(current);
            totalEl.textContent = formatTime(total);
            progressEl.style.width = total > 0 ? `${(current / total) * 100}%` : '0%';
            
            if (deck === state.activeDeck && state.autoCrossfade && state.isPlaying && !state.isCrossfading) {
                const timeLeft = total - current;
                if (timeLeft > 0 && timeLeft <= state.crossfadeDuration + 0.5) {
                    const nextIndex = (state.currentIndex + 1) % state.playlist.length;
                    if (state.playlist.length > 1) {
                        crossfadeToTrack(nextIndex);
                    }
                }
            }
        } catch (e) {
            // Player not ready
        }
    });
}

// === Event Listeners ===
function setupEventListeners() {
    // Add track
    els.btnAddTrack.addEventListener('click', () => {
        if (els.urlInput.value.trim()) {
            addTrack(els.urlInput.value);
            els.urlInput.value = '';
        }
    });
    
    els.urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && els.urlInput.value.trim()) {
            addTrack(els.urlInput.value);
            els.urlInput.value = '';
        }
    });
    
    // Transport controls
    els.btnPlayPause.addEventListener('click', togglePlayPause);
    els.btnStop.addEventListener('click', stop);
    els.btnNext.addEventListener('click', nextTrack);
    els.btnPrev.addEventListener('click', prevTrack);
    
    // Auto crossfade toggle
    els.btnAutoCrossfade.addEventListener('click', () => {
        state.autoCrossfade = !state.autoCrossfade;
        els.btnAutoCrossfade.classList.toggle('active', state.autoCrossfade);
        showToast(`Auto-crossfade ${state.autoCrossfade ? 'ON' : 'OFF'}`);
    });
    
    // Crossfade duration buttons
    document.querySelectorAll('.fade-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.fade-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.crossfadeDuration = parseInt(btn.dataset.duration);
            showToast(`Fade time: ${state.crossfadeDuration}s`);
        });
    });
    
    // Manual crossfader
    els.crossfader.addEventListener('input', () => {
        if (state.isCrossfading) return;
        state.crossfadeValue = parseInt(els.crossfader.value);
        applyVolume('A');
        applyVolume('B');
    });
    
    // Speed controls with knob rotation
    els.speedA.addEventListener('input', () => {
        state.speeds.A = parseFloat(els.speedA.value);
        els.speedValueA.textContent = state.speeds.A.toFixed(2) + 'x';
        applySpeed('A');
        updateKnobRotation(els.knobSpeedA, state.speeds.A, 0.5, 1.5);
    });
    
    els.speedB.addEventListener('input', () => {
        state.speeds.B = parseFloat(els.speedB.value);
        els.speedValueB.textContent = state.speeds.B.toFixed(2) + 'x';
        applySpeed('B');
        updateKnobRotation(els.knobSpeedB, state.speeds.B, 0.5, 1.5);
    });
    
    // Volume controls with knob rotation
    els.volumeA.addEventListener('input', () => {
        state.volumes.A = parseInt(els.volumeA.value);
        els.volumeValueA.textContent = state.volumes.A + '%';
        applyVolume('A');
        updateKnobRotation(els.knobVolumeA, state.volumes.A, 0, 100);
    });
    
    els.volumeB.addEventListener('input', () => {
        state.volumes.B = parseInt(els.volumeB.value);
        els.volumeValueB.textContent = state.volumes.B + '%';
        applyVolume('B');
        updateKnobRotation(els.knobVolumeB, state.volumes.B, 0, 100);
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT') return;
        
        switch (e.code) {
            case 'Space':
                e.preventDefault();
                togglePlayPause();
                break;
            case 'ArrowRight':
                e.preventDefault();
                nextTrack();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                prevTrack();
                break;
            case 'KeyC':
                e.preventDefault();
                state.autoCrossfade = !state.autoCrossfade;
                els.btnAutoCrossfade.classList.toggle('active', state.autoCrossfade);
                showToast(`Auto-crossfade ${state.autoCrossfade ? 'ON' : 'OFF'}`);
                break;
            case 'KeyA':
                e.preventDefault();
                manualCrossfade('A');
                break;
            case 'KeyB':
                e.preventDefault();
                manualCrossfade('B');
                break;
            case 'Digit1':
                document.querySelector('.fade-btn[data-duration="3"]').click();
                break;
            case 'Digit2':
                document.querySelector('.fade-btn[data-duration="5"]').click();
                break;
            case 'Digit3':
                document.querySelector('.fade-btn[data-duration="8"]').click();
                break;
            case 'Digit4':
                document.querySelector('.fade-btn[data-duration="12"]').click();
                break;
        }
    });
    
    // Initialize knob rotations
    updateKnobRotation(els.knobSpeedA, 1, 0.5, 1.5);
    updateKnobRotation(els.knobSpeedB, 1, 0.5, 1.5);
    updateKnobRotation(els.knobVolumeA, 100, 0, 100);
    updateKnobRotation(els.knobVolumeB, 100, 0, 100);
}

// === Initialize ===
function init() {
    console.log('📼 MixTape DJ - Retro Edition initializing...');
    setupEventListeners();
    animateVUMeters();
    setInterval(updateProgress, 100);
    
    showToast('📼 Insert a tape to begin!');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Make functions globally accessible
window.playFromQueue = playFromQueue;
window.removeTrack = removeTrack;
