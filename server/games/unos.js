const COLORS = ['red', 'blue', 'green', 'yellow'];
const COLOR_LABELS = {
  red: 'Czerwony',
  blue: 'Niebieski',
  green: 'Zielony',
  yellow: 'Żółty',
};

const STARTING_HAND = 7;

function cardId(color, type, value, index) {
  if (type === 'wild') return `wild-${index}`;
  return `${color}-${type}-${value ?? type}-${index}`;
}

function buildDeck() {
  const deck = [];
  let idx = 0;

  for (const color of COLORS) {
    deck.push({ id: cardId(color, 'number', 0, idx++), color, type: 'number', value: 0 });
    for (let value = 1; value <= 7; value++) {
      deck.push({ id: cardId(color, 'number', value, idx++), color, type: 'number', value });
    }
    deck.push({ id: cardId(color, 'skip', null, idx++), color, type: 'skip', value: null });
    deck.push({ id: cardId(color, 'draw2', null, idx++), color, type: 'draw2', value: null });
  }

  for (let i = 0; i < 4; i++) {
    deck.push({ id: cardId('wild', 'wild', null, idx++), color: 'wild', type: 'wild', value: null });
  }

  return deck;
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function isSpecialStart(card) {
  return card.type === 'wild' || card.type === 'skip' || card.type === 'draw2';
}

function getTopCard(state) {
  return state.discard[state.discard.length - 1];
}

function getActiveColor(state) {
  const top = getTopCard(state);
  if (!top) return null;
  if (top.type === 'wild') return state.wildColor;
  return top.color;
}

function cardMatches(state, card) {
  if (card.type === 'wild') return true;

  const top = getTopCard(state);
  if (!top) return false;

  const activeColor = getActiveColor(state);

  // Ta sama cyfra — dowolny kolor
  if (card.type === 'number' && top.type === 'number') {
    const cardValue = Number(card.value);
    const topValue = Number(top.value);
    if (!Number.isNaN(cardValue) && !Number.isNaN(topValue) && cardValue === topValue) {
      return true;
    }
  }

  // Ten sam typ akcji (skip, +2) — dowolny kolor
  if (
    (card.type === 'skip' || card.type === 'draw2')
    && card.type === top.type
  ) {
    return true;
  }

  // Pasujący kolor aktywny
  if (activeColor && card.color === activeColor) return true;

  return false;
}

function drawFromDeck(state, count = 1) {
  const drawn = [];
  for (let i = 0; i < count; i++) {
    if (state.deck.length === 0) {
      if (state.discard.length <= 1) break;
      const top = state.discard.pop();
      state.deck = shuffle(state.discard);
      state.discard = top ? [top] : [];
    }
    if (state.deck.length === 0) break;
    drawn.push(state.deck.pop());
  }
  return drawn;
}

function nextPlayer(state, playerIds, steps = 1) {
  const idx = playerIds.indexOf(state.currentTurn);
  if (idx === -1) return playerIds[0];
  return playerIds[(idx + steps) % playerIds.length];
}

function isTwoPlayer(playerIds) {
  return playerIds.length === 2;
}

function endTurn(state, playerIds) {
  state.currentTurn = nextPlayer(state, playerIds, 1);
}

function applySpecialCardTurn(state, playerIds, cardType, actingPlayerId) {
  if (isTwoPlayer(playerIds)) {
    if (cardType === 'draw2') {
      const opponentId = playerIds.find((id) => id !== actingPlayerId);
      state.hands[opponentId].push(...drawFromDeck(state, 2));
      state.lastAction = { ...state.lastAction, target: opponentId };
      return;
    }
    if (cardType === 'skip') {
      return;
    }
    endTurn(state, playerIds);
    return;
  }

  if (cardType === 'draw2') {
    const targetId = nextPlayer(state, playerIds, 1);
    state.hands[targetId].push(...drawFromDeck(state, 2));
    state.currentTurn = nextPlayer(state, playerIds, 2);
    state.lastAction = { ...state.lastAction, target: targetId };
    return;
  }

  if (cardType === 'skip') {
    state.currentTurn = nextPlayer(state, playerIds, 2);
    return;
  }

  endTurn(state, playerIds);
}

function dealOpening(state, playerIds) {
  state.deck = shuffle(buildDeck());

  do {
    state.discard = [state.deck.pop()];
  } while (isSpecialStart(getTopCard(state)) && state.deck.length > 0);

  if (isSpecialStart(getTopCard(state))) {
    const top = getTopCard(state);
    state.deck.unshift(top);
    state.discard = [];
    state.deck = shuffle(state.deck);
    state.discard = [state.deck.pop()];
  }

  for (const id of playerIds) {
    state.hands[id] = drawFromDeck(state, STARTING_HAND);
    state.unosCalled[id] = false;
    state.needsUnosCall[id] = false;
    state.pendingDrawPlay[id] = null;
  }

  const opening = getTopCard(state);
  if (opening.type === 'wild') {
    state.wildColor = COLORS[Math.floor(Math.random() * COLORS.length)];
  } else {
    state.wildColor = null;
  }

  state.currentTurn = playerIds[Math.floor(Math.random() * playerIds.length)];
  state.phase = 'playing';
  state.winner = null;
  state.pendingSkip = false;
}

function createUnosState(playerIds) {
  const state = {
    deck: [],
    discard: [],
    hands: {},
    currentTurn: null,
    wildColor: null,
    phase: 'playing',
    chooseColorFor: null,
    winner: null,
    unosCalled: {},
    needsUnosCall: {},
    pendingSkip: false,
    lastAction: null,
    pendingDrawPlay: {},
  };

  dealOpening(state, playerIds);
  return state;
}

function applyUnosPenaltyIfNeeded(state, playerId) {
  if (state.needsUnosCall[playerId] && !state.unosCalled[playerId]) {
    state.hands[playerId].push(...drawFromDeck(state, 2));
    state.needsUnosCall[playerId] = false;
    state.unosCalled[playerId] = false;
    state.lastAction = { type: 'unosPenalty', playerId };
    return true;
  }
  return false;
}

function penalizeForgottenUnos(state, playerIds, actingPlayerId) {
  for (const id of playerIds) {
    if (id !== actingPlayerId) {
      applyUnosPenaltyIfNeeded(state, id);
    }
  }
}

function checkWinner(state, playerId) {
  if (state.hands[playerId].length === 0) {
    state.winner = playerId;
    state.phase = 'finished';
    return true;
  }
  return false;
}

function playCard(state, playerId, cardId, chosenColor, playerIds) {
  if (state.phase === 'finished') {
    return { valid: false, reason: 'Gra zakończona' };
  }
  if (state.phase === 'chooseColor') {
    return { valid: false, reason: 'Wybierz kolor wilda' };
  }
  if (state.currentTurn !== playerId) {
    return { valid: false, reason: 'Nie twój ruch' };
  }

  penalizeForgottenUnos(state, playerIds, playerId);

  const hand = state.hands[playerId];
  const cardIndex = hand.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) {
    return { valid: false, reason: 'Nie masz tej karty' };
  }

  const card = hand[cardIndex];
  if (!cardMatches(state, card)) {
    const top = getTopCard(state);
    if (top?.type === 'wild') {
      return { valid: false, reason: 'Na stole jest wild — zagraj kartę w kolorze gry' };
    }
    return { valid: false, reason: 'Karta musi pasować kolorem, cyfrą lub symbolem' };
  }

  if (card.type === 'wild') {
    if (!chosenColor || !COLORS.includes(chosenColor)) {
      state.phase = 'chooseColor';
      state.chooseColorFor = playerId;
      state.pendingCard = card;
      state.pendingCardIndex = cardIndex;
      return { valid: true, needColor: true };
    }
  }

  hand.splice(cardIndex, 1);
  state.discard.push(card);
  state.pendingDrawPlay[playerId] = null;

  if (card.type === 'wild') {
    state.wildColor = chosenColor;
  } else {
    state.wildColor = null;
  }

  state.unosCalled[playerId] = false;

  if (checkWinner(state, playerId)) {
    state.lastAction = { type: 'win', playerId, card };
    return { valid: true, won: true };
  }

  if (hand.length === 1) {
    state.needsUnosCall[playerId] = true;
    state.unosCalled[playerId] = false;
  }

  if (card.type === 'draw2') {
    state.lastAction = { type: 'draw2', playerId, card };
    applySpecialCardTurn(state, playerIds, 'draw2', playerId);
  } else if (card.type === 'skip') {
    state.lastAction = { type: 'skip', playerId, card };
    applySpecialCardTurn(state, playerIds, 'skip', playerId);
  } else {
    state.lastAction = { type: 'play', playerId, card };
    applySpecialCardTurn(state, playerIds, 'play', playerId);
  }

  return { valid: true };
}

