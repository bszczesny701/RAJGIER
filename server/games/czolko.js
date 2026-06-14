const WIN_SCORE = 5;

const PEOPLE = [
  { name: 'ROBERT LEWANDOWSKI', age: '36 lat', nationality: 'Polska', knownFor: 'Piłkarz' },
  { name: 'LIONEL MESSI', age: '37 lat', nationality: 'Argentyna', knownFor: 'Piłkarz' },
  { name: 'CRISTIANO RONALDO', age: '39 lat', nationality: 'Portugalia', knownFor: 'Piłkarz' },
  { name: 'KYLIAN MBAPPÉ', age: '26 lat', nationality: 'Francja', knownFor: 'Piłkarz' },
  { name: 'ERLING HAALAND', age: '24 lata', nationality: 'Norwegia', knownFor: 'Piłkarz' },
  { name: 'IGA ŚWIĄTEK', age: '23 lata', nationality: 'Polska', knownFor: 'Tenisistka' },
  { name: 'NOVAK DJOKOVIC', age: '37 lat', nationality: 'Serbia', knownFor: 'Tenisista' },
  { name: 'RAFAEL NADAL', age: '38 lat', nationality: 'Hiszpania', knownFor: 'Tenisista' },
  { name: 'TAYLOR SWIFT', age: '35 lat', nationality: 'USA', knownFor: 'Piosenkarka' },
  { name: 'BEYONCÉ', age: '43 lata', nationality: 'USA', knownFor: 'Piosenkarka' },
  { name: 'DRAKE', age: '38 lat', nationality: 'Kanada', knownFor: 'Raper' },
  { name: 'BILLIE EILISH', age: '23 lata', nationality: 'USA', knownFor: 'Piosenkarka' },
  { name: 'FREDDIE MERCURY', age: '45 lat', nationality: 'Wielka Brytania', knownFor: 'Wokalista Queen' },
  { name: 'MICHAEL JACKSON', age: '50 lat', nationality: 'USA', knownFor: 'Piosenkarz' },
  { name: 'LEONARDO DICAPRIO', age: '49 lat', nationality: 'USA', knownFor: 'Aktor' },
  { name: 'TOM HANKS', age: '68 lat', nationality: 'USA', knownFor: 'Aktor' },
  { name: 'SCARLETT JOHANSSON', age: '40 lat', nationality: 'USA', knownFor: 'Aktorka' },
  { name: 'MERYL STREEP', age: '75 lat', nationality: 'USA', knownFor: 'Aktorka' },
  { name: 'BRAD PITT', age: '61 lat', nationality: 'USA', knownFor: 'Aktor' },
  { name: 'ANGELINA JOLIE', age: '49 lat', nationality: 'USA', knownFor: 'Aktorka' },
  { name: 'DWAYNE JOHNSON', age: '52 lata', nationality: 'USA', knownFor: 'Aktor' },
  { name: 'MARGOT ROBBIE', age: '34 lata', nationality: 'Australia', knownFor: 'Aktorka' },
  { name: 'RYAN REYNOLDS', age: '48 lat', nationality: 'Kanada', knownFor: 'Aktor' },
  { name: 'EMMA WATSON', age: '34 lata', nationality: 'Wielka Brytania', knownFor: 'Aktorka' },
  { name: 'DANIEL CRAIG', age: '56 lat', nationality: 'Wielka Brytania', knownFor: 'Aktor' },
  { name: 'MIKOŁAJ KOPERNIK', age: 'XVI wiek', nationality: 'Polska', knownFor: 'Astronom' },
  { name: 'MARIA SKŁODOWSKA-CURIE', age: '1867–1934', nationality: 'Polska', knownFor: 'Naukowczyni' },
  { name: 'FRYDERYK CHOPIN', age: '1810–1849', nationality: 'Polska', knownFor: 'Kompozytor' },
  { name: 'ALBERT EINSTEIN', age: '1879–1955', nationality: 'Niemcy', knownFor: 'Fizyk' },
  { name: 'LEONARDO DA VINCI', age: '1452–1519', nationality: 'Włochy', knownFor: 'Malarz i wynalazca' },
  { name: 'WILLIAM SHAKESPEARE', age: '1564–1616', nationality: 'Anglia', knownFor: 'Pisarz' },
  { name: 'STEVE JOBS', age: '1955–2011', nationality: 'USA', knownFor: 'Założyciel Apple' },
  { name: 'BILL GATES', age: '69 lat', nationality: 'USA', knownFor: 'Założyciel Microsoft' },
  { name: 'ELON MUSK', age: '53 lata', nationality: 'USA', knownFor: 'Przedsiębiorca' },
  { name: 'MARK ZUCKERBERG', age: '40 lat', nationality: 'USA', knownFor: 'Założyciel Facebooka' },
  { name: 'JEFF BEZOS', age: '60 lat', nationality: 'USA', knownFor: 'Założyciel Amazon' },
  { name: 'OPRAH WINFREY', age: '70 lat', nationality: 'USA', knownFor: 'Prezenterka' },
  { name: 'DAVID BECKHAM', age: '49 lat', nationality: 'Wielka Brytania', knownFor: 'Piłkarz' },
  { name: 'ZINEDINE ZIDANE', age: '52 lata', nationality: 'Francja', knownFor: 'Piłkarz' },
  { name: 'RONALDINHO', age: '44 lata', nationality: 'Brazylia', knownFor: 'Piłkarz' },
  { name: 'NEYMAR', age: '33 lata', nationality: 'Brazylia', knownFor: 'Piłkarz' },
  { name: 'MOHAMED SALAH', age: '32 lata', nationality: 'Egipt', knownFor: 'Piłkarz' },
  { name: 'HARRY KANE', age: '31 lat', nationality: 'Anglia', knownFor: 'Piłkarz' },
  { name: 'VIRGIL VAN DIJK', age: '33 lata', nationality: 'Holandia', knownFor: 'Piłkarz' },
  { name: 'PAWEŁ PAWLIKOWSKI', age: '67 lat', nationality: 'Polska', knownFor: 'Reżyser' },
  { name: 'AGNIESZKA HOLLAND', age: '75 lat', nationality: 'Polska', knownFor: 'Reżyserka' },
  { name: 'MAŁGORZATA KOŻUCHOWSKA', age: '52 lata', nationality: 'Polska', knownFor: 'Aktorka' },
  { name: 'TOMASZ KAROLAK', age: '49 lat', nationality: 'Polska', knownFor: 'Aktor' },
  { name: 'CILLIAN MURPHY', age: '48 lat', nationality: 'Irlandia', knownFor: 'Aktor' },
  { name: 'TIMOTHÉE CHALAMET', age: '29 lat', nationality: 'USA', knownFor: 'Aktor' },
  { name: 'ZENDAYA', age: '28 lat', nationality: 'USA', knownFor: 'Aktorka' },
  { name: 'KEANU REEVES', age: '60 lat', nationality: 'Kanada', knownFor: 'Aktor' },
  { name: 'JENNIFER LAWRENCE', age: '34 lata', nationality: 'USA', knownFor: 'Aktorka' },
  { name: 'CHRIS HEMSWORTH', age: '41 lat', nationality: 'Australia', knownFor: 'Aktor' },
  { name: 'SERENA WILLIAMS', age: '43 lata', nationality: 'USA', knownFor: 'Tenisistka' },
  { name: 'LEWIS HAMILTON', age: '39 lat', nationality: 'Wielka Brytania', knownFor: 'Kierowca F1' },
  { name: 'MAX VERSTAPPEN', age: '27 lat', nationality: 'Holandia', knownFor: 'Kierowca F1' },
  { name: 'MICHAEL SCHUMACHER', age: '55 lat', nationality: 'Niemcy', knownFor: 'Kierowca F1' },
  { name: 'USAIN BOLT', age: '38 lat', nationality: 'Jamajka', knownFor: 'Sprinter' },
  { name: 'CONOR MCGREGOR', age: '36 lat', nationality: 'Irlandia', knownFor: 'Zawodnik MMA' },
  { name: 'GORDON RAMSAY', age: '58 lat', nationality: 'Wielka Brytania', knownFor: 'Szef kuchni' },
  { name: 'JAMIE OLIVER', age: '49 lat', nationality: 'Wielka Brytania', knownFor: 'Szef kuchni' },
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

function normalizeAnswer(text) {
  return normalizePolish(text).replace(/\s+/g, ' ');
}

function getNameParts(name) {
  return name
    .split(/[\s-]+/)
    .map((part) => normalize(part))
    .filter((part) => part.length >= 3);
}

function answersMatch(given, expected) {
  const g = normalizeAnswer(given);
  const e = normalizeAnswer(expected);
  if (g === e) return true;
  if (normalize(g) === normalize(e)) return true;
  if (g.replace(/\s/g, '') === e.replace(/\s/g, '')) return true;
  return false;
}

function hintContainsName(hint, name) {
  const hintNorm = normalize(hint);
  const fullNorm = normalize(name);
  if (hintNorm.includes(fullNorm)) return true;

  for (const part of getNameParts(name)) {
    if (hintNorm.includes(part)) return true;
  }

  return false;
}

function pickNextPerson(state) {
  if (state.personPool.length === 0) {
    state.personPool = shuffle(PEOPLE);
  }
  state.currentPerson = state.personPool.pop();
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
  const personPool = shuffle(PEOPLE);
  const guesserId = playerIds[0];
  const hinterId = playerIds[1];

  const state = {
    personPool,
    currentPerson: null,
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

  pickNextPerson(state);
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
  pickNextPerson(state);
}

function trySendHint(state, playerId, text) {
  if (state.winner) return { success: false, reason: 'Gra zakończona' };
  if (playerId !== state.hinterId) return { success: false, reason: 'Tylko podpowiadający może wysłać podpowiedź' };

  const hint = (text || '').trim().slice(0, 120);
  if (!hint) return { success: false, reason: 'Wpisz podpowiedź' };

  if (hintContainsName(hint, state.currentPerson.name)) {
    return { success: false, reason: 'Nie możesz użyć imienia ani nazwiska!' };
  }

  state.hints.push({ text: hint, time: Date.now() });
  return { success: true };
}

function tryGuess(state, playerId, guess, playerIds) {
  if (state.winner) return { success: false, reason: 'Gra zakończona' };
  if (playerId !== state.guesserId) return { success: false, reason: 'Tylko zgadujący może odpowiadać' };

  const answer = (guess || '').trim();
  if (!answer) return { success: false, reason: 'Wpisz odpowiedź' };

  if (!answersMatch(answer, state.currentPerson.name)) {
    return { success: false, reason: 'Nie ta osoba — spróbuj jeszcze raz!' };
  }

  finishRound(state, playerIds, {
    type: 'correct',
    name: state.currentPerson.name,
    guess: normalizeAnswer(answer),
    guesserId: playerId,
  });

  return { success: true, correct: true, name: state.currentPerson.name };
}

function trySkip(state, playerId, playerIds) {
  if (state.winner) return { success: false, reason: 'Gra zakończona' };
  if (playerId !== state.guesserId && playerId !== state.hinterId) {
    return { success: false, reason: 'Nie jesteś w tej rundzie' };
  }

  const name = state.currentPerson.name;
  finishRound(state, playerIds, {
    type: 'skipped',
    name,
    guesserId: state.guesserId,
    skippedBy: playerId,
  });

  return { success: true, skipped: true, name };
}

function getPersonMeta(person) {
  if (!person) {
    return { nameLength: 0, wordCount: 0 };
  }

  const words = person.name.split(/\s+/);
  const nameLength = person.name.replace(/\s/g, '').length;

  return {
    nameLength,
    wordCount: words.length,
  };
}

function getPublicCzolkoState(state, playerId) {
  const isGuesser = playerId === state.guesserId;
  const isHinter = playerId === state.hinterId;
  const meta = getPersonMeta(state.currentPerson);

  return {
    round: state.round,
    guesserId: state.guesserId,
    hinterId: state.hinterId,
    role: isGuesser ? 'guesser' : isHinter ? 'hinter' : 'spectator',
    person: isHinter ? {
      name: state.currentPerson.name,
      age: state.currentPerson.age,
      nationality: state.currentPerson.nationality,
      knownFor: state.currentPerson.knownFor,
    } : null,
    nameLength: meta.nameLength,
    wordCount: meta.wordCount,
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
  PEOPLE,
};
