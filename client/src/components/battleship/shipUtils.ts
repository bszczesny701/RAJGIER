export interface Cell {
  row: number;
  col: number;
}

export interface BoardCell {
  ship: string | null;
  hit: boolean;
}

export type ShipOrientation = 'h' | 'v';
export type ShipSegment = 'single' | 'start' | 'middle' | 'end';

export interface ShipSegmentInfo {
  shipId: string;
  size: number;
  orientation: ShipOrientation;
  segment: ShipSegment;
  index: number;
  sunk: boolean;
}

function hasShip(board: BoardCell[][] | null, row: number, col: number, shipId: string): boolean {
  if (!board?.[row]?.[col]) return false;
  return board[row][col].ship === shipId;
}

function isShipFullyHit(board: BoardCell[][], cells: Cell[]): boolean {
  return cells.every(({ row, col }) => board[row][col].hit);
}

export function getShipCellsFromBoard(
  board: BoardCell[][] | null,
  row: number,
  col: number,
): { shipId: string; cells: Cell[]; orientation: ShipOrientation } | null {
  if (!board?.[row]?.[col]?.ship) return null;

  const shipId = board[row][col].ship!;
  const cells: Cell[] = [{ row, col }];

  if (hasShip(board, row, col - 1, shipId) || hasShip(board, row, col + 1, shipId)) {
    let c = col - 1;
    while (hasShip(board, row, c, shipId)) {
      cells.unshift({ row, col: c });
      c -= 1;
    }
    c = col + 1;
    while (hasShip(board, row, c, shipId)) {
      cells.push({ row, col: c });
      c += 1;
    }
    return { shipId, cells, orientation: 'h' };
  }

  let r = row - 1;
  while (hasShip(board, r, col, shipId)) {
    cells.unshift({ row: r, col });
    r -= 1;
  }
  r = row + 1;
  while (hasShip(board, r, col, shipId)) {
    cells.push({ row: r, col });
    r += 1;
  }
  return { shipId, cells, orientation: 'v' };
}

export function getShipCellsFromPlacement(
  placedShips: { id: string; size: number; cells: Cell[] }[],
  row: number,
  col: number,
): { shipId: string; cells: Cell[]; orientation: ShipOrientation } | null {
  const ship = placedShips.find((s) => s.cells.some((c) => c.row === row && c.col === col));
  if (!ship) return null;

  const sorted = [...ship.cells].sort((a, b) => a.row - b.row || a.col - b.col);
  const orientation: ShipOrientation = sorted.length === 1 || sorted[0].row === sorted[1].row ? 'h' : 'v';
  return { shipId: ship.id, cells: sorted, orientation };
}

function getSegmentType(index: number, size: number): ShipSegment {
  if (size === 1) return 'single';
  if (index === 0) return 'start';
  if (index === size - 1) return 'end';
  return 'middle';
}

export function getShipSegmentInfo(
  board: BoardCell[][] | null,
  placedShips: { id: string; size: number; cells: Cell[] }[] | null,
  row: number,
  col: number,
): ShipSegmentInfo | null {
  const fromBoard = board ? getShipCellsFromBoard(board, row, col) : null;
  const fromPlacement = !fromBoard && placedShips
    ? getShipCellsFromPlacement(placedShips, row, col)
    : null;
  const data = fromBoard || fromPlacement;
  if (!data) return null;

  const index = data.cells.findIndex((c) => c.row === row && c.col === col);
  const size = data.cells.length;
  const sunk = board ? isShipFullyHit(board, data.cells) : false;

  return {
    shipId: data.shipId,
    size,
    orientation: data.orientation,
    segment: getSegmentType(index, size),
    index,
    sunk,
  };
}

export function shipSegmentClass(info: ShipSegmentInfo): string {
  const parts = [
    'ship-cell',
    info.orientation === 'h' ? 'ship-h' : 'ship-v',
    `ship-seg-${info.segment}`,
  ];
  if (info.sunk) parts.push('ship-sunk');
  if (info.size >= 3 && info.segment === 'middle') parts.push('ship-deck');
  return parts.join(' ');
}