function finalizeWildColor(state, playerId, chosenColor, playerIds) {
  if (state.phase !== 'chooseColor' || state.chooseColorFor !== playerId) {
    return { valid: false, reason: 'Nie musisz wybierać koloru' };
  }
  if (!COLORS.includes(chosenColor)) {
    return { valid: false, reason: 'Nieprawidłowy kolor' };
  }

  const card = state.pendingCard;
  const cardIndex = state.pendingCardIndex;
  const hand = state.hands[playerId];

  hand.splice(cardIndex, 1);
  state.discard.push(card);
  state.pendingDrawPlay[playerId] = null;
  state.wildColor = chosenColor;
  state.phase = 'playing';
  state.chooseColorFor = null;
  state.pendingCard = null;
  state.pendingCardIndex = null;
  state.unosCalled[playerId] = false;

  if (checkWinner(state, playerId)) {
    state.lastAction = { type: 'win', playerId, card };
    return { valid: true, won: true };
  }

  if (hand.length === 1) {
    state.needsUnosCall[playerId] = true;
    state.unosCalled[playerId] = false;
  }

  state.lastAction = { type: 'play', playerId, card, wildColor: chosenColor };
  applySpecialCardTurn(state, playerIds, 'play', playerId);

  return { valid: true };
}

function drawCard(state, playerId, playerIds) {
  if (state.phase === 'finished') {
    return { valid: false, reason: 'Gra zakończona' };
  }
  if (state.phase === 'chooseColor') {
    return { valid: false, reason: 'Najpierw wybierz kolor' };
  }
  if (state.currentTurn !== playerId) {
    return { valid: false, reason: 'Nie twój ruch' };
  }

  penalizeForgottenUnos(state, playerIds, playerId);

  const drawn = drawFromDeck(state, 1);
  if (drawn.length === 0) {
    return { valid: false, reason: 'Brak kart w talii' };
  }

  state.hands[playerId].push(...drawn);
  const card = drawn[0];
  state.lastAction = { type: 'draw', playerId, card };

  if (cardMatches(state, card)) {
    state.pendingDrawPlay[playerId] = card.id;
    return { valid: true, drawn: card, canPlayDrawn: true };
  }

  state.pendingDrawPlay[playerId] = null;
  endTurn(state, playerIds);

  return { valid: true, drawn: card, canPlayDrawn: false };
}

