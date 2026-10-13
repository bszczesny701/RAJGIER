import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export type AvatarId =
  | 'knight'
  | 'goblin'
  | 'archer'
  | 'giant'
  | 'wizard'
  | 'dragon'
  | 'tower'
  | 'fireball'
  | 'king'
  | 'princess';

interface ModelProps {
  avatar: AvatarId | string;
  mine: boolean;
  anim: string;
  attackAnim: number;
  hitFlash: number;
  flying?: boolean;
  attackTarget?: { x: number; z: number } | null;
}

/** Shared low-seg geometries — one allocation for the whole fight. */
const box = new THREE.BoxGeometry(1, 1, 1);
const cyl6 = new THREE.CylinderGeometry(0.5, 0.5, 1, 6);
const cyl8 = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
const cone6 = new THREE.ConeGeometry(0.5, 1, 6);
const sphere8 = new THREE.SphereGeometry(0.5, 8, 8);

function Mat({
  color,
  emissive,
  emissiveIntensity = 0,
}: {
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
}) {
  return (
    <meshLambertMaterial
      color={color}
      emissive={emissive || '#000000'}
      emissiveIntensity={emissiveIntensity}
      flatShading
    />
  );
}

function teamBody(mine: boolean, ally: string, enemy: string) {
  return mine ? ally : enemy;
}

export function UnitModel({
  avatar,
  mine,
  anim,
  attackAnim,
  hitFlash,
  flying,
  attackTarget,
}: ModelProps) {
  const group = useRef<THREE.Group>(null);
  const attacking = attackAnim > 0;
  const walking = anim === 'walk';

  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    const t = clock.elapsedTime;
    const bob = walking ? Math.sin(t * 9) * 0.035 : Math.sin(t * 2) * 0.012;
    const fly = flying ? 0.38 + Math.sin(t * 2.8) * 0.05 : 0;
    const punch = attacking ? 0.08 : 0;
    g.position.y = bob + fly + punch;
    if (hitFlash > 0) g.scale.setScalar(1.06);
    else if (g.scale.x !== 1) g.scale.setScalar(1);
  });

  const id = (avatar || 'knight') as AvatarId;

  return (
    <group ref={group}>
      {id === 'knight' && <Knight mine={mine} attacking={attacking} />}
      {id === 'goblin' && <Goblin mine={mine} attacking={attacking} />}
      {id === 'archer' && <Archer mine={mine} attacking={attacking} />}
      {id === 'giant' && <Giant mine={mine} attacking={attacking} />}
      {id === 'wizard' && <Wizard mine={mine} attacking={attacking} />}
      {id === 'dragon' && <Dragon mine={mine} attacking={attacking} attackTarget={attackTarget} />}
      {id === 'tower' && <BuildTower mine={mine} attacking={attacking} />}
      {id === 'king' && <KingTower mine={mine} attacking={attacking} />}
      {id === 'princess' && <PrincessTower mine={mine} attacking={attacking} />}
      {id === 'fireball' && <FireballCard />}
      {!['knight', 'goblin', 'archer', 'giant', 'wizard', 'dragon', 'tower', 'king', 'princess', 'fireball'].includes(id) && (
        <Knight mine={mine} attacking={attacking} />
      )}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} geometry={cyl8} scale={[0.55, 0.02, 0.55]}>
        <meshBasicMaterial color={mine ? '#38bdf8' : '#f43f5e'} transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

