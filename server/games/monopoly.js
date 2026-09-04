const {
  BOARD,
  GO_INDEX,
  JAIL_INDEX,
  GO_SALARY,
  JAIL_FEE,
  STARTING_CASH,
  MAX_HOUSES,
  getSpace,
  isBuyable,
  groupIndexes,
} = require('./monopolyBoard');
const { CHANCE_CARDS, CHEST_CARDS, getCard } = require('./monopolyCards');

const PIECES = ['pawn', 'car', 'hat', 'dog', 'shoe', 'boat'];
const BUILD_PHASES = ['rolling', 'awaitEnd'];

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pushLog(state, text) {
  state.log = [...(state.log || []), text].slice(-12);
}

function aliveIds(state) {
  return state.order.filter((id) => !state.players[id].bankrupt);
}

function checkWinner(state) {
  const alive = aliveIds(state);
  if (alive.length === 1) {
    state.winner = alive[0];
    state.phase = 'ended';
    pushLog(state, 'Został jeden gracz — koniec gry.');
    return true;
  }
  return false;
}

function getHouses(state, spaceIndex) {
  return state.houses?.[spaceIndex] || 0;
}

function setHouses(state, spaceIndex, level) {
  if (!state.houses) state.houses = {};
  if (level <= 0) delete state.houses[spaceIndex];
  else state.houses[spaceIndex] = level;
}

function isMortgaged(state, spaceIndex) {
  return !!(state.mortgaged && state.mortgaged[spaceIndex]);
}

function setMortgaged(state, spaceIndex, value) {
  if (!state.mortgaged) state.mortgaged = {};
  if (value) state.mortgaged[spaceIndex] = true;
  else delete state.mortgaged[spaceIndex];
}

function mortgageValue(space) {
  return Math.floor((space?.price || 0) / 2);
}

function unmortgageCost(space) {
  return Math.floor(mortgageValue(space) * 1.1);
}

function groupHasHouses(state, group) {
  return groupIndexes(group).some((i) => getHouses(state, i) > 0);
}

function groupHasMortgage(state, group) {
  return groupIndexes(group).some((i) => isMortgaged(state, i));
}

function ownsFullGroup(state, playerId, group) {
  const idxs = groupIndexes(group);
  if (idxs.length === 0) return false;
  return idxs.every((i) => state.owners[i] === playerId);
}

function groupHouseLevels(state, group) {
  return groupIndexes(group).map((i) => getHouses(state, i));
}

function canImproveEvenly(state, spaceIndex) {
  const space = getSpace(spaceIndex);
  if (!space || space.type !== 'investment') return false;
  const current = getHouses(state, spaceIndex);
  if (current >= MAX_HOUSES) return false;
  const levels = groupHouseLevels(state, space.group);
  const min = Math.min(...levels);
  return current === min;
}

function canDemoteEvenly(state, spaceIndex) {
  const space = getSpace(spaceIndex);
  if (!space || space.type !== 'investment') return false;
  const current = getHouses(state, spaceIndex);
  if (current <= 0) return false;
  const levels = groupHouseLevels(state, space.group);
  const max = Math.max(...levels);
  return current === max;
}

function buildCheck(state, playerId, spaceIndex) {
  const gate = assertTurn(state, playerId, BUILD_PHASES);
  if (!gate.ok) return gate;

  const space = getSpace(spaceIndex);
  if (!space || space.type !== 'investment') {
    return { ok: false, reason: 'Nie można budować na tym polu' };
  }
  if (state.owners[spaceIndex] !== playerId) {
    return { ok: false, reason: 'To nie Twoje pole' };
  }
  if (isMortgaged(state, spaceIndex) || groupHasMortgage(state, space.group)) {
    return { ok: false, reason: 'Najpierw wykup zastawione pola w kolorze' };
  }
  if (!ownsFullGroup(state, playerId, space.group)) {
    return { ok: false, reason: 'Potrzebujesz monopolu koloru' };
  }
  if (!canImproveEvenly(state, spaceIndex)) {
    return { ok: false, reason: 'Buduj równomiernie w kolorze' };
  }
  const cost = space.houseCost || 0;
  if ((state.players[playerId].cash || 0) < cost) {
    return { ok: false, reason: 'Za mało gotówki' };
  }
  return { ok: true, space, cost };
}

function sellCheck(state, playerId, spaceIndex) {
  const gate = assertTurn(state, playerId, BUILD_PHASES);
  if (!gate.ok) return gate;

  const space = getSpace(spaceIndex);
  if (!space || space.type !== 'investment') {
    return { ok: false, reason: 'Nie ma tu budynków' };
  }
  if (state.owners[spaceIndex] !== playerId) {
    return { ok: false, reason: 'To nie Twoje pole' };
  }
  if (!canDemoteEvenly(state, spaceIndex)) {
    return { ok: false, reason: 'Sprzedawaj równomiernie w kolorze' };
  }
  const refund = Math.floor((space.houseCost || 0) / 2);
  return { ok: true, space, refund };
}

