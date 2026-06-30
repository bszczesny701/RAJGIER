const POLISH_WORDS = [
  'MIŁOŚĆ', 'SERCE', 'RAJ', 'GRA', 'ZABAWA', 'WYGRANA', 'STATKI',
  'SŁOWO', 'UKŁADANKA', 'RADOŚĆ', 'SMUTKU', 'PARA', 'RAZEM', 'WIECZÓR',
  'KAWA', 'FILM', 'SPACER', 'MUZYKA', 'TORT', 'PREZENT', 'UŚMIECH',
  'PRZYJAŹŃ', 'SZCZĘŚCIE', 'MARZENIE', 'POCAŁUNEK', 'PRZYGA', 'WAKACJE',
];

const POLISH_LETTERS = 'AĄBCĆDEĘFGHIJKLŁMNŃOÓPQRSŚTUVWXYZŹŻ';

function randomLetter() {
  return POLISH_LETTERS[Math.floor(Math.random() * POLISH_LETTERS.length)];
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function canPlace(grid, word, row, col, dr, dc) {
  const size = grid.length;
  for (let i = 0; i < word.length; i++) {
    const r = row + dr * i;
    const c = col + dc * i;
    if (r < 0 || r >= size || c < 0 || c >= size) return false;
    const cell = grid[r][c];
    if (cell && cell !== word[i]) return false;
  }
  return true;
}

function placeWord(grid, word, row, col, dr, dc) {
  for (let i = 0; i < word.length; i++) {
    grid[row + dr * i][col + dc * i] = word[i];
  }
}

function generateGrid(size = 14, wordCount = 10) {
  const words = shuffle(POLISH_WORDS)
    .slice(0, wordCount)
    .map((w) => w.toUpperCase());

  const grid = Array.from({ length: size }, () => Array(size).fill(''));
  const directions = [
    [0, 1], [1, 0], [1, 1], [1, -1],
    [0, -1], [-1, 0], [-1, -1], [-1, 1],
  ];

  for (const word of words.sort((a, b) => b.length - a.length)) {
    let placed = false;
    const attempts = shuffle(
      Array.from({ length: size * size * directions.length }, (_, i) => i)
    );

    for (const attempt of attempts) {
      const dirIdx = attempt % directions.length;
      const pos = Math.floor(attempt / directions.length);
      const row = Math.floor(pos / size);
      const col = pos % size;
      const [dr, dc] = directions[dirIdx];

      if (canPlace(grid, word, row, col, dr, dc)) {
        placeWord(grid, word, row, col, dr, dc);
        placed = true;
        break;
      }
    }

    if (!placed) {
      return generateGrid(size, wordCount);
    }
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!grid[r][c]) grid[r][c] = randomLetter();
    }
  }

  return { grid, words };
}

function cellsMatchWord(grid, cells, word) {
  if (cells.length !== word.length) return false;

  let extracted = '';
  for (const { row, col } of cells) {
    if (row < 0 || row >= grid.length || col < 0 || col >= grid[0].length) {
      return false;
    }
    extracted += grid[row][col];
  }

  return extracted === word || extracted === word.split('').reverse().join('');
}

function createWordSearchState() {
  const { grid, words } = generateGrid();
  return {
    grid,
    words,
    foundBy: {},
    scores: {},
    startTime: Date.now(),
    winner: null,
  };
}

function tryFindWord(state, playerId, cells) {
  if (state.winner) return { success: false, reason: 'Gra zakończona' };

  for (const word of state.words) {
    if (state.foundBy[word]) continue;
    if (cellsMatchWord(state.grid, cells, word)) {
      state.foundBy[word] = playerId;
      if (!state.foundWordCells) state.foundWordCells = {};
      state.foundWordCells[word] = { playerId, cells: [...cells] };
      state.scores[playerId] = (state.scores[playerId] || 0) + 1;

      const allFound = state.words.every((w) => state.foundBy[w]);
      if (allFound) {
        const scores = Object.entries(state.scores);
        scores.sort((a, b) => b[1] - a[1]);
        if (scores.length >= 2 && scores[0][1] === scores[1][1]) {
          state.winner = 'draw';
        } else {
          state.winner = scores[0]?.[0] || playerId;
        }
      }

      return { success: true, word };
    }
  }

  return { success: false, reason: 'Nie znaleziono słowa' };
}

function getPublicWordSearchState(state, playerId) {
  const foundCellMarks = [];
  for (const { playerId: finderId, cells } of Object.values(state.foundWordCells || {})) {
    for (const cell of cells) {
      foundCellMarks.push({ row: cell.row, col: cell.col, playerId: finderId });
    }
  }

  return {
    grid: state.grid,
    words: state.words.map((word) => ({
      word,
      found: !!state.foundBy[word],
      foundByMe: state.foundBy[word] === playerId,
      foundByOpponent: state.foundBy[word] && state.foundBy[word] !== playerId,
    })),
    foundCellMarks,
    scores: state.scores,
    startTime: state.startTime,
    winner: state.winner,
    foundBy: state.foundBy,
  };
}

module.exports = {
  createWordSearchState,
  tryFindWord,
  getPublicWordSearchState,
};