function Knight({ mine, attacking }: { mine: boolean; attacking: boolean }) {
  const armor = teamBody(mine, '#94a3b8', '#e11d48');
  return (
    <group scale={0.95}>
      <mesh geometry={box} position={[-0.1, 0.14, 0]} scale={[0.12, 0.28, 0.12]}>
        <Mat color="#0f172a" />
      </mesh>
      <mesh geometry={box} position={[0.1, 0.14, 0]} scale={[0.12, 0.28, 0.12]}>
        <Mat color="#0f172a" />
      </mesh>
      <mesh geometry={box} position={[0, 0.42, 0]} scale={[0.42, 0.48, 0.3]}>
        <Mat color={armor} />
      </mesh>
      <mesh geometry={box} position={[0, 0.42, -0.12]} scale={[0.36, 0.4, 0.08]}>
        <Mat color="#334155" />
      </mesh>
      <mesh geometry={box} position={[-0.28, 0.48, 0.02]} scale={[0.14, 0.14, 0.2]}>
        <Mat color={armor} />
      </mesh>
      <mesh geometry={box} position={[0.28, 0.48, 0.02]} scale={[0.14, 0.14, 0.2]}>
        <Mat color={armor} />
      </mesh>
      <mesh geometry={sphere8} position={[0, 0.74, 0]} scale={0.3}>
        <Mat color="#fbbf24" />
      </mesh>
      <mesh geometry={box} position={[0, 0.88, 0]} scale={[0.28, 0.14, 0.28]}>
        <Mat color="#64748b" />
      </mesh>
      <mesh geometry={box} position={[0, 0.82, 0.12]} scale={[0.2, 0.06, 0.04]}>
        <Mat color="#0f172a" />
      </mesh>
      <mesh geometry={box} position={[-0.28, 0.4, 0.12]} scale={[0.2, 0.32, 0.06]}>
        <Mat color="#2563eb" />
      </mesh>
      <group position={[0.32, 0.45, 0]} rotation={[0, 0, attacking ? -1.0 : -0.35]}>
        <mesh geometry={box} scale={[0.07, 0.55, 0.07]}>
          <Mat color="#e2e8f0" />
        </mesh>
        <mesh geometry={box} position={[0, 0.32, 0]} scale={[0.16, 0.1, 0.04]}>
          <Mat color="#cbd5e1" />
        </mesh>
      </group>
    </group>
  );
}

function Goblin({ mine, attacking }: { mine: boolean; attacking: boolean }) {
  const skin = teamBody(mine, '#4ade80', '#86efac');
  return (
    <group scale={0.78}>
      <mesh geometry={box} position={[-0.08, 0.1, 0]} scale={[0.1, 0.2, 0.1]}>
        <Mat color="#166534" />
      </mesh>
      <mesh geometry={box} position={[0.08, 0.1, 0]} scale={[0.1, 0.2, 0.1]}>
        <Mat color="#166534" />
      </mesh>
      <mesh geometry={box} position={[0, 0.32, 0]} scale={[0.32, 0.34, 0.24]}>
        <Mat color={skin} />
      </mesh>
      <mesh geometry={sphere8} position={[0, 0.58, 0]} scale={0.28}>
        <Mat color="#22c55e" />
      </mesh>
      <mesh geometry={cone6} position={[-0.14, 0.68, 0]} rotation={[0, 0, 0.5]} scale={[0.1, 0.22, 0.1]}>
        <Mat color="#15803d" />
      </mesh>
      <mesh geometry={cone6} position={[0.14, 0.68, 0]} rotation={[0, 0, -0.5]} scale={[0.1, 0.22, 0.1]}>
        <Mat color="#15803d" />
      </mesh>
      <mesh geometry={box} position={[-0.08, 0.56, 0.12]} scale={[0.06, 0.06, 0.04]}>
        <Mat color="#fef08a" />
      </mesh>
      <mesh geometry={box} position={[0.08, 0.56, 0.12]} scale={[0.06, 0.06, 0.04]}>
        <Mat color="#fef08a" />
      </mesh>
      <group position={[0.24, 0.38, 0]} rotation={[0, 0, attacking ? -1.2 : -0.55]}>
        <mesh geometry={cyl6} scale={[0.05, 0.55, 0.05]}>
          <Mat color="#a16207" />
        </mesh>
        <mesh geometry={cone6} position={[0, 0.32, 0]} scale={[0.08, 0.14, 0.08]}>
          <Mat color="#e2e8f0" />
        </mesh>
      </group>
    </group>
  );
}