function liquidateHouses(state, playerId) {
  let total = 0;
  for (const [idx, owner] of Object.entries(state.owners || {})) {
    if (owner !== playerId) continue;
    const i = Number(idx);
    const level = getHouses(state, i);
    if (level <= 0) continue;
    const space = getSpace(i);
    const refund = Math.floor((space?.houseCost || 0) / 2) * level;
    total += refund;
    setHouses(state, i, 0);
  }
  if (total > 0 && state.players[playerId]) {
    state.players[playerId].cash += total;
    pushLog(state, `Sprzedaż budynków do banku: +${total}`);
  }
  return total;
}

function clearHousesOnProperties(state, playerId) {
  for (const [idx, owner] of Object.entries(state.owners || {})) {
    if (owner === playerId) setHouses(state, Number(idx), 0);
  }
}

function releaseProperties(state, playerId) {
  clearHousesOnProperties(state, playerId);
  for (const [idx, owner] of Object.entries(state.owners)) {
    if (owner === playerId) {
      const i = Number(idx);
      setMortgaged(state, i, false);
      delete state.owners[i];
    }
  }
}

function bankruptPlayer(state, playerId, creditorId) {
  const p = state.players[playerId];
  if (p.bankrupt) return;
  p.bankrupt = true;
  p.inJail = false;

  liquidateHouses(state, playerId);

  if (creditorId && state.players[creditorId] && !state.players[creditorId].bankrupt) {
    state.players[creditorId].cash += p.cash;
    for (const [idx, owner] of Object.entries(state.owners)) {
      if (owner === playerId) {
        state.owners[Number(idx)] = creditorId;
      }
    }
    pushLog(state, 'Bankructwo — majątek przechodzi do wierzyciela.');
  } else {
    releaseProperties(state, playerId);
    pushLog(state, 'Bankructwo — pola wracają do banku.');
  }

  p.cash = 0;
  state.awaitingBuy = null;
  checkWinner(state);

  if (state.winner) return;
  if (state.currentPlayerId === playerId) {
    state.extraTurn = false;
    state.sixCount = 0;
    advanceTurn(state);
  }
}

function debit(state, playerId, amount, creditorId, reason) {
  if (amount <= 0) return true;
  const p = state.players[playerId];
  if (p.bankrupt) return false;

  if (p.cash >= amount) {
    p.cash -= amount;
    if (creditorId && state.players[creditorId] && !state.players[creditorId].bankrupt) {
      state.players[creditorId].cash += amount;
    }
    if (reason) pushLog(state, reason);
    return true;
  }

  pushLog(state, reason ? `${reason} — brak środków.` : 'Brak środków.');
  bankruptPlayer(state, playerId, creditorId);
  return false;
}

function credit(state, playerId, amount, reason) {
  if (amount <= 0) return;
  const p = state.players[playerId];
  if (p.bankrupt) return;
  p.cash += amount;
  if (reason) pushLog(state, reason);
}

function sendToJail(state, playerId) {
  const p = state.players[playerId];
  p.position = JAIL_INDEX;
  p.inJail = true;
  p.jailTurns = 0;
  state.extraTurn = false;
  state.sixCount = 0;
  state.awaitingBuy = null;
  state.pendingNotice = {
    id: `jail-${playerId}-${Date.now()}`,
    kind: 'jail',
    title: 'Kościuch',
    text: 'Idziesz do Kościucha!',
  };
  pushLog(state, 'Idziesz do Kościucha.');
}

function collectGoIfPassed(state, playerId, from, to, steps) {
  if (steps <= 0) return;
  if (from + steps >= 40 || to < from) {
    credit(state, playerId, GO_SALARY, `Przejście przez Start: +${GO_SALARY}`);
  }
}

function moveBySteps(state, playerId, steps) {
  const p = state.players[playerId];
  const from = p.position;
  const to = (from + steps + 40 * 4) % 40;
  if (steps > 0) collectGoIfPassed(state, playerId, from, to, steps);
  p.position = to;
}

function goToIndex(state, playerId, index, collectGo) {
  const p = state.players[playerId];
  const from = p.position;
  if (collectGo && index !== from) {
    const steps = (index - from + 40) % 40;
    if (steps > 0) collectGoIfPassed(state, playerId, from, index, steps);
  }
  p.position = index;
}

function countOwnedOfType(state, ownerId, type) {
  let n = 0;
  BOARD.forEach((space, i) => {
    if (space.type === type && state.owners[i] === ownerId) n += 1;
  });
  return n;
}

function rentDue(state, spaceIndex, diceTotal) {
  const space = getSpace(spaceIndex);
  const ownerId = state.owners[spaceIndex];
  if (!ownerId || !space) return 0;
  if (isMortgaged(state, spaceIndex)) return 0;

  if (space.type === 'investment') {
    const level = getHouses(state, spaceIndex);
    if (level > 0) {
      return space.rent[level] || space.rent[space.rent.length - 1] || 0;
    }
    const base = space.rent[0] || 0;
    if (
      ownsFullGroup(state, ownerId, space.group) &&
      !groupHasMortgage(state, space.group)
    ) {
      return base * 2;
    }
    return base;
  }
  if (space.type === 'rail') {
    const n = countOwnedOfType(state, ownerId, 'rail');
    return space.rent[Math.max(0, n - 1)] || 25;
  }
  if (space.type === 'utility') {
    const n = countOwnedOfType(state, ownerId, 'utility');
    const mult = n >= 2 ? 10 : 4;
    return (diceTotal || 0) * mult;
  }
  return 0;
}

