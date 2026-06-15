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
  // Piłka nożna i sport
  { name: 'PELE', age: '1940–2022', nationality: 'Brazylia', knownFor: 'Piłkarz' },
  { name: 'DIEGO MARADONA', age: '1960–2020', nationality: 'Argentyna', knownFor: 'Piłkarz' },
  { name: 'LUKA MODRIĆ', age: '39 lat', nationality: 'Chorwacja', knownFor: 'Piłkarz' },
  { name: 'ANDRÉS INIESTA', age: '40 lat', nationality: 'Hiszpania', knownFor: 'Piłkarz' },
  { name: 'XAVI HERNÁNDEZ', age: '44 lata', nationality: 'Hiszpania', knownFor: 'Piłkarz' },
  { name: 'GARETH BALE', age: '35 lat', nationality: 'Walia', knownFor: 'Piłkarz' },
  { name: 'VINÍCIUS JÚNIOR', age: '24 lata', nationality: 'Brazylia', knownFor: 'Piłkarz' },
  { name: 'JUDE BELLINGHAM', age: '21 lat', nationality: 'Anglia', knownFor: 'Piłkarz' },
  { name: 'WOJCIECH SZCZĘSNY', age: '34 lata', nationality: 'Polska', knownFor: 'Piłkarz' },
  { name: 'PIOTR ZIELIŃSKI', age: '30 lat', nationality: 'Polska', knownFor: 'Piłkarz' },
  { name: 'ZBIGNIEW BONIEK', age: '68 lat', nationality: 'Polska', knownFor: 'Piłkarz' },
  { name: 'ROGER FEDERER', age: '43 lata', nationality: 'Szwajcaria', knownFor: 'Tenisista' },
  { name: 'HUBERT HURKACZ', age: '27 lat', nationality: 'Polska', knownFor: 'Tenisista' },
  { name: 'AGNIESZKA RADWAŃSKA', age: '35 lat', nationality: 'Polska', knownFor: 'Tenisistka' },
  { name: 'ADAM MAŁYSZ', age: '47 lat', nationality: 'Polska', knownFor: 'Skoczek narciarski' },
  { name: 'KAMIL STOCH', age: '37 lat', nationality: 'Polska', knownFor: 'Skoczek narciarski' },
  { name: 'MICHAEL JORDAN', age: '62 lata', nationality: 'USA', knownFor: 'Koszykarz' },
  { name: 'KOBE BRYANT', age: '1978–2020', nationality: 'USA', knownFor: 'Koszykarz' },
  { name: 'MUHAMMAD ALI', age: '1942–2016', nationality: 'USA', knownFor: 'Bokser' },
  { name: 'MIKE TYSON', age: '58 lat', nationality: 'USA', knownFor: 'Bokser' },
  { name: 'TIGER WOODS', age: '49 lat', nationality: 'USA', knownFor: 'Golfista' },
  { name: 'SIMONE BILES', age: '27 lat', nationality: 'USA', knownFor: 'Gimnastyczka' },
  { name: 'FERNANDO ALONSO', age: '43 lata', nationality: 'Hiszpania', knownFor: 'Kierowca F1' },
  // Muzyka
  { name: 'LADY GAGA', age: '38 lat', nationality: 'USA', knownFor: 'Piosenkarka' },
  { name: 'RIHANNA', age: '36 lat', nationality: 'Barbados', knownFor: 'Piosenkarka' },
  { name: 'ADELE', age: '36 lat', nationality: 'Wielka Brytania', knownFor: 'Piosenkarka' },
  { name: 'EMINEM', age: '52 lata', nationality: 'USA', knownFor: 'Raper' },
  { name: 'SHAKIRA', age: '47 lat', nationality: 'Kolumbia', knownFor: 'Piosenkarka' },
  { name: 'MADONNA', age: '66 lat', nationality: 'USA', knownFor: 'Piosenkarka' },
  { name: 'ELVIS PRESLEY', age: '1935–1977', nationality: 'USA', knownFor: 'Piosenkarz' },
  { name: 'JOHN LENNON', age: '1940–1980', nationality: 'Wielka Brytania', knownFor: 'Muzyk The Beatles' },
  { name: 'BOB MARLEY', age: '1945–1981', nationality: 'Jamajka', knownFor: 'Muzyk reggae' },
  { name: 'DAWID PODSIADŁO', age: '29 lat', nationality: 'Polska', knownFor: 'Piosenkarz' },
  { name: 'SANAH', age: '29 lat', nationality: 'Polska', knownFor: 'Piosenkarka' },
  { name: 'MARGARET', age: '28 lat', nationality: 'Polska', knownFor: 'Piosenkarka' },
  { name: 'TACO HEMINGWAY', age: '32 lata', nationality: 'Polska', knownFor: 'Raper' },
  { name: 'MATA', age: '25 lat', nationality: 'Polska', knownFor: 'Raper' },
  { name: 'KANYE WEST', age: '47 lat', nationality: 'USA', knownFor: 'Raper i producent' },
  { name: 'BRUNO MARS', age: '39 lat', nationality: 'USA', knownFor: 'Piosenkarz' },
  { name: 'ED SHEERAN', age: '33 lata', nationality: 'Wielka Brytania', knownFor: 'Piosenkarz' },
  { name: 'HARRY STYLES', age: '30 lat', nationality: 'Wielka Brytania', knownFor: 'Piosenkarz' },
  // Aktorzy i reżyserzy
  { name: 'JOHNNY DEPP', age: '61 lat', nationality: 'USA', knownFor: 'Aktor' },
  { name: 'WILL SMITH', age: '56 lat', nationality: 'USA', knownFor: 'Aktor' },
  { name: 'TOM CRUISE', age: '62 lata', nationality: 'USA', knownFor: 'Aktor' },
  { name: 'HARRISON FORD', age: '82 lata', nationality: 'USA', knownFor: 'Aktor' },
  { name: 'ARNOLD SCHWARZENEGGER', age: '77 lat', nationality: 'Austria', knownFor: 'Aktor' },
  { name: 'ROBERT DE NIRO', age: '81 lat', nationality: 'USA', knownFor: 'Aktor' },
  { name: 'MORGAN FREEMAN', age: '87 lat', nationality: 'USA', knownFor: 'Aktor' },
  { name: 'NATALIE PORTMAN', age: '43 lata', nationality: 'USA', knownFor: 'Aktorka' },
  { name: 'JULIA ROBERTS', age: '57 lat', nationality: 'USA', knownFor: 'Aktorka' },
  { name: 'NICOLE KIDMAN', age: '57 lat', nationality: 'Australia', knownFor: 'Aktorka' },
  { name: 'PEDRO PASCAL', age: '49 lat', nationality: 'Chile', knownFor: 'Aktor' },
  { name: 'ANYA TAYLOR-JOY', age: '28 lat', nationality: 'Argentyna', knownFor: 'Aktorka' },
  { name: 'BARTŁOMIEJ TOPA', age: '47 lat', nationality: 'Polska', knownFor: 'Aktor' },
  { name: 'MAGDALENA BOCZARSKA', age: '44 lata', nationality: 'Polska', knownFor: 'Aktorka' },
  { name: 'ZBIGNIEW ZAMACHOWSKI', age: '59 lat', nationality: 'Polska', knownFor: 'Aktor' },
  { name: 'ROMAN POLAŃSKI', age: '91 lat', nationality: 'Polska', knownFor: 'Reżyser' },
  { name: 'ANDRZEJ WAJDA', age: '1926–2016', nationality: 'Polska', knownFor: 'Reżyser' },
  { name: 'QUENTIN TARANTINO', age: '61 lat', nationality: 'USA', knownFor: 'Reżyser' },
  { name: 'STEVEN SPIELBERG', age: '78 lat', nationality: 'USA', knownFor: 'Reżyser' },
  { name: 'CHRISTOPHER NOLAN', age: '54 lata', nationality: 'Wielka Brytania', knownFor: 'Reżyser' },
  // Historia, nauka, polityka
  { name: 'JAN PAWEŁ II', age: '1920–2005', nationality: 'Polska', knownFor: 'Papież' },
  { name: 'LECH WAŁĘSA', age: '81 lat', nationality: 'Polska', knownFor: 'Działacz i prezydent' },
  { name: 'WISŁAWA SZYMBORSKA', age: '1923–2012', nationality: 'Polska', knownFor: 'Poetka' },
  { name: 'CZESŁAW MIŁOSZ', age: '1911–2004', nationality: 'Polska', knownFor: 'Poeta' },
  { name: 'JÓZEF PIŁSUDSKI', age: '1867–1935', nationality: 'Polska', knownFor: 'Marszałek' },
  { name: 'NELSON MANDELA', age: '1918–2013', nationality: 'RPA', knownFor: 'Działacz' },
  { name: 'MAHATMA GANDHI', age: '1869–1948', nationality: 'Indie', knownFor: 'Działacz' },
  { name: 'MARTIN LUTHER KING', age: '1929–1968', nationality: 'USA', knownFor: 'Działacz' },
  { name: 'BARACK OBAMA', age: '63 lata', nationality: 'USA', knownFor: 'Były prezydent' },
  { name: 'WINSTON CHURCHILL', age: '1874–1965', nationality: 'Wielka Brytania', knownFor: 'Premier' },
  { name: 'NAPOLEON BONAPARTE', age: '1769–1821', nationality: 'Francja', knownFor: 'Cesarz' },
  { name: 'KLEOPATRA', age: '69 p.n.e.–30 p.n.e.', nationality: 'Egipt', knownFor: 'Królowa' },
  { name: 'ISAAC NEWTON', age: '1643–1727', nationality: 'Anglia', knownFor: 'Fizyk' },
  { name: 'CHARLES DARWIN', age: '1809–1882', nationality: 'Wielka Brytania', knownFor: 'Biolog' },
  { name: 'STEPHEN HAWKING', age: '1942–2018', nationality: 'Wielka Brytania', knownFor: 'Fizyk' },
  { name: 'NIKOLA TESLA', age: '1856–1943', nationality: 'Serbia', knownFor: 'Wynalazca' },
  // Postacie fikcyjne i popkultura
  { name: 'BATMAN', age: 'fikcja', nationality: 'Gotham', knownFor: 'Superbohater' },
  { name: 'SUPERMAN', age: 'fikcja', nationality: 'Krypton', knownFor: 'Superbohater' },
  { name: 'SPIDER-MAN', age: 'fikcja', nationality: 'USA', knownFor: 'Superbohater' },
  { name: 'HARRY POTTER', age: 'fikcja', nationality: 'Wielka Brytania', knownFor: 'Czarodziej' },
  { name: 'DARTH VADER', age: 'fikcja', nationality: 'Galaktyka', knownFor: 'Złoczyńca Star Wars' },
  { name: 'LUKE SKYWALKER', age: 'fikcja', nationality: 'Galaktyka', knownFor: 'Bohater Star Wars' },
  { name: 'MARIO', age: 'fikcja', nationality: 'Królestwo Grzybów', knownFor: 'Bohater gier' },
  { name: 'SONIC', age: 'fikcja', nationality: 'Japońskie gry', knownFor: 'Jeż z gier Sega' },
  { name: 'PIKACHU', age: 'fikcja', nationality: 'Japonia', knownFor: 'Pokemon' },
  { name: 'MICKEY MOUSE', age: 'fikcja', nationality: 'USA', knownFor: 'Postać Disneya' },
  { name: 'SHREK', age: 'fikcja', nationality: 'Bagno', knownFor: 'Bohater filmu animowanego' },
  { name: 'ELSA', age: 'fikcja', nationality: 'Arendelle', knownFor: 'Królowa z Krainy Lodu' },
  // Inne znane osoby
  { name: 'DAVID ATTENBOROUGH', age: '98 lat', nationality: 'Wielka Brytania', knownFor: 'Przyrodnik' },
  { name: 'NEIL ARMSTRONG', age: '1930–2012', nationality: 'USA', knownFor: 'Astronauta' },
  { name: 'MARILYN MONROE', age: '1926–1962', nationality: 'USA', knownFor: 'Aktorka' },
  { name: 'AUDREY HEPBURN', age: '1929–1993', nationality: 'Wielka Brytania', knownFor: 'Aktorka' },
  { name: 'DAVID BOWIE', age: '1947–2016', nationality: 'Wielka Brytania', knownFor: 'Muzyk' },
  { name: 'PRINCE', age: '1958–2016', nationality: 'USA', knownFor: 'Muzyk' },
  { name: 'WHITNEY HOUSTON', age: '1963–2012', nationality: 'USA', knownFor: 'Piosenkarka' },
  { name: 'BOB ROSS', age: '1942–1995', nationality: 'USA', knownFor: 'Malarz z TV' },
  { name: 'MR BEAST', age: '26 lat', nationality: 'USA', knownFor: 'Youtuber' },
  { name: 'PEWDIEPIE', age: '35 lat', nationality: 'Szwecja', knownFor: 'Youtuber' },
  { name: 'ELIZABETH II', age: '1926–2022', nationality: 'Wielka Brytania', knownFor: 'Królowa' },
  { name: 'DIANA SPENCER', age: '1961–1997', nationality: 'Wielka Brytania', knownFor: 'Księżna' },
];

