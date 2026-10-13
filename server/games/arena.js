/**
 * Arena — uproszczona bitwa 1v1 w stylu Clash Royale.
 * Współrzędne: szerokość 18, wysokość 32. Gracz A (index 0) na dole, B na górze.
 */

const ARENA_W = 18;
const ARENA_H = 32;
const TICK_MS = 100;
const MATCH_MS = 180_000;
const DOUBLE_ELIXIR_MS = 60_000;
const ELIXIR_MAX = 10;
const ELIXIR_START = 5;
const ELIXIR_PER_SEC = 1 / 2.8;
const HAND_SIZE = 4;

const CARDS = {
  rycerz: {
    id: 'rycerz',
    name: 'Rycerz',
    emoji: '⚔️',
    cost: 3,
    kind: 'troop',
    count: 1,
    hp: 680,
    damage: 75,
    range: 1.2,
    speed: 2.2,
    attackMs: 1100,
    splash: 0,
    flying: false,
    targetsBuildings: false,
  },
  gobliny: {
    id: 'gobliny',
    name: 'Gobliny',
    emoji: '👺',
    cost: 2,
    kind: 'troop',
    count: 3,
    hp: 160,
    damage: 50,
    range: 1.0,
    speed: 3.6,
    attackMs: 900,
    splash: 0,
    flying: false,
    targetsBuildings: false,
  },
  lucznicy: {
    id: 'lucznicy',
    name: 'Łucznicy',
    emoji: '🏹',
    cost: 3,
    kind: 'troop',
    count: 2,
    hp: 220,
    damage: 48,
    range: 5.0,
    speed: 2.4,
    attackMs: 1000,
    splash: 0,
    flying: false,
    targetsBuildings: false,
  },
  olbrzym: {
    id: 'olbrzym',
    name: 'Olbrzym',
    emoji: '🧱',
    cost: 5,
    kind: 'troop',
    count: 1,
    hp: 1600,
    damage: 110,
    range: 1.3,
    speed: 1.4,
    attackMs: 1400,
    splash: 0,
    flying: false,
    targetsBuildings: true,
  },
  czarodziej: {
    id: 'czarodziej',
    name: 'Czarodziej',
    emoji: '🔮',
    cost: 5,
    kind: 'troop',
    count: 1,
    hp: 420,
    damage: 90,
    range: 5.5,
    speed: 2.0,
    attackMs: 1400,
    splash: 1.5,
    flying: false,
    targetsBuildings: false,
  },
  smok: {
    id: 'smok',
    name: 'Smok',
    emoji: '🐉',
    cost: 4,
    kind: 'troop',
    count: 1,
    hp: 520,
    damage: 70,
    range: 3.5,
    speed: 2.6,
    attackMs: 1200,
    splash: 1.2,
    flying: true,
    targetsBuildings: false,
  },
  ogien: {
    id: 'ogien',
    name: 'Kula ognia',
    emoji: '🔥',
    cost: 4,
    kind: 'spell',
    radius: 2.5,
    damage: 325,
    towerDamage: 95,
  },
  wieza: {
    id: 'wieza',
    name: 'Wieża',
    emoji: '🗼',
    cost: 5,
    kind: 'building',
    count: 1,
    hp: 700,
    damage: 55,
    range: 6.0,
    speed: 0,
    attackMs: 800,
    splash: 0,
    flying: false,
    targetsBuildings: false,
    lifetimeMs: 40_000,
  },
};

const DEFAULT_DECK = Object.keys(CARDS);