function Archer({ mine, attacking }: { mine: boolean; attacking: boolean }) {
  const cloak = teamBody(mine, '#0e7490', '#be123c');
  return (
    <group scale={0.88}>
      <mesh geometry={box} position={[-0.08, 0.12, 0]} scale={[0.1, 0.24, 0.1]}>
        <Mat color="#134e4a" />
      </mesh>
      <mesh geometry={box} position={[0.08, 0.12, 0]} scale={[0.1, 0.24, 0.1]}>
        <Mat color="#134e4a" />
      </mesh>
      <mesh geometry={box} position={[0, 0.38, 0]} scale={[0.32, 0.42, 0.24]}>
        <Mat color={cloak} />
      </mesh>
      <mesh geometry={sphere8} position={[0, 0.68, 0]} scale={0.26}>
        <Mat color="#fbbf24" />
      </mesh>
      <mesh geometry={cone6} position={[0, 0.82, 0]} scale={[0.32, 0.28, 0.32]}>
        <Mat color="#155e75" />
      </mesh>
      <mesh geometry={box} position={[0.22, 0.42, 0]} rotation={[0, 0, attacking ? 0.15 : 0]} scale={[0.04, 0.38, 0.04]}>
        <Mat color="#78350f" />
      </mesh>
      <mesh geometry={box} position={[0.22, 0.55, 0.08]} scale={[0.04, 0.04, 0.22]}>
        <Mat color="#a16207" />
      </mesh>
      <mesh geometry={box} position={[0.22, 0.32, 0.08]} scale={[0.04, 0.04, 0.22]}>
        <Mat color="#a16207" />
      </mesh>
    </group>
  );
}

function Giant({ mine, attacking }: { mine: boolean; attacking: boolean }) {
  const body = teamBody(mine, '#fb7185', '#e11d48');
  const armScale = attacking ? 1.12 : 1;
  return (
    <group scale={1.28}>
      <mesh geometry={box} position={[-0.14, 0.16, 0]} scale={[0.16, 0.3, 0.16]}>
        <Mat color="#9f1239" />
      </mesh>
      <mesh geometry={box} position={[0.14, 0.16, 0]} scale={[0.16, 0.3, 0.16]}>
        <Mat color="#9f1239" />
      </mesh>
      <mesh geometry={box} position={[0, 0.52, 0]} scale={[0.58, 0.58, 0.42]}>
        <Mat color={body} />
      </mesh>
      <mesh geometry={sphere8} position={[0, 0.95, 0]} scale={0.42}>
        <Mat color="#fecdd3" />
      </mesh>
      <mesh geometry={box} position={[0, 1.05, 0.12]} scale={[0.28, 0.08, 0.08]}>
        <Mat color="#881337" />
      </mesh>
      <mesh geometry={box} position={[-0.38, 0.55, 0]} scale={[0.22 * armScale, 0.42, 0.22]}>
        <Mat color={body} />
      </mesh>
      <mesh geometry={box} position={[0.38, 0.55, 0]} scale={[0.22 * armScale, 0.42, 0.22]}>
        <Mat color={body} />
      </mesh>
    </group>
  );
}

function Wizard({ mine, attacking }: { mine: boolean; attacking: boolean }) {
  const robe = teamBody(mine, '#7c3aed', '#a21caf');
  return (
    <group scale={0.92}>
      <mesh geometry={cone6} position={[0, 0.38, 0]} scale={[0.55, 0.7, 0.55]}>
        <Mat color={robe} />
      </mesh>
      <mesh geometry={sphere8} position={[0, 0.72, 0]} scale={0.28}>
        <Mat color="#fde68a" />
      </mesh>
      <mesh geometry={cone6} position={[0, 0.98, 0]} scale={[0.38, 0.4, 0.38]}>
        <Mat color="#5b21b6" />
      </mesh>
      <mesh geometry={cyl6} position={[0.3, 0.48, 0]} scale={[0.05, 0.65, 0.05]}>
        <Mat color="#92400e" />
      </mesh>
      <mesh geometry={sphere8} position={[0.3, 0.82, 0]} scale={attacking ? 0.22 : 0.16}>
        <Mat color="#e9d5ff" emissive="#a855f7" emissiveIntensity={attacking ? 1.1 : 0.35} />
      </mesh>
    </group>
  );
}