function drawCard(state, kind) {
  const deckKey = kind === 'chance' ? 'chanceDeck' : 'chestDeck';
  const discardKey = kind === 'chance' ? 'chanceDiscard' : 'chestDiscard';
  if (state[deckKey].length === 0) {
    state[deckKey] = shuffle(state[discardKey]);
    state[discardKey] = [];
  }
  if (state[deckKey].length === 0) return null;
  const id = state[deckKey].pop();
  state[discardKey].push(id);
  return getCard(id);
}

function refillDeck(state, kind) {
  const deckKey = kind === 'chance' ? 'chanceDeck' : 'chestDeck';
  const discardKey = kind === 'chance' ? 'chanceDiscard' : 'chestDiscard';
  if (state[deckKey].length === 0) {
    state[deckKey] = shuffle(state[discardKey]);
    state[discardKey] = [];
  }
}

/** Ściąga do n kart z talii (bez discard) — do wyboru 1 z 3. */
function takeCardsFromDeck(state, kind, n) {
  const deckKey = kind === 'chance' ? 'chanceDeck' : 'chestDeck';
  const ids = [];
  for (let i = 0; i < n; i++) {
    refillDeck(state, kind);
    if (state[deckKey].length === 0) break;
    ids.push(state[deckKey].pop());
  }
  return ids;
}

function offerCardPick(state, playerId, kind) {
  const options = takeCardsFromDeck(state, kind, 3);
  if (options.length === 0) return;

  if (options.length === 1) {
    const discardKey = kind === 'chance' ? 'chanceDiscard' : 'chestDiscard';
    state[discardKey].push(options[0]);
    applyCard(state, playerId, getCard(options[0]));
    return;
  }

  state.pendingCardPick = {
    id: `pick-${kind}-${playerId}-${Date.now()}`,
    playerId,
    kind,
    options,
  };
  state.phase = 'awaitCardPick';
  pushLog(state, kind === 'chance' ? 'Los — wybierz 1 z 3 kart.' : 'Kasa — wybierz kartę.');
}

function applyCard(state, playerId, card, depth = 0) {
  if (!card) return;
  state.pendingCard = { id: card.id, text: card.text, kind: card.id.startsWith('ch') ? 'chance' : 'chest' };
  pushLog(state, card.text);

  const effect = card.effect || {};
  if (effect.type === 'money') {
    if (effect.amount >= 0) credit(state, playerId, effect.amount);
    else debit(state, playerId, -effect.amount, null);
    return;
  }
  if (effect.type === 'jail') {
    sendToJail(state, playerId);
    return;
  }
  if (effect.type === 'goto') {
    goToIndex(state, playerId, effect.index, effect.collectGo !== false);
    resolveLanding(state, playerId, { skipCardDraw: false, depth: depth + 1 });
    return;
  }
  if (effect.type === 'move') {
    moveBySteps(state, playerId, effect.steps);
    resolveLanding(state, playerId, { skipCardDraw: false, depth: depth + 1 });
  }
}

function resolveLanding(state, playerId, opts = {}) {
  if (state.winner || state.players[playerId].bankrupt) return;

  const depth = opts.depth || 0;
  if (depth > 6) return;

  const p = state.players[playerId];
  const space = getSpace(p.position);
  if (!space) return;

  if (space.type === 'gotojail') {
    sendToJail(state, playerId);
    return;
  }

  if (space.type === 'tax') {
    debit(state, playerId, space.tax || 0, null, `Kupon −${space.tax}`);
    return;
  }

  if (space.type === 'chance' && !opts.skipCardDraw) {
    offerCardPick(state, playerId, 'chance');
    return;
  }

  if (space.type === 'chest' && !opts.skipCardDraw) {
    const card = drawCard(state, 'chest');
    applyCard(state, playerId, card, depth);
    return;
  }

  if (isBuyable(space)) {
    const ownerId = state.owners[p.position];
    if (!ownerId) {
      state.awaitingBuy = p.position;
      return;
    }
    if (ownerId !== playerId && !state.players[ownerId].bankrupt) {
      const rent = rentDue(state, p.position, state.lastDice?.total || 0);
      const paid = debit(state, playerId, rent, ownerId, `Czynsz ${rent} za ${space.name}`);
      if (rent > 0) {
        state.pendingNotice = {
          id: `rent-${playerId}-${p.position}-${Date.now()}`,
          kind: 'rent',
          title: 'Czynsz',
          payerId: playerId,
          ownerId,
          amount: rent,
          spaceName: space.name,
          bankrupt: !paid,
        };
      }
    }
  }
}

