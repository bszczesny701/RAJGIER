/** 40 pól — polskie nazwy w stylu Monopoly. */
const HOUSE_COST_BY_GROUP = {
  brown: 50,
  lightblue: 50,
  pink: 100,
  orange: 100,
  red: 150,
  yellow: 150,
  green: 200,
  darkblue: 200,
};

const BOARD = [
  { type: 'go', name: 'Start', group: 'special' },
  { type: 'investment', name: 'WC w Kościuchu', group: 'brown', price: 60, rent: [2, 10, 30, 90, 160, 250], houseCost: 50 },
  { type: 'chest', name: 'Kasa społeczna', group: 'special' },
  { type: 'investment', name: 'Bagno Parzniewskie', group: 'brown', price: 60, rent: [4, 20, 60, 180, 320, 450], houseCost: 50 },
  { type: 'tax', name: 'Kupon', group: 'special', tax: 200 },
  { type: 'rail', name: 'WKD PRUSZKÓW', group: 'rail', price: 200, rent: [25, 50, 100, 200] },
  { type: 'investment', name: 'Polna', group: 'lightblue', price: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50 },
  { type: 'chance', name: 'Los', group: 'special' },
  { type: 'investment', name: 'Nowa Stacja', group: 'lightblue', price: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50 },
  { type: 'investment', name: 'WPR BURGER', group: 'lightblue', price: 120, rent: [8, 40, 100, 300, 450, 600], houseCost: 50 },
  { type: 'jail', name: 'Kościuch / Odwiedziny', group: 'special' },
  { type: 'investment', name: 'Costa Coffee', group: 'pink', price: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100 },
  { type: 'utility', name: 'Lekcja Żywień', group: 'utility', price: 150 },
  { type: 'investment', name: 'Empik', group: 'pink', price: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100 },
  { type: 'investment', name: 'Van Graaf', group: 'pink', price: 160, rent: [12, 60, 180, 500, 700, 900], houseCost: 100 },
  { type: 'rail', name: 'WKD MICHAŁOWICE', group: 'rail', price: 200, rent: [25, 50, 100, 200] },
  { type: 'investment', name: 'Sztutowo', group: 'orange', price: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100 },
  { type: 'chest', name: 'Kasa społeczna', group: 'special' },
  { type: 'investment', name: 'Stegna', group: 'orange', price: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100 },
  { type: 'investment', name: 'Jastarnia', group: 'orange', price: 200, rent: [16, 80, 220, 600, 800, 1000], houseCost: 100 },
  { type: 'parking', name: 'Park Anielin', group: 'special' },
  { type: 'investment', name: 'Uniwersytet Civitas', group: 'red', price: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150 },
  { type: 'chance', name: 'Los', group: 'special' },
  { type: 'investment', name: 'Uniwersytet Warszawski', group: 'red', price: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150 },
  { type: 'investment', name: 'Politechnika Warszawska', group: 'red', price: 240, rent: [20, 100, 300, 750, 925, 1100], houseCost: 150 },
  { type: 'rail', name: 'WKD TWORKI', group: 'rail', price: 200, rent: [25, 50, 100, 200] },
  { type: 'investment', name: 'Efes', group: 'yellow', price: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150 },
  { type: 'investment', name: 'Smak Kebab', group: 'yellow', price: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150 },
  { type: 'utility', name: 'Lekcja Bożeny', group: 'utility', price: 150 },
  { type: 'investment', name: 'Złote Łuki', group: 'yellow', price: 280, rent: [24, 120, 360, 850, 1025, 1200], houseCost: 150 },
  { type: 'gotojail', name: 'Idź do Kościucha', group: 'special' },
  { type: 'investment', name: 'Kałęczyn', group: 'green', price: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200 },
  { type: 'investment', name: 'Spacerowa', group: 'green', price: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200 },
  { type: 'chest', name: 'Kasa społeczna', group: 'special' },
  { type: 'investment', name: 'Lipowa', group: 'green', price: 320, rent: [28, 150, 450, 1000, 1200, 1400], houseCost: 200 },
  { type: 'rail', name: 'WKD MALICHY', group: 'rail', price: 200, rent: [25, 50, 100, 200] },
  { type: 'chance', name: 'Los', group: 'special' },
  { type: 'investment', name: 'Zdrofit Leszcz', group: 'darkblue', price: 350, rent: [35, 175, 500, 1100, 1300, 1500], houseCost: 200 },
  { type: 'tax', name: 'Kupon', group: 'special', tax: 100 },
  { type: 'investment', name: 'Zdrofit Nowa Stacja', group: 'darkblue', price: 400, rent: [50, 200, 600, 1400, 1700, 2000], houseCost: 200 },
];

const GO_INDEX = 0;
const JAIL_INDEX = 10;
const GO_SALARY = 200;
const JAIL_FEE = 50;
const STARTING_CASH = 1500;

const MAX_HOUSES = 5; // 4 domy + hotel

function getSpace(index) {
  return BOARD[index];
}

function isBuyable(space) {
  return space && (space.type === 'investment' || space.type === 'rail' || space.type === 'utility');
}

/** Indeksy pól investment w danym kolorze. */
function groupIndexes(group) {
  const idxs = [];
  BOARD.forEach((space, i) => {
    if (space.type === 'investment' && space.group === group) idxs.push(i);
  });
  return idxs;
}

module.exports = {
  BOARD,
  HOUSE_COST_BY_GROUP,
  GO_INDEX,
  JAIL_INDEX,
  GO_SALARY,
  JAIL_FEE,
  STARTING_CASH,
  MAX_HOUSES,
  getSpace,
  isBuyable,
  groupIndexes,
};