function Dragon({
  mine,
  attacking,
  attackTarget,
}: {
  mine: boolean;
  attacking: boolean;
  attackTarget?: { x: number; z: number } | null;
}) {
  const body = teamBody(mine, '#ef4444', '#991b1b');
  const breathDir = useMemo(() => {
    if (!attackTarget) return new THREE.Vector3(0, 0, 1);
    return new THREE.Vector3(attackTarget.x, 0.15, attackTarget.z).normalize();
  }, [attackTarget]);

  return (
    <group scale={1.08}>
      <mesh geometry={sphere8} position={[0, 0.38, 0]} scale={0.55}>
        <Mat color={body} />
      </mesh>
      <mesh geometry={sphere8} position={[0.08, 0.32, 0.12]} scale={0.34}>
        <Mat color="#fecaca" />
      </mesh>
      <mesh geometry={sphere8} position={[0.28, 0.48, -0.02]} scale={0.32}>
        <Mat color={body} />
      </mesh>
      <mesh geometry={cone6} position={[0.38, 0.52, 0.08]} rotation={[1.2, 0, 0]} scale={[0.12, 0.22, 0.12]}>
        <Mat color="#7f1d1d" />
      </mesh>
      <mesh geometry={box} position={[-0.38, 0.42, 0]} rotation={[0.25, 0, 0.35]} scale={[0.55, 0.06, 0.38]}>
        <Mat color="#7f1d1d" />
      </mesh>
      <mesh geometry={box} position={[-0.38, 0.42, 0]} rotation={[-0.25, 0, -0.35]} scale={[0.55, 0.06, 0.38]}>
        <Mat color="#7f1d1d" />
      </mesh>
      <mesh geometry={cone6} position={[0.08, 0.62, -0.12]} scale={[0.08, 0.16, 0.08]}>
        <Mat color="#fef3c7" />
      </mesh>
      <mesh geometry={cone6} position={[-0.05, 0.2, -0.28]} rotation={[1.1, 0, 0]} scale={[0.12, 0.35, 0.12]}>
        <Mat color={body} />
      </mesh>
      {attacking && (
        <mesh
          geometry={cone6}
          position={[breathDir.x * 0.5, 0.42 + breathDir.y * 0.15, breathDir.z * 0.5]}
          scale={[0.22, 0.75, 0.22]}
        >
          <Mat color="#f97316" emissive="#fb923c" emissiveIntensity={1.2} />
        </mesh>
      )}
    </group>
  );
}

/** Cannon / card tower — stone cylinder + barrel. */
function BuildTower({ mine, attacking }: { mine: boolean; attacking: boolean }) {
  const mid = teamBody(mine, '#d6d3d1', '#9f1239');
  return (
    <group>
      <mesh geometry={cyl8} position={[0, 0.14, 0]} scale={[0.62, 0.28, 0.62]}>
        <Mat color="#57534e" />
      </mesh>
      <mesh geometry={cyl8} position={[0, 0.48, 0]} scale={[0.48, 0.5, 0.48]}>
        <Mat color={mid} />
      </mesh>
      <mesh geometry={cyl8} position={[0, 0.78, 0]} scale={[0.56, 0.12, 0.56]}>
        <Mat color="#44403c" />
      </mesh>
      <mesh geometry={box} position={[0, 0.88, 0.18]} scale={[0.12, 0.22, 0.28]}>
        <Mat color="#1c1917" emissive={attacking ? '#fbbf24' : undefined} emissiveIntensity={attacking ? 0.9 : 0} />
      </mesh>
    </group>
  );
}

/**
 * King tower — matches ArenaSprites CSS: wide base, stone body,
 * battlements, gold crown, red flag, cannon port.
 */