function afterLanding(state, playerId) {
  if (state.winner) {
    state.phase = 'ended';
    return;
  }
  const p = state.players[playerId];
  if (!p || p.bankrupt) return;

  if (state.pendingCardPick) {
    state.phase = 'awaitCardPick';
    return;
  }
  if (state.awaitingBuy != null) {
    state.phase = 'awaitBuy';
    return;
  }
  if (state.extraTurn && !p.inJail) {
    state.phase = 'rolling';
    pushLog(state, 'Szóstka — rzucasz jeszcze raz.');
    return;
  }
  state.phase = 'awaitEnd';
}

function advanceTurn(state) {
  if (state.winner) {
    state.phase = 'ended';
    return;
  }
  const alive = aliveIds(state);
  if (alive.length === 0) {
    state.phase = 'ended';
    return;
  }

  const current = state.currentPlayerId;
  const start = state.order.indexOf(current);
  for (let i = 1; i <= state.order.length; i++) {
    const nextId = state.order[(start + i) % state.order.length];
    if (!state.players[nextId].bankrupt) {
      state.currentPlayerId = nextId;
      break;
    }
  }

  state.phase = 'rolling';
  state.extraTurn = false;
  state.sixCount = 0;
  state.awaitingBuy = null;
  state.pendingCard = null;
  state.pendingNotice = null;
  state.pendingTrade = null;
  state.pendingCardPick = null;
}

function createMonopolyState(playerIds) {
  const players = {};
  playerIds.forEach((id, i) => {
    players[id] = {
      cash: STARTING_CASH,
      position: GO_INDEX,
      inJail: false,
      jailTurns: 0,
      bankrupt: false,
      piece: PIECES[i % PIECES.length],
    };
  });

  return {
    phase: 'rolling',
    currentPlayerId: playerIds[0],
    sixCount: 0,
    extraTurn: false,
    players,
    order: [...playerIds],
    owners: {},
    houses: {},
    mortgaged: {},
    lastDice: null,
    pendingCard: null,
    pendingNotice: null,
    pendingTrade: null,
    pendingCardPick: null,
    awaitingBuy: null,
    log: ['Zaczynamy partię Monopoly.'],
    winner: null,
    chanceDeck: shuffle(CHANCE_CARDS.map((c) => c.id)),
    chestDeck: shuffle(CHEST_CARDS.map((c) => c.id)),
    chanceDiscard: [],
    chestDiscard: [],
  };
}

function monopolySetPiece(state, playerId, piece) {
  if (state.winner) return { ok: false, reason: 'Gra zakończona' };
  const p = state.players[playerId];
  if (!p || p.bankrupt) return { ok: false, reason: 'Nie możesz zmienić pionka' };
  if (!PIECES.includes(piece)) return { ok: false, reason: 'Nieznany pionek' };
  if (p.piece === piece) return { ok: true };

  const taken = Object.entries(state.players).some(
    ([id, other]) => id !== playerId && !other.bankrupt && other.piece === piece
  );
  if (taken) return { ok: false, reason: 'Ten pionek jest już zajęty' };

  p.piece = piece;
  return { ok: true };
}

function assertTurn(state, playerId, phases) {
  if (state.winner) return { ok: false, reason: 'Gra zakończona' };
  if (state.currentPlayerId !== playerId) return { ok: false, reason: 'Nie twoja tura' };
  const p = state.players[playerId];
  if (!p || p.bankrupt) return { ok: false, reason: 'Nie możesz teraz zagrać' };
  if (phases && !phases.includes(state.phase)) return { ok: false, reason: 'Ta akcja jest teraz niedostępna' };
  return { ok: true };
}

function monopolyRoll(state, playerId) {
  const gate = assertTurn(state, playerId, ['rolling']);
  if (!gate.ok) return gate;

  const p = state.players[playerId];
  const d1 = 1 + Math.floor(Math.random() * 6);
  const bonus = d1 === 6;
  const total = d1;
  state.lastDice = { d1, total, bonus };
  state.pendingCard = null;
  state.pendingNotice = null;
  state.pendingCardPick = null;
  pushLog(state, `Kostka: ${d1}${bonus ? ' (szóstka — dodatkowy rzut)' : ''}`);

  if (p.inJail) {
    if (bonus) {
      p.inJail = false;
      p.jailTurns = 0;
      state.extraTurn = false;
      state.sixCount = 0;
      moveBySteps(state, playerId, total);
      resolveLanding(state, playerId);
      afterLanding(state, playerId);
      return { ok: true };
    }

    p.jailTurns += 1;
    if (p.jailTurns >= 3) {
      const paid = debit(state, playerId, JAIL_FEE, null, `Kaucja ${JAIL_FEE} (3. tura w Kościuchu)`);
      if (!paid || state.players[playerId].bankrupt) return { ok: true };
      p.inJail = false;
      p.jailTurns = 0;
      moveBySteps(state, playerId, total);
      resolveLanding(state, playerId);
      afterLanding(state, playerId);
      return { ok: true };
    }

    pushLog(state, 'Brak szóstki — zostajesz w Kościuchu.');
    state.phase = 'awaitEnd';
    return { ok: true };
  }

  if (bonus) {
    state.sixCount += 1;
    if (state.sixCount >= 3) {
      sendToJail(state, playerId);
      state.phase = 'awaitEnd';
      return { ok: true };
    }
    state.extraTurn = true;
  } else {
    state.sixCount = 0;
    state.extraTurn = false;
  }

  moveBySteps(state, playerId, total);
  resolveLanding(state, playerId);
  afterLanding(state, playerId);
  return { ok: true };
}

function monopolyPayJail(state, playerId) {
  const gate = assertTurn(state, playerId, ['rolling']);
  if (!gate.ok) return gate;

  const p = state.players[playerId];
  if (!p.inJail) return { ok: false, reason: 'Nie jesteś w Kościuchu' };

  const paid = debit(state, playerId, JAIL_FEE, null, `Kaucja ${JAIL_FEE}`);
  if (!paid || p.bankrupt) return { ok: true };

  p.inJail = false;
  p.jailTurns = 0;
  pushLog(state, 'Wychodzisz z Kościucha — rzuć kostką.');
  state.phase = 'rolling';
  return { ok: true };
}

function monopolyBuy(state, playerId) {
  const gate = assertTurn(state, playerId, ['awaitBuy']);
  if (!gate.ok) return gate;

  const idx = state.awaitingBuy;
  if (idx == null) return { ok: false, reason: 'Nie ma nic do kupienia' };

  const space = getSpace(idx);
  if (!isBuyable(space) || state.owners[idx]) {
    state.awaitingBuy = null;
    afterLanding(state, playerId);
    return { ok: false, reason: 'To pole nie jest na sprzedaż' };
  }

  const p = state.players[playerId];
  if (p.cash < space.price) return { ok: false, reason: 'Za mało gotówki' };

  p.cash -= space.price;
  state.owners[idx] = playerId;
  state.awaitingBuy = null;
  pushLog(state, `Kupiono: ${space.name} za ${space.price}`);
  afterLanding(state, playerId);
  return { ok: true };
}

function monopolySkipBuy(state, playerId) {
  const gate = assertTurn(state, playerId, ['awaitBuy']);
  if (!gate.ok) return gate;

  const idx = state.awaitingBuy;
  const space = idx != null ? getSpace(idx) : null;
  state.awaitingBuy = null;
  if (space) pushLog(state, `Odpuściliście zakup: ${space.name}`);
  afterLanding(state, playerId);
  return { ok: true };
}

function monopolyEndTurn(state, playerId) {
  const gate = assertTurn(state, playerId, ['awaitEnd']);
  if (!gate.ok) return gate;

  advanceTurn(state);
  return { ok: true };
}

function monopolyBuild(state, playerId, spaceIndex) {
  const idx = Number(spaceIndex);
  if (!Number.isInteger(idx) || idx < 0 || idx >= BOARD.length) {
    return { ok: false, reason: 'Nieprawidłowe pole' };
  }

  const check = buildCheck(state, playerId, idx);
  if (!check.ok) return check;

  const p = state.players[playerId];
  p.cash -= check.cost;
  const next = getHouses(state, idx) + 1;
  setHouses(state, idx, next);
  const label = next >= MAX_HOUSES ? 'hotel' : `dom (${next})`;
  pushLog(state, `Budowa: ${check.space.name} → ${label} (−${check.cost})`);
  return { ok: true };
}

function monopolySellHouse(state, playerId, spaceIndex) {
  const idx = Number(spaceIndex);
  if (!Number.isInteger(idx) || idx < 0 || idx >= BOARD.length) {
    return { ok: false, reason: 'Nieprawidłowe pole' };
  }

  const check = sellCheck(state, playerId, idx);
  if (!check.ok) return check;

  const p = state.players[playerId];
  const next = getHouses(state, idx) - 1;
  setHouses(state, idx, next);
  p.cash += check.refund;
  pushLog(state, `Sprzedaż budynku: ${check.space.name} (+${check.refund})`);
  return { ok: true };
}

function mortgageCheck(state, playerId, spaceIndex) {
  const gate = assertTurn(state, playerId, BUILD_PHASES);
  if (!gate.ok) return gate;

  const space = getSpace(spaceIndex);
  if (!isBuyable(space)) {
    return { ok: false, reason: 'Tego pola nie można zastawić' };
  }
  if (state.owners[spaceIndex] !== playerId) {
    return { ok: false, reason: 'To nie Twoje pole' };
  }
  if (isMortgaged(state, spaceIndex)) {
    return { ok: false, reason: 'Pole jest już zastawione' };
  }
  if (space.type === 'investment' && groupHasHouses(state, space.group)) {
    return { ok: false, reason: 'Najpierw sprzedaj domy w tym kolorze' };
  }
  const amount = mortgageValue(space);
  return { ok: true, space, amount };
}

