const WIN_SCORE = 5;

const WORDS = [
  'KOT', 'PIES', 'KAWA', 'FILM', 'PIZZA', 'GÓRA', 'MORZE', 'SŁOŃCE',
  'KSIĄŻKA', 'TELEFON', 'SAMOCHÓD', 'ROWER', 'LOTNISKO', 'RESTAURACJA',
  'SZAŁAS', 'TORT', 'PREZENT', 'MUZYKA', 'TENIS', 'PIŁKA', 'ZABAWA',
  'MIŁOŚĆ', 'SERCE', 'PARA', 'WAKACJE', 'PLAŻA', 'LAS', 'RZEKA',
  'KOMIK', 'AKTOR', 'PILOT', 'LEKARZ', 'NAUCZYCIEL', 'KUCHARZ',
  'TRAMPOLINA', 'DESKOROLKA', 'GITARA', 'PIANO', 'SMARTFON', 'LAPTOP',
  'OKULARY', 'CZAPKA', 'BUTY', 'PLECAK', 'WALIZKA', 'SAMOLOT',
  'POCIĄG', 'TRAMWAJ', 'METRO', 'STATEK', 'ŻAGLOWIEC', 'WULKAN',
  'DINOZAUR', 'LEW', 'SŁOŃ', 'TYGRYS', 'NIEDŹWIEDŹ', 'PINGWIN',
  'DOLAR', 'EURO', 'MONETA', 'PORTFEL', 'KARTA', 'LIST',
  'KWIAT', 'DRZEWO', 'TRAWA', 'CHMURA', 'DESZCZ', 'ŚNIEG',
  'LAMPKA', 'KRZESŁO', 'STÓŁ', 'ŁÓŻKO', 'SZAFKA', 'LUSTRO',
  'ZUPA', 'KANAPKA', 'LODY', 'CZEKOLADA', 'JABŁKO', 'BANAN',
  'POMIDOR', 'OGÓREK', 'SER', 'MASŁO', 'CHLEB', 'MĄKA',
];

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

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

function pickNextWord(state) {
  if (state.wordPool.length === 0) {
    state.wordPool = shuffle(WORDS);
  }
  state.currentWord = state.wordPool.pop();
  state.hints = [];
  state.lastResult = null;
}

function swapRoles(state, playerIds) {
  const guesserIdx = playerIds.indexOf(state.guesserId);
  const nextGuesser = playerIds[(guesserIdx + 1) % playerIds.length];
  state.guesserId = nextGuesser;
  state.hinterId = playerIds.find((id) => id !== nextGuesser);
  state.round += 1;
}

function checkWinner(state) {
  for (const [playerId, score] of Object.entries(state.scores)) {
    if (score >= WIN_SCORE) {
      state.winner = playerId;
      return;
    }
  }
}

function createCzolkoState(playerIds) {
  const wordPool = shuffle(WORDS);
  const guesserId = playerIds[0];
  const hinterId = playerIds[1];

  const state = {
    wordPool,
    currentWord: null,
    round: 1,
    guesserId,
    hinterId,
    hints: [],
    scores: {},
    lastResult: null,
    winner: null,
    winScore: WIN_SCORE,
    startTime: Date.now(),
  };

  for (const id of playerIds) {
    state.scores[id] = 0;
  }

  pickNextWord(state);
  return state;
}

function finishRound(state, playerIds, result) {
  state.lastResult = result;

  if (result.type === 'correct') {
    state.scores[state.guesserId] = (state.scores[state.guesserId] || 0) + 1;
  }

  checkWinner(state);
  if (state.winner) return;

  swapRoles(state, playerIds);
  pickNextWord(state);
}

function trySendHint(state, playerId, text) {
  if (state.winner) return { success: false, reason: 'Gra zakończona' };
  if (playerId !== state.hinterId) return { success: false, reason: 'Tylko podpowiadający może wysłać podpowiedź' };

  const hint = (text || '').trim().slice(0, 120);
  if (!hint) return { success: false, reason: 'Wpisz podpowiedź' };

  const wordNorm = normalize(state.currentWord);
  const hintNorm = normalize(hint);
  if (hintNorm.includes(wordNorm) || wordNorm.includes(hintNorm)) {
    return { success: false, reason: 'Nie możesz użyć słowa z odpowiedzi!' };
  }

  state.hints.push({ text: hint, time: Date.now() });
  return { success: true };
}

function tryGuess(state, playerId, guess, playerIds) {
  if (state.winner) return { success: false, reason: 'Gra zakończona' };
  if (playerId !== state.guesserId) return { success: false, reason: 'Tylko zgadujący może odpowiadać' };

  const answer = (guess || '').trim();
  if (!answer) return { success: false, reason: 'Wpisz odpowiedź' };

  if (!answersMatch(answer, state.currentWord)) {
    return { success: false, reason: 'Nie to słowo — spróbuj jeszcze raz!' };
  }

  finishRound(state, playerIds, {
    type: 'correct',
    word: state.currentWord,
    guess: normalizePolish(answer),
    guesserId: playerId,
  });

  return { success: true, correct: true, word: state.currentWord };
}

function trySkip(state, playerId, playerIds) {
  if (state.winner) return { success: false, reason: 'Gra zakończona' };
  if (playerId !== state.guesserId && playerId !== state.hinterId) {
    return { success: false, reason: 'Nie jesteś w tej rundzie' };
  }

  const word = state.currentWord;
  finishRound(state, playerIds, {
    type: 'skipped',
    word,
    guesserId: state.guesserId,
    skippedBy: playerId,
  });

  return { success: true, skipped: true, word };
}

function getPublicCzolkoState(state, playerId) {
  const isGuesser = playerId === state.guesserId;
  const isHinter = playerId === state.hinterId;

  return {
    round: state.round,
    guesserId: state.guesserId,
    hinterId: state.hinterId,
    role: isGuesser ? 'guesser' : isHinter ? 'hinter' : 'spectator',
    word: isHinter ? state.currentWord : null,
    wordLength: state.currentWord?.length || 0,
    hints: state.hints,
    scores: state.scores,
    lastResult: state.lastResult,
    winner: state.winner,
    winScore: state.winScore,
    startTime: state.startTime,
  };
}

module.exports = {
  createCzolkoState,
  trySendHint,
  tryGuess,
  trySkip,
  getPublicCzolkoState,
  WIN_SCORE,
};
