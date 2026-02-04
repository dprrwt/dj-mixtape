/**
 * 🎧 MixTape DJ — Crossfade Edition
 * A dual-deck DJ interface with smooth crossfade transitions
 */

// === YouTube IFrame API Loader ===
const tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';
document.head.appendChild(tag);

// === App State ===
const state = {
    playlist: [],
    currentIndex: 0,
    activeDeck: 'A', // Which deck is currently "live"
    isPlaying: false,
    crossfadeValue: 50,
    crossfadeDuration: 5, // seconds
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
    platterA: document.getElementById('platterA'),
    platterB: document.getElementById('platterB'),
    tonearmA: document.getElementById('tonearmA'),
    tonearmB: document.getElementById('tonearmB'),
    trackTitleA: document.getElementById('trackTitleA'),
    trackTitleB: document.getElementById('trackTitleB'),
    vinylTitleA: document.getElementById('vinylTitleA'),
    vinylTitleB: document.getElementById('vinylTitleB'),
    timeCurrentA: document.getElementById('timeCurrentA'),
    timeCurrentB: document.getElementById('timeCurrentB'),
    timeTotalA: document.getElementById('timeTotalA'),
    timeTotalB: document.getElementById('timeTotalB'),
    progressA: document.getElementById('progressA'),
    progressB: document.getElementById('progressB'),
    deckAStatus: document.getElementById('deckAStatus'),
    deckBStatus: document.getElementById('deckBStatus'),
    
    // Controls
    speedA: document.getElementById('speedA'),
    speedB: document.getElementById('speedB'),
    speedValueA: document.getElementById('speedValueA'),
    speedValueB: document.getElementById('speedValueB'),
    volumeA: document.getElementById('volumeA'),
    volumeB: document.getElementById('volumeB'),
    volumeValueA: document.getElementById('volumeValueA'),
    volumeValueB: document.getElementById('volumeValueB'),
    
    // Mixer
    crossfader: document.getElementById('crossfader'),
    btnPlayPause: document.getElementById('btnPlayPause'),
    btnPrev: document.getElementById('btnPrev'),
    btnNext: document.getElementById('btnNext'),
    btnAutoCrossfade: document.getElementById('btnAutoCrossfade'),
    bpmValue: document.getElementById('bpmValue'),
    visualizer: document.getElementById('visualizer'),
    
    // Playlist
    urlInput: document.getElementById('urlInput'),
    btnAddTrack: document.getElementById('btnAddTrack'),
    queue: document.getElementById('queue'),
    trackCount: document.getElementById('trackCount'),
    nowPlayingText: document.getElementById('nowPlayingText'),
    
    // Toast
    toast: document.getElementById('toast'),
};

// === YouTube API Ready Callback ===
window.onYouTubeIframeAPIReady = () => {
    console.log('🎬 YouTube API Ready');
    initPlayers();
};

function initPlayers() {
    // Create two YouTube players for crossfade
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
    console.log(`🎧 Deck ${deck} ready`);
    state.playerReady[deck] = true;
    applyVolume(deck);
}

function onPlayerStateChange(deck, event) {
    const statusEl = deck === 'A' ? els.deckAStatus : els.deckBStatus;
    const platter = deck === 'A' ? els.platterA : els.platterB;
    
    switch (event.data) {
        case YT.PlayerState.PLAYING:
            statusEl.textContent = 'PLAYING';
            statusEl.classList.add('playing');
            platter.classList.add('spinning');
            break;
        case YT.PlayerState.PAUSED:
            statusEl.textContent = 'PAUSED';
            statusEl.classList.remove('playing');
            platter.classList.remove('spinning');
            break;
        case YT.PlayerState.ENDED:
            statusEl.textContent = 'ENDED';
            statusEl.classList.remove('playing');
            platter.classList.remove('spinning');
            if (deck === state.activeDeck && !state.isCrossfading) {
                handleTrackEnd();
            }
            break;
        case YT.PlayerState.BUFFERING:
            statusEl.textContent = 'LOADING';
            break;
        default:
            statusEl.textContent = 'IDLE';
            statusEl.classList.remove('playing');
    }
}

