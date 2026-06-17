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
const {
  createCrosswordState,
  trySubmitWord,
  getPublicCrosswordState,
  checkWinner,
} = require('./games/crossword');
const {
  createSudokuState,
  trySubmitSudoku,
  getPublicSudokuState,
} = require('./games/sudoku');
const {
  createUnosState,
  playCard,
  finalizeWildColor,
  drawCard,
  callUnos,
  passTurn,
  getPublicUnosState,
} = require('./games/unos');
const {
  createCzolkoState,
  tryAskQuestion,
  tryAnswerQuestion,
  tryGuess,
  trySkip,
  getPublicCzolkoState,
  getPeopleForPool,
  normalizeCharacterPool,
} = require('./games/czolko');

const app = express();
app.use(cors());

app.get('/health', (_req, res) => {
  res.json({ ok: true, name: 'RAJ GIER' });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  transports: ['websocket', 'polling'],
});

const rooms = new Map();
const MAX_ROOM_PLAYERS = 4;

const GAME_PLAYER_LIMITS = {
  battleship: { min: 2, max: 2 },
  wordsearch: { min: 2, max: 2 },
  crossword: { min: 2, max: 2 },
  sudoku: { min: 2, max: 2 },
  unos: { min: 2, max: 4 },
  czolko: { min: 2, max: 4 },
};

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

function findPlayer(room, { sessionId, playerName, socketId }) {
  if (!room) return null;
  if (sessionId) {
    const bySession = room.players.find((p) => p.id === sessionId);
    if (bySession) return bySession;
  }
  if (playerName) {
    const name = playerName.trim().slice(0, 20);
    const byName = room.players.find((p) => p.name === name);
    if (byName) return byName;
  }
  if (socketId) {
    return room.players.find((p) => p.socketId === socketId) || null;
  }
  return null;
}

function bindSocketToRoom(socket, room, player) {
  player.socketId = socket.id;
  socket.join(room.code);
  return room.code;
}

function getRoomForSocket(socket, currentRoom, roomCode) {
  const code = (currentRoom || roomCode || '').toString().trim().toUpperCase();
  if (!code) return null;
  return rooms.get(code) || null;
}

function resolvePlayerContext(socket, currentRoom, payload = {}) {
  const room = getRoomForSocket(socket, currentRoom, payload.roomCode);
  if (!room) return { room: null, player: null, roomCode: null };

  const player = findPlayer(room, {
    sessionId: payload.sessionId,
    playerName: payload.playerName,
    socketId: socket.id,
  });

  if (!player) return { room, player: null, roomCode: room.code };

  const roomCode = bindSocketToRoom(socket, room, player);
  return { room, player, roomCode };
}

function buildBattleshipPayload(room, playerId) {
  const player = room.players.find((p) => p.id === playerId);
  const opponentId = getOpponent(room, playerId);
  return {
    ...getPublicBattleshipState(room.gameState, playerId, opponentId),
    opponentName: room.players.find((p) => p.id === opponentId)?.name,
    myName: player?.name,
  };
}

function buildWordSearchPayload(room, playerId) {
  const player = room.players.find((p) => p.id === playerId);
  return {
    ...getPublicWordSearchState(room.gameState, playerId),
    opponentName: room.players.find((p) => p.id !== playerId)?.name,
    myName: player?.name,
    myId: playerId,
  };
}

function buildCrosswordPayload(room, playerId) {
  const player = room.players.find((p) => p.id === playerId);
  return {
    ...getPublicCrosswordState(room.gameState, playerId),
    opponentName: room.players.find((p) => p.id !== playerId)?.name,
    myName: player?.name,
    myId: playerId,
  };
}

function buildSudokuPayload(room, playerId) {
  const player = room.players.find((p) => p.id === playerId);
  return {
    ...getPublicSudokuState(room.gameState, playerId),
    opponentName: room.players.find((p) => p.id !== playerId)?.name,
    myName: player?.name,
  };
}

