import * as THREE from 'three';

/** Shared geometries — never disposed. */
const box = new THREE.BoxGeometry(1, 1, 1);
const cyl = new THREE.CylinderGeometry(0.5, 0.5, 1, 6);
const cone = new THREE.ConeGeometry(0.5, 1, 6);
const sphere = new THREE.SphereGeometry(0.5, 6, 6);
for (const g of [box, cyl, cone, sphere]) {
  g.dispose = () => undefined;
}

const matCache = new Map<string, THREE.MeshLambertMaterial>();

function mat(color: string, emissive = '#000000', intensity = 0) {
  const key = `${color}|${emissive}|${intensity}`;
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshLambertMaterial({
      color,
      emissive,
      emissiveIntensity: intensity,
      flatShading: true,
    });
    matCache.set(key, m);
  }
  return m;
}

function mesh(
  geo: THREE.BufferGeometry,
  color: string,
  x: number,
  y: number,
  z: number,
  sx: number,
  sy: number,
  sz: number,
  emissive?: string,
  intensity?: number,
) {
  const m = new THREE.Mesh(geo, mat(color, emissive, intensity));
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.castShadow = false;
  m.receiveShadow = false;
  m.matrixAutoUpdate = true;
  return m;
}

function team(mine: boolean, ally: string, enemy: string) {
  return mine ? ally : enemy;
}

function addHpBar(g: THREE.Group, height: number) {
  const bg = mesh(box, '#111111', 0, height, 0, 0.45, 0.05, 0.05);
  bg.name = 'hpBg';
  const fill = mesh(box, '#4ade80', 0, height, 0.01, 0.45, 0.05, 0.05);
  fill.name = 'hpFill';
  // per-instance material so HP color/scale updates don't leak across clones
  fill.material = (fill.material as THREE.MeshLambertMaterial).clone();
  g.add(bg, fill);
}

export function setHpBar(g: THREE.Object3D, hp: number, maxHp: number, mine: boolean) {
  const fill = g.getObjectByName('hpFill') as THREE.Mesh | undefined;
  if (!fill) return;
  const pct = Math.max(0.02, Math.min(1, hp / Math.max(1, maxHp)));
  fill.scale.x = 0.45 * pct;
  fill.position.x = -0.225 * (1 - pct);
  const m = fill.material as THREE.MeshLambertMaterial;
  m.color.set(mine ? '#4ade80' : '#f87171');
}

function knight(mine: boolean) {
  const g = new THREE.Group();
  const armor = team(mine, '#94a3b8', '#e11d48');
  g.add(
    mesh(box, '#0f172a', -0.1, 0.14, 0, 0.12, 0.28, 0.12),
    mesh(box, '#0f172a', 0.1, 0.14, 0, 0.12, 0.28, 0.12),
    mesh(box, armor, 0, 0.42, 0, 0.4, 0.45, 0.28),
    mesh(sphere, '#fbbf24', 0, 0.72, 0, 0.28, 0.28, 0.28),
    mesh(box, '#64748b', 0, 0.86, 0, 0.26, 0.12, 0.26),
    mesh(box, '#2563eb', -0.26, 0.4, 0.1, 0.18, 0.28, 0.05),
    mesh(box, '#e2e8f0', 0.3, 0.45, 0, 0.06, 0.5, 0.06),
  );
  addHpBar(g, 1.05);
  return g;
}

function goblin(mine: boolean) {
  const g = new THREE.Group();
  const skin = team(mine, '#4ade80', '#86efac');
  g.add(
    mesh(box, '#166534', -0.08, 0.1, 0, 0.1, 0.2, 0.1),
    mesh(box, '#166534', 0.08, 0.1, 0, 0.1, 0.2, 0.1),
    mesh(box, skin, 0, 0.3, 0, 0.3, 0.32, 0.22),
    mesh(sphere, '#22c55e', 0, 0.55, 0, 0.26, 0.26, 0.26),
    mesh(cone, '#15803d', -0.12, 0.66, 0, 0.1, 0.2, 0.1),
    mesh(cone, '#15803d', 0.12, 0.66, 0, 0.1, 0.2, 0.1),
    mesh(cyl, '#a16207', 0.22, 0.35, 0, 0.05, 0.5, 0.05),
  );
  g.scale.setScalar(0.85);
  addHpBar(g, 0.95);
  return g;
}