function KingTower({ mine, attacking }: { mine: boolean; attacking: boolean }) {
  const body = teamBody(mine, '#e7e5e4', '#9f1239');
  const accent = mine ? '#38bdf8' : '#f43f5e';
  return (
    <group scale={1.45}>
      {/* base plinth */}
      <mesh geometry={box} position={[0, 0.12, 0]} scale={[0.85, 0.24, 0.85]}>
        <Mat color="#44403c" />
      </mesh>
      <mesh geometry={box} position={[0, 0.22, 0]} scale={[0.78, 0.08, 0.78]}>
        <Mat color="#a8a29e" />
      </mesh>
      {/* main keep */}
      <mesh geometry={box} position={[0, 0.62, 0]} scale={[0.62, 0.72, 0.62]}>
        <Mat color={body} />
      </mesh>
      {/* team stripe */}
      <mesh geometry={box} position={[0, 0.55, 0.32]} scale={[0.5, 0.1, 0.04]}>
        <Mat color={accent} />
      </mesh>
      {/* window / door */}
      <mesh geometry={box} position={[0, 0.4, 0.33]} scale={[0.16, 0.22, 0.04]}>
        <Mat color="#1c1917" />
      </mesh>
      {/* ledge */}
      <mesh geometry={box} position={[0, 1.0, 0]} scale={[0.72, 0.08, 0.72]}>
        <Mat color="#57534e" />
      </mesh>
      {/* battlements (crenellations) */}
      {[-0.28, -0.1, 0.1, 0.28].map((x) => (
        <mesh key={`f${x}`} geometry={box} position={[x, 1.12, 0.3]} scale={[0.12, 0.16, 0.1]}>
          <Mat color="#57534e" />
        </mesh>
      ))}
      {[-0.28, -0.1, 0.1, 0.28].map((x) => (
        <mesh key={`b${x}`} geometry={box} position={[x, 1.12, -0.3]} scale={[0.12, 0.16, 0.1]}>
          <Mat color="#57534e" />
        </mesh>
      ))}
      {[-0.28, 0.28].map((z) => (
        <mesh key={`s${z}`} geometry={box} position={[0.3, 1.12, z]} scale={[0.1, 0.16, 0.12]}>
          <Mat color="#57534e" />
        </mesh>
      ))}
      {[-0.28, 0.28].map((z) => (
        <mesh key={`s2${z}`} geometry={box} position={[-0.3, 1.12, z]} scale={[0.1, 0.16, 0.12]}>
          <Mat color="#57534e" />
        </mesh>
      ))}
      {/* gold crown */}
      <mesh geometry={cone6} position={[0, 1.38, 0]} scale={[0.28, 0.28, 0.28]}>
        <Mat color="#fbbf24" />
      </mesh>
      <mesh geometry={box} position={[-0.1, 1.48, 0]} scale={[0.06, 0.12, 0.06]}>
        <Mat color="#fde68a" />
      </mesh>
      <mesh geometry={box} position={[0.1, 1.48, 0]} scale={[0.06, 0.12, 0.06]}>
        <Mat color="#fde68a" />
      </mesh>
      <mesh geometry={box} position={[0, 1.52, 0]} scale={[0.06, 0.14, 0.06]}>
        <Mat color="#fde68a" />
      </mesh>
      {/* flag pole + red flag */}
      <mesh geometry={cyl6} position={[0.28, 1.35, -0.1]} scale={[0.03, 0.4, 0.03]}>
        <Mat color="#78716c" />
      </mesh>
      <mesh geometry={box} position={[0.4, 1.45, -0.1]} scale={[0.22, 0.14, 0.04]}>
        <Mat color="#ef4444" />
      </mesh>
      {/* cannon */}
      <mesh geometry={box} position={[0, 0.78, 0.38]} scale={[0.14, 0.12, 0.28]}>
        <Mat color="#1c1917" emissive={attacking ? '#fde68a' : undefined} emissiveIntensity={attacking ? 1 : 0} />
      </mesh>
      {attacking && (
        <mesh geometry={sphere8} position={[0, 0.78, 0.58]} scale={0.12}>
          <Mat color="#fef3c7" emissive="#fbbf24" emissiveIntensity={1.2} />
        </mesh>
      )}
    </group>
  );
}

/**
 * Princess tower — tall thin shaft, gold band, top platform, archer on roof.
 */
