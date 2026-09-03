/**
 * Placeholdery losów — podmień text i effect na Wasze historie.
 * effect.type: money | goto | jail | move
 */
const CHANCE_CARDS = [
  { id: 'ch-1', text: 'Szansa: dostajesz 200 (placeholder).', effect: { type: 'money', amount: 200 } },
  { id: 'ch-2', text: 'Szansa: płacisz 150 (placeholder).', effect: { type: 'money', amount: -150 } },
  { id: 'ch-3', text: 'Szansa: idziesz na Start.', effect: { type: 'goto', index: 0, collectGo: true } },
  { id: 'ch-4', text: 'Szansa: idziesz do więzienia.', effect: { type: 'jail' } },
  { id: 'ch-5', text: 'Szansa: przesuń się o 3 pola do przodu.', effect: { type: 'move', steps: 3 } },
  { id: 'ch-6', text: 'Szansa: bank wypłaca 50 (placeholder).', effect: { type: 'money', amount: 50 } },
  { id: 'ch-7', text: 'Szansa: mandacik 50 (placeholder).', effect: { type: 'money', amount: -50 } },
  { id: 'ch-8', text: 'Szansa: idziesz na Stację 1.', effect: { type: 'goto', index: 5, collectGo: true } },
];

const CHEST_CARDS = [
  { id: 'cs-1', text: 'Kasa: spadek 100 (placeholder).', effect: { type: 'money', amount: 100 } },
  { id: 'cs-2', text: 'Kasa: rachunki −100 (placeholder).', effect: { type: 'money', amount: -100 } },
  { id: 'cs-3', text: 'Kasa: idziesz na Start.', effect: { type: 'goto', index: 0, collectGo: true } },
  { id: 'cs-4', text: 'Kasa: idziesz do więzienia.', effect: { type: 'jail' } },
  { id: 'cs-5', text: 'Kasa: zwrot podatku 20 (placeholder).', effect: { type: 'money', amount: 20 } },
  { id: 'cs-6', text: 'Kasa: opłata szpitalna −50 (placeholder).', effect: { type: 'money', amount: -50 } },
  { id: 'cs-7', text: 'Kasa: bonus 25 (placeholder).', effect: { type: 'money', amount: 25 } },
  { id: 'cs-8', text: 'Kasa: cofnij się o 2 pola.', effect: { type: 'move', steps: -2 } },
];

const ALL_CARDS = [...CHANCE_CARDS, ...CHEST_CARDS];

function getCard(id) {
  return ALL_CARDS.find((c) => c.id === id) || null;
}

module.exports = {
  CHANCE_CARDS,
  CHEST_CARDS,
  getCard,
};