function buildUnosPayload(room, playerId) {
  const player = room.players.find((p) => p.id === playerId);
  const playerIds = room.players.map((p) => p.id);
  const playerNames = Object.fromEntries(room.players.map((p) => [p.id, p.name]));
  return {
    ...getPublicUnosState(room.gameState, playerId, playerIds, playerNames),
    myName: player?.name,
  };
}

function buildCzolkoPayload(room, playerId) {
  const player = room.players.find((p) => p.id === playerId);
  const playerIds = room.players.map((p) => p.id);
  const playerNames = Object.fromEntries(room.players.map((p) => [p.id, p.name]));
  return {
    ...getPublicCzolkoState(room.gameState, playerId, playerNames, playerIds),
    myName: player?.name,
    myId: playerId,
  };
}

function sendBattleshipState(room, player, targetSocket) {
  targetSocket.emit('battleshipUpdate', buildBattleshipPayload(room, player.id));
}

function sendWordSearchState(room, player, targetSocket) {
  targetSocket.emit('wordsearchUpdate', buildWordSearchPayload(room, player.id));
}

function sendCrosswordState(room, player, targetSocket) {
  targetSocket.emit('crosswordUpdate', buildCrosswordPayload(room, player.id));
}

function sendSudokuState(room, player, targetSocket) {
  targetSocket.emit('sudokuUpdate', buildSudokuPayload(room, player.id));
}

function sendUnosState(room, player, targetSocket) {
  targetSocket.emit('unosUpdate', buildUnosPayload(room, player.id));
}

function sendCzolkoState(room, player, targetSocket) {
  targetSocket.emit('czolkoUpdate', buildCzolkoPayload(room, player.id));
}

function emitRoomUpdate(room) {
  io.to(room.code).emit('roomUpdate', getRoomPublic(room));
}

function emitBattleshipUpdate(room) {
  for (const player of room.players) {
    if (!player.socketId) continue;
    io.to(player.socketId).emit('battleshipUpdate', buildBattleshipPayload(room, player.id));
  }
}

function emitWordSearchUpdate(room) {
  for (const player of room.players) {
    if (!player.socketId) continue;
    io.to(player.socketId).emit('wordsearchUpdate', buildWordSearchPayload(room, player.id));
  }
}

function emitCrosswordUpdate(room) {
  for (const player of room.players) {
    if (!player.socketId) continue;
    io.to(player.socketId).emit('crosswordUpdate', buildCrosswordPayload(room, player.id));
  }
}

function emitSudokuUpdate(room) {
  for (const player of room.players) {
    if (!player.socketId) continue;
    io.to(player.socketId).emit('sudokuUpdate', buildSudokuPayload(room, player.id));
  }
}

function emitUnosUpdate(room) {
  for (const player of room.players) {
    if (!player.socketId) continue;
    io.to(player.socketId).emit('unosUpdate', buildUnosPayload(room, player.id));
  }
}

function emitCzolkoUpdate(room) {
  for (const player of room.players) {
    if (!player.socketId) continue;
    io.to(player.socketId).emit('czolkoUpdate', buildCzolkoPayload(room, player.id));
  }
}

function startGame(room, game, gameOptions = {}) {
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
  } else if (game === 'crossword') {
    room.gameState = createCrosswordState();
    for (const player of room.players) {
      room.gameState.scores[player.id] = 0;
    }
    emitCrosswordUpdate(room);
  } else if (game === 'sudoku') {
    room.gameState = createSudokuState();
    emitSudokuUpdate(room);
  } else if (game === 'unos') {
    room.gameState = createUnosState(room.players.map((p) => p.id));
    emitUnosUpdate(room);
  } else if (game === 'czolko') {
    room.gameState = createCzolkoState(room.players.map((p) => p.id), gameOptions);
    emitCzolkoUpdate(room);
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

  socket.on('createRoom', ({ playerName, sessionId }, callback) => {
    if (!sessionId) {
      callback?.({ success: false, error: 'Brak identyfikatora sesji' });
      return;
    }

    const name = (playerName || 'Gracz').trim().slice(0, 20) || 'Gracz';
    const code = generateRoomCode();

    const room = {
      code,
      players: [{ id: sessionId, name, socketId: socket.id }],
      hostId: sessionId,
      status: 'waiting',
      game: null,
      gameState: null,
    };

    rooms.set(code, room);
    currentRoom = bindSocketToRoom(socket, room, room.players[0]);

    callback?.({ success: true, roomCode: code, playerId: sessionId });
    emitRoomUpdate(room);
  });

  socket.on('joinRoom', ({ roomCode, playerName, sessionId }, callback) => {
    if (!sessionId) {
      callback?.({ success: false, error: 'Brak identyfikatora sesji' });
      return;
    }

    const code = (roomCode || '').trim().toUpperCase();
    const room = rooms.get(code);

    if (!room) {
      callback?.({ success: false, error: 'Nie znaleziono pokoju' });
      return;
    }

    const existing = findPlayer(room, { sessionId, playerName });
    if (existing) {
      currentRoom = bindSocketToRoom(socket, room, existing);
      callback?.({ success: true, roomCode: code, playerId: existing.id });
      emitRoomUpdate(room);
      return;
    }

    if (room.players.length >= MAX_ROOM_PLAYERS) {
      callback?.({ success: false, error: `Pokój jest pełny (max ${MAX_ROOM_PLAYERS} graczy)` });
      return;
    }

    if (room.status === 'playing') {
      callback?.({ success: false, error: 'Gra już trwa' });
      return;
    }

    const name = (playerName || 'Gracz').trim().slice(0, 20) || 'Gracz';
    const player = { id: sessionId, name, socketId: socket.id };
    room.players.push(player);
    currentRoom = bindSocketToRoom(socket, room, player);

    callback?.({ success: true, roomCode: code, playerId: sessionId });
    emitRoomUpdate(room);
  });

  socket.on('selectGame', ({ game, sessionId, roomCode, gameOptions }) => {
    const { room, player, roomCode: code } = resolvePlayerContext(socket, currentRoom, {
      sessionId,
      roomCode,
    });
    if (!room || !player || room.hostId !== player.id) return;
    if (room.players.length < 2) return;
    if (!['battleship', 'wordsearch', 'crossword', 'sudoku', 'unos', 'czolko'].includes(game)) return;

    const limits = GAME_PLAYER_LIMITS[game];
    const count = room.players.length;
    if (!limits || count < limits.min || count > limits.max) {
      socket.emit('error', {
        message: limits
          ? `Ta gra wymaga ${limits.min === limits.max ? limits.min : `${limits.min}–${limits.max}`} graczy`
          : 'Nie można rozpocząć gry',
      });
      return;
    }

    let options = {};
    if (game === 'czolko') {
      const characterPool = normalizeCharacterPool(gameOptions?.characterPool);
      const poolSize = getPeopleForPool(characterPool).length;
      if (poolSize < count) {
        socket.emit('error', { message: 'Za mało postaci w wybranej puli dla liczby graczy' });
        return;
      }
      options = { characterPool };
    }

    currentRoom = code;
    startGame(room, game, options);
  });

  socket.on('placeShips', ({ ships, sessionId, roomCode }) => {
    const { room, player, roomCode: code } = resolvePlayerContext(socket, currentRoom, {
      sessionId,
      roomCode,
    });
    if (!room || !player || room.game !== 'battleship') return;
    currentRoom = code;

    const result = placeShipsOnBoard(room.gameState, player.id, ships);
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

  socket.on('shoot', ({ row, col, sessionId, roomCode }) => {
    const { room, player, roomCode: code } = resolvePlayerContext(socket, currentRoom, {
      sessionId,
      roomCode,
    });
    if (!room || !player || room.game !== 'battleship') return;
    currentRoom = code;

    const opponentId = getOpponent(room, player.id);
    const result = shoot(room.gameState, player.id, row, col, opponentId);

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

  socket.on('findWord', ({ cells, sessionId, roomCode }) => {
    const { room, player, roomCode: code } = resolvePlayerContext(socket, currentRoom, {
      sessionId,
      roomCode,
    });
    if (!room || !player || room.game !== 'wordsearch') return;
    currentRoom = code;

    const result = tryFindWord(room.gameState, player.id, cells);
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

  socket.on('submitCrossword', ({ wordId, answer, sessionId, roomCode }) => {
    const { room, player, roomCode: code } = resolvePlayerContext(socket, currentRoom, {
      sessionId,
      roomCode,
    });
    if (!room || !player || room.game !== 'crossword') return;
    currentRoom = code;

    const result = trySubmitWord(room.gameState, player.id, wordId, answer);
    if (!result.success) {
      socket.emit('error', { message: result.reason });
      return;
    }

    checkWinner(room.gameState, room.players.map((p) => p.id));
    emitCrosswordUpdate(room);

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
        game: 'crossword',
        draw: room.gameState.winner === 'draw',
      });
      room.status = 'finished';
      emitRoomUpdate(room);
    }
  });

  socket.on('submitSudoku', ({ grid, sessionId, roomCode }) => {
    const { room, player, roomCode: code } = resolvePlayerContext(socket, currentRoom, {
      sessionId,
      roomCode,
    });
    if (!room || !player || room.game !== 'sudoku') return;
    currentRoom = code;

    const result = trySubmitSudoku(room.gameState, player.id, grid);
    if (!result.success) {
      socket.emit('error', { message: result.reason });
      return;
    }

    emitSudokuUpdate(room);

    if (room.gameState.winner) {
      const winner = room.players.find((p) => p.id === room.gameState.winner);
      io.to(room.code).emit('gameOver', {
        winnerId: room.gameState.winner,
        winnerName: winner?.name,
        game: 'sudoku',
      });
      room.status = 'finished';
      emitRoomUpdate(room);
    }
  });

  socket.on('unosPlayCard', ({ cardId, color, sessionId, roomCode }) => {
    const { room, player, roomCode: code } = resolvePlayerContext(socket, currentRoom, {
      sessionId,
      roomCode,
    });
    if (!room || !player || room.game !== 'unos') return;
    currentRoom = code;

    const playerIds = room.players.map((p) => p.id);
    const result = playCard(room.gameState, player.id, cardId, color, playerIds);

    if (!result.valid) {
      socket.emit('error', { message: result.reason });
      return;
    }

    emitUnosUpdate(room);

    if (room.gameState.winner) {
      const winner = room.players.find((p) => p.id === room.gameState.winner);
      io.to(room.code).emit('gameOver', {
        winnerId: room.gameState.winner,
        winnerName: winner?.name,
        game: 'unos',
      });
      room.status = 'finished';
      emitRoomUpdate(room);
    }
  });

  socket.on('unosChooseColor', ({ color, sessionId, roomCode }) => {
    const { room, player, roomCode: code } = resolvePlayerContext(socket, currentRoom, {
      sessionId,
      roomCode,
    });
    if (!room || !player || room.game !== 'unos') return;
    currentRoom = code;

    const playerIds = room.players.map((p) => p.id);
    const result = finalizeWildColor(room.gameState, player.id, color, playerIds);

    if (!result.valid) {
      socket.emit('error', { message: result.reason });
      return;
    }

    emitUnosUpdate(room);

    if (room.gameState.winner) {
      const winner = room.players.find((p) => p.id === room.gameState.winner);
      io.to(room.code).emit('gameOver', {
        winnerId: room.gameState.winner,
        winnerName: winner?.name,
        game: 'unos',
      });
      room.status = 'finished';
      emitRoomUpdate(room);
    }
  });

  socket.on('unosDrawCard', ({ sessionId, roomCode }) => {
    const { room, player, roomCode: code } = resolvePlayerContext(socket, currentRoom, {
      sessionId,
      roomCode,
    });
    if (!room || !player || room.game !== 'unos') return;
    currentRoom = code;

    const playerIds = room.players.map((p) => p.id);
    const result = drawCard(room.gameState, player.id, playerIds);

    if (!result.valid) {
      socket.emit('error', { message: result.reason });
      return;
    }

    emitUnosUpdate(room);
  });

  socket.on('unosCallUnos', ({ sessionId, roomCode }) => {
    const { room, player, roomCode: code } = resolvePlayerContext(socket, currentRoom, {
      sessionId,
      roomCode,
    });
    if (!room || !player || room.game !== 'unos') return;
    currentRoom = code;

    const result = callUnos(room.gameState, player.id);
    if (!result.valid) {
      socket.emit('error', { message: result.reason });
      return;
    }

    emitUnosUpdate(room);
  });

  socket.on('unosPassTurn', ({ sessionId, roomCode }) => {
    const { room, player, roomCode: code } = resolvePlayerContext(socket, currentRoom, {
      sessionId,
      roomCode,
    });
    if (!room || !player || room.game !== 'unos') return;
    currentRoom = code;

    const playerIds = room.players.map((p) => p.id);
    const result = passTurn(room.gameState, player.id, playerIds);

    if (!result.valid) {
      socket.emit('error', { message: result.reason });
      return;
    }

    emitUnosUpdate(room);
  });

  socket.on('czolkoAskQuestion', ({ text, sessionId, roomCode }) => {
    const { room, player, roomCode: code } = resolvePlayerContext(socket, currentRoom, {
      sessionId,
      roomCode,
    });
    if (!room || !player || room.game !== 'czolko') return;
    currentRoom = code;

    const result = tryAskQuestion(room.gameState, player.id, text);
    if (!result.success) {
      socket.emit('error', { message: result.reason });
      return;
    }

    emitCzolkoUpdate(room);
  });

  socket.on('czolkoAnswerQuestion', ({ answer, sessionId, roomCode }) => {
    const { room, player, roomCode: code } = resolvePlayerContext(socket, currentRoom, {
      sessionId,
      roomCode,
    });
    if (!room || !player || room.game !== 'czolko') return;
    currentRoom = code;

    const playerIds = room.players.map((p) => p.id);
    const result = tryAnswerQuestion(room.gameState, player.id, answer, playerIds);
    if (!result.success) {
      socket.emit('error', { message: result.reason });
      return;
    }

    emitCzolkoUpdate(room);

    if (room.gameState.winner) {
      const winnerName = room.players.find((p) => p.id === room.gameState.winner)?.name;
      io.to(room.code).emit('gameOver', {
        winnerId: room.gameState.winner,
        winnerName,
        game: 'czolko',
      });
      room.status = 'finished';
      emitRoomUpdate(room);
    }
  });

  socket.on('czolkoGuess', ({ guess, sessionId, roomCode }) => {
    const { room, player, roomCode: code } = resolvePlayerContext(socket, currentRoom, {
      sessionId,
      roomCode,
    });
    if (!room || !player || room.game !== 'czolko') return;
    currentRoom = code;

    const playerIds = room.players.map((p) => p.id);
    const result = tryGuess(room.gameState, player.id, guess, playerIds);
    if (!result.success) {
      socket.emit('error', { message: result.reason });
      return;
    }

    emitCzolkoUpdate(room);

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
        game: 'czolko',
        draw: room.gameState.winner === 'draw',
      });
      room.status = 'finished';
      emitRoomUpdate(room);
    }
  });

  socket.on('czolkoSkip', ({ sessionId, roomCode }) => {
    const { room, player, roomCode: code } = resolvePlayerContext(socket, currentRoom, {
      sessionId,
      roomCode,
    });
    if (!room || !player || room.game !== 'czolko') return;
    currentRoom = code;

    const playerIds = room.players.map((p) => p.id);
    const result = trySkip(room.gameState, player.id, playerIds);
    if (!result.success) {
      socket.emit('error', { message: result.reason });
      return;
    }

    emitCzolkoUpdate(room);

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
        game: 'czolko',
        draw: room.gameState.winner === 'draw',
      });
      room.status = 'finished';
      emitRoomUpdate(room);
    }
  });

  socket.on('requestGameState', ({ sessionId, roomCode, playerName }) => {
    const { room, player, roomCode: code } = resolvePlayerContext(socket, currentRoom, {
      sessionId,
      roomCode,
      playerName,
    });
    if (!room || !player || room.status !== 'playing' || !room.gameState) return;
    currentRoom = code;

    if (room.game === 'battleship') {
      sendBattleshipState(room, player, socket);
    } else if (room.game === 'wordsearch') {
      sendWordSearchState(room, player, socket);
    } else if (room.game === 'crossword') {
      sendCrosswordState(room, player, socket);
    } else if (room.game === 'sudoku') {
      sendSudokuState(room, player, socket);
    } else if (room.game === 'unos') {
      sendUnosState(room, player, socket);
    } else if (room.game === 'czolko') {
      sendCzolkoState(room, player, socket);
    }
  });

  socket.on('backToLobby', ({ sessionId, roomCode }) => {
    const { room, player, roomCode: code } = resolvePlayerContext(socket, currentRoom, {
      sessionId,
      roomCode,
    });
    if (!room || !player || room.hostId !== player.id) return;
    currentRoom = code;
    resetToLobby(room);
  });

  socket.on('leaveRoom', ({ sessionId, roomCode }) => {
    const { room, player, roomCode: code } = resolvePlayerContext(socket, currentRoom, {
      sessionId,
      roomCode,
    });
    if (!room || !player) return;

    const wasPlaying = room.status === 'playing';
    const remaining = room.players.filter((p) => p.id !== player.id);

    room.players = remaining;
    socket.leave(code);

    if (remaining.length === 0) {
      rooms.delete(room.code);
      currentRoom = null;
      return;
    }

    if (room.hostId === player.id) {
      room.hostId = remaining[0].id;
    }

    if (wasPlaying) {
      io.to(room.code).emit('gameOver', {
        winnerId: remaining[0].id,
        winnerName: remaining[0].name,
        game: room.game,
        forfeit: true,
      });
      resetToLobby(room);
    } else {
      emitRoomUpdate(room);
    }

    if (player.socketId === socket.id) {
      currentRoom = null;
    }
  });

  socket.on('rejoinRoom', ({ roomCode, playerName, sessionId }, callback) => {
    const { room, player } = resolvePlayerContext(socket, null, {
      roomCode,
      playerName,
      sessionId,
    });

    if (!room || !player) {
      callback?.({ success: false });
      return;
    }

    currentRoom = bindSocketToRoom(socket, room, player);
    callback?.({ success: true, room: getRoomPublic(room), playerId: player.id });

    if (room.game === 'battleship' && room.gameState) {
      sendBattleshipState(room, player, socket);
    } else if (room.game === 'wordsearch' && room.gameState) {
      sendWordSearchState(room, player, socket);
    } else if (room.game === 'crossword' && room.gameState) {
      sendCrosswordState(room, player, socket);
    } else if (room.game === 'sudoku' && room.gameState) {
      sendSudokuState(room, player, socket);
    } else if (room.game === 'unos' && room.gameState) {
      sendUnosState(room, player, socket);
    } else if (room.game === 'czolko' && room.gameState) {
      sendCzolkoState(room, player, socket);
    }
  });

  socket.on('disconnect', () => {
    const room = rooms.get(currentRoom);
    if (!room) return;

    const player = room.players.find((p) => p.socketId === socket.id);
    if (player) {
      player.socketId = null;
    }

    emitRoomUpdate(room);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`RAJ GIER serwer działa na porcie ${PORT}`);
});