const VALID_ANSWERS = ['yes', 'no', 'bad'];

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

function textContainsName(text, name) {
  const textNorm = normalize(text);
  const fullNorm = normalize(name);
  if (textNorm.includes(fullNorm)) return true;

  for (const part of getNameParts(name)) {
    if (textNorm.includes(part)) return true;
  }

  return false;
}

function getUsedPersonNames(state, exceptPlayerId = null) {
  const names = new Set();
  for (const [id, person] of Object.entries(state.playerPersons || {})) {
    if (id !== exceptPlayerId && person?.name) {
      names.add(person.name);
    }
  }
  return names;
}

function refillPersonPool(state) {
  if (!state.personPool || state.personPool.length === 0) {
    state.personPool = shuffle(PEOPLE);
  }
}

function pickPersonForPlayer(state, playerId) {
  refillPersonPool(state);
  if (!state.playerPersons) state.playerPersons = {};
  if (!state.qaLogByPlayer) state.qaLogByPlayer = {};

  const usedNames = getUsedPersonNames(state, playerId);
  let person = null;
  let attempts = 0;

  while (attempts < PEOPLE.length) {
    refillPersonPool(state);
    person = state.personPool.pop();
    if (!usedNames.has(person.name)) break;
    attempts += 1;
  }

  state.playerPersons[playerId] = person;
  state.qaLogByPlayer[playerId] = [];
}

