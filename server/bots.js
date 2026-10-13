/**
 * Proste AI botów: Statki, UNOS, Arena, Monopoly.
 */

const { SHIP_TYPES, GRID_SIZE, placeShipsOnBoard, shoot } = require('./games/battleship');
const {
  playCard: unosPlay,
  finalizeWildColor,
  drawCard,
  callUnos,
  passTurn,
  cardMatches,
  COLORS,
} = require('./games/unos');
const {
  playCard: arenaPlayCard,
  getPublicArenaState,
  CARDS: ARENA_CARDS,
  ARENA_H,
} = require('./games/arena');
const {
  monopolyRoll,
  monopolyPayJail,
  monopolyBuy,
  monopolySkipBuy,
  monopolyEndTurn,
  monopolyPickCard,
} = require('./games/monopoly');
const { getSpace, JAIL_FEE } = require('./games/monopolyBoard');

const BOT_GAMES = new Set(['battleship', 'unos', 'arena', 'monopoly']);
const BOT_NAMES = ['Bot Raj', 'CyberBot', 'Pixel', 'Hex'];

function isBotGame(game) {
  return BOT_GAMES.has(game);
}

function ensureBot(room) {
  let bot = room.players.find((p) => p.isBot);
  if (bot) return bot;

  const id = `bot-${room.code}`;
  const name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
  bot = { id, name, socketId: null, isBot: true };
  room.players.push(bot);
  room.botMemory = room.botMemory || {};
  return bot;
}

function removeBots(room) {
  const had = room.players.some((p) => p.isBot);
  room.players = room.players.filter((p) => !p.isBot);
  if (room.hostId && !room.players.some((p) => p.id === room.hostId) && room.players[0]) {
    room.hostId = room.players[0].id;
  }
  room.botMemory = null;
  clearBotTimers(room);
  return had;
}

function clearBotTimers(room) {
  if (room._botTimer) {
    clearTimeout(room._botTimer);
    room._botTimer = null;
  }
}

function humanCount(room) {
  return room.players.filter((p) => !p.isBot).length;
}

function scheduleBots(room, hooks, delayMs) {
  if (!room || room.status !== 'playing') return;
  if (!room.players.some((p) => p.isBot)) return;
  if (!isBotGame(room.game)) return;

  clearBotTimers(room);
  const delay = delayMs ?? (550 + Math.floor(Math.random() * 650));
  room._botTimer = setTimeout(() => {
    room._botTimer = null;
    try {
      const again = runBots(room, hooks);
      if (again) scheduleBots(room, hooks, again);
    } catch (err) {
      console.error('[bot]', err);
    }
  }, delay);
}

function runBots(room, hooks) {
  if (!room.gameState || room.status !== 'playing') return 0;
  const bots = room.players.filter((p) => p.isBot);
  if (!bots.length) return 0;

  let acted = false;
  for (const bot of bots) {
    if (room.game === 'battleship') acted = botBattleship(room, bot, hooks) || acted;
    else if (room.game === 'unos') acted = botUnos(room, bot, hooks) || acted;
    else if (room.game === 'arena') acted = botArena(room, bot, hooks) || acted;
    else if (room.game === 'monopoly') acted = botMonopoly(room, bot, hooks) || acted;
  }

  if (acted) {
    hooks.afterBotAction(room);
  }

  // Arena / ciągłe tury — planuj kolejny ruch
  if (room.status === 'playing' && room.game === 'arena' && !room.gameState.winner) {
    return 900 + Math.floor(Math.random() * 700);
  }
  if (room.status === 'playing' && room.game === 'unos' && !room.gameState.winner) {
    const turnBot = bots.some((b) => room.gameState.currentTurn === b.id)
      || bots.some((b) => room.gameState.chooseColorFor === b.id);
    if (turnBot) return 500;
  }
  if (room.status === 'playing' && room.game === 'battleship' && !room.gameState.winner) {
    const turnBot = bots.some((b) => room.gameState.currentTurn === b.id);
    const needPlace = room.gameState.phase === 'placement'
      && bots.some((b) => !room.gameState.placementReady[b.id]);
    if (turnBot || needPlace) return 450;
  }
  if (room.status === 'playing' && room.game === 'monopoly' && !room.gameState.winner) {
    const turnBot = bots.some((b) => room.gameState.currentPlayerId === b.id);
    if (turnBot) return 600;
  }
  return 0;
}

/* ——— Statki ——— */

function generateRandomFleet() {
  const sizes = SHIP_TYPES.flatMap(({ size, count }) => Array.from({ length: count }, () => size));
  const occupied = new Set();
  const ships = [];

  for (const size of sizes) {
    let placed = false;
    for (let attempt = 0; attempt < 400 && !placed; attempt++) {
      const horizontal = Math.random() < 0.5;
      const row0 = Math.floor(Math.random() * GRID_SIZE);
      const col0 = Math.floor(Math.random() * GRID_SIZE);
      const cells = [];
      let ok = true;
      for (let i = 0; i < size; i++) {
        const row = horizontal ? row0 : row0 + i;
        const col = horizontal ? col0 + i : col0;
        if (row < 0 || col < 0 || row >= GRID_SIZE || col >= GRID_SIZE) {
          ok = false;
          break;
        }
        if (occupied.has(`${row},${col}`)) {
          ok = false;
          break;
        }
        cells.push({ row, col });
      }
      if (!ok) continue;
      for (const c of cells) occupied.add(`${c.row},${c.col}`);
      ships.push({ id: String(size), size, cells });
      placed = true;
    }
    if (!placed) return null;
  }
  return ships;
}

function botBattleship(room, bot, hooks) {
  const state = room.gameState;
  const opponent = room.players.find((p) => p.id !== bot.id);
  if (!opponent) return false;

  if (state.phase === 'placement' && !state.placementReady[bot.id]) {
    let ships = null;
    for (let i = 0; i < 20 && !ships; i++) ships = generateRandomFleet();
    if (!ships) return false;
    const result = placeShipsOnBoard(state, bot.id, ships);
    if (!result.valid) return false;
    const playerIds = room.players.map((p) => p.id);
    hooks.onBattleshipPlaced?.(room, playerIds);
    return true;
  }

  if (state.phase === 'battle' && state.currentTurn === bot.id && !state.winner) {
    const shot = pickBattleshipShot(room, bot.id, opponent.id);
    if (!shot) return false;
    const result = shoot(state, bot.id, shot.row, shot.col, opponent.id);
    if (!result.valid) return false;
    rememberBattleshipHit(room, bot.id, shot, result);
    hooks.onBattleshipShot?.(room);
    return true;
  }

  return false;
}

function rememberBattleshipHit(room, botId, shot, result) {
  room.botMemory = room.botMemory || {};
  const mem = room.botMemory.battleship = room.botMemory.battleship || { queue: [] };
  if (result.shipSunk) {
    mem.queue = [];
    return;
  }
  if (result.hit) {
    const dirs = [
      { row: shot.row - 1, col: shot.col },
      { row: shot.row + 1, col: shot.col },
      { row: shot.row, col: shot.col - 1 },
      { row: shot.row, col: shot.col + 1 },
    ];
    for (const d of dirs) {
      if (d.row < 0 || d.col < 0 || d.row >= GRID_SIZE || d.col >= GRID_SIZE) continue;
      if (!mem.queue.some((q) => q.row === d.row && q.col === d.col)) {
        mem.queue.push(d);
      }
    }
  }
}

function pickBattleshipShot(room, botId, opponentId) {
  const state = room.gameState;
  const view = state.enemyView[botId];
  if (!view) return null;

  room.botMemory = room.botMemory || {};
  const mem = room.botMemory.battleship = room.botMemory.battleship || { queue: [] };

  while (mem.queue.length) {
    const next = mem.queue.shift();
    if (!view[next.row][next.col].hit && !view[next.row][next.col].miss) {
      return next;
    }
  }

  const candidates = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (view[row][col].hit || view[row][col].miss) continue;
      // lekki checkerboard
      if ((row + col) % 2 === 0) candidates.push({ row, col });
    }
  }
  if (!candidates.length) {
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (!view[row][col].hit && !view[row][col].miss) candidates.push({ row, col });
      }
    }
  }
  if (!candidates.length) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/* ——— UNOS ——— */

