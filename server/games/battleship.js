const SHIP_TYPES = [
  { id: '4', size: 4, count: 1 },
  { id: '3', size: 3, count: 2 },
  { id: '2', size: 2, count: 3 },
  { id: '1', size: 1, count: 4 },
];

const GRID_SIZE = 10;

function createEmptyBoard() {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => ({ ship: null, hit: false }))
  );
}

function createBattleshipState() {
  return {
    phase: 'placement',
    currentTurn: null,
    boards: {},
    fleets: {},
    enemyView: {},
    enemySunkCounts: {},
    placementReady: {},
    winner: null,
    lastShot: null,
    lastSunk: null,
  };
}

function getSunkShipIds(board, fleet) {
  if (!board || !fleet) return [];
  return fleet
    .filter((ship) => ship.cells.every(({ row, col }) => board[row][col].hit))
    .map((ship) => ship.id);
}

function findNewlySunkShip(board, fleet, previouslySunk) {
  const sunkNow = getSunkShipIds(board, fleet);
  const prev = new Set(previouslySunk);
  return sunkNow.find((id) => !prev.has(id)) || null;
}

function validateShips(ships) {
  const required = SHIP_TYPES.flatMap(({ id, size, count }) =>
    Array.from({ length: count }, () => ({ id, size }))
  );

  if (ships.length !== required.length) {
    return { valid: false, reason: 'Nieprawidłowa liczba statków' };
  }

  const sortedRequired = required.map((s) => s.size).sort((a, b) => b - a);
  const sortedProvided = ships.map((s) => s.size).sort((a, b) => b - a);

  for (let i = 0; i < sortedRequired.length; i++) {
    if (sortedRequired[i] !== sortedProvided[i]) {
      return { valid: false, reason: 'Nieprawidłowe rozmiary statków' };
    }
  }

  const occupied = new Set();

  for (const ship of ships) {
    const cells = ship.cells;
    if (!cells || cells.length !== ship.size) {
      return { valid: false, reason: 'Nieprawidły statek' };
    }

    const sorted = [...cells].sort((a, b) => a.row - b.row || a.col - b.col);
    const isHorizontal = sorted.every((c, i) =>
      i === 0 || (c.row === sorted[i - 1].row && c.col === sorted[i - 1].col + 1)
    );
    const isVertical = sorted.every((c, i) =>
      i === 0 || (c.col === sorted[i - 1].col && c.row === sorted[i - 1].row + 1)
    );

    if (!isHorizontal && !isVertical) {
      return { valid: false, reason: 'Statki muszą być proste' };
    }

    for (const { row, col } of cells) {
      if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) {
        return { valid: false, reason: 'Statek poza planszą' };
      }
      const key = `${row},${col}`;
      if (occupied.has(key)) {
        return { valid: false, reason: 'Statki nachodzą na siebie' };
      }
      occupied.add(key);
    }
  }

  return { valid: true };
}

function placeShipsOnBoard(state, playerId, ships) {
  const validation = validateShips(ships);
  if (!validation.valid) return validation;

  const board = createEmptyBoard();
  const fleet = ships.map((ship, index) => {
    const id = `${ship.id}-${index}`;
    for (const { row, col } of ship.cells) {
      board[row][col] = { ship: id, hit: false };
    }
    return { id, size: ship.size, cells: ship.cells };
  });

  state.boards[playerId] = board;
  state.fleets[playerId] = fleet;
  state.enemyView[playerId] = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => ({ hit: false, miss: false }))
  );
  state.enemySunkCounts[playerId] = { 4: 0, 3: 0, 2: 0, 1: 0 };
  state.placementReady[playerId] = true;

  return { valid: true };
}

function allPlaced(state, playerIds) {
  return playerIds.every((id) => state.placementReady[id]);
}

function startBattle(state, playerIds) {
  state.phase = 'battle';
  state.currentTurn = playerIds[Math.floor(Math.random() * playerIds.length)];
}

function shoot(state, playerId, row, col, opponentId) {
  if (state.phase !== 'battle') {
    return { valid: false, reason: 'Gra jeszcze się nie rozpoczęła' };
  }
  if (state.currentTurn !== playerId) {
    return { valid: false, reason: 'Nie twój ruch' };
  }
  if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) {
    return { valid: false, reason: 'Poza planszą' };
  }

  const view = state.enemyView[playerId];
  if (view[row][col].hit || view[row][col].miss) {
    return { valid: false, reason: 'Już strzelano w to pole' };
  }

  const enemyBoard = state.boards[opponentId];
  const cell = enemyBoard[row][col];
  const hit = !!cell.ship;

  if (hit) {
    cell.hit = true;
    view[row][col].hit = true;
  } else {
    view[row][col].miss = true;
  }

  state.lastShot = { row, col, hit, shooter: playerId };
  state.lastSunk = null;

  const enemyFleet = state.fleets[opponentId] || [];
  const previouslySunk = getSunkShipIds(enemyBoard, enemyFleet);
  const newlySunkId = findNewlySunkShip(enemyBoard, enemyFleet, previouslySunk);

  if (newlySunkId) {
    const sunkShip = enemyFleet.find((s) => s.id === newlySunkId);
    if (sunkShip) {
      state.enemySunkCounts[playerId][sunkShip.size] += 1;
      state.lastSunk = { size: sunkShip.size, shooter: playerId };
    }
  }

  const allSunk = enemyBoard.every((rowCells) =>
    rowCells.every((c) => !c.ship || c.hit)
  );

  if (allSunk) {
    state.phase = 'finished';
    state.winner = playerId;
  } else if (!hit) {
    state.currentTurn = opponentId;
  }

  return { valid: true, hit, sunk: allSunk, shipSunk: !!newlySunkId };
}

function buildFleetStatus(board, fleet) {
  const sunkIds = new Set(getSunkShipIds(board, fleet));
  return (fleet || []).map(({ id, size }) => ({
    id,
    size,
    sunk: sunkIds.has(id),
  }));
}

function getPublicBattleshipState(state, playerId, opponentId) {
  const myBoard = state.boards[playerId];
  const myFleet = state.fleets[playerId];

  return {
    phase: state.phase,
    currentTurn: state.currentTurn,
    myBoard: myBoard?.map((row) =>
      row.map((cell) => ({
        ship: cell.ship,
        hit: cell.hit,
      }))
    ),
    enemyBoard: state.enemyView[playerId],
    myFleet: buildFleetStatus(myBoard, myFleet),
    enemySunkCounts: { ...(state.enemySunkCounts[playerId] || { 4: 0, 3: 0, 2: 0, 1: 0 }) },
    placementReady: !!state.placementReady[playerId],
    opponentReady: !!state.placementReady[opponentId],
    winner: state.winner,
    lastShot: state.lastShot,
    lastSunk: state.lastSunk,
    shipTypes: SHIP_TYPES,
    gridSize: GRID_SIZE,
  };
}

module.exports = {
  SHIP_TYPES,
  GRID_SIZE,
  createBattleshipState,
  placeShipsOnBoard,
  allPlaced,
  startBattle,
  shoot,
  getPublicBattleshipState,
};