function assignAllPlayerPersons(state, playerIds) {
  if (!state.playerPersons) state.playerPersons = {};
  if (!state.qaLogByPlayer) state.qaLogByPlayer = {};

  for (const id of playerIds) {
    if (!state.playerPersons[id]) {
      pickPersonForPlayer(state, id);
    } else if (!state.qaLogByPlayer[id]) {
      state.qaLogByPlayer[id] = [];
    }
  }
}

function getPlayerPerson(state, playerId) {
  return state.playerPersons?.[playerId] || null;
}

function getGuesserPerson(state) {
  return getPlayerPerson(state, state.guesserId);
}

function rotateGuesser(state, playerIds) {
  const guesserIdx = playerIds.indexOf(state.guesserId);
  state.guesserId = playerIds[(guesserIdx + 1) % playerIds.length];
  state.round += 1;
  state.pendingQuestion = null;
  state.phase = 'asking';
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
  const state = {
    personPool: shuffle(PEOPLE),
    playerPersons: {},
    qaLogByPlayer: {},
    round: 1,
    guesserId: playerIds[0],
    phase: 'asking',
    pendingQuestion: null,
    scores: {},
    lastResult: null,
    winner: null,
    winScore: WIN_SCORE,
    startTime: Date.now(),
    playerIds,
  };

  for (const id of playerIds) {
    state.scores[id] = 0;
  }

  assignAllPlayerPersons(state, playerIds);
  return state;
}