function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makeTowers(ownerId, side) {
  // side 0 = dół, side 1 = góra
  const backY = side === 0 ? 2.5 : ARENA_H - 2.5;
  const frontY = side === 0 ? 6.5 : ARENA_H - 6.5;
  return [
    {
      id: `${ownerId}-king`,
      type: 'king',
      ownerId,
      x: ARENA_W / 2,
      y: backY,
      hp: 2400,
      maxHp: 2400,
      damage: 50,
      range: 7,
      attackMs: 1000,
      attackCooldown: 0,
      alive: true,
    },
    {
      id: `${ownerId}-left`,
      type: 'princess',
      ownerId,
      x: 3.5,
      y: frontY,
      hp: 1400,
      maxHp: 1400,
      damage: 65,
      range: 7.5,
      attackMs: 800,
      attackCooldown: 0,
      alive: true,
    },
    {
      id: `${ownerId}-right`,
      type: 'princess',
      ownerId,
      x: ARENA_W - 3.5,
      y: frontY,
      hp: 1400,
      maxHp: 1400,
      damage: 65,
      range: 7.5,
      attackMs: 800,
      attackCooldown: 0,
      alive: true,
    },
  ];
}

function drawHand(queue) {
  const hand = [];
  while (hand.length < HAND_SIZE && queue.length) {
    hand.push(queue.shift());
  }
  return hand;
}

function createArenaState(playerIds) {
  if (playerIds.length !== 2) {
    throw new Error('Arena wymaga dokładnie 2 graczy');
  }

  const [a, b] = playerIds;
  const now = Date.now();

  const players = {
    [a]: {
      id: a,
      side: 0,
      elixir: ELIXIR_START,
      deckQueue: shuffle([...DEFAULT_DECK, ...DEFAULT_DECK]),
      hand: [],
      crowns: 0,
    },
    [b]: {
      id: b,
      side: 1,
      elixir: ELIXIR_START,
      deckQueue: shuffle([...DEFAULT_DECK, ...DEFAULT_DECK]),
      hand: [],
      crowns: 0,
    },
  };

  for (const p of Object.values(players)) {
    p.hand = drawHand(p.deckQueue);
    if (p.deckQueue.length < 8) {
      p.deckQueue.push(...shuffle([...DEFAULT_DECK]));
    }
  }

  return {
    phase: 'playing',
    startedAt: now,
    endsAt: now + MATCH_MS,
    playerIds: [a, b],
    players,
    towers: [...makeTowers(a, 0), ...makeTowers(b, 1)],
    units: [],
    effects: [],
    nextUnitId: 1,
    winner: null,
    winReason: null,
    tick: 0,
  };
}

function mirrorY(y) {
  return ARENA_H - y;
}

function toViewerCoords(entity, viewerSide) {
  if (viewerSide === 0) {
    return { x: entity.x, y: entity.y };
  }
  return { x: entity.x, y: mirrorY(entity.y) };
}

function fromViewerCoords(x, y, viewerSide) {
  if (viewerSide === 0) return { x, y };
  return { x, y: mirrorY(y) };
}

function getAliveTowers(state, ownerId) {
  return state.towers.filter((t) => t.ownerId === ownerId && t.alive);
}

function countCrowns(state, attackerId) {
  const defenderId = state.playerIds.find((id) => id !== attackerId);
  const destroyed = state.towers.filter((t) => t.ownerId === defenderId && !t.alive);
  const princess = destroyed.filter((t) => t.type === 'princess').length;
  const king = destroyed.some((t) => t.type === 'king');
  if (king) return 3;
  return princess;
}

function spawnOffsets(count) {
  if (count === 1) return [{ dx: 0, dy: 0 }];
  if (count === 2) return [{ dx: -0.7, dy: 0 }, { dx: 0.7, dy: 0 }];
  return [
    { dx: -0.9, dy: 0 },
    { dx: 0.9, dy: 0 },
    { dx: 0, dy: 0.7 },
  ];
}

function clampDeploy(x, y, side) {
  const cx = Math.max(0.8, Math.min(ARENA_W - 0.8, x));
  let cy = y;
  if (side === 0) {
    cy = Math.max(0.8, Math.min(ARENA_H / 2 - 0.5, y));
  } else {
    cy = Math.max(ARENA_H / 2 + 0.5, Math.min(ARENA_H - 0.8, y));
  }
  return { x: cx, y: cy };
}