function PrincessTower({ mine, attacking }: { mine: boolean; attacking: boolean }) {
  const shaft = teamBody(mine, '#d6d3d1', '#9f1239');
  const accent = mine ? '#38bdf8' : '#f43f5e';
  return (
    <group scale={1.2}>
      <mesh geometry={cyl8} position={[0, 0.12, 0]} scale={[0.58, 0.22, 0.58]}>
        <Mat color="#44403c" />
      </mesh>
      <mesh geometry={cyl8} position={[0, 0.22, 0]} scale={[0.52, 0.08, 0.52]}>
        <Mat color="#a8a29e" />
      </mesh>
      {/* shaft */}
      <mesh geometry={cyl8} position={[0, 0.58, 0]} scale={[0.38, 0.65, 0.38]}>
        <Mat color={shaft} />
      </mesh>
      {/* gold band */}
      <mesh geometry={cyl8} position={[0, 0.5, 0]} scale={[0.42, 0.08, 0.42]}>
        <Mat color="#a16207" />
      </mesh>
      {/* team stripe */}
      <mesh geometry={box} position={[0, 0.7, 0.2]} scale={[0.28, 0.08, 0.03]}>
        <Mat color={accent} />
      </mesh>
      {/* top platform */}
      <mesh geometry={cyl8} position={[0, 0.95, 0]} scale={[0.5, 0.12, 0.5]}>
        <Mat color="#44403c" />
      </mesh>
      {/* merlons */}
      {[-0.18, 0.18].map((x) => (
        <mesh key={`m${x}`} geometry={box} position={[x, 1.08, 0.18]} scale={[0.1, 0.14, 0.08]}>
          <Mat color="#57534e" />
        </mesh>
      ))}
      {/* archer on top */}
      <mesh geometry={box} position={[0, 1.12, 0]} scale={[0.16, 0.2, 0.12]}>
        <Mat color="#0e7490" />
      </mesh>
      <mesh geometry={sphere8} position={[0, 1.28, 0]} scale={0.18}>
        <Mat color="#fde68a" />
      </mesh>
      <mesh geometry={cone6} position={[0, 1.4, 0]} scale={[0.16, 0.14, 0.16]}>
        <Mat color="#155e75" />
      </mesh>
      {/* bow */}
      <mesh geometry={box} position={[0.14, 1.18, 0.08]} rotation={[0, 0, attacking ? 0.2 : 0]} scale={[0.04, 0.22, 0.04]}>
        <Mat color="#78350f" />
      </mesh>
      {attacking && (
        <mesh geometry={box} position={[0.28, 1.2, 0.2]} scale={[0.04, 0.04, 0.28]}>
          <Mat color="#fef3c7" emissive="#fbbf24" emissiveIntensity={0.8} />
        </mesh>
      )}
    </group>
  );
}

function FireballCard() {
  return (
    <mesh geometry={sphere8} scale={0.48}>
      <Mat color="#f97316" emissive="#fb923c" emissiveIntensity={0.85} />
    </mesh>
  );
}

export function ProjectileMesh({ style, angle }: { style: string; angle: number }) {
  const rot = -angle + Math.PI / 2;
  if (style === 'arrow') {
    return (
      <group rotation={[0, rot, 0]}>
        <mesh geometry={cyl6} scale={[0.035, 0.32, 0.035]}>
          <Mat color="#fef3c7" />
        </mesh>
        <mesh geometry={cone6} position={[0, 0.2, 0]} scale={[0.08, 0.12, 0.08]}>
          <Mat color="#fbbf24" />
        </mesh>
      </group>
    );
  }
  if (style === 'fire') {
    return (
      <mesh geometry={sphere8} scale={0.22}>
        <Mat color="#f97316" emissive="#fb923c" emissiveIntensity={1.1} />
      </mesh>
    );
  }
  if (style === 'cannon') {
    return (
      <mesh geometry={sphere8} scale={0.16}>
        <Mat color="#57534e" />
      </mesh>
    );
  }
  return (
    <mesh geometry={sphere8} scale={0.18}>
      <Mat color="#c084fc" emissive="#a855f7" emissiveIntensity={0.85} />
    </mesh>
  );
}
