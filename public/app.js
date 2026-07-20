const socket = io();

let gameState = {
  playerName: '',
  playerId: null,
  isDescriber: false,
  currentRound: 0,
  currentImage: null,
  scores: {},
  imageCache: {}
};

// DOM Elements
const lobbyScreen = document.getElementById('lobby');
const gameScreen = document.getElementById('gameScreen');
const playerNameInput = document.getElementById('playerName');
const joinBtn = document.getElementById('joinBtn');
const playersContainer = document.getElementById('playersContainer');
const playersList = document.getElementById('playersList');
const startBtn = document.getElementById('startBtn');
const scoresList = document.getElementById('scoresList');
const roundNumber = document.getElementById('roundNumber');
const timerDisplay = document.getElementById('timerDisplay');
const describerView = document.getElementById('describerView');
const guesserView = document.getElementById('guesserView');
const roundEnd = document.getElementById('roundEnd');
const describerImage = document.getElementById('describerImage');
const descriptionInput = document.getElementById('descriptionInput');
const sendDescriptionBtn = document.getElementById('sendDescriptionBtn');
const describerName = document.getElementById('describerName');
const descriptionDisplay = document.getElementById('descriptionDisplay');
const guessInput = document.getElementById('guessInput');
const submitGuessBtn = document.getElementById('submitGuessBtn');
const feedbackArea = document.getElementById('feedbackArea');
const roundEndInfo = document.getElementById('roundEndInfo');

let roundTimer = null;
let roundTimeLeft = 60;

// Event Listeners
joinBtn.addEventListener('click', joinGame);
playerNameInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') joinGame();
});

startBtn.addEventListener('click', () => {
  socket.emit('start-game');
});

sendDescriptionBtn.addEventListener('click', submitDescription);
descriptionInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    submitDescription();
  }
});

submitGuessBtn.addEventListener('click', submitGuess);
guessInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    submitGuess();
  }
});

// Join Game
function joinGame() {
  const name = playerNameInput.value.trim();
  if (!name) {
    alert('Please enter a name');
    return;
  }

  gameState.playerName = name;
  gameState.playerId = socket.id;
  socket.emit('join-game', name);
  playerNameInput.value = '';
}

// Socket Events
socket.on('player-joined', (data) => {
  playersList.classList.remove('hidden');
  playersContainer.innerHTML = '';
  data.players.forEach(player => {
    const li = document.createElement('li');
    li.textContent = player.name;
    playersContainer.appendChild(li);
  });

  // Show start button if current user has multiple players
  if (data.totalPlayers >= 2) {
    startBtn.classList.remove('hidden');
  }
});

socket.on('new-round', (data) => {
  hideAllViews();
  roundNumber.textContent = data.round;
  gameState.currentRound = data.round;
  gameState.scores = data.scores;
  updateScores();

  roundTimeLeft = data.roundDuration;
  startRoundTimer();

  // Show appropriate view
  if (gameState.isDescriber) {
    describerView.classList.add('active');
    descriptionInput.focus();
    descriptionInput.value = '';
  } else {
    guesserView.classList.add('active');
    describerName.textContent = data.describer.name;
    descriptionDisplay.innerHTML = '<p class="waiting">Waiting for description...</p>';
    feedbackArea.innerHTML = '';
    guessInput.value = '';
    guessInput.focus();
  }
});

socket.on('your-image', (data) => {
  gameState.currentImage = data;
  gameState.isDescriber = data.isDescriber;

  if (data.isDescriber) {
    loadImage(data.imageId, (imageSrc) => {
      describerImage.src = imageSrc;
    });
  }
});

socket.on('description-submitted', (data) => {
  descriptionDisplay.innerHTML = `<p>${data.description}</p>`;
});

socket.on('incorrect-guess', (data) => {
  feedbackArea.innerHTML = `<span class="incorrect">❌ Wrong guess! Try again.</span>`;
  feedbackArea.classList.add('incorrect');
  feedbackArea.classList.remove('correct');
  setTimeout(() => {
    feedbackArea.innerHTML = '';
    feedbackArea.classList.remove('incorrect');
  }, 2000);
  guessInput.value = '';
});

socket.on('correct-guess', (data) => {
  const guessMessage = `✅ ${data.playerName} guessed correctly! Answer: ${data.correctAnswer}`;
  hideAllViews();
  roundEnd.classList.add('active');
  roundEndInfo.innerHTML = `<h3>${guessMessage}</h3>`;
  gameState.scores = data.updatedScores;
  updateScores();
});

socket.on('round-ended', (data) => {
  hideAllViews();
  roundEnd.classList.add('active');
  roundEndInfo.innerHTML = `<h3>Time's up! The answer was: ${data.correctAnswer}</h3>`;
  gameState.scores = data.scores;
  updateScores();
});

socket.on('player-left', (data) => {
  if (data.totalPlayers === 0) {
    alert('Game ended - all players disconnected');
    location.reload();
  }
});

socket.on('error', (message) => {
  alert(message);
});

// Functions
function submitDescription() {
  const description = descriptionInput.value.trim();
  if (description) {
    socket.emit('submit-description', description);
  }
}

function submitGuess() {
  const guess = guessInput.value.trim();
  if (guess) {
    socket.emit('submit-guess', guess);
    guessInput.value = '';
  }
}

function hideAllViews() {
  describerView.classList.remove('active');
  guesserView.classList.remove('active');
  roundEnd.classList.remove('active');
  clearTimeout(roundTimer);
}

function updateScores() {
  scoresList.innerHTML = '';
  const sortedScores = Object.entries(gameState.scores)
    .sort(([, a], [, b]) => b - a);

  sortedScores.forEach(([playerId, score]) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="player-name">Player</span>
      <span class="player-score">${score}</span>
    `;
    scoresList.appendChild(li);
  });
}

function startRoundTimer() {
  clearTimeout(roundTimer);
  roundTimeLeft = 60;
  updateTimerDisplay();

  roundTimer = setInterval(() => {
    roundTimeLeft--;
    updateTimerDisplay();
    if (roundTimeLeft <= 0) {
      clearTimeout(roundTimer);
    }
  }, 1000);
}

function updateTimerDisplay() {
  timerDisplay.textContent = `${roundTimeLeft}s`;
  if (roundTimeLeft <= 10) {
    timerDisplay.style.color = '#e53e3e';
  } else {
    timerDisplay.style.color = '#764ba2';
  }
}

function loadImage(imageId, callback) {
  // Sample placeholder implementation
  // In production, you would fetch from server or use actual image URLs
  const placeholderColors = {
    'crisis_2008': '#333',
    'pence': '#555',
    'air_force_one': '#777',
    'aus_pm': '#999',
    'pink_hair': '#ff69b4',
    'houndstooth': '#000080',
    'turban': '#8b7355',
    'hoodie': '#1a1a1a',
    'capitol_riot': '#4b0082',
    'clinton': '#c0c0c0',
    'hiroshima': '#ff8c00',
    '9_11': '#4682b4'
  };
  
  const color = placeholderColors[imageId] || '#999';
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 300;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 400, 300);
  ctx.fillStyle = 'white';
  ctx.font = '24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(imageId.replace(/_/g, ' '), 200, 150);
  
  callback(canvas.toDataURL());
}

// Initialize lobby visibility
window.addEventListener('load', () => {
  lobbyScreen.classList.add('active');
});

socket.on('connect', () => {
  console.log('Connected to server');
});