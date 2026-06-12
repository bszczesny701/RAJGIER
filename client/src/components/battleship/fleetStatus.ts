import type { BoardCell } from './shipUtils';

export interface FleetShip {
  id: string;
  size: number;
  sunk: boolean;
}

interface ShipType {
  id: string;
  size: number;
  count: number;
}

export function enrichMyFleetFromBoard(
  board: BoardCell[][] | null,
  fleet: FleetShip[],
): FleetShip[] {
  if (!board?.length || !fleet.length) return fleet;

  return fleet.map((ship) => {
    const cells: { row: number; col: number }[] = [];
    board.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell.ship === ship.id) {
          cells.push({ row: rowIndex, col: colIndex });
        }
      });
    });

    if (!cells.length) return ship;

    return {
      ...ship,
      sunk: cells.every(({ row, col }) => board[row][col].hit),
    };
  });
}

export function mergeFleetWithSunkCounts(
  fleet: FleetShip[],
  shipTypes: ShipType[],
  sunkCounts?: Record<number, number>,
): FleetShip[] {
  if (!fleet.length) return fleet;
  if (!sunkCounts) return fleet;

  const bySize = new Map<number, FleetShip[]>();
  for (const ship of fleet) {
    if (!bySize.has(ship.size)) bySize.set(ship.size, []);
    bySize.get(ship.size)!.push({ ...ship });
  }

  for (const type of shipTypes) {
    const ships = bySize.get(type.size) || [];
    const boardSunk = ships.filter((ship) => ship.sunk).length;
    const targetSunk = Math.max(boardSunk, sunkCounts[type.size] || 0);

    for (let i = 0; i < ships.length; i++) {
      ships[i].sunk = i < targetSunk;
    }
  }

  return fleet.map((ship) => {
    const updated = bySize.get(ship.size)?.find((entry) => entry.id === ship.id);
    return updated ? { ...ship, sunk: updated.sunk } : ship;
  });
}