function archer(mine: boolean) {
  const g = new THREE.Group();
  const cloak = team(mine, '#0e7490', '#be123c');
  g.add(
    mesh(box, '#134e4a', -0.08, 0.12, 0, 0.1, 0.22, 0.1),
    mesh(box, '#134e4a', 0.08, 0.12, 0, 0.1, 0.22, 0.1),
    mesh(box, cloak, 0, 0.36, 0, 0.3, 0.4, 0.22),
    mesh(sphere, '#fbbf24', 0, 0.64, 0, 0.24, 0.24, 0.24),
    mesh(cone, '#155e75', 0, 0.8, 0, 0.28, 0.24, 0.28),
    mesh(box, '#78350f', 0.2, 0.4, 0, 0.04, 0.36, 0.04),
  );
  g.scale.setScalar(0.9);
  addHpBar(g, 1.0);
  return g;
}

function giant(mine: boolean) {
  const g = new THREE.Group();
  const body = team(mine, '#fb7185', '#e11d48');
  g.add(
    mesh(box, '#9f1239', -0.14, 0.16, 0, 0.16, 0.28, 0.16),
    mesh(box, '#9f1239', 0.14, 0.16, 0, 0.16, 0.28, 0.16),
    mesh(box, body, 0, 0.5, 0, 0.55, 0.55, 0.4),
    mesh(sphere, '#fecdd3', 0, 0.9, 0, 0.38, 0.38, 0.38),
    mesh(box, body, -0.36, 0.52, 0, 0.2, 0.4, 0.2),
    mesh(box, body, 0.36, 0.52, 0, 0.2, 0.4, 0.2),
  );
  g.scale.setScalar(1.2);
  addHpBar(g, 1.15);
  return g;
}

function wizard(mine: boolean) {
  const g = new THREE.Group();
  const robe = team(mine, '#7c3aed', '#a21caf');
  g.add(
    mesh(cone, robe, 0, 0.36, 0, 0.5, 0.65, 0.5),
    mesh(sphere, '#fde68a', 0, 0.7, 0, 0.26, 0.26, 0.26),
    mesh(cone, '#5b21b6', 0, 0.95, 0, 0.34, 0.36, 0.34),
    mesh(cyl, '#92400e', 0.28, 0.45, 0, 0.05, 0.6, 0.05),
    mesh(sphere, '#e9d5ff', 0.28, 0.78, 0, 0.16, 0.16, 0.16, '#a855f7', 0.6),
  );
  addHpBar(g, 1.15);
  return g;
}

function dragon(mine: boolean) {
  const g = new THREE.Group();
  const body = team(mine, '#ef4444', '#991b1b');
  g.add(
    mesh(sphere, body, 0, 0.38, 0, 0.5, 0.5, 0.5),
    mesh(sphere, '#fecaca', 0.06, 0.3, 0.1, 0.3, 0.3, 0.3),
    mesh(sphere, body, 0.26, 0.46, 0, 0.28, 0.28, 0.28),
    mesh(box, '#7f1d1d', -0.36, 0.42, 0, 0.5, 0.06, 0.34),
    mesh(box, '#7f1d1d', -0.36, 0.38, 0.05, 0.5, 0.06, 0.34),
    mesh(cone, body, -0.05, 0.18, -0.28, 0.12, 0.32, 0.12),
  );
  const breath = mesh(cone, '#f97316', 0.45, 0.4, 0.2, 0.18, 0.55, 0.18, '#fb923c', 1);
  breath.name = 'breath';
  breath.visible = false;
  g.add(breath);
  g.scale.setScalar(1.05);
  addHpBar(g, 1.05);
  return g;
}

function buildTower(mine: boolean) {
  const g = new THREE.Group();
  const mid = team(mine, '#d6d3d1', '#9f1239');
  g.add(
    mesh(cyl, '#57534e', 0, 0.14, 0, 0.6, 0.28, 0.6),
    mesh(cyl, mid, 0, 0.48, 0, 0.46, 0.48, 0.46),
    mesh(cyl, '#44403c', 0, 0.76, 0, 0.54, 0.12, 0.54),
    mesh(box, '#1c1917', 0, 0.88, 0.18, 0.12, 0.2, 0.26),
  );
  addHpBar(g, 1.15);
  return g;
}

function kingTower(mine: boolean) {
  const g = new THREE.Group();
  const body = team(mine, '#e7e5e4', '#9f1239');
  const accent = mine ? '#38bdf8' : '#f43f5e';
  g.add(
    mesh(box, '#44403c', 0, 0.12, 0, 0.85, 0.24, 0.85),
    mesh(box, '#a8a29e', 0, 0.22, 0, 0.78, 0.08, 0.78),
    mesh(box, body, 0, 0.62, 0, 0.62, 0.72, 0.62),
    mesh(box, accent, 0, 0.55, 0.32, 0.5, 0.1, 0.04),
    mesh(box, '#1c1917', 0, 0.4, 0.33, 0.16, 0.22, 0.04),
    mesh(box, '#57534e', 0, 1.0, 0, 0.72, 0.08, 0.72),
  );
  for (const x of [-0.28, -0.1, 0.1, 0.28]) {
    g.add(mesh(box, '#57534e', x, 1.12, 0.3, 0.12, 0.16, 0.1));
    g.add(mesh(box, '#57534e', x, 1.12, -0.3, 0.12, 0.16, 0.1));
  }
  g.add(
    mesh(cone, '#fbbf24', 0, 1.38, 0, 0.28, 0.28, 0.28),
    mesh(cyl, '#78716c', 0.28, 1.35, -0.1, 0.03, 0.4, 0.03),
    mesh(box, '#ef4444', 0.4, 1.45, -0.1, 0.22, 0.14, 0.04),
    mesh(box, '#1c1917', 0, 0.78, 0.38, 0.14, 0.12, 0.28),
  );
  const muzzle = mesh(sphere, '#fef3c7', 0, 0.78, 0.58, 0.12, 0.12, 0.12, '#fbbf24', 1);
  muzzle.name = 'muzzle';
  muzzle.visible = false;
  g.add(muzzle);
  g.scale.setScalar(1.35);
  addHpBar(g, 1.55);
  return g;
}

function princessTower(mine: boolean) {
  const g = new THREE.Group();
  const shaft = team(mine, '#d6d3d1', '#9f1239');
  const accent = mine ? '#38bdf8' : '#f43f5e';
  g.add(
    mesh(cyl, '#44403c', 0, 0.12, 0, 0.56, 0.22, 0.56),
    mesh(cyl, shaft, 0, 0.55, 0, 0.36, 0.62, 0.36),
    mesh(cyl, '#a16207', 0, 0.48, 0, 0.4, 0.08, 0.4),
    mesh(box, accent, 0, 0.68, 0.2, 0.26, 0.08, 0.03),
    mesh(cyl, '#44403c', 0, 0.92, 0, 0.48, 0.12, 0.48),
    mesh(box, '#0e7490', 0, 1.1, 0, 0.16, 0.2, 0.12),
    mesh(sphere, '#fde68a', 0, 1.26, 0, 0.16, 0.16, 0.16),
    mesh(cone, '#155e75', 0, 1.38, 0, 0.14, 0.14, 0.14),
  );
  g.scale.setScalar(1.15);
  addHpBar(g, 1.45);
  return g;
}

function rubble() {
  return mesh(box, '#292524', 0, 0.08, 0, 0.45, 0.14, 0.45);
}

function projectile(style: string) {
  if (style === 'arrow') {
    const g = new THREE.Group();
    g.add(mesh(cyl, '#fef3c7', 0, 0, 0, 0.04, 0.32, 0.04));
    g.add(mesh(cone, '#fbbf24', 0, 0.2, 0, 0.07, 0.1, 0.07));
    return g;
  }
  if (style === 'fire') return mesh(sphere, '#f97316', 0, 0, 0, 0.2, 0.2, 0.2, '#fb923c', 1);
  if (style === 'cannon') return mesh(sphere, '#57534e', 0, 0, 0, 0.14, 0.14, 0.14);
  return mesh(sphere, '#c084fc', 0, 0, 0, 0.16, 0.16, 0.16, '#a855f7', 0.8);
}

function effectBurst(fire: boolean) {
  return mesh(
    sphere,
    fire ? '#f97316' : '#e2e8f0',
    0,
    0.2,
    0,
    1,
    1,
    1,
  );
}

type ProtoKey =
  | 'knight_a' | 'knight_e'
  | 'goblin_a' | 'goblin_e'
  | 'archer_a' | 'archer_e'
  | 'giant_a' | 'giant_e'
  | 'wizard_a' | 'wizard_e'
  | 'dragon_a' | 'dragon_e'
  | 'tower_a' | 'tower_e'
  | 'king_a' | 'king_e'
  | 'princess_a' | 'princess_e'
  | 'rubble'
  | 'proj_arrow' | 'proj_fire' | 'proj_cannon' | 'proj_bolt'
  | 'fx_fire' | 'fx_other';

const protos: Partial<Record<ProtoKey, THREE.Object3D>> = {};

function ensureProtos() {
  if (protos.knight_a) return;
  protos.knight_a = knight(true);
  protos.knight_e = knight(false);
  protos.goblin_a = goblin(true);
  protos.goblin_e = goblin(false);
  protos.archer_a = archer(true);
  protos.archer_e = archer(false);
  protos.giant_a = giant(true);
  protos.giant_e = giant(false);
  protos.wizard_a = wizard(true);
  protos.wizard_e = wizard(false);
  protos.dragon_a = dragon(true);
  protos.dragon_e = dragon(false);
  protos.tower_a = buildTower(true);
  protos.tower_e = buildTower(false);
  protos.king_a = kingTower(true);
  protos.king_e = kingTower(false);
  protos.princess_a = princessTower(true);
  protos.princess_e = princessTower(false);
  protos.rubble = rubble();
  protos.proj_arrow = projectile('arrow');
  protos.proj_fire = projectile('fire');
  protos.proj_cannon = projectile('cannon');
  protos.proj_bolt = projectile('bolt');
  protos.fx_fire = effectBurst(true);
  protos.fx_other = effectBurst(false);
}