function tryAskQuestion(state, playerId, text) {
  if (state.winner) return { success: false, reason: 'Gra zakończona' };
  if (playerId !== state.guesserId) return { success: false, reason: 'Tylko zgadujący może zadawać pytania' };
  if (state.phase !== 'asking') return { success: false, reason: 'Czekaj na odpowiedź' };

  const person = getGuesserPerson(state);
  if (!person) return { success: false, reason: 'Brak postaci' };

  const question = (text || '').trim().slice(0, 160);
  if (!question) return { success: false, reason: 'Wpisz pytanie' };

  if (textContainsName(question, person.name)) {
    return { success: false, reason: 'Nie możesz użyć imienia ani nazwiska w pytaniu!' };
  }

  state.pendingQuestion = {
    text: question,
    time: Date.now(),
    guesserId: playerId,
  };
  state.phase = 'answering';

  return { success: true };
}

function tryAnswerQuestion(state, playerId, answer, playerIds) {
  if (state.winner) return { success: false, reason: 'Gra zakończona' };
  if (playerId === state.guesserId) return { success: false, reason: 'Zgadujący nie odpowiada na pytania' };
  if (state.phase !== 'answering' || !state.pendingQuestion) {
    return { success: false, reason: 'Brak pytania do odpowiedzi' };
  }
  if (!VALID_ANSWERS.includes(answer)) {
    return { success: false, reason: 'Nieprawidłowa odpowiedź' };
  }

  const guesserId = state.pendingQuestion.guesserId;
  const questionText = state.pendingQuestion.text;

  if (!state.qaLogByPlayer[guesserId]) {
    state.qaLogByPlayer[guesserId] = [];
  }

  state.qaLogByPlayer[guesserId].push({
    question: questionText,
    answer,
    answeredBy: playerId,
    time: Date.now(),
  });

  state.lastResult = {
    type: 'answered',
    answer,
    question: questionText,
    guesserId,
    answeredBy: playerId,
  };

  rotateGuesser(state, playerIds);
  return { success: true, answer };
}

