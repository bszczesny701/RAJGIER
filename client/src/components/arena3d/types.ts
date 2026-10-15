export interface FieldUnit {
  id: string;
  avatar: string;
  mine: boolean;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  flying: boolean;
  anim: string;
  attackAnim: number;
  hitFlash: number;
  facing: number;
  attackTargetX?: number | null;
  attackTargetY?: number | null;
}

export interface FieldTower {
  id: string;
  type: 'king' | 'princess';
  mine: boolean;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  attackAnim?: number;
}

export interface FieldProjectile {
  id: string;
  style: string;
  x: number;
  y: number;
  angle: number;
}

export interface FieldEffect {
  id: string;
  type: string;
  x: number;
  y: number;
  radius: number;
  ttl: number;
  tx?: number;
  ty?: number;
}

export interface FieldSnapshot {
  arenaW: number;
  arenaH: number;
  units: FieldUnit[];
  towers: FieldTower[];
  projectiles: FieldProjectile[];
  effects: FieldEffect[];
}