function cloneProto(key: ProtoKey): THREE.Object3D {
  ensureProtos();
  const p = protos[key]!;
  return p.clone(true);
}

export function createUnitModel(avatar: string, mine: boolean): THREE.Object3D {
  const side = mine ? 'a' : 'e';
  const map: Record<string, ProtoKey> = {
    knight: `knight_${side}` as ProtoKey,
    goblin: `goblin_${side}` as ProtoKey,
    archer: `archer_${side}` as ProtoKey,
    giant: `giant_${side}` as ProtoKey,
    wizard: `wizard_${side}` as ProtoKey,
    dragon: `dragon_${side}` as ProtoKey,
    tower: `tower_${side}` as ProtoKey,
  };
  return cloneProto(map[avatar] || (`knight_${side}` as ProtoKey));
}

export function createTowerModel(type: 'king' | 'princess', mine: boolean, alive: boolean): THREE.Object3D {
  if (!alive && type !== 'king') return cloneProto('rubble');
  if (!alive) {
    const g = new THREE.Group();
    return g;
  }
  const side = mine ? 'a' : 'e';
  return cloneProto(`${type}_${side}` as ProtoKey);
}

export function createProjectileModel(style: string): THREE.Object3D {
  if (style === 'arrow') return cloneProto('proj_arrow');
  if (style === 'fire') return cloneProto('proj_fire');
  if (style === 'cannon') return cloneProto('proj_cannon');
  return cloneProto('proj_bolt');
}

export function createEffectModel(type: string): THREE.Object3D {
  return cloneProto(type.includes('fire') ? 'fx_fire' : 'fx_other');
}

export function createArenaGround(): THREE.Group {
  const ARENA_W = 18;
  const ARENA_H = 32;
  const RIVER_Y = ARENA_H / 2;
  const RIVER_HALF = 0.85;
  const WORLD_SCALE = 0.55;
  const BRIDGES = [
    { x: ARENA_W * 0.25, halfW: 1.35 },
    { x: ARENA_W * 0.75, halfW: 1.35 },
  ];
  const toWorld = (x: number, y: number) => ({
    x: (x - ARENA_W / 2) * WORLD_SCALE,
    z: -(y - ARENA_H / 2) * WORLD_SCALE,
  });

  const g = new THREE.Group();
  const w = ARENA_W * WORLD_SCALE;
  const h = ARENA_H * WORLD_SCALE;
  const riverZ = -(RIVER_Y - ARENA_H / 2) * WORLD_SCALE;
  const riverDepth = RIVER_HALF * 2 * WORLD_SCALE;

  const plane = new THREE.PlaneGeometry(1, 1);
  plane.dispose = () => undefined;

  const g1 = new THREE.Mesh(plane, new THREE.MeshBasicMaterial({ color: '#15803d' }));
  g1.rotation.x = -Math.PI / 2;
  g1.position.set(0, 0, h * 0.25);
  g1.scale.set(w, h * 0.5 - riverDepth, 1);

  const g2 = new THREE.Mesh(plane, new THREE.MeshBasicMaterial({ color: '#166534' }));
  g2.rotation.x = -Math.PI / 2;
  g2.position.set(0, 0, -h * 0.25);
  g2.scale.set(w, h * 0.5 - riverDepth, 1);

  const river = new THREE.Mesh(plane, new THREE.MeshBasicMaterial({ color: '#1d4ed8' }));
  river.rotation.x = -Math.PI / 2;
  river.position.set(0, 0.02, riverZ);
  river.scale.set(w, riverDepth, 1);
  g.add(g1, g2, river);

  for (const b of BRIDGES) {
    const { x, z } = toWorld(b.x, RIVER_Y);
    g.add(mesh(box, '#a16207', x, 0.08, z, b.halfW * 2 * WORLD_SCALE, 0.12, riverDepth + 0.15));
    const hw = b.halfW * WORLD_SCALE;
    g.add(mesh(box, '#78350f', x - hw + 0.04, 0.16, z, 0.06, 0.1, riverDepth + 0.1));
    g.add(mesh(box, '#78350f', x + hw - 0.04, 0.16, z, 0.06, 0.1, riverDepth + 0.1));
  }
  return g;
}