function unmortgageCheck(state, playerId, spaceIndex) {
  const gate = assertTurn(state, playerId, BUILD_PHASES);
  if (!gate.ok) return gate;

  const space = getSpace(spaceIndex);
  if (!isBuyable(space)) {
    return { ok: false, reason: 'Nieprawidłowe pole' };
  }
  if (state.owners[spaceIndex] !== playerId) {
    return { ok: false, reason: 'To nie Twoje pole' };
  }
  if (!isMortgaged(state, spaceIndex)) {
    return { ok: false, reason: 'Pole nie jest zastawione' };
  }
  const cost = unmortgageCost(space);
  if ((state.players[playerId].cash || 0) < cost) {
    return { ok: false, reason: 'Za mało gotówki na wykup' };
  }
  return { ok: true, space, cost };
}

function monopolyMortgage(state, playerId, spaceIndex) {
  const idx = Number(spaceIndex);
  if (!Number.isInteger(idx) || idx < 0 || idx >= BOARD.length) {
    return { ok: false, reason: 'Nieprawidłowe pole' };
  }

  const check = mortgageCheck(state, playerId, idx);
  if (!check.ok) return check;

  setMortgaged(state, idx, true);
  state.players[playerId].cash += check.amount;
  pushLog(state, `Zastaw: ${check.space.name} (+${check.amount})`);
  return { ok: true };
}

function monopolyUnmortgage(state, playerId, spaceIndex) {
  const idx = Number(spaceIndex);
  if (!Number.isInteger(idx) || idx < 0 || idx >= BOARD.length) {
    return { ok: false, reason: 'Nieprawidłowe pole' };
  }

  const check = unmortgageCheck(state, playerId, idx);
  if (!check.ok) return check;

  state.players[playerId].cash -= check.cost;
  setMortgaged(state, idx, false);
  pushLog(state, `Wykup zastawu: ${check.space.name} (−${check.cost})`);
  return { ok: true };
}

function monopolyPickCard(state, playerId, slotIndex) {
  const pick = state.pendingCardPick;
  if (!pick) return { ok: false, reason: 'Brak kart do wyboru' };
  if (pick.playerId !== playerId) return { ok: false, reason: 'To nie Twój los' };
  if (state.phase !== 'awaitCardPick') return { ok: false, reason: 'Teraz nie wybierasz karty' };

  const slot = Number(slotIndex);
  if (!Number.isInteger(slot) || slot < 0 || slot >= pick.options.length) {
    return { ok: false, reason: 'Nieprawidłowa karta' };
  }

  const chosenId = pick.options[slot];
  const rest = pick.options.filter((_, i) => i !== slot);
  const kind = pick.kind;
  const deckKey = kind === 'chance' ? 'chanceDeck' : 'chestDeck';
  const discardKey = kind === 'chance' ? 'chanceDiscard' : 'chestDiscard';

  state[discardKey].push(chosenId);
  state[deckKey] = shuffle([...state[deckKey], ...rest]);
  state.pendingCardPick = null;

  const card = getCard(chosenId);
  if (!card) {
    pushLog(state, 'Błąd karty Los — tura idzie dalej.');
    afterLanding(state, playerId);
    return { ok: true };
  }

  applyCard(state, playerId, card);
  afterLanding(state, playerId);
  return { ok: true };
}

function normalizeSpaceList(list) {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const raw of list) {
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 0 || n >= BOARD.length) continue;
    if (!out.includes(n)) out.push(n);
  }
  return out;
}

function tradeSpaceOk(state, ownerId, spaceIndex) {
  const space = getSpace(spaceIndex);
  if (!isBuyable(space)) return { ok: false, reason: 'Nieprawidłowe pole w handlu' };
  if (state.owners[spaceIndex] !== ownerId) {
    return { ok: false, reason: 'Pole nie należy do oferującego / drugiej strony' };
  }
  if (space.type === 'investment' && groupHasHouses(state, space.group)) {
    return { ok: false, reason: 'Najpierw sprzedaj domy w kolorze pola' };
  }
  return { ok: true };
}

function monopolyTradePropose(state, fromId, payload = {}) {
  const gate = assertTurn(state, fromId, BUILD_PHASES);
  if (!gate.ok) return gate;
  if (state.pendingTrade) return { ok: false, reason: 'Trwa już inna oferta handlu' };

  const toId = payload.toId;
  if (!toId || toId === fromId || !state.players[toId] || state.players[toId].bankrupt) {
    return { ok: false, reason: 'Wybierz żywego gracza' };
  }

  const offerCash = Math.max(0, Math.floor(Number(payload.offerCash) || 0));
  const askCash = Math.max(0, Math.floor(Number(payload.askCash) || 0));
  const offerSpaces = normalizeSpaceList(payload.offerSpaces);
  const askSpaces = normalizeSpaceList(payload.askSpaces);

  if (offerCash === 0 && askCash === 0 && offerSpaces.length === 0 && askSpaces.length === 0) {
    return { ok: false, reason: 'Oferta jest pusta' };
  }
  if ((state.players[fromId].cash || 0) < offerCash) {
    return { ok: false, reason: 'Za mało gotówki w ofercie' };
  }
  if ((state.players[toId].cash || 0) < askCash) {
    return { ok: false, reason: 'Druga strona nie ma tyle gotówki' };
  }

  for (const idx of offerSpaces) {
    const check = tradeSpaceOk(state, fromId, idx);
    if (!check.ok) return check;
  }
  for (const idx of askSpaces) {
    const check = tradeSpaceOk(state, toId, idx);
    if (!check.ok) return check;
  }

  state.pendingTrade = {
    id: `trade-${fromId}-${toId}-${Date.now()}`,
    fromId,
    toId,
    offerCash,
    askCash,
    offerSpaces,
    askSpaces,
  };
  pushLog(state, 'Wysłano ofertę handlu.');
  return { ok: true };
}

