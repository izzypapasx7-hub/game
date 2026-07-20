# 🎮 Multiplayer Image Guessing Game

A real-time multiplayer game where players describe images to others and compete to guess them correctly.

## How to Play

1. **Join the Game** - Enter your name in the lobby
2. **Start Game** - Once 2+ players have joined, click "Start Game"
3. **Each Round**:
   - One player is the **Describer** - They see an image and must describe it to other players
   - Other players are **Guessers** - They read the description and try to guess what the image is
   - **First correct guess wins 10 points!**
4. **Rotate** - Each round, a new player becomes the describer
5. **Keep Score** - Track scores on the sidebar

## Features

- ✅ Real-time multiplayer using Socket.io
- ✅ 12 historical/political images
- ✅ Live score tracking
- ✅ 60-second round timer
- ✅ Round rotation system
- ✅ Responsive design for mobile & desktop
- ✅ Private image distribution (each player gets their own)

## Installation

```bash
# Install dependencies
npm install

# Start server
npm start

# Visit http://localhost:3000
```

## Tech Stack

- **Backend**: Node.js, Express, Socket.io
- **Frontend**: HTML5, CSS3, JavaScript
- **Real-time**: Socket.io WebSockets

## Game Images

The game includes 12 images:
1. 2008 Financial Crisis
2. Mike Pence
3. Air Force One Stairs
4. Australian Prime Minister
5. Pink Hair Sequins
6. Houndstooth Pearl
7. Turban
8. Hoodie Portrait
9. Capitol Building Riot
10. Bill Clinton at Desk
11. Hiroshima Bombing
12. 9/11 Twin Towers

## Future Enhancements

- [ ] Image upload/customization
- [ ] Custom round durations
- [ ] Team mode
- [ ] Leaderboard persistence
- [ ] Chat system
- [ ] Sound effects
- [ ] Difficulty levels with hint system
- [ ] Actual image loading from PDF

## License

MIT