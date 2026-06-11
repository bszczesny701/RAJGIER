const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const {
  createBattleshipState,
  placeShipsOnBoard,
  allPlaced,
  startBattle,
  shoot,
  getPublicBattleshipState,
} = require('./games/battleship');
const {
  createWordSearchState,
  tryFindWord,
  getPublicWordSearchState,
} = require('./games/wordsearch');

const app = express();
app.use(cors());

app.get('/health', (_req, res) => {
  res.json({ ok: true, name: 'RAJ GIER' });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

const rooms = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  if (rooms.has(code)) return generateRoomCode();
  return code;
}

function getRoomPublic(room) {
  return {
    code: room.code,
    players: room.players.map((p) => ({ id: p.id, name: p.name })),
    hostId: room.hostId,
    status: room.status,
    game: room.game,
  };
}

function getOpponent(room, playerId) {
  return room.players.find((p) => p.id !== playerId)?.id;
}

function emitRoomUpdate(room) {
  io.to(room.code).emit('roomUpdate', getRoomPublic(room));
}

function emitBattleshipUpdate(room) {
  for (const player of room.players) {
    const opponentId = getOpponent(room, player.id);
    io.to(player.id).emit('battleshipUpdate', {
      ...getPublicBattleshipState(room.gameState, player.id, opponentId),
      opponentName: room.players.find((p) => p.id === opponentId)?.name,
      myName: player.name,
    });
  }
}

function emitWordSearchUpdate(room) {
  for (const player of room.players) {
    io.to(player.id).emit('wordsearchUpdate', {
      ...getPublicWordSearchState(room.gameState, player.id),
      opponentName: room.players.find((p) => p.id !== player.id)?.name,
      myName: player.name,
      myId: player.id,
    });
  }
}

function startGame(room, game) {
  room.game = game;
  room.status = 'playing';

  if (game === 'battleship') {
    room.gameState = createBattleshipState();
    emitBattleshipUpdate(room);
  } else if (game === 'wordsearch') {
    room.gameState = createWordSearchState();
    for (const player of room.players) {
      room.gameState.scores[player.id] = 0;
    }
    emitWordSearchUpdate(room);
  }

  emitRoomUpdate(room);
  io.to(room.code).emit('gameStart', { game });
}

function resetToLobby(room) {
  room.status = 'waiting';
  room.game = null;
  room.gameState = null;
  emitRoomUpdate(room);
}

const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (require('fs').existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('/{*path}', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

io.on('connection', (socket) => {
  let currentRoom = null;

  socket.on('createRoom', ({ playerName }, callback) => {
    const name = (playerName || 'Gracz').trim().slice(0, 20) || 'Gracz';
    const code = generateRoomCode();

    const room = {
      code,
      players: [{ id: socket.id, name }],
      hostId: socket.id,
      status: 'waiting',
      game: null,
      gameState: null,
    };

    rooms.set(code, room);
    currentRoom = code;
    socket.join(code);

    callback?.({ success: true, roomCode: code, playerId: socket.id });
    emitRoomUpdate(room);
  });

  socket.on('joinRoom', ({ roomCode, playerName }, callback) => {
    const code = (roomCode || '').trim().toUpperCase();
    const room = rooms.get(code);

    if (!room) {
      callback?.({ success: false, error: 'Nie znaleziono pokoju' });
      return;
    }

    if (room.players.length >= 2) {
      callback?.({ success: false, error: 'Pokój jest pełny' });
      return;
    }

    if (room.status === 'playing') {
      callback?.({ success: false, error: 'Gra już trwa' });
      return;
    }

    const name = (playerName || 'Gracz').trim().slice(0, 20) || 'Gracz';
    room.players.push({ id: socket.id, name });
    currentRoom = code;
    socket.join(code);

    callback?.({ success: true, roomCode: code, playerId: socket.id });
    emitRoomUpdate(room);
  });

  socket.on('selectGame', ({ game }) => {
    const room = rooms.get(currentRoom);
    if (!room || room.hostId !== socket.id) return;
    if (room.players.length < 2) return;
    if (!['battleship', 'wordsearch'].includes(game)) return;

    startGame(room, game);
  });

  socket.on('placeShips', ({ ships }) => {
    const room = rooms.get(currentRoom);
    if (!room || room.game !== 'battleship') return;

    const result = placeShipsOnBoard(room.gameState, socket.id, ships);
    if (!result.valid) {
      socket.emit('error', { message: result.reason });
      return;
    }

    const playerIds = room.players.map((p) => p.id);
    if (allPlaced(room.gameState, playerIds)) {
      startBattle(room.gameState, playerIds);
    }

    emitBattleshipUpdate(room);
  });

  socket.on('shoot', ({ row, col }) => {
    const room = rooms.get(currentRoom);
    if (!room || room.game !== 'battleship') return;

    const opponentId = getOpponent(room, socket.id);
    const result = shoot(room.gameState, socket.id, row, col, opponentId);

    if (!result.valid) {
      socket.emit('error', { message: result.reason });
      return;
    }

    emitBattleshipUpdate(room);

    if (room.gameState.winner) {
      const winner = room.players.find((p) => p.id === room.gameState.winner);
      io.to(room.code).emit('gameOver', {
        winnerId: room.gameState.winner,
        winnerName: winner?.name,
        game: 'battleship',
      });
      room.status = 'finished';
      emitRoomUpdate(room);
    }
  });

  socket.on('findWord', ({ cells }) => {
    const room = rooms.get(currentRoom);
    if (!room || room.game !== 'wordsearch') return;

    const result = tryFindWord(room.gameState, socket.id, cells);
    if (!result.success) {
      socket.emit('error', { message: result.reason });
      return;
    }

    emitWordSearchUpdate(room);

    if (room.gameState.winner) {
      let winnerName;
      if (room.gameState.winner === 'draw') {
        winnerName = null;
      } else {
        winnerName = room.players.find((p) => p.id === room.gameState.winner)?.name;
      }
      io.to(room.code).emit('gameOver', {
        winnerId: room.gameState.winner === 'draw' ? 'draw' : room.gameState.winner,
        winnerName,
        game: 'wordsearch',
        draw: room.gameState.winner === 'draw',
      });
      room.status = 'finished';
      emitRoomUpdate(room);
    }
  });

  socket.on('backToLobby', () => {
    const room = rooms.get(currentRoom);
    if (!room || room.hostId !== socket.id) return;
    resetToLobby(room);
  });

  socket.on('rejoinRoom', ({ roomCode }, callback) => {
    const code = (roomCode || '').trim().toUpperCase();
    const room = rooms.get(code);
    if (!room) {
      callback?.({ success: false });
      return;
    }

    const existing = room.players.find((p) => p.id === socket.id);
    if (!existing) {
      callback?.({ success: false });
      return;
    }

    currentRoom = code;
    socket.join(code);
    callback?.({ success: true, room: getRoomPublic(room), playerId: socket.id });

    if (room.game === 'battleship' && room.gameState) {
      emitBattleshipUpdate(room);
    } else if (room.game === 'wordsearch' && room.gameState) {
      emitWordSearchUpdate(room);
    }
  });

  socket.on('disconnect', () => {
    const room = rooms.get(currentRoom);
    if (!room) return;

    room.players = room.players.filter((p) => p.id !== socket.id);

    if (room.players.length === 0) {
      rooms.delete(room.code);
      return;
    }

    if (room.hostId === socket.id) {
      room.hostId = room.players[0].id;
    }

    if (room.status === 'playing') {
      room.status = 'finished';
      io.to(room.code).emit('gameOver', {
        winnerId: room.players[0].id,
        winnerName: room.players[0].name,
        game: room.game,
        forfeit: true,
      });
    }

    emitRoomUpdate(room);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`RAJ GIER serwer działa na porcie ${PORT}`);
});