function monopolyTradeAccept(state, playerId) {
  const trade = state.pendingTrade;
  if (!trade) return { ok: false, reason: 'Brak oferty' };
  if (trade.toId !== playerId) return { ok: false, reason: 'To nie Twoja oferta' };
  if (state.winner) return { ok: false, reason: 'Gra zakończona' };

  const from = state.players[trade.fromId];
  const to = state.players[trade.toId];
  if (!from || !to || from.bankrupt || to.bankrupt) {
    state.pendingTrade = null;
    return { ok: false, reason: 'Handel niemożliwy' };
  }
  if (from.cash < trade.offerCash || to.cash < trade.askCash) {
    return { ok: false, reason: 'Brak gotówki do wymiany' };
  }

  for (const idx of trade.offerSpaces) {
    if (state.owners[idx] !== trade.fromId) {
      return { ok: false, reason: 'Oferta jest nieaktualna' };
    }
    const check = tradeSpaceOk(state, trade.fromId, idx);
    if (!check.ok) return check;
  }
  for (const idx of trade.askSpaces) {
    if (state.owners[idx] !== trade.toId) {
      return { ok: false, reason: 'Oferta jest nieaktualna' };
    }
    const check = tradeSpaceOk(state, trade.toId, idx);
    if (!check.ok) return check;
  }

  from.cash -= trade.offerCash;
  to.cash += trade.offerCash;
  to.cash -= trade.askCash;
  from.cash += trade.askCash;

  for (const idx of trade.offerSpaces) {
    state.owners[idx] = trade.toId;
  }
  for (const idx of trade.askSpaces) {
    state.owners[idx] = trade.fromId;
  }

  state.pendingTrade = null;
  pushLog(state, 'Handel zakończony.');
  return { ok: true };
}

function monopolyTradeReject(state, playerId) {
  const trade = state.pendingTrade;
  if (!trade) return { ok: false, reason: 'Brak oferty' };
  if (trade.toId !== playerId) return { ok: false, reason: 'To nie Twoja oferta' };
  state.pendingTrade = null;
  pushLog(state, 'Oferta handlu odrzucona.');
  return { ok: true };
}

function monopolyTradeCancel(state, playerId) {
  const trade = state.pendingTrade;
  if (!trade) return { ok: false, reason: 'Brak oferty' };
  if (trade.fromId !== playerId) return { ok: false, reason: 'Nie możesz anulować' };
  state.pendingTrade = null;
  pushLog(state, 'Oferta handlu anulowana.');
  return { ok: true };
}