function cycleCard(player, cardId) {
  const idx = player.hand.indexOf(cardId);
  if (idx === -1) return false;
  player.hand.splice(idx, 1);
  if (player.deckQueue.length === 0) {
    player.deckQueue.push(...shuffle([...DEFAULT_DECK]));
  }
  const next = player.deckQueue.shift();
  player.hand.push(next);
  player.deckQueue.push(cardId);
  return true;
}

function playCard(state, playerId, cardId, viewX, viewY) {
  if (state.phase !== 'playing' || state.winner) {
    return { ok: false, reason: 'Gra zakończona' };
  }

  const player = state.players[playerId];
  if (!player) return { ok: false, reason: 'Brak gracza' };

  const def = CARDS[cardId];
  if (!def) return { ok: false, reason: 'Nieznana karta' };
  if (!player.hand.includes(cardId)) return { ok: false, reason: 'Tej karty nie ma w ręce' };
  if (player.elixir < def.cost) return { ok: false, reason: 'Za mało eliksiru' };

  const world = fromViewerCoords(viewX, viewY, player.side);

  if (def.kind === 'spell') {
    // Spelle można rzucać na całą arenę
    const sx = Math.max(0.5, Math.min(ARENA_W - 0.5, world.x));
    const sy = Math.max(0.5, Math.min(ARENA_H - 0.5, world.y));
    player.elixir -= def.cost;
    cycleCard(player, cardId);
    applySpell(state, playerId, def, sx, sy);
    return { ok: true };
  }

  const pos = clampDeploy(world.x, world.y, player.side);
  // Walidacja: czy punkt był po stronie gracza (po clamp i tak jest OK, ale sprawdźmy próby za rzeką)
  const half = ARENA_H / 2;
  if (player.side === 0 && world.y > half) {
    return { ok: false, reason: 'Stawiaj tylko na swojej połowie' };
  }
  if (player.side === 1 && world.y < half) {
    return { ok: false, reason: 'Stawiaj tylko na swojej połowie' };
  }

  player.elixir -= def.cost;
  cycleCard(player, cardId);

  const offsets = spawnOffsets(def.count || 1);
  for (const off of offsets) {
    const unit = {
      id: `u${state.nextUnitId++}`,
      cardId: def.id,
      ownerId: playerId,
      x: pos.x + off.dx,
      y: pos.y + off.dy,
      hp: def.hp,
      maxHp: def.hp,
      damage: def.damage,
      range: def.range,
      speed: def.speed,
      attackMs: def.attackMs,
      attackCooldown: 0.4,
      splash: def.splash || 0,
      flying: !!def.flying,
      targetsBuildings: !!def.targetsBuildings,
      kind: def.kind,
      lifetimeMs: def.lifetimeMs || null,
      ageMs: 0,
      targetId: null,
    };
    state.units.push(unit);
  }

  return { ok: true };
}

function applySpell(state, ownerId, def, x, y) {
  state.effects.push({
    id: `e${state.nextUnitId++}`,
    type: 'fireball',
    x,
    y,
    radius: def.radius,
    ttl: 0.45,
    ownerId,
  });

  for (const unit of state.units) {
    if (!unit.hp || unit.hp <= 0) continue;
    if (dist(unit, { x, y }) <= def.radius) {
      unit.hp -= def.damage;
    }
  }

  for (const tower of state.towers) {
    if (!tower.alive) continue;
    if (dist(tower, { x, y }) <= def.radius + 0.8) {
      tower.hp -= def.towerDamage;
      if (tower.hp <= 0) destroyTower(state, tower, ownerId);
    }
  }

  state.units = state.units.filter((u) => u.hp > 0);
}

function destroyTower(state, tower, attackerId) {
  if (!tower.alive) return;
  tower.alive = false;
  tower.hp = 0;

  if (attackerId && state.players[attackerId]) {
    state.players[attackerId].crowns = countCrowns(state, attackerId);
  }

  // Usuń jednostki wrogie zbyt blisko? nie — CR zostawia

  if (tower.type === 'king') {
    state.winner = attackerId;
    state.winReason = 'king';
    state.phase = 'finished';
  }
}