function tryGuess(state, playerId, guess, playerIds) {
  if (state.winner) return { success: false, reason: 'Gra zakończona' };
  if (playerId !== state.guesserId) return { success: false, reason: 'Tylko zgadujący może odpowiadać' };
  if (state.phase !== 'asking') return { success: false, reason: 'Najpierw poczekaj na odpowiedź' };

  const person = getPlayerPerson(state, playerId);
  if (!person) return { success: false, reason: 'Brak postaci' };

  const answer = (guess || '').trim();
  if (!answer) return { success: false, reason: 'Wpisz odpowiedź' };

  if (!answersMatch(answer, person.name)) {
    return { success: false, reason: 'Nie ta osoba — spróbuj jeszcze raz!' };
  }

  state.scores[playerId] = (state.scores[playerId] || 0) + 1;

  const personName = person.name;
  state.lastResult = {
    type: 'correct',
    name: personName,
    guess: normalizeAnswer(answer),
    guesserId: playerId,
  };

  checkWinner(state);
  if (state.winner) return { success: true, correct: true, name: personName };

  pickPersonForPlayer(state, playerId);
  rotateGuesser(state, playerIds);

  return { success: true, correct: true, name: personName };
}

function trySkip(state, playerId, playerIds) {
  if (state.winner) return { success: false, reason: 'Gra zakończona' };
  if (playerId !== state.guesserId) return { success: false, reason: 'Tylko zgadujący może pominąć' };
  if (state.phase !== 'asking') return { success: false, reason: 'Najpierw poczekaj na odpowiedź' };

  const person = getPlayerPerson(state, playerId);
  const name = person?.name || '?';

  state.lastResult = {
    type: 'skipped',
    name,
    guesserId: playerId,
    skippedBy: playerId,
  };

  pickPersonForPlayer(state, playerId);
  rotateGuesser(state, playerIds);

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

const ANSWER_LABELS = {
  yes: 'Tak',
  no: 'Nie',
  bad: 'Źle pytanie',
};

function normalizeCzolkoState(state, playerIds = []) {
  if (!state.playerIds || !state.playerIds.length) {
    state.playerIds = playerIds.length ? playerIds : Object.keys(state.scores || {});
  }
  if (!state.scores) {
    state.scores = {};
  }
  if (!state.personPool || !state.personPool.length) {
    state.personPool = shuffle(PEOPLE);
  }
  if (!state.phase) {
    state.phase = state.pendingQuestion ? 'answering' : 'asking';
  }

  // Migracja ze starego formatu (jedna wspólna postać)
  if (!state.playerPersons && state.currentPerson) {
    state.playerPersons = {};
    for (const id of state.playerIds) {
      state.playerPersons[id] = state.currentPerson;
    }
    delete state.currentPerson;
  }

  if (!state.qaLogByPlayer) {
    state.qaLogByPlayer = {};
    if (Array.isArray(state.qaLog) && state.qaLog.length) {
      const legacyGuesser = state.guesserId || state.playerIds[0];
      state.qaLogByPlayer[legacyGuesser] = state.qaLog;
    }
    delete state.qaLog;
  }

  assignAllPlayerPersons(state, state.playerIds);
  return state;
}

function getPublicCzolkoState(state, playerId, playerNames = {}, playerIds = []) {
  normalizeCzolkoState(state, playerIds);

  const isGuesser = playerId === state.guesserId;
  const guesserPerson = getGuesserPerson(state);
  const myPerson = getPlayerPerson(state, playerId);
  const displayPerson = isGuesser ? myPerson : guesserPerson;
  const meta = getPersonMeta(displayPerson);
  const activeQaLog = state.qaLogByPlayer?.[playerId] || [];

  return {
    round: state.round || 1,
    guesserId: state.guesserId,
    playerIds: state.playerIds,
    role: isGuesser ? 'guesser' : 'hinter',
    phase: state.phase || 'asking',
    person: !isGuesser && guesserPerson ? {
      name: guesserPerson.name,
      age: guesserPerson.age,
      nationality: guesserPerson.nationality,
      knownFor: guesserPerson.knownFor,
    } : null,
    pendingQuestion: state.pendingQuestion
      ? {
          text: state.pendingQuestion.text,
          guesserName: playerNames[state.pendingQuestion.guesserId] || 'Gracz',
        }
      : null,
    nameLength: meta.nameLength,
    wordCount: meta.wordCount,
    qaLog: activeQaLog.map((entry) => ({
      question: entry.question,
      answer: entry.answer,
      answerLabel: ANSWER_LABELS[entry.answer] || entry.answer,
      answeredByName: playerNames[entry.answeredBy] || 'Gracz',
      time: entry.time,
    })),
    scores: state.scores || {},
    lastResult: state.lastResult
      ? {
          ...state.lastResult,
          answerLabel: state.lastResult.answer
            ? ANSWER_LABELS[state.lastResult.answer]
            : undefined,
        }
      : null,
    winner: state.winner,
    winScore: state.winScore || WIN_SCORE,
    startTime: state.startTime || Date.now(),
    playerNames,
    answerLabels: ANSWER_LABELS,
  };
}

module.exports = {
  createCzolkoState,
  tryAskQuestion,
  tryAnswerQuestion,
  tryGuess,
  trySkip,
  getPublicCzolkoState,
  WIN_SCORE,
  PEOPLE,
};
