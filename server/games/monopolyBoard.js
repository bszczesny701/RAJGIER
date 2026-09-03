/** 40 pól — nazwy i ceny to placeholdery do późniejszej podmiany. */
const BOARD = [
  { type: 'go', name: 'Start', group: 'special' },
  { type: 'investment', name: 'Inwestycja A1', group: 'brown', price: 60, rent: [2, 10, 30, 90, 160, 250] },
  { type: 'chest', name: 'Kasa społeczna', group: 'special' },
  { type: 'investment', name: 'Inwestycja A2', group: 'brown', price: 60, rent: [4, 20, 60, 180, 320, 450] },
  { type: 'tax', name: 'Podatek', group: 'special', tax: 200 },
  { type: 'rail', name: 'Stacja 1', group: 'rail', price: 200, rent: [25, 50, 100, 200] },
  { type: 'investment', name: 'Inwestycja B1', group: 'lightblue', price: 100, rent: [6, 30, 90, 270, 400, 550] },
  { type: 'chance', name: 'Szansa', group: 'special' },
  { type: 'investment', name: 'Inwestycja B2', group: 'lightblue', price: 100, rent: [6, 30, 90, 270, 400, 550] },
  { type: 'investment', name: 'Inwestycja B3', group: 'lightblue', price: 120, rent: [8, 40, 100, 300, 450, 600] },
  { type: 'jail', name: 'Więzienie / Odwiedziny', group: 'special' },
  { type: 'investment', name: 'Inwestycja C1', group: 'pink', price: 140, rent: [10, 50, 150, 450, 625, 750] },
  { type: 'utility', name: 'Media 1', group: 'utility', price: 150 },
  { type: 'investment', name: 'Inwestycja C2', group: 'pink', price: 140, rent: [10, 50, 150, 450, 625, 750] },
  { type: 'investment', name: 'Inwestycja C3', group: 'pink', price: 160, rent: [12, 60, 180, 500, 700, 900] },
  { type: 'rail', name: 'Stacja 2', group: 'rail', price: 200, rent: [25, 50, 100, 200] },
  { type: 'investment', name: 'Inwestycja D1', group: 'orange', price: 180, rent: [14, 70, 200, 550, 750, 950] },
  { type: 'chest', name: 'Kasa społeczna', group: 'special' },
  { type: 'investment', name: 'Inwestycja D2', group: 'orange', price: 180, rent: [14, 70, 200, 550, 750, 950] },
  { type: 'investment', name: 'Inwestycja D3', group: 'orange', price: 200, rent: [16, 80, 220, 600, 800, 1000] },
  { type: 'parking', name: 'Darmowy parking', group: 'special' },
  { type: 'investment', name: 'Inwestycja E1', group: 'red', price: 220, rent: [18, 90, 250, 700, 875, 1050] },
  { type: 'chance', name: 'Szansa', group: 'special' },
  { type: 'investment', name: 'Inwestycja E2', group: 'red', price: 220, rent: [18, 90, 250, 700, 875, 1050] },
  { type: 'investment', name: 'Inwestycja E3', group: 'red', price: 240, rent: [20, 100, 300, 750, 925, 1100] },
  { type: 'rail', name: 'Stacja 3', group: 'rail', price: 200, rent: [25, 50, 100, 200] },
  { type: 'investment', name: 'Inwestycja F1', group: 'yellow', price: 260, rent: [22, 110, 330, 800, 975, 1150] },
  { type: 'investment', name: 'Inwestycja F2', group: 'yellow', price: 260, rent: [22, 110, 330, 800, 975, 1150] },
  { type: 'utility', name: 'Media 2', group: 'utility', price: 150 },
  { type: 'investment', name: 'Inwestycja F3', group: 'yellow', price: 280, rent: [24, 120, 360, 850, 1025, 1200] },
  { type: 'gotojail', name: 'Idź do więzienia', group: 'special' },
  { type: 'investment', name: 'Inwestycja G1', group: 'green', price: 300, rent: [26, 130, 390, 900, 1100, 1275] },
  { type: 'investment', name: 'Inwestycja G2', group: 'green', price: 300, rent: [26, 130, 390, 900, 1100, 1275] },
  { type: 'chest', name: 'Kasa społeczna', group: 'special' },
  { type: 'investment', name: 'Inwestycja G3', group: 'green', price: 320, rent: [28, 150, 450, 1000, 1200, 1400] },
  { type: 'rail', name: 'Stacja 4', group: 'rail', price: 200, rent: [25, 50, 100, 200] },
  { type: 'chance', name: 'Szansa', group: 'special' },
  { type: 'investment', name: 'Inwestycja H1', group: 'darkblue', price: 350, rent: [35, 175, 500, 1100, 1300, 1500] },
  { type: 'tax', name: 'Podatek luksusowy', group: 'special', tax: 100 },
  { type: 'investment', name: 'Inwestycja H2', group: 'darkblue', price: 400, rent: [50, 200, 600, 1400, 1700, 2000] },
];

const GO_INDEX = 0;
const JAIL_INDEX = 10;
const GO_SALARY = 200;
const JAIL_FEE = 50;
const STARTING_CASH = 1500;

function getSpace(index) {
  return BOARD[index];
}

function isBuyable(space) {
  return space && (space.type === 'investment' || space.type === 'rail' || space.type === 'utility');
}

module.exports = {
  BOARD,
  GO_INDEX,
  JAIL_INDEX,
  GO_SALARY,
  JAIL_FEE,
  STARTING_CASH,
  getSpace,
  isBuyable,
};