function getPublicMonopolyState(state, viewerId, playerNames = {}) {
  const p = state.players[viewerId];
  const buySpace = state.awaitingBuy != null ? getSpace(state.awaitingBuy) : null;
  const isMyTurn = state.currentPlayerId === viewerId && !p?.bankrupt;
  const canManageBuildings = isMyTurn && BUILD_PHASES.includes(state.phase);

  const spaces = BOARD.map((space, index) => {
    const houses = space.type === 'investment' ? getHouses(state, index) : 0;
    const mortgaged = isMortgaged(state, index);
    const ownedByMe = state.owners[index] === viewerId;
    let canBuild = false;
    let canSellHouse = false;
    let canMortgage = false;
    let canUnmortgage = false;
    if (canManageBuildings && ownedByMe) {
      if (space.type === 'investment') {
        canBuild = buildCheck(state, viewerId, index).ok;
        canSellHouse = sellCheck(state, viewerId, index).ok;
      }
      if (isBuyable(space)) {
        canMortgage = mortgageCheck(state, viewerId, index).ok;
        canUnmortgage = unmortgageCheck(state, viewerId, index).ok;
      }
    }

    return {
      index,
      type: space.type,
      name: space.name,
      group: space.group || 'special',
      price: space.price || null,
      tax: space.tax || null,
      rent: space.rent ? [...space.rent] : null,
      houseCost: space.houseCost || null,
      ownerId: state.owners[index] || null,
      houses,
      mortgaged,
      canBuild,
      canSellHouse,
      canMortgage,
      canUnmortgage,
      sellRefund: space.houseCost != null ? Math.floor(space.houseCost / 2) : null,
      mortgageAmount: space.price != null ? mortgageValue(space) : null,
      unmortgageCost: space.price != null ? unmortgageCost(space) : null,
    };
  });

  const tokens = state.order.map((id) => ({
    id,
    name: playerNames[id] || 'Gracz',
    cash: state.players[id].cash,
    position: state.players[id].position,
    inJail: state.players[id].inJail,
    jailTurns: state.players[id].jailTurns,
    bankrupt: state.players[id].bankrupt,
    piece: state.players[id].piece || 'pawn',
  }));

  const myPropertyIndexes = Object.entries(state.owners)
    .filter(([, owner]) => owner === viewerId)
    .map(([idx]) => Number(idx))
    .sort((a, b) => a - b);

  let pendingNotice = null;
  if (state.pendingNotice) {
    const n = state.pendingNotice;
    if (n.kind === 'jail') {
      pendingNotice = {
        id: n.id,
        kind: 'jail',
        title: n.title || 'Kościuch',
        text: n.text || 'Idziesz do Kościucha!',
      };
    } else {
      const payerName = playerNames[n.payerId] || 'Gracz';
      const ownerName = playerNames[n.ownerId] || 'Gracz';
      const text = n.bankrupt
        ? `${payerName} nie stać na czynsz ${n.amount} za ${n.spaceName} (właściciel: ${ownerName}) — bankructwo!`
        : `${payerName} płaci ${n.amount} za ${n.spaceName} (właściciel: ${ownerName}).`;
      pendingNotice = {
        id: n.id,
        kind: n.kind || 'rent',
        title: n.title || 'Czynsz',
        text,
      };
    }
  }

  return {
    phase: state.phase,
    currentPlayerId: state.currentPlayerId,
    currentTurnName: playerNames[state.currentPlayerId] || 'Gracz',
    winner: state.winner,
    lastDice: state.lastDice,
    pendingCard: state.pendingCard,
    pendingCardPick: state.pendingCardPick
      ? {
          id: state.pendingCardPick.id,
          playerId: state.pendingCardPick.playerId,
          playerName: playerNames[state.pendingCardPick.playerId] || 'Gracz',
          kind: state.pendingCardPick.kind,
          count: state.pendingCardPick.options.length,
          isMine: state.pendingCardPick.playerId === viewerId,
        }
      : null,
    pendingNotice,
    log: state.log,
    spaces,
    tokens,
    myPropertyIndexes,
    myId: viewerId,
    myCash: p?.cash ?? 0,
    myPosition: p?.position ?? 0,
    myBankrupt: !!p?.bankrupt,
    inJail: !!p?.inJail,
    isMyTurn,
    canRoll: isMyTurn && state.phase === 'rolling',
    canPayJail: isMyTurn && state.phase === 'rolling' && !!p?.inJail && (p?.cash ?? 0) >= JAIL_FEE,
    canBuy: isMyTurn && state.phase === 'awaitBuy' && buySpace && (p?.cash ?? 0) >= (buySpace.price || 0),
    canSkipBuy: isMyTurn && state.phase === 'awaitBuy',
    canEndTurn: isMyTurn && state.phase === 'awaitEnd',
    canPickCard: !!state.pendingCardPick && state.pendingCardPick.playerId === viewerId && state.phase === 'awaitCardPick',
    buyOffer: buySpace
      ? { index: state.awaitingBuy, name: buySpace.name, price: buySpace.price }
      : null,
    jailFee: JAIL_FEE,
    goSalary: GO_SALARY,
    pendingTrade: state.pendingTrade
      ? {
          id: state.pendingTrade.id,
          fromId: state.pendingTrade.fromId,
          toId: state.pendingTrade.toId,
          fromName: playerNames[state.pendingTrade.fromId] || 'Gracz',
          toName: playerNames[state.pendingTrade.toId] || 'Gracz',
          offerCash: state.pendingTrade.offerCash,
          askCash: state.pendingTrade.askCash,
          offerSpaces: [...state.pendingTrade.offerSpaces],
          askSpaces: [...state.pendingTrade.askSpaces],
          offerSpaceNames: state.pendingTrade.offerSpaces.map((i) => getSpace(i)?.name || `#${i}`),
          askSpaceNames: state.pendingTrade.askSpaces.map((i) => getSpace(i)?.name || `#${i}`),
        }
      : null,
    canProposeTrade: isMyTurn && BUILD_PHASES.includes(state.phase) && !state.pendingTrade,
    canRespondTrade: !!state.pendingTrade && state.pendingTrade.toId === viewerId,
    canCancelTrade: !!state.pendingTrade && state.pendingTrade.fromId === viewerId,
  };
}

module.exports = {
  createMonopolyState,
  monopolyRoll,
  monopolyPayJail,
  monopolyBuy,
  monopolySkipBuy,
  monopolyEndTurn,
  monopolyBuild,
  monopolySellHouse,
  monopolyMortgage,
  monopolyUnmortgage,
  monopolyPickCard,
  monopolyTradePropose,
  monopolyTradeAccept,
  monopolyTradeReject,
  monopolyTradeCancel,
  monopolySetPiece,
  getPublicMonopolyState,
  PIECES,
};
