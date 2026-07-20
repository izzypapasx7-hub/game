const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: "*" }
});

app.use(express.static('public'));
app.use(express.json());

// Game state
let gameState = {
  players: {},
  gameActive: false,
  currentRound: 0,
  currentDescriber: null,
  imageAssignments: {},
  scores: {},
  descriptions: [],
  guesses: {},
  roundTimeout: null,
  usedImages: []
};

const IMAGE_IDS = [
  'crisis_2008', 'pence', 'air_force_one', 'aus_pm', 
  'pink_hair', 'houndstooth', 'turban', 'hoodie',
  'capitol_riot', 'clinton', 'hiroshima', '9_11'
];

const IMAGE_NAMES = [
  '2008 Financial Crisis',
  'Mike Pence',
  'Air Force One Stairs',
  'Australian Prime Minister',
  'Pink Hair Sequins',
  'Houndstooth Pearl',
  'Turban',
  'Hoodie Portrait',
  'Capitol Building Riot',
  'Bill Clinton at Desk',
  'Hiroshima Bombing',
  '9/11 Twin Towers'
];

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/image/:id', (req, res) => {
  const images = require('./public/images.json');
  const imageId = req.params.id;
  if (images[imageId]) {
    res.json(images[imageId]);
  } else {
    res.status(404).json({ error: 'Image not found' });
  }
});

// Socket.io events
io.on('connection', (socket) => {
  console.log('New player connected:', socket.id);

  socket.on('join-game', (playerName) => {
    gameState.players[socket.id] = {
      id: socket.id,
      name: playerName,
      isConnected: true
    };
    gameState.scores[socket.id] = 0;

    io.emit('player-joined', {
      playerName,
      totalPlayers: Object.keys(gameState.players).length,
      players: Object.values(gameState.players)
    });
  });

  socket.on('start-game', () => {
    if (Object.keys(gameState.players).length < 2) {
      socket.emit('error', 'Need at least 2 players to start');
      return;
    }

    gameState.gameActive = true;
    gameState.currentRound = 0;
    startNewRound();
  });

  socket.on('submit-description', (description) => {
    if (socket.id === gameState.currentDescriber) {
      gameState.descriptions.push({
        playerId: socket.id,
        playerName: gameState.players[socket.id].name,
        description,
        timestamp: Date.now()
      });
      io.emit('description-submitted', { description });
    }
  });

  socket.on('submit-guess', (guess) => {
    if (socket.id !== gameState.currentDescriber && gameState.gameActive) {
      const correctAnswer = IMAGE_NAMES[gameState.imageAssignments[gameState.currentDescriber]];
      const isCorrect = guess.toLowerCase().trim() === correctAnswer.toLowerCase().trim();

      if (isCorrect && !gameState.guesses[socket.id]) {
        gameState.guesses[socket.id] = true;
        gameState.scores[socket.id] += 10;
        
        io.emit('correct-guess', {
          playerName: gameState.players[socket.id].name,
          correctAnswer,
          updatedScores: gameState.scores
        });

        clearTimeout(gameState.roundTimeout);
        scheduleNextRound();
      } else if (!isCorrect) {
        socket.emit('incorrect-guess', { guess });
      }
    }
  });

  socket.on('disconnect', () => {
    delete gameState.players[socket.id];
    delete gameState.scores[socket.id];
    console.log('Player disconnected:', socket.id);
    
    io.emit('player-left', {
      totalPlayers: Object.keys(gameState.players).length,
      players: Object.values(gameState.players)
    });
  });
});

function startNewRound() {
  gameState.currentRound++;
  gameState.descriptions = [];
  gameState.guesses = {};
  
  const playerIds = Object.keys(gameState.players);
  gameState.currentDescriber = playerIds[Math.floor(Math.random() * playerIds.length)];
  
  // Assign images to all players
  gameState.imageAssignments = {};
  const shuffledImages = [...IMAGE_IDS].sort(() => Math.random() - 0.5);
  playerIds.forEach((playerId, index) => {
    gameState.imageAssignments[playerId] = index % IMAGE_IDS.length;
  });

  io.emit('new-round', {
    round: gameState.currentRound,
    describer: {
      id: gameState.currentDescriber,
      name: gameState.players[gameState.currentDescriber].name
    },
    scores: gameState.scores,
    roundDuration: 60
  });

  // Send each player their image
  Object.keys(gameState.players).forEach(playerId => {
    const imageIndex = gameState.imageAssignments[playerId];
    io.to(playerId).emit('your-image', {
      imageName: IMAGE_NAMES[imageIndex],
      imageId: IMAGE_IDS[imageIndex],
      isDescriber: playerId === gameState.currentDescriber
    });
  });

  // Set round timeout
  gameState.roundTimeout = setTimeout(() => {
    endRound();
  }, 60000);
}

function endRound() {
  const correctAnswer = IMAGE_NAMES[gameState.imageAssignments[gameState.currentDescriber]];
  io.emit('round-ended', {
    correctAnswer,
    scores: gameState.scores
  });

  setTimeout(() => {
    if (gameState.gameActive && Object.keys(gameState.players).length > 0) {
      startNewRound();
    }
  }, 3000);
}

function scheduleNextRound() {
  gameState.roundTimeout = setTimeout(() => {
    if (gameState.gameActive) {
      startNewRound();
    }
  }, 3000);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Game server running on http://localhost:${PORT}`);
});