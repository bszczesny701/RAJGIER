const PUZZLES = [
  {
    id: 'latwe1',
    difficulty: 'Łatwe',
    initial: [
      [5, 3, 0, 0, 7, 0, 0, 0, 0],
      [6, 0, 0, 1, 9, 5, 0, 0, 0],
      [0, 9, 8, 0, 0, 0, 0, 6, 0],
      [8, 0, 0, 0, 6, 0, 0, 0, 3],
      [4, 0, 0, 8, 0, 3, 0, 0, 1],
      [7, 0, 0, 0, 2, 0, 0, 0, 6],
      [0, 6, 0, 0, 0, 0, 2, 8, 0],
      [0, 0, 0, 4, 1, 9, 0, 0, 5],
      [0, 0, 0, 0, 8, 0, 0, 7, 9],
    ],
    solution: [
      [5, 3, 4, 6, 7, 8, 9, 1, 2],
      [6, 7, 2, 1, 9, 5, 3, 4, 8],
      [1, 9, 8, 3, 4, 2, 5, 6, 7],
      [8, 5, 9, 7, 6, 1, 4, 2, 3],
      [4, 2, 6, 8, 5, 3, 7, 9, 1],
      [7, 1, 3, 9, 2, 4, 8, 5, 6],
      [9, 6, 1, 5, 3, 7, 2, 8, 4],
      [2, 8, 7, 4, 1, 9, 6, 3, 5],
      [3, 4, 5, 2, 8, 6, 1, 7, 9],
    ],
  },
];

function pickPuzzle() {
  return PUZZLES[Math.floor(Math.random() * PUZZLES.length)];
}

function createSudokuState() {
  const puzzle = pickPuzzle();
  return {
    puzzleId: puzzle.id,
    difficulty: puzzle.difficulty,
    initial: puzzle.initial.map((row) => [...row]),
    solution: puzzle.solution.map((row) => [...row]),
    startTime: Date.now(),
    finishes: {},
    winner: null,
  };
}

function isComplete(grid) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (!grid[r]?.[c] || grid[r][c] < 1 || grid[r][c] > 9) return false;
    }
  }
  return true;
}

function matchesSolution(grid, solution) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] !== solution[r][c]) return false;
    }
  }
  return true;
}

function preservesInitial(initial, grid) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (initial[r][c] !== 0 && initial[r][c] !== grid[r][c]) return false;
    }
  }
  return true;
}

function trySubmitSudoku(state, playerId, grid) {
  if (state.winner) return { success: false, reason: 'Gra zakończona' };
  if (state.finishes[playerId]) return { success: false, reason: 'Już ukończyłeś sudoku' };

  if (!Array.isArray(grid) || grid.length !== 9) {
    return { success: false, reason: 'Nieprawidłowa plansza' };
  }

  if (!preservesInitial(state.initial, grid)) {
    return { success: false, reason: 'Nie możesz zmieniać podanych liczb' };
  }

  if (!isComplete(grid)) {
    return { success: false, reason: 'Uzupełnij wszystkie pola' };
  }

  if (!matchesSolution(grid, state.solution)) {
    return { success: false, reason: 'Niepoprawne rozwiązanie — sprawdź jeszcze raz' };
  }

  const elapsed = Date.now() - state.startTime;
  state.finishes[playerId] = { time: elapsed, at: Date.now() };

  if (!state.winner) {
    state.winner = playerId;
  }

  return { success: true, time: elapsed };
}

function getPublicSudokuState(state, playerId) {
  const opponentFinish = Object.entries(state.finishes).find(([id]) => id !== playerId)?.[1];
  const myFinish = state.finishes[playerId];

  return {
    puzzleId: state.puzzleId,
    difficulty: state.difficulty,
    initial: state.initial,
    startTime: state.startTime,
    myFinished: !!myFinish,
    myTime: myFinish?.time ?? null,
    opponentFinished: !!opponentFinish,
    opponentTime: opponentFinish?.time ?? null,
    winner: state.winner,
  };
}

module.exports = {
  createSudokuState,
  trySubmitSudoku,
  getPublicSudokuState,
};
