const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());

const IMAGE_COUNT = 22;
const IMAGES = Array.from({length: IMAGE_COUNT}, (_, i) => i + 1);

const GamePhase = {
  LOBBY: 'lobby',
  ASSIGNMENT: 'assignment',
  DESCRIPTION: 'description',
  GUESSING: 'guessing',
  REVEAL: 'reveal',
  SCORES: 'scores'
};

class Game {
  constructor(gameId) {
    this.gameId = gameId;
    this.players = {};
    this.phase = GamePhase.LOBBY;
    this.currentRound = 0;
    this.scores = {};
    this.imageAssignments = {};
    this.descriptions = {};
    this.guesses = {};
  }

  addPlayer(socketId, name) {
    this.players[socketId] = {
      id: socketId,
      name,
      ready: false
    };
    this.scores[socketId] = 0;
  }

  removePlayer(socketId) {
    delete this.players[socketId];
    delete this.scores[socketId];
  }

  getPlayerCount() {
    return Object.keys(this.players).length;
  }

  shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  startRound() {
    this.currentRound++;
    const playerIds = Object.keys(this.players);
    const shuffledImages = this.shuffleArray(IMAGES);
    
    this.imageAssignments = {};
    this.descriptions = {};
    this.guesses = {};
    
    playerIds.forEach((playerId, index) => {
      this.imageAssignments[playerId] = shuffledImages[index % shuffledImages.length];
    });
    
    this.phase = GamePhase.DESCRIPTION;
  }

  submitDescription(socketId, description) {
    this.descriptions[socketId] = {
      playerId: socketId,
      playerName: this.players[socketId].name,
      description,
      imageId: this.imageAssignments[socketId]
    };

    if (Object.keys(this.descriptions).length === this.getPlayerCount()) {
      this.phase = GamePhase.GUESSING;
    }
  }

  submitGuess(socketId, guessPlayerId) {
    if (!this.guesses[socketId]) {
      this.guesses[socketId] = [];
    }
    this.guesses[socketId].push(guessPlayerId);
  }

  revealAnswers() {
    const reveals = Object.keys(this.descriptions).map(socketId => ({
      describer: this.players[socketId].name,
      description: this.descriptions[socketId].description,
      imageId: this.imageAssignments[socketId],
      guesses: this.guesses
    }));
    return reveals;
  }
}

const games = {};

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  socket.on('createGame', (playerName) => {
    const gameId = Math.random().toString(36).substr(2, 9);
    games[gameId] = new Game(gameId);
    games[gameId].addPlayer(socket.id, playerName);
    socket.join(gameId);
    socket.emit('gameCreated', { gameId, game: games[gameId] });
    io.to(gameId).emit('gameUpdated', games[gameId]);
  });

  socket.on('joinGame', (gameId, playerName) => {
    if (games[gameId] && games[gameId].phase === GamePhase.LOBBY) {
      games[gameId].addPlayer(socket.id, playerName);
      socket.join(gameId);
      socket.emit('gameJoined', { gameId, game: games[gameId] });
      io.to(gameId).emit('gameUpdated', games[gameId]);
    } else {
      socket.emit('error', 'Game not found or already started');
    }
  });

  socket.on('startGame', (gameId) => {
    if (games[gameId] && games[gameId].getPlayerCount() >= 2) {
      games[gameId].startRound();
      io.to(gameId).emit('roundStarted', {
        round: games[gameId].currentRound,
        gameState: games[gameId]
      });
    }
  });

  socket.on('getMyImage', (gameId) => {
    if (games[gameId]) {
      const imageId = games[gameId].imageAssignments[socket.id];
      socket.emit('myImage', { imageId });
    }
  });

  socket.on('submitDescription', (gameId, description) => {
    if (games[gameId]) {
      games[gameId].submitDescription(socket.id, description);
      io.to(gameId).emit('descriptionSubmitted', { gameState: games[gameId] });
    }
  });

  socket.on('submitGuess', (gameId, guessPlayerId) => {
    if (games[gameId]) {
      games[gameId].submitGuess(socket.id, guessPlayerId);
      const allGuessesIn = Object.keys(games[gameId].guesses).length === games[gameId].getPlayerCount();
      io.to(gameId).emit('guessSubmitted', { allGuessesIn, gameState: games[gameId] });
    }
  });

  socket.on('revealRound', (gameId) => {
    if (games[gameId]) {
      const reveals = games[gameId].revealAnswers();
      io.to(gameId).emit('roundRevealed', { reveals, scores: games[gameId].scores });
    }
  });

  socket.on('nextRound', (gameId) => {
    if (games[gameId]) {
      games[gameId].startRound();
      io.to(gameId).emit('roundStarted', {
        round: games[gameId].currentRound,
        gameState: games[gameId]
      });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    Object.keys(games).forEach(gameId => {
      if (games[gameId].players[socket.id]) {
        games[gameId].removePlayer(socket.id);
        io.to(gameId).emit('gameUpdated', games[gameId]);
        if (games[gameId].getPlayerCount() === 0) {
          delete games[gameId];
        }
      }
    });
  });
});

server.listen(5000, () => {
  console.log('Server running on port 5000');
});