function onPlayerError(deck, event) {
    console.error(`❌ Deck ${deck} error:`, event.data);
    showToast(`Error loading track on Deck ${deck}`);
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

function truncateTitle(title, maxLen = 25) {
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
    
    // Check for duplicates
    if (state.playlist.some(t => t.videoId === videoId)) {
        showToast('Track already in playlist');
        return false;
    }
    
    // Fetch video info via noembed
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
        bpm: Math.floor(Math.random() * 50) + 100, // Simulated BPM
    };
    
    state.playlist.push(track);
    renderPlaylist();
    showToast(`Added: ${truncateTitle(title)}`);
    
    // Auto-load first track
    if (state.playlist.length === 1) {
        loadTrackToDeck('A', 0);
    }
    // Pre-load second track to deck B
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
    els.trackCount.textContent = `${state.playlist.length} track${state.playlist.length !== 1 ? 's' : ''}`;
    
    if (state.playlist.length === 0) {
        els.queue.innerHTML = `
            <div class="empty-queue">
                <span class="empty-icon">📀</span>
                <p>Your playlist is empty</p>
                <p class="hint">Paste YouTube URLs above to add tracks</p>
            </div>
        `;
        els.nowPlayingText.textContent = 'Drop some tracks to get started';
        return;
    }
    
    const nextIndex = (state.currentIndex + 1) % state.playlist.length;
    
    els.queue.innerHTML = state.playlist.map((track, i) => `
        <div class="queue-item ${i === state.currentIndex ? 'active' : ''} ${i === nextIndex && state.playlist.length > 1 ? 'next' : ''}" 
             data-index="${i}" onclick="playFromQueue(${i})">
            <span class="queue-number">${i + 1}</span>
            <img class="queue-thumb" src="${track.thumbnail}" alt="" loading="lazy">
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
        // Crossfade to new track
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
    
    // Update UI
    const titleEl = deck === 'A' ? els.trackTitleA : els.trackTitleB;
    const vinylEl = deck === 'A' ? els.vinylTitleA : els.vinylTitleB;
    
    titleEl.textContent = track.title;
    vinylEl.textContent = truncateTitle(track.title, 10);
    
    if (deck === state.activeDeck) {
        els.nowPlayingText.textContent = track.title;
        els.bpmValue.textContent = track.bpm;
        // Update cassette label
        const cassetteTitle = document.getElementById('cassetteTitle');
        if (cassetteTitle) {
            cassetteTitle.textContent = track.title.length > 12 ? track.title.substring(0, 12) + '...' : track.title;
        }
    }
    
    console.log(`📀 Loaded "${track.title}" to Deck ${deck}`);
}

function play() {
    if (state.playlist.length === 0) {
        showToast('Add some tracks first!');
        return;
    }
    
    const player = state.players[state.activeDeck];
    if (player && state.playerReady[state.activeDeck]) {
        player.playVideo();
        state.isPlaying = true;
        els.btnPlayPause.innerHTML = '<span class="icon">⏸</span>';
        els.btnPlayPause.classList.add('playing');
        updateCassette(true);
    }
}

function pause() {
    state.players.A.pauseVideo();
    state.players.B.pauseVideo();
    state.isPlaying = false;
    els.btnPlayPause.innerHTML = '<span class="icon">▶</span>';
    els.btnPlayPause.classList.remove('playing');
    updateCassette(false);
}

// === Cassette Tape Animation ===
function updateCassette(isPlaying) {
    const cassette = document.querySelector('.cassette');
    const cassetteTitle = document.getElementById('cassetteTitle');
    
    if (cassette) {
        if (isPlaying) {
            cassette.classList.add('playing');
        } else {
            cassette.classList.remove('playing');
        }
    }
    
    // Update cassette label with current track
    if (cassetteTitle && state.currentIndex >= 0 && state.playlist[state.currentIndex]) {
        const title = state.playlist[state.currentIndex].title;
        // Truncate long titles
        cassetteTitle.textContent = title.length > 12 ? title.substring(0, 12) + '...' : title;
    }
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
    
    // Load new track to inactive deck
    loadTrackToDeck(newDeck, newIndex);
    
    // Wait a moment for cue, then start crossfade
    setTimeout(() => {
        state.players[newDeck].playVideo();
        performCrossfade(oldDeck, newDeck, () => {
            state.activeDeck = newDeck;
            state.currentIndex = newIndex;
            state.isCrossfading = false;
            
            // Preload next track to old deck
            const nextIndex = (newIndex + 1) % state.playlist.length;
            if (state.playlist.length > 1) {
                loadTrackToDeck(oldDeck, nextIndex);
            }
            
            renderPlaylist();
            els.nowPlayingText.textContent = state.playlist[newIndex].title;
            els.bpmValue.textContent = state.playlist[newIndex].bpm;
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
    
    const fadeInterval = setInterval(() => {
        step++;
        const progress = step / steps;
        
        // Fade out old deck
        const oldVol = Math.round(fromVolume * (1 - progress));
        // Fade in new deck
        const newVol = Math.round(toVolume * progress);
        
        state.players[fromDeck].setVolume(oldVol);
        state.players[toDeck].setVolume(newVol);
        
        // Update crossfader UI
        const crossfadePos = fromDeck === 'A' 
            ? Math.round(progress * 100)
            : Math.round(100 - progress * 100);
        els.crossfader.value = crossfadePos;
        
        if (step >= steps) {
            clearInterval(fadeInterval);
            state.players[fromDeck].pauseVideo();
            state.players[fromDeck].setVolume(fromVolume); // Reset volume
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
    
    // Only apply if not currently crossfading
    if (!state.isCrossfading) {
        state.players[deck].setVolume(Math.round(effectiveVolume));
    }
}

function applySpeed(deck) {
    if (!state.playerReady[deck]) return;
    state.players[deck].setPlaybackRate(state.speeds[deck]);
}

// === Visualizer ===
const visualizerCtx = els.visualizer.getContext('2d');
const barCount = 32;
const bars = Array(barCount).fill(0);

function drawVisualizer() {
    const width = els.visualizer.width;
    const height = els.visualizer.height;
    const barWidth = width / barCount - 2;
    
    visualizerCtx.fillStyle = '#0a0a0f';
    visualizerCtx.fillRect(0, 0, width, height);
    
    // Simulate audio visualization when playing
    for (let i = 0; i < barCount; i++) {
        if (state.isPlaying) {
            // Simulate frequency data with some randomness
            const target = Math.random() * 0.7 + 0.1;
            bars[i] += (target - bars[i]) * 0.3;
        } else {
            bars[i] *= 0.95; // Decay when paused
        }
        
        const barHeight = bars[i] * height * 0.8;
        const x = i * (barWidth + 2);
        const y = height - barHeight;
        
        // Gradient based on height
        const gradient = visualizerCtx.createLinearGradient(x, y, x, height);
        gradient.addColorStop(0, '#ff2d75');
        gradient.addColorStop(0.5, '#b14fff');
        gradient.addColorStop(1, '#00f5ff');
        
        visualizerCtx.fillStyle = gradient;
        visualizerCtx.fillRect(x, y, barWidth, barHeight);
    }
    
    requestAnimationFrame(drawVisualizer);
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
            
            // Auto-crossfade trigger (when track is near end)
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
            showToast(`Crossfade: ${state.crossfadeDuration}s`);
        });
    });
    
    // Manual crossfader
    els.crossfader.addEventListener('input', () => {
        if (state.isCrossfading) return;
        state.crossfadeValue = parseInt(els.crossfader.value);
        applyVolume('A');
        applyVolume('B');
    });
    
    // Speed controls
    els.speedA.addEventListener('input', () => {
        state.speeds.A = parseFloat(els.speedA.value);
        els.speedValueA.textContent = state.speeds.A.toFixed(2) + 'x';
        applySpeed('A');
    });
    
    els.speedB.addEventListener('input', () => {
        state.speeds.B = parseFloat(els.speedB.value);
        els.speedValueB.textContent = state.speeds.B.toFixed(2) + 'x';
        applySpeed('B');
    });
    
    // Volume controls
    els.volumeA.addEventListener('input', () => {
        state.volumes.A = parseInt(els.volumeA.value);
        els.volumeValueA.textContent = state.volumes.A + '%';
        applyVolume('A');
    });
    
    els.volumeB.addEventListener('input', () => {
        state.volumes.B = parseInt(els.volumeB.value);
        els.volumeValueB.textContent = state.volumes.B + '%';
        applyVolume('B');
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ignore if typing in input
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
}

// === Initialize ===
function init() {
    console.log('🎧 MixTape DJ initializing...');
    setupEventListeners();
    drawVisualizer();
    setInterval(updateProgress, 100);
    
    // Demo tracks (commented out - uncomment to test)
    // addTrack('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    
    showToast('🎧 MixTape DJ Ready!');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Make functions globally accessible for onclick handlers
window.playFromQueue = playFromQueue;
window.removeTrack = removeTrack;