function enemyEntities(state, ownerId, preferBuildings) {
  const enemies = [];
  for (const t of state.towers) {
    if (t.alive && t.ownerId !== ownerId) enemies.push({ kind: 'tower', ref: t });
  }
  if (!preferBuildings) {
    for (const u of state.units) {
      if (u.hp > 0 && u.ownerId !== ownerId) enemies.push({ kind: 'unit', ref: u });
    }
  }
  return enemies;
}

function pickTarget(unit, state) {
  const list = enemyEntities(state, unit.ownerId, unit.targetsBuildings);
  let best = null;
  let bestD = Infinity;
  for (const e of list) {
    // Latające atakują wszystko; wieże atakują latających
    const d = dist(unit, e.ref);
    if (d < bestD) {
      bestD = d;
      best = e;
    }
  }
  return best;
}

function moveToward(unit, target, dt) {
  const d = dist(unit, target);
  if (d <= unit.range) return false;
  const step = unit.speed * dt;
  if (step <= 0) return false;
  const ratio = Math.min(1, step / d);
  unit.x += (target.x - unit.x) * ratio;
  unit.y += (target.y - unit.y) * ratio;
  unit.x = Math.max(0.3, Math.min(ARENA_W - 0.3, unit.x));
  unit.y = Math.max(0.3, Math.min(ARENA_H - 0.3, unit.y));
  return true;
}

function dealDamage(state, attacker, targetRef, kind) {
  if (kind === 'tower') {
    const tower = targetRef;
    if (!tower.alive) return;
    tower.hp -= attacker.damage;
    if (tower.hp <= 0) destroyTower(state, tower, attacker.ownerId);
    return;
  }

  const unit = targetRef;
  unit.hp -= attacker.damage;
  if (attacker.splash > 0) {
    for (const other of state.units) {
      if (other.id === unit.id || other.ownerId === attacker.ownerId || other.hp <= 0) continue;
      if (dist(other, unit) <= attacker.splash) {
        other.hp -= attacker.damage * 0.7;
      }
    }
  }
}

function tickCombatEntity(state, entity, dt, isTower) {
  entity.attackCooldown = Math.max(0, (entity.attackCooldown || 0) - dt);
  const target = pickTarget(entity, state);
  if (!target) return;

  const d = dist(entity, target.ref);
  if (d > entity.range) {
    if (!isTower && entity.speed > 0) {
      moveToward(entity, target.ref, dt);
    }
    return;
  }

  if (entity.attackCooldown <= 0) {
    dealDamage(state, entity, target.ref, target.kind);
    entity.attackCooldown = entity.attackMs / 1000;
  }
}

function tickArena(state) {
  if (state.phase !== 'playing' || state.winner) return { finished: !!state.winner };

  state.tick += 1;
  const dt = TICK_MS / 1000;
  const now = Date.now();
  const remaining = state.endsAt - now;
  const doubleElixir = remaining <= DOUBLE_ELIXIR_MS;
  const elixirRate = ELIXIR_PER_SEC * (doubleElixir ? 2 : 1);

  for (const p of Object.values(state.players)) {
    p.elixir = Math.min(ELIXIR_MAX, p.elixir + elixirRate * dt);
    p.crowns = countCrowns(state, p.id);
  }

  // Efekty wizualne
  state.effects = state.effects
    .map((e) => ({ ...e, ttl: e.ttl - dt }))
    .filter((e) => e.ttl > 0);

  // Jednostki
  for (const unit of state.units) {
    unit.ageMs += TICK_MS;
    if (unit.lifetimeMs && unit.ageMs >= unit.lifetimeMs) {
      unit.hp = 0;
      continue;
    }
    tickCombatEntity(state, unit, dt, false);
  }
  state.units = state.units.filter((u) => u.hp > 0);

  // Wieże
  for (const tower of state.towers) {
    if (!tower.alive) continue;
    tickCombatEntity(state, tower, dt, true);
  }

  if (state.winner) {
    return { finished: true };
  }

  if (now >= state.endsAt) {
    finishByTime(state);
    return { finished: true };
  }

  return { finished: false, doubleElixir };
}

