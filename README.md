# Multiplayer Image Guessing Game

## 🎮 Overview
A real-time multiplayer game where players describe images to others and compete to guess correctly. Each player gets a unique image from a collection of 22 images, describes it to the group, and other players try to identify which image the describer is talking about.

## 🎯 Game Flow

1. **Lobby Phase**: Players join a game room with a room code
2. **Image Assignment**: Each player receives a unique random image (private)
3. **Description Phase**: Players describe their assigned image to others without revealing the answer
4. **Guessing Phase**: Other players submit their guesses for which player has which image
5. **Reveal Phase**: Correct answers are revealed
6. **Scoring**: First player to correctly guess wins a point
7. **Next Round**: Repeat with new image assignments

## 📋 Game Images (22 Total)

1. 2008 Financial Crisis
2. Mike Pence
3. Presidential Stairs Incident
4. Scott Morrison
5. Man at Stadium
6. Senate Attendee
7. Capitol Building Protest
8. Presidential Address
9. Hiroshima Bombing
10. 9/11 Attack
11. Political Rally
12. News Anchor (Male)
13. News Anchor (Female)
14. Woman Portrait
15. Man Mugshot
16. Religious Icon
17. Historical Revolutionary
18. Former Iraqi Leader
19. Karl Marx
20. Anne Frank
21. Jesus Christ
22. News Broadcast

## 🚀 How to Run

### Backend Server
```bash
npm install
npm start
```
Server runs on `http://localhost:5000`

### Frontend (React)
```bash
cd client
npm install
npm start
```
Frontend runs on `http://localhost:3000`

## 📖 How to Play

1. **Create or Join**: Start a new game or join with a room code
2. **Wait for Players**: Minimum 2 players required to start
3. **View Your Image**: Only you can see your assigned image
4. **Describe**: Tell others about your image without saying what it is
5. **Guess**: Listen to descriptions and try to match them to players
6. **Score**: First correct guess wins a point
7. **Repeat**: Play multiple rounds to build up your score

## 🏆 Scoring System

- **1 point** for correctly identifying someone else's image
- Players can play unlimited rounds
- Scores accumulate throughout the game session
- Leaderboard updates after each round

## 🔧 Tech Stack

- **Backend**: Node.js + Express + Socket.io
- **Frontend**: React + TypeScript
- **Real-time Communication**: WebSockets
- **Data Format**: JSON

## 💡 Socket.io Events

### Client → Server
- `createGame`: Start a new game room
- `joinGame`: Join existing game
- `startGame`: Begin the game
- `submitDescription`: Submit your image description
- `submitGuess`: Submit a guess for someone's image
- `revealRound`: Request round results
- `nextRound`: Move to next round
- `getMyImage`: Retrieve your assigned image ID

### Server → Client
- `gameCreated`: Game successfully created
- `gameJoined`: Successfully joined game
- `gameUpdated`: Game state changed
- `roundStarted`: New round begins
- `descriptionSubmitted`: Description received
- `guessSubmitted`: Guess received
- `roundRevealed`: Results and scores
- `myImage`: Your assigned image ID
- `error`: Error notification

## 🎲 Rules

- Minimum 2 players required
- Each player gets exactly one image per round
- You cannot guess your own image
- Descriptions must not directly reveal the image
- First player to guess correctly gets the point
- All images are randomized each round
- No player gets the same image in consecutive rounds

## 🛠️ Development

```bash
# Run server with auto-reload
npm run dev

# Run both server and client
# Terminal 1:
npm start
# Terminal 2:
npm run client
```
