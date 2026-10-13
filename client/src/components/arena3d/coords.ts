/** Arena world (x right, y up from own king) → Three.js (x right, z depth, y up). */

export const ARENA_W = 18;
export const ARENA_H = 32;
export const RIVER_Y = ARENA_H / 2;
export const RIVER_HALF = 0.85;
export const BRIDGES = [
  { id: 'left', x: ARENA_W * 0.25, halfW: 1.35 },
  { id: 'right', x: ARENA_W * 0.75, halfW: 1.35 },
] as const;

export const WORLD_SCALE = 0.55;

/** Viewer coords already have "me" at low y. Map to 3D with own side at -Z. */
export function arenaToWorld(x: number, y: number, arenaW = ARENA_W, arenaH = ARENA_H) {
  const wx = (x - arenaW / 2) * WORLD_SCALE;
  const wz = -(y - arenaH / 2) * WORLD_SCALE;
  return { x: wx, z: wz };
}
