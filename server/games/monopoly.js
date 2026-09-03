const {
  BOARD,
  GO_INDEX,
  JAIL_INDEX,
  GO_SALARY,
  JAIL_FEE,
  STARTING_CASH,
  getSpace,
  isBuyable,
} = require('./monopolyBoard');
const { CHANCE_CARDS, CHEST_CARDS, getCard } = require('./monopolyCards');

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

function releaseProperties(state, playerId) {
  for (const [idx, owner] of Object.entries(state.owners)) {
    if (owner === playerId) {
      delete state.owners[Number(idx)];
    }
  }
}

function bankruptPlayer(state, playerId, creditorId) {
  const p = state.players[playerId];
  if (p.bankrupt) return;
  p.bankrupt = true;
  p.inJail = false;

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
    title: 'Więzienie',
    text: 'Idziesz do więzienia!',
  };
  pushLog(state, 'Idziesz do więzienia.');
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

  if (space.type === 'investment') {
    return space.rent[0];
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

function applyCard(state, playerId, card, depth = 0) {
  if (!card) return;
  state.pendingCard = { id: card.id, text: card.text };
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
    debit(state, playerId, space.tax || 0, null, `Podatek ${space.tax}`);
    return;
  }

  if ((space.type === 'chance' || space.type === 'chest') && !opts.skipCardDraw) {
    const card = drawCard(state, space.type === 'chance' ? 'chance' : 'chest');
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
}

function createMonopolyState(playerIds) {
  const players = {};
  for (const id of playerIds) {
    players[id] = {
      cash: STARTING_CASH,
      position: GO_INDEX,
      inJail: false,
      jailTurns: 0,
      bankrupt: false,
    };
  }

  return {
    phase: 'rolling',
    currentPlayerId: playerIds[0],
    sixCount: 0,
    extraTurn: false,
    players,
    order: [...playerIds],
    owners: {},
    lastDice: null,
    pendingCard: null,
    pendingNotice: null,
    awaitingBuy: null,
    log: ['Zaczynamy partię Monopoly.'],
    winner: null,
    chanceDeck: shuffle(CHANCE_CARDS.map((c) => c.id)),
    chestDeck: shuffle(CHEST_CARDS.map((c) => c.id)),
    chanceDiscard: [],
    chestDiscard: [],
  };
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
      const paid = debit(state, playerId, JAIL_FEE, null, `Kaucja ${JAIL_FEE} (3. tura w więzieniu)`);
      if (!paid || state.players[playerId].bankrupt) return { ok: true };
      p.inJail = false;
      p.jailTurns = 0;
      moveBySteps(state, playerId, total);
      resolveLanding(state, playerId);
      afterLanding(state, playerId);
      return { ok: true };
    }

    pushLog(state, 'Brak szóstki — zostajesz w więzieniu.');
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
  if (!p.inJail) return { ok: false, reason: 'Nie jesteś w więzieniu' };

  const paid = debit(state, playerId, JAIL_FEE, null, `Kaucja ${JAIL_FEE}`);
  if (!paid || p.bankrupt) return { ok: true };

  p.inJail = false;
  p.jailTurns = 0;
  pushLog(state, 'Wychodzisz z więzienia — rzuć kostką.');
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

function getPublicMonopolyState(state, viewerId, playerNames = {}) {
  const p = state.players[viewerId];
  const buySpace = state.awaitingBuy != null ? getSpace(state.awaitingBuy) : null;
  const isMyTurn = state.currentPlayerId === viewerId && !p?.bankrupt;

  const spaces = BOARD.map((space, index) => ({
    index,
    type: space.type,
    name: space.name,
    group: space.group || 'special',
    price: space.price || null,
    tax: space.tax || null,
    rent: space.rent ? [...space.rent] : null,
    houseCost: space.houseCost || null,
    ownerId: state.owners[index] || null,
  }));

  const tokens = state.order.map((id) => ({
    id,
    name: playerNames[id] || 'Gracz',
    cash: state.players[id].cash,
    position: state.players[id].position,
    inJail: state.players[id].inJail,
    jailTurns: state.players[id].jailTurns,
    bankrupt: state.players[id].bankrupt,
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
        title: n.title || 'Więzienie',
        text: n.text || 'Idziesz do więzienia!',
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
    buyOffer: buySpace
      ? { index: state.awaitingBuy, name: buySpace.name, price: buySpace.price }
      : null,
    jailFee: JAIL_FEE,
    goSalary: GO_SALARY,
  };
}

module.exports = {
  createMonopolyState,
  monopolyRoll,
  monopolyPayJail,
  monopolyBuy,
  monopolySkipBuy,
  monopolyEndTurn,
  getPublicMonopolyState,
};