function botUnos(room, bot) {
  const state = room.gameState;
  const playerIds = room.players.map((p) => p.id);

  if (state.phase === 'finished' || state.winner) return false;

  if (state.needsUnosCall?.[bot.id] && !state.unosCalled?.[bot.id]) {
    callUnos(state, bot.id);
  }

  if (state.phase === 'chooseColor' && state.chooseColorFor === bot.id) {
    const color = pickBestWildColor(state, bot.id);
    finalizeWildColor(state, bot.id, color, playerIds);
    return true;
  }

  if (state.currentTurn !== bot.id) return false;

  const hand = state.hands[bot.id] || [];
  const playable = hand.filter((c) => cardMatches(state, c));

  if (state.pendingDrawPlay?.[bot.id]) {
    const id = state.pendingDrawPlay[bot.id];
    const card = hand.find((c) => c.id === id);
    if (card && cardMatches(state, card)) {
      const color = card.type === 'wild' ? pickBestWildColor(state, bot.id) : undefined;
      unosPlay(state, bot.id, id, color, playerIds);
      if (state.needsUnosCall?.[bot.id]) callUnos(state, bot.id);
      return true;
    }
  }

  if (playable.length) {
    playable.sort((a, b) => {
      const score = (c) => (c.type === 'wild' ? 0 : c.type === 'draw2' ? 3 : c.type === 'skip' ? 2 : 1);
      return score(b) - score(a);
    });
    const card = playable[0];
    const color = card.type === 'wild' ? pickBestWildColor(state, bot.id) : undefined;
    unosPlay(state, bot.id, card.id, color, playerIds);
    if (state.phase === 'chooseColor' && state.chooseColorFor === bot.id) {
      finalizeWildColor(state, bot.id, pickBestWildColor(state, bot.id), playerIds);
    }
    if (state.needsUnosCall?.[bot.id]) callUnos(state, bot.id);
    return true;
  }

  const drawn = drawCard(state, bot.id, playerIds);
  if (drawn.valid && drawn.canPlayDrawn) {
    const color = drawn.drawn.type === 'wild' ? pickBestWildColor(state, bot.id) : undefined;
    unosPlay(state, bot.id, drawn.drawn.id, color, playerIds);
    if (state.phase === 'chooseColor' && state.chooseColorFor === bot.id) {
      finalizeWildColor(state, bot.id, pickBestWildColor(state, bot.id), playerIds);
    }
    if (state.needsUnosCall?.[bot.id]) callUnos(state, bot.id);
    return true;
  }

  if (state.currentTurn === bot.id && state.pendingDrawPlay?.[bot.id] == null) {
    // draw już zakończył turę
    return true;
  }

  passTurn(state, bot.id, playerIds);
  return true;
}

function pickBestWildColor(state, playerId) {
  const hand = state.hands[playerId] || [];
  const counts = { red: 0, blue: 0, green: 0, yellow: 0 };
  for (const c of hand) {
    if (c.color && counts[c.color] != null) counts[c.color] += 1;
  }
  let best = COLORS[0];
  let bestN = -1;
  for (const color of COLORS) {
    if (counts[color] > bestN) {
      bestN = counts[color];
      best = color;
    }
  }
  return best;
}

/* ——— Arena ——— */

function botArena(room, bot) {
  const state = room.gameState;
  if (state.phase !== 'playing' || state.winner) return false;

  const player = state.players[bot.id];
  if (!player) return false;

  const playable = player.hand
    .map((id) => ARENA_CARDS[id])
    .filter((c) => c && player.elixir >= c.cost);
  if (!playable.length) return false;

  // nie spamuj — czasem poczekaj na droższą kartę
  if (Math.random() < 0.28 && player.elixir < 6) return false;

  playable.sort((a, b) => a.cost - b.cost);
  const pick = Math.random() < 0.65
    ? playable[0]
    : playable[Math.floor(Math.random() * playable.length)];

  const pub = getPublicArenaState(state, bot.id);
  let x;
  let y;
  if (pick.kind === 'spell') {
    x = 2 + Math.random() * 14;
    y = ARENA_H * 0.55 + Math.random() * (ARENA_H * 0.35);
  } else {
    x = 1.5 + Math.random() * 15;
    const zoneMax = x < 9 ? pub.deployZone.leftMaxY : pub.deployZone.rightMaxY;
    y = 1.2 + Math.random() * Math.max(1.5, zoneMax - 1.5);
  }

  const result = arenaPlayCard(state, bot.id, pick.id, x, y);
  return !!result.ok;
}

/* ——— Monopoly ——— */

function botMonopoly(room, bot) {
  const state = room.gameState;
  if (state.winner) return false;
  if (state.currentPlayerId !== bot.id) return false;

  const p = state.players[bot.id];
  if (!p || p.bankrupt) return false;

  if (state.phase === 'awaitCardPick' && state.pendingCardPick?.playerId === bot.id) {
    const slot = Math.floor(Math.random() * (state.pendingCardPick.options?.length || 1));
    monopolyPickCard(state, bot.id, slot);
    return true;
  }

  if (state.phase === 'rolling') {
    if (p.inJail && (p.cash || 0) >= JAIL_FEE && p.jailTurns >= 1 && Math.random() < 0.45) {
      monopolyPayJail(state, bot.id);
      if (state.phase === 'rolling') monopolyRoll(state, bot.id);
      return true;
    }
    monopolyRoll(state, bot.id);
    return true;
  }

  if (state.phase === 'awaitBuy') {
    const space = state.awaitingBuy != null ? getSpace(state.awaitingBuy) : null;
    const price = space?.price || 0;
    if ((p.cash || 0) >= price + 80) {
      monopolyBuy(state, bot.id);
    } else {
      monopolySkipBuy(state, bot.id);
    }
    return true;
  }

  if (state.phase === 'awaitEnd') {
    monopolyEndTurn(state, bot.id);
    return true;
  }

  return false;
}

module.exports = {
  BOT_GAMES,
  isBotGame,
  ensureBot,
  removeBots,
  clearBotTimers,
  humanCount,
  scheduleBots,
  runBots,
};
