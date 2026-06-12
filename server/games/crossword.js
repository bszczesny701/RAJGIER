const PUZZLES = [
  {
    id: 'milosc',
    title: 'Miłość',
    size: 8,
    words: [
      { id: 'w1', number: 1, dir: 'h', row: 0, col: 1, answer: 'MIŁOŚĆ', clue: 'Najpiękniejsze uczucie' },
      { id: 'w2', number: 2, dir: 'h', row: 2, col: 2, answer: 'RAJ', clue: 'Miejsce szczęścia (jak ta apka!)' },
      { id: 'w3', number: 3, dir: 'v', row: 2, col: 6, answer: 'GRA', clue: 'Rozgrywka, zabawa' },
      { id: 'w4', number: 4, dir: 'h', row: 4, col: 2, answer: 'PARA', clue: 'Dwie osoby razem' },
      { id: 'w5', number: 5, dir: 'h', row: 6, col: 1, answer: 'SERCE', clue: 'Symbol miłości' },
    ],
  },
  {
    id: 'wspolne',
    title: 'Wspólne chwile',
    size: 9,
    words: [
      { id: 'w1', number: 1, dir: 'h', row: 0, col: 1, answer: 'KAWA', clue: 'Poranny napój we dwoje' },
      { id: 'w2', number: 2, dir: 'h', row: 0, col: 5, answer: 'FILM', clue: 'Wieczór przed ekranem' },
      { id: 'w3', number: 3, dir: 'h', row: 2, col: 2, answer: 'RAZEM', clue: 'Zawsze w parze' },
      { id: 'w4', number: 4, dir: 'h', row: 4, col: 1, answer: 'SPACER', clue: 'Romantyczny spacer' },
      { id: 'w5', number: 5, dir: 'h', row: 6, col: 1, answer: 'MUZYKA', clue: 'Wspólna playlista' },
      { id: 'w6', number: 6, dir: 'h', row: 4, col: 6, answer: 'TORT', clue: 'Słodki deser' },
    ],
  },
  {
    id: 'zabawa',
    title: 'Zabawa',
    size: 8,
    words: [
      { id: 'w1', number: 1, dir: 'h', row: 0, col: 1, answer: 'ZABAWA', clue: 'Dobry wieczór w grach' },
      { id: 'w2', number: 2, dir: 'h', row: 2, col: 1, answer: 'GRA', clue: 'Rozgrywka' },
      { id: 'w3', number: 3, dir: 'h', row: 2, col: 5, answer: 'RAJ', clue: 'Wasze królestwo gier' },
      { id: 'w4', number: 4, dir: 'h', row: 4, col: 1, answer: 'PARA', clue: 'Wy gracie w parze' },
      { id: 'w5', number: 5, dir: 'h', row: 6, col: 2, answer: 'TORT', clue: 'Deser na koniec' },
    ],
  },
];

function normalize(text) {
  return (text || '').toUpperCase().trim()
    .replace(/Ó/g, 'O')
    .replace(/Ł/g, 'L')
    .replace(/Ś/g, 'S')
    .replace(/Ć/g, 'C')
    .replace(/Ń/g, 'N')
    .replace(/Ź/g, 'Z')
    .replace(/Ż/g, 'Z')
    .replace(/Ą/g, 'A')
    .replace(/Ę/g, 'E');
}

function normalizePolish(text) {
  return (text || '').toUpperCase().trim();
}

function answersMatch(given, expected) {
  return normalizePolish(given) === normalizePolish(expected)
    || normalize(given) === normalize(expected);
}

function buildGrid(puzzle) {
  const { size, words } = puzzle;
  const blocks = Array.from({ length: size }, () => Array(size).fill(true));
  const numbers = Array.from({ length: size }, () => Array(size).fill(0));

  for (const word of words) {
    for (let i = 0; i < word.answer.length; i++) {
      const r = word.dir === 'h' ? word.row : word.row + i;
      const c = word.dir === 'h' ? word.col + i : word.col;
      blocks[r][c] = false;
    }
    numbers[word.row][word.col] = word.number;
  }

  return { blocks, numbers };
}

function getWordCells(word) {
  const cells = [];
  for (let i = 0; i < word.answer.length; i++) {
    cells.push({
      row: word.dir === 'h' ? word.row : word.row + i,
      col: word.dir === 'h' ? word.col + i : word.col,
    });
  }
  return cells;
}

function pickPuzzle() {
  return PUZZLES[Math.floor(Math.random() * PUZZLES.length)];
}

function createCrosswordState() {
  const puzzle = pickPuzzle();
  const { blocks, numbers } = buildGrid(puzzle);

  return {
    puzzleId: puzzle.id,
    title: puzzle.title,
    size: puzzle.size,
    blocks,
    numbers,
    words: puzzle.words.map((w) => ({
      id: w.id,
      number: w.number,
      dir: w.dir,
      row: w.row,
      col: w.col,
      length: w.answer.length,
      clue: w.clue,
      solvedBy: null,
    })),
    revealed: {},
    scores: {},
    startTime: Date.now(),
    winner: null,
  };
}

function applyWordToRevealed(state, wordDef, puzzleWord) {
  const cells = getWordCells(puzzleWord);
  for (let i = 0; i < cells.length; i++) {
    const { row, col } = cells[i];
    state.revealed[`${row},${col}`] = wordDef.answer[i];
  }
}

function checkWinner(state, playerIds) {
  const unsolved = state.words.filter((w) => !w.solvedBy);
  if (unsolved.length > 0) return;

  const entries = playerIds.map((id) => [id, state.scores[id] || 0]);
  entries.sort((a, b) => b[1] - a[1]);

  if (entries.length >= 2 && entries[0][1] === entries[1][1]) {
    state.winner = 'draw';
  } else {
    state.winner = entries[0]?.[0] || null;
  }
}

function trySubmitWord(state, playerId, wordId, answer) {
  if (state.winner) return { success: false, reason: 'Gra zakończona' };

  const word = state.words.find((w) => w.id === wordId);
  if (!word) return { success: false, reason: 'Nie znaleziono hasła' };
  if (word.solvedBy) return { success: false, reason: 'Hasło już rozwiązane' };

  const puzzle = PUZZLES.find((p) => p.id === state.puzzleId);
  const puzzleWord = puzzle?.words.find((w) => w.id === wordId);
  if (!puzzleWord) return { success: false, reason: 'Błąd krzyżówki' };

  if (!answersMatch(answer, puzzleWord.answer)) {
    return { success: false, reason: 'Niepoprawna odpowiedź' };
  }

  word.solvedBy = playerId;
  state.scores[playerId] = (state.scores[playerId] || 0) + 1;
  applyWordToRevealed(state, puzzleWord, puzzleWord);

  return { success: true, word: puzzleWord.answer };
}

function getPublicCrosswordState(state, playerId) {
  return {
    puzzleId: state.puzzleId,
    title: state.title,
    size: state.size,
    blocks: state.blocks,
    numbers: state.numbers,
    words: state.words.map((w) => ({
      id: w.id,
      number: w.number,
      dir: w.dir,
      row: w.row,
      col: w.col,
      length: w.length,
      clue: w.clue,
      solved: !!w.solvedBy,
      solvedByMe: w.solvedBy === playerId,
      solvedByOpponent: w.solvedBy && w.solvedBy !== playerId,
    })),
    revealed: state.revealed,
    scores: state.scores,
    startTime: state.startTime,
    winner: state.winner,
  };
}

module.exports = {
  createCrosswordState,
  trySubmitWord,
  getPublicCrosswordState,
  checkWinner,
  getWordCells,
  PUZZLES,
};