function finishByTime(state) {
  const [a, b] = state.playerIds;
  const ca = state.players[a].crowns;
  const cb = state.players[b].crowns;

  if (ca > cb) {
    state.winner = a;
    state.winReason = 'crowns';
  } else if (cb > ca) {
    state.winner = b;
    state.winReason = 'crowns';
  } else {
    const hpA = getAliveTowers(state, a).reduce((s, t) => s + t.hp, 0);
    const hpB = getAliveTowers(state, b).reduce((s, t) => s + t.hp, 0);
    if (hpA > hpB) {
      state.winner = a;
      state.winReason = 'hp';
    } else if (hpB > hpA) {
      state.winner = b;
      state.winReason = 'hp';
    } else {
      state.winner = 'draw';
      state.winReason = 'draw';
    }
  }
  state.phase = 'finished';
}

function getPublicArenaState(state, playerId) {
  const me = state.players[playerId];
  if (!me) return null;

  const opponentId = state.playerIds.find((id) => id !== playerId);
  const opp = state.players[opponentId];
  const side = me.side;

  const mapTower = (t) => {
    const pos = toViewerCoords(t, side);
    return {
      id: t.id,
      type: t.type,
      mine: t.ownerId === playerId,
      x: pos.x,
      y: pos.y,
      hp: Math.max(0, Math.round(t.hp)),
      maxHp: t.maxHp,
      alive: t.alive,
    };
  };

  const mapUnit = (u) => {
    const pos = toViewerCoords(u, side);
    const def = CARDS[u.cardId];
    return {
      id: u.id,
      cardId: u.cardId,
      emoji: def?.emoji || '❓',
      name: def?.name || u.cardId,
      mine: u.ownerId === playerId,
      x: pos.x,
      y: pos.y,
      hp: Math.max(0, Math.round(u.hp)),
      maxHp: u.maxHp,
      flying: !!u.flying,
      kind: u.kind,
    };
  };

  const mapEffect = (e) => {
    const pos = toViewerCoords(e, side);
    return {
      id: e.id,
      type: e.type,
      x: pos.x,
      y: pos.y,
      radius: e.radius,
      ttl: e.ttl,
    };
  };

  const hand = me.hand.map((id) => {
    const c = CARDS[id];
    return {
      id: c.id,
      name: c.name,
      emoji: c.emoji,
      cost: c.cost,
      kind: c.kind,
      playable: me.elixir >= c.cost,
    };
  });

  const nextId = me.deckQueue[0];
  const nextCard = nextId
    ? { id: nextId, name: CARDS[nextId].name, emoji: CARDS[nextId].emoji, cost: CARDS[nextId].cost }
    : null;

  const remainingMs = Math.max(0, state.endsAt - Date.now());

  return {
    phase: state.phase,
    arenaW: ARENA_W,
    arenaH: ARENA_H,
    elixir: Math.floor(me.elixir * 10) / 10,
    elixirMax: ELIXIR_MAX,
    hand,
    nextCard,
    myCrowns: me.crowns,
    enemyCrowns: opp?.crowns ?? 0,
    myName: null,
    enemyName: null,
    towers: state.towers.map(mapTower),
    units: state.units.map(mapUnit),
    effects: state.effects.map(mapEffect),
    remainingMs,
    doubleElixir: remainingMs <= DOUBLE_ELIXIR_MS,
    winner: state.winner,
    winReason: state.winReason,
    cardsCatalog: Object.values(CARDS).map((c) => ({
      id: c.id,
      name: c.name,
      emoji: c.emoji,
      cost: c.cost,
      kind: c.kind,
    })),
  };
}

module.exports = {
  createArenaState,
  playCard,
  tickArena,
  getPublicArenaState,
  TICK_MS,
  CARDS,
  ARENA_W,
  ARENA_H,
};
