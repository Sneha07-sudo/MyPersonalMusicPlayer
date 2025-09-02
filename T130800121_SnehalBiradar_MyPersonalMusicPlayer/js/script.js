const audio = document.getElementById('audio');
const playPauseBtn = document.getElementById('play-pause');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const progress = document.getElementById('progress');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const volumeSlider = document.getElementById('volume');
const playlistEl = document.getElementById('playlist');
const songTitle = document.getElementById('song-title');
const artist = document.getElementById('artist');
const searchInput = document.getElementById('search');
const filterButtons = document.querySelectorAll('.filter-btn');
const albumArt = document.querySelector('.album-art');
const visualizerCanvas = document.getElementById('visualizer');
const ctx = visualizerCanvas.getContext('2d');

const songs = [
  {
    title: "Neon Dreams",
    artist: "CyberWave",
    src: "songs/song1.mp3",
    albumArt: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
    favorite: true,
    recentlyPlayed: true,
  },
  {
    title: "Digital Horizon",
    artist: "TechnoMind",
    src: "songs/song2.mp3",
    albumArt: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80",
    favorite: false,
    recentlyPlayed: true,
  },
  {
    title: "Quantum Leap",
    artist: "FutureSound",
    src: "songs/song3.mp3",
    albumArt: "https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&w=400&q=80",
    favorite: true,
    recentlyPlayed: false,
  },
  {
    title: "Synthetic Soul",
    artist: "ElectroHeart",
    src: "songs/song4.mp3",
    albumArt: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=400&q=80",
    favorite: false,
    recentlyPlayed: false,
  },
  {
    title: "Binary Beats",
    artist: "CodeRunner",
    src: "songs/song5.mp3",
    albumArt: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=400&q=80",
    favorite: false,
    recentlyPlayed: true,
  }
];

let currentSongIndex = 0;
let isPlaying = false;
let shuffle = false;
let repeat = false;

function loadSong(index) {
  const song = songs[index];
  audio.src = song.src;
  songTitle.textContent = song.title;
  artist.textContent = song.artist;
  albumArt.src = song.albumArt;
  updateActiveSong();
}

function playSong() {
  audio.play();
  isPlaying = true;
  playPauseBtn.innerHTML = '&#10074;&#10074;'; // Pause icon
}

function pauseSong() {
  audio.pause();
  isPlaying = false;
  playPauseBtn.innerHTML = '&#9658;'; // Play icon
}

playPauseBtn.addEventListener('click', () => {
  if (isPlaying) {
    pauseSong();
  } else {
    playSong();
  }
});

prevBtn.addEventListener('click', () => {
  if (shuffle) {
    currentSongIndex = Math.floor(Math.random() * songs.length);
  } else {
    currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
  }
  loadSong(currentSongIndex);
  playSong();
});

nextBtn.addEventListener('click', () => {
  if (shuffle) {
    currentSongIndex = Math.floor(Math.random() * songs.length);
  } else {
    currentSongIndex = (currentSongIndex + 1) % songs.length;
  }
  loadSong(currentSongIndex);
  playSong();
});

audio.addEventListener('timeupdate', () => {
  if (audio.duration) {
    const progressPercent = (audio.currentTime / audio.duration) * 100;
    progress.value = progressPercent;
    currentTimeEl.textContent = formatTime(audio.currentTime);
    durationEl.textContent = formatTime(audio.duration);
  }
});

progress.addEventListener('input', () => {
  if (audio.duration) {
    const seekTime = (progress.value / 100) * audio.duration;
    audio.currentTime = seekTime;
  }
});

volumeSlider.addEventListener('input', () => {
  audio.volume = volumeSlider.value;
});

audio.addEventListener('ended', () => {
  if (repeat) {
    playSong();
  } else {
    nextBtn.click();
  }
});

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function updateActiveSong() {
  const items = playlistEl.querySelectorAll('li');
  items.forEach((item, index) => {
    item.classList.toggle('active', index === currentSongIndex);
  });
}

function populatePlaylist(filter = 'all', searchTerm = '') {
  playlistEl.innerHTML = '';
  let filteredSongs = songs;

  if (filter === 'favorites') {
    filteredSongs = songs.filter(song => song.favorite);
  } else if (filter === 'recent') {
    filteredSongs = songs.filter(song => song.recentlyPlayed);
  }

  if (searchTerm) {
    filteredSongs = filteredSongs.filter(song =>
      song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  filteredSongs.forEach((song, index) => {
    const li = document.createElement('li');
    li.classList.add('playlist-item');
    li.innerHTML = `
      <div class="song-details">
        <span class="song-title">${song.title}</span>
        <span class="song-artist">${song.artist}</span>
      </div>
    `;
    li.addEventListener('click', () => {
      currentSongIndex = songs.indexOf(song);
      loadSong(currentSongIndex);
      playSong();
    });
    playlistEl.appendChild(li);
  });
  updateActiveSong();
}

// Search functionality
searchInput.addEventListener('input', () => {
  populatePlaylist(getActiveFilter(), searchInput.value);
});

// Filter tabs functionality
filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    filterButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    populatePlaylist(button.getAttribute('data-filter'), searchInput.value);
  });
});

// Visualizer setup
let audioContext;
let analyser;
let source;
let dataArray;
let bufferLength;

function setupVisualizer() {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();
  source = audioContext.createMediaElementSource(audio);
  source.connect(analyser);
  analyser.connect(audioContext.destination);
  analyser.fftSize = 256;
  bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);
  drawVisualizer();
}

function drawVisualizer() {
  requestAnimationFrame(drawVisualizer);
  analyser.getByteFrequencyData(dataArray);
  ctx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);

  const barWidth = (visualizerCanvas.width / bufferLength) * 2.5;
  let barHeight;
  let x = 0;

  for (let i = 0; i < bufferLength; i++) {
    barHeight = dataArray[i];
    const r = 124;
    const g = 77;
    const b = 255;
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.shadowColor = `rgba(${r},${g},${b},0.7)`;
    ctx.shadowBlur = 10;
    ctx.fillRect(x, visualizerCanvas.height - barHeight / 2, barWidth, barHeight / 2);
    x += barWidth + 1;
  }
}

function getActiveFilter() {
  const activeBtn = document.querySelector('.filter-btn.active');
  return activeBtn ? activeBtn.getAttribute('data-filter') : 'all';
}

// Initialize
populatePlaylist();
loadSong(currentSongIndex);

audio.addEventListener('play', () => {
  if (!audioContext) {
    setupVisualizer();
  }
});