function callUnos(state, playerId) {
  if (state.hands[playerId]?.length !== 1) {
    return { valid: false, reason: 'UNOS tylko przy jednej karcie' };
  }
  state.unosCalled[playerId] = true;
  state.needsUnosCall[playerId] = false;
  state.lastAction = { type: 'unos', playerId };
  return { valid: true };
}

function passTurn(state, playerId, playerIds) {
  if (state.currentTurn !== playerId) {
    return { valid: false, reason: 'Nie twój ruch' };
  }
  state.pendingDrawPlay[playerId] = null;
  endTurn(state, playerIds);
  state.lastAction = { type: 'pass', playerId };
  return { valid: true };
}

function serializeCard(card) {
  return {
    id: card.id,
    color: card.color,
    type: card.type,
    value: card.value,
  };
}

function getPublicUnosState(state, playerId, playerIds, playerNames = {}) {
  const top = getTopCard(state);
  const myHand = state.hands[playerId] || [];

  const otherPlayers = playerIds
    .filter((id) => id !== playerId)
    .map((id) => ({
      id,
      name: playerNames[id] || 'Gracz',
      handCount: (state.hands[id] || []).length,
    }));

  return {
    phase: state.phase,
    currentTurn: state.currentTurn,
    currentTurnName: playerNames[state.currentTurn] || 'Gracz',
    topCard: top ? serializeCard(top) : null,
    activeColor: getActiveColor(state),
    wildColor: state.wildColor,
    myHand: myHand.map(serializeCard),
    otherPlayers,
    playerCount: playerIds.length,
    deckCount: state.deck.length,
    playableCardIds: myHand.filter((c) => cardMatches(state, c)).map((c) => c.id),
    canPlayDrawnCardId: state.pendingDrawPlay[playerId] || null,
    needsUnosCall: !!state.needsUnosCall[playerId],
    unosCalled: !!state.unosCalled[playerId],
    mustChooseColor: state.phase === 'chooseColor' && state.chooseColorFor === playerId,
    winner: state.winner,
    lastAction: state.lastAction,
    colors: COLORS,
    colorLabels: COLOR_LABELS,
    playerNames,
  };
}

module.exports = {
  COLORS,
  COLOR_LABELS,
  createUnosState,
  playCard,
  finalizeWildColor,
  drawCard,
  callUnos,
  passTurn,
  getPublicUnosState,
  cardMatches,
};
