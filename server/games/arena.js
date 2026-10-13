/**
 * Arena — bitwa 1v1 w stylu Clash Royale.
 * Współrzędne: szerokość 18, wysokość 32. Gracz A (side 0) na dole, B na górze.
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
const BRIDGE_PUSH = 4.2;
const BOTH_TOWERS_PUSH = 5.8;

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
    projectile: null,
    avatar: 'knight',
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
    projectile: null,
    avatar: 'goblin',
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
    projectile: 'arrow',
    projectileSpeed: 14,
    avatar: 'archer',
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
    projectile: null,
    avatar: 'giant',
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
    projectile: 'bolt',
    projectileSpeed: 11,
    avatar: 'wizard',
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
    projectile: 'fire',
    projectileSpeed: 10,
    avatar: 'dragon',
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
    avatar: 'fireball',
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
    projectile: 'bolt',
    projectileSpeed: 13,
    avatar: 'tower',
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
  const backY = side === 0 ? 2.5 : ARENA_H - 2.5;
  const frontY = side === 0 ? 6.5 : ARENA_H - 6.5;
  return [
    {
      id: `${ownerId}-king`,
      type: 'king',
      lane: 'center',
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
      projectile: 'cannon',
      projectileSpeed: 12,
      facing: side === 0 ? 1 : -1,
      attackAnim: 0,
    },
    {
      id: `${ownerId}-left`,
      type: 'princess',
      lane: 'left',
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
      projectile: 'cannon',
      projectileSpeed: 13,
      facing: side === 0 ? 1 : -1,
      attackAnim: 0,
    },
    {
      id: `${ownerId}-right`,
      type: 'princess',
      lane: 'right',
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
      projectile: 'cannon',
      projectileSpeed: 13,
      facing: side === 0 ? 1 : -1,
      attackAnim: 0,
    },
  ];
}

/** Dobierz kolejną kartę spoza ręki (bez duplikatów w EQ). */
function drawNextUnique(player) {
  if (!player.deckQueue.length) {
    player.deckQueue.push(...shuffle([...DEFAULT_DECK]));
  }

  const total = player.deckQueue.length;
  for (let i = 0; i < total; i++) {
    const next = player.deckQueue.shift();
    if (!player.hand.includes(next)) {
      player.hand.push(next);
      return next;
    }
    // ta sama karta co w ręce — na koniec kolejki, spróbuj następną
    player.deckQueue.push(next);
  }

  // awaryjnie (nie powinno się zdarzyć przy talii 8 unikalnych)
  const fallback = player.deckQueue.shift();
  if (fallback) player.hand.push(fallback);
  return fallback || null;
}

function drawOpeningHand(player) {
  player.hand = [];
  while (player.hand.length < HAND_SIZE) {
    if (!drawNextUnique(player)) break;
  }
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
      // jedna kopia każdej karty — jak talia CR
      deckQueue: shuffle([...DEFAULT_DECK]),
      hand: [],
      crowns: 0,
    },
    [b]: {
      id: b,
      side: 1,
      elixir: ELIXIR_START,
      deckQueue: shuffle([...DEFAULT_DECK]),
      hand: [],
      crowns: 0,
    },
  };

  for (const p of Object.values(players)) {
    drawOpeningHand(p);
  }

  return {
    phase: 'playing',
    startedAt: now,
    endsAt: now + MATCH_MS,
    playerIds: [a, b],
    players,
    towers: [...makeTowers(a, 0), ...makeTowers(b, 1)],
    units: [],
    projectiles: [],
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
  if (viewerSide === 0) return { x: entity.x, y: entity.y };
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

function getEnemyPrincess(state, playerId, lane) {
  const opponentId = state.playerIds.find((id) => id !== playerId);
  return state.towers.find(
    (t) => t.ownerId === opponentId && t.type === 'princess' && t.lane === lane,
  );
}

/** Ile pól za rzekę można wystawić w danym X (świat). */
function getBridgePush(state, playerId, x) {
  const left = getEnemyPrincess(state, playerId, 'left');
  const right = getEnemyPrincess(state, playerId, 'right');
  const leftDown = left && !left.alive;
  const rightDown = right && !right.alive;

  if (leftDown && rightDown) return BOTH_TOWERS_PUSH;

  const onLeft = x < ARENA_W / 2;
  if (onLeft && leftDown) return BRIDGE_PUSH;
  if (!onLeft && rightDown) return BRIDGE_PUSH;
  return 0;
}

function canDeployAt(state, playerId, worldX, worldY) {
  const player = state.players[playerId];
  const half = ARENA_H / 2;
  const push = getBridgePush(state, playerId, worldX);

  if (player.side === 0) {
    const maxY = half - 0.4 + push;
    return worldY >= 0.5 && worldY <= maxY;
  }
  const minY = half + 0.4 - push;
  return worldY <= ARENA_H - 0.5 && worldY >= minY;
}

function clampDeploy(state, playerId, x, y) {
  const player = state.players[playerId];
  const half = ARENA_H / 2;
  const push = getBridgePush(state, playerId, x);
  const cx = Math.max(0.8, Math.min(ARENA_W - 0.8, x));
  let cy = y;
  if (player.side === 0) {
    cy = Math.max(0.8, Math.min(half - 0.4 + push, y));
  } else {
    cy = Math.max(half + 0.4 - push, Math.min(ARENA_H - 0.8, y));
  }
  return { x: cx, y: cy };
}

/** Strefa deploy w koordynatach widza (do UI). */
function getDeployZoneForViewer(state, playerId) {
  const me = state.players[playerId];
  const half = ARENA_H / 2;
  const leftPush = getBridgePush(state, playerId, ARENA_W * 0.25);
  const rightPush = getBridgePush(state, playerId, ARENA_W * 0.75);

  // W widoku gracza jego tył to y=0; push zwiększa maxY w jego układzie.
  return {
    baseMaxY: half - 0.4,
    leftMaxY: half - 0.4 + leftPush,
    rightMaxY: half - 0.4 + rightPush,
    leftPush,
    rightPush,
    side: me.side,
  };
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

function cycleCard(player, cardId) {
  const idx = player.hand.indexOf(cardId);
  if (idx === -1) return false;
  player.hand.splice(idx, 1);
  // zagrana karta wraca na koniec talii
  player.deckQueue.push(cardId);
  // następna karta z talii — pomiń te, które już są w ręce
  drawNextUnique(player);
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
    const sx = Math.max(0.5, Math.min(ARENA_W - 0.5, world.x));
    const sy = Math.max(0.5, Math.min(ARENA_H - 0.5, world.y));
    player.elixir -= def.cost;
    cycleCard(player, cardId);
    applySpell(state, playerId, def, sx, sy);
    return { ok: true };
  }

  if (!canDeployAt(state, playerId, world.x, world.y)) {
    return { ok: false, reason: 'Nie możesz tu wystawić — zniszcz wieżę, by poszerzyć strefę' };
  }

  const pos = clampDeploy(state, playerId, world.x, world.y);
  player.elixir -= def.cost;
  cycleCard(player, cardId);

  const offsets = spawnOffsets(def.count || 1);
  for (const off of offsets) {
    const unit = {
      id: `u${state.nextUnitId++}`,
      cardId: def.id,
      avatar: def.avatar,
      ownerId: playerId,
      x: pos.x + off.dx,
      y: pos.y + off.dy,
      hp: def.hp,
      maxHp: def.hp,
      damage: def.damage,
      range: def.range,
      speed: def.speed,
      attackMs: def.attackMs,
      attackCooldown: 0.35,
      splash: def.splash || 0,
      flying: !!def.flying,
      targetsBuildings: !!def.targetsBuildings,
      kind: def.kind,
      projectile: def.projectile || null,
      projectileSpeed: def.projectileSpeed || 12,
      lifetimeMs: def.lifetimeMs || null,
      ageMs: 0,
      targetId: null,
      facing: player.side === 0 ? 1 : -1,
      anim: 'idle',
      attackAnim: 0,
      hitFlash: 0,
    };
    state.units.push(unit);
  }

  state.effects.push({
    id: `e${state.nextUnitId++}`,
    type: 'spawn',
    x: pos.x,
    y: pos.y,
    radius: 1.2,
    ttl: 0.35,
    ownerId: playerId,
  });

  return { ok: true };
}

function applySpell(state, ownerId, def, x, y) {
  state.effects.push({
    id: `e${state.nextUnitId++}`,
    type: 'fireball',
    x,
    y,
    radius: def.radius,
    ttl: 0.55,
    ownerId,
  });

  for (const unit of state.units) {
    if (!unit.hp || unit.hp <= 0) continue;
    if (dist(unit, { x, y }) <= def.radius) {
      unit.hp -= def.damage;
      unit.hitFlash = 0.25;
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

function syncCrowns(state) {
  for (const id of state.playerIds) {
    if (state.players[id]) {
      state.players[id].crowns = countCrowns(state, id);
    }
  }
}

function destroyTower(state, tower, attackerId) {
  if (!tower.alive) return;
  tower.alive = false;
  tower.hp = 0;

  state.effects.push({
    id: `e${state.nextUnitId++}`,
    type: 'tower-break',
    x: tower.x,
    y: tower.y,
    radius: 2.2,
    ttl: 0.7,
    ownerId: attackerId,
  });

  syncCrowns(state);

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
    const d = dist(unit, e.ref);
    if (d < bestD) {
      bestD = d;
      best = e;
    }
  }
  return best;
}

function faceToward(entity, target) {
  const dx = target.x - entity.x;
  const dy = target.y - entity.y;
  if (Math.abs(dy) >= Math.abs(dx)) {
    entity.facing = dy >= 0 ? 1 : -1;
  } else {
    entity.facing = dx >= 0 ? 1 : -1;
  }
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
  faceToward(unit, target);
  unit.anim = 'walk';
  return true;
}

function applyHit(state, targetRef, kind, damage, splash, splashOrigin, attackerOwnerId) {
  if (kind === 'tower') {
    const tower = targetRef;
    if (!tower.alive) return;
    tower.hp -= damage;
    if (tower.hp <= 0) destroyTower(state, tower, attackerOwnerId);
    return;
  }

  const unit = targetRef;
  unit.hp -= damage;
  unit.hitFlash = 0.22;
  if (splash > 0) {
    for (const other of state.units) {
      if (other.id === unit.id || other.ownerId === attackerOwnerId || other.hp <= 0) continue;
      if (dist(other, splashOrigin || unit) <= splash) {
        other.hp -= damage * 0.7;
        other.hitFlash = 0.18;
      }
    }
  }
}

function spawnProjectile(state, attacker, target, style) {
  state.projectiles.push({
    id: `p${state.nextUnitId++}`,
    style: style || 'bolt',
    ownerId: attacker.ownerId,
    x: attacker.x,
    y: attacker.y,
    tx: target.ref.x,
    ty: target.ref.y,
    speed: attacker.projectileSpeed || 12,
    damage: attacker.damage,
    splash: attacker.splash || 0,
    targetId: target.ref.id,
    targetKind: target.kind,
    flying: !!attacker.flying,
  });
}

function resolveTargetById(state, targetId, targetKind) {
  if (targetKind === 'tower') {
    const t = state.towers.find((x) => x.id === targetId && x.alive);
    return t ? { kind: 'tower', ref: t } : null;
  }
  const u = state.units.find((x) => x.id === targetId && x.hp > 0);
  return u ? { kind: 'unit', ref: u } : null;
}

function tickProjectiles(state, dt) {
  const next = [];
  for (const p of state.projectiles) {
    const target = resolveTargetById(state, p.targetId, p.targetKind);
    if (target) {
      p.tx = target.ref.x;
      p.ty = target.ref.y;
    }

    const goal = { x: p.tx, y: p.ty };
    const d = dist(p, goal);
    const step = p.speed * dt;

    if (d <= step + 0.35 || !target) {
      if (target) {
        applyHit(state, target.ref, target.kind, p.damage, p.splash, target.ref, p.ownerId);
        state.effects.push({
          id: `e${state.nextUnitId++}`,
          type: p.style === 'arrow' ? 'impact-arrow' : p.style === 'fire' ? 'impact-fire' : 'impact',
          x: target.ref.x,
          y: target.ref.y,
          radius: 0.8,
          ttl: 0.28,
          ownerId: p.ownerId,
        });
      }
      continue;
    }

    const ratio = step / d;
    p.x += (goal.x - p.x) * ratio;
    p.y += (goal.y - p.y) * ratio;
    next.push(p);
  }
  state.projectiles = next;
  state.units = state.units.filter((u) => u.hp > 0);
}

function fireAttack(state, entity, target) {
  faceToward(entity, target.ref);
  entity.anim = 'attack';
  entity.attackAnim = entity.projectile === 'fire' ? 0.45 : 0.32;
  entity.attackTargetX = target.ref.x;
  entity.attackTargetY = target.ref.y;

  const style = entity.projectile;
  if (style === 'fire') {
    // Smok: widoczny strumień ognia + pocisk
    state.effects.push({
      id: `e${state.nextUnitId++}`,
      type: 'dragon-breath',
      x: entity.x,
      y: entity.y,
      tx: target.ref.x,
      ty: target.ref.y,
      radius: 1.2,
      ttl: 0.4,
      ownerId: entity.ownerId,
    });
    spawnProjectile(state, entity, target, style);
  } else if (style) {
    spawnProjectile(state, entity, target, style);
  } else {
    applyHit(state, target.ref, target.kind, entity.damage, entity.splash || 0, target.ref, entity.ownerId);
    state.effects.push({
      id: `e${state.nextUnitId++}`,
      type: 'melee',
      x: (entity.x + target.ref.x) / 2,
      y: (entity.y + target.ref.y) / 2,
      radius: 0.7,
      ttl: 0.22,
      ownerId: entity.ownerId,
    });
  }
}

function tickCombatEntity(state, entity, dt, isTower) {
  entity.attackCooldown = Math.max(0, (entity.attackCooldown || 0) - dt);
  entity.attackAnim = Math.max(0, (entity.attackAnim || 0) - dt);
  if (entity.hitFlash) entity.hitFlash = Math.max(0, entity.hitFlash - dt);

  const target = pickTarget(entity, state);
  if (!target) {
    if (!isTower) entity.anim = entity.attackAnim > 0 ? 'attack' : 'idle';
    return;
  }

  entity.targetId = target.ref.id;
  const d = dist(entity, target.ref);
  if (d > entity.range) {
    if (!isTower && entity.speed > 0) {
      moveToward(entity, target.ref, dt);
    } else if (!isTower) {
      entity.anim = 'idle';
    }
    return;
  }

  if (entity.attackCooldown <= 0) {
    fireAttack(state, entity, target);
    entity.attackCooldown = entity.attackMs / 1000;
  } else if (!isTower) {
    entity.anim = entity.attackAnim > 0 ? 'attack' : 'idle';
    faceToward(entity, target.ref);
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

  state.effects = state.effects
    .map((e) => ({ ...e, ttl: e.ttl - dt }))
    .filter((e) => e.ttl > 0);

  for (const unit of state.units) {
    unit.ageMs += TICK_MS;
    if (unit.lifetimeMs && unit.ageMs >= unit.lifetimeMs) {
      unit.hp = 0;
      continue;
    }
    tickCombatEntity(state, unit, dt, false);
  }
  state.units = state.units.filter((u) => u.hp > 0);

  for (const tower of state.towers) {
    if (!tower.alive) continue;
    tickCombatEntity(state, tower, dt, true);
  }

  tickProjectiles(state, dt);

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
  const deployZone = getDeployZoneForViewer(state, playerId);

  const mapTower = (t) => {
    const pos = toViewerCoords(t, side);
    return {
      id: t.id,
      type: t.type,
      lane: t.lane,
      mine: t.ownerId === playerId,
      x: pos.x,
      y: pos.y,
      hp: Math.max(0, Math.round(t.hp)),
      maxHp: t.maxHp,
      alive: t.alive,
      facing: side === 0 ? t.facing : -t.facing,
      attackAnim: t.attackAnim || 0,
    };
  };

  const mapUnit = (u) => {
    const pos = toViewerCoords(u, side);
    const def = CARDS[u.cardId];
    let atx = null;
    let aty = null;
    if (u.attackAnim > 0 && u.attackTargetX != null) {
      const tip = toViewerCoords({ x: u.attackTargetX, y: u.attackTargetY }, side);
      atx = tip.x;
      aty = tip.y;
    }
    return {
      id: u.id,
      cardId: u.cardId,
      avatar: u.avatar || def?.avatar || 'knight',
      emoji: def?.emoji || '❓',
      name: def?.name || u.cardId,
      mine: u.ownerId === playerId,
      x: pos.x,
      y: pos.y,
      hp: Math.max(0, Math.round(u.hp)),
      maxHp: u.maxHp,
      flying: !!u.flying,
      kind: u.kind,
      facing: side === 0 ? u.facing : -u.facing,
      anim: u.anim || 'idle',
      attackAnim: u.attackAnim || 0,
      hitFlash: u.hitFlash || 0,
      attackTargetX: atx,
      attackTargetY: aty,
    };
  };

  const mapProjectile = (p) => {
    const pos = toViewerCoords(p, side);
    const tip = toViewerCoords({ x: p.tx, y: p.ty }, side);
    const angle = Math.atan2(tip.y - pos.y, tip.x - pos.x);
    // Po odwróceniu Y na ekranie kąt też trzeba zmapować w UI — podajemy raw viewer arena coords
    return {
      id: p.id,
      style: p.style,
      x: pos.x,
      y: pos.y,
      tx: tip.x,
      ty: tip.y,
      angle,
      mine: p.ownerId === playerId,
    };
  };

  const mapEffect = (e) => {
    const pos = toViewerCoords(e, side);
    const out = {
      id: e.id,
      type: e.type,
      x: pos.x,
      y: pos.y,
      radius: e.radius,
      ttl: e.ttl,
    };
    if (e.tx != null && e.ty != null) {
      const tip = toViewerCoords({ x: e.tx, y: e.ty }, side);
      out.tx = tip.x;
      out.ty = tip.y;
      out.angle = Math.atan2(tip.y - pos.y, tip.x - pos.x);
    }
    return out;
  };

  const hand = me.hand.map((id) => {
    const c = CARDS[id];
    return {
      id: c.id,
      name: c.name,
      emoji: c.emoji,
      avatar: c.avatar,
      cost: c.cost,
      kind: c.kind,
      playable: me.elixir >= c.cost,
    };
  });

  // Podgląd następnej karty — pierwsza w kolejce, której nie ma w ręce
  const nextId = me.deckQueue.find((id) => !me.hand.includes(id)) || null;
  const nextCard = nextId
    ? {
      id: nextId,
      name: CARDS[nextId].name,
      emoji: CARDS[nextId].emoji,
      avatar: CARDS[nextId].avatar,
      cost: CARDS[nextId].cost,
    }
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
    myCrowns: countCrowns(state, playerId),
    enemyCrowns: opponentId ? countCrowns(state, opponentId) : 0,
    myName: null,
    enemyName: null,
    towers: state.towers.map(mapTower),
    units: state.units.map(mapUnit),
    projectiles: state.projectiles.map(mapProjectile),
    effects: state.effects.map(mapEffect),
    deployZone,
    remainingMs,
    doubleElixir: remainingMs <= DOUBLE_ELIXIR_MS,
    winner: state.winner,
    winReason: state.winReason,
  };
}

module.exports = {
  createArenaState,
  playCard,
  tickArena,
  getPublicArenaState,
  canDeployAt,
  TICK_MS,
  CARDS,
  ARENA_W,
  ARENA_H,
};
