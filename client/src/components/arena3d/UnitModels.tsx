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

function teamColor(mine: boolean, ally: string, enemy: string) {
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
    const bob = walking ? Math.sin(t * 10) * 0.04 : Math.sin(t * 2.2) * 0.015;
    const fly = flying ? 0.35 + Math.sin(t * 3) * 0.06 : 0;
    const punch = attacking ? Math.sin(Math.min(1, attackAnim * 8) * Math.PI) * 0.12 : 0;
    g.position.y = bob + fly + punch;
    g.rotation.y = attacking ? Math.sin(t * 20) * 0.08 : 0;
    g.scale.setScalar(hitFlash > 0 ? 1.08 : 1);
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
      {/* team ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.22, 0.28, 24]} />
        <meshBasicMaterial color={mine ? '#38bdf8' : '#f43f5e'} transparent opacity={0.85} />
      </mesh>
    </group>
  );
}

function Knight({ mine, attacking }: { mine: boolean; attacking: boolean }) {
  const armor = teamColor(mine, '#94a3b8', '#fb7185');
  return (
    <group scale={0.9}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[0.38, 0.45, 0.28]} />
        <meshStandardMaterial color={armor} metalness={0.55} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.7, 0]} castShadow>
        <sphereGeometry args={[0.16, 12, 12]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>
      <mesh position={[0, 0.82, 0]}>
        <boxGeometry args={[0.22, 0.12, 0.22]} />
        <meshStandardMaterial color="#64748b" metalness={0.7} />
      </mesh>
      <mesh position={[0.28, 0.4, 0]} rotation={[0, 0, attacking ? -0.8 : -0.3]}>
        <boxGeometry args={[0.08, 0.45, 0.08]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.8} />
      </mesh>
      <mesh position={[-0.26, 0.35, 0.08]}>
        <boxGeometry args={[0.18, 0.28, 0.06]} />
        <meshStandardMaterial color="#3b82f6" />
      </mesh>
      <mesh position={[-0.1, 0.12, 0]}>
        <boxGeometry args={[0.12, 0.22, 0.12]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0.1, 0.12, 0]}>
        <boxGeometry args={[0.12, 0.22, 0.12]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
    </group>
  );
}

function Goblin({ mine, attacking }: { mine: boolean; attacking: boolean }) {
  const skin = teamColor(mine, '#4ade80', '#86efac');
  return (
    <group scale={0.75}>
      <mesh position={[0, 0.28, 0]} castShadow>
        <boxGeometry args={[0.28, 0.32, 0.22]} />
        <meshStandardMaterial color={skin} />
      </mesh>
      <mesh position={[0, 0.55, 0]} castShadow>
        <sphereGeometry args={[0.14, 10, 10]} />
        <meshStandardMaterial color="#22c55e" />
      </mesh>
      <mesh position={[-0.12, 0.62, 0]} rotation={[0, 0, 0.4]}>
        <coneGeometry args={[0.05, 0.14, 6]} />
        <meshStandardMaterial color="#16a34a" />
      </mesh>
      <mesh position={[0.12, 0.62, 0]} rotation={[0, 0, -0.4]}>
        <coneGeometry args={[0.05, 0.14, 6]} />
        <meshStandardMaterial color="#16a34a" />
      </mesh>
      <mesh position={[0.22, 0.35, 0]} rotation={[0, 0, attacking ? -1.1 : -0.5]}>
        <cylinderGeometry args={[0.03, 0.03, 0.5, 6]} />
        <meshStandardMaterial color="#a16207" />
      </mesh>
    </group>
  );
}

function Archer({ mine, attacking }: { mine: boolean; attacking: boolean }) {
  const cloak = teamColor(mine, '#0891b2', '#e11d48');
  return (
    <group scale={0.85}>
      <mesh position={[0, 0.32, 0]} castShadow>
        <boxGeometry args={[0.3, 0.4, 0.22]} />
        <meshStandardMaterial color={cloak} />
      </mesh>
      <mesh position={[0, 0.62, 0]} castShadow>
        <sphereGeometry args={[0.13, 10, 10]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>
      <mesh position={[0, 0.72, 0]}>
        <coneGeometry args={[0.16, 0.18, 8]} />
        <meshStandardMaterial color="#0e7490" />
      </mesh>
      <mesh position={[0.2, 0.4, 0]} rotation={[0, 0, attacking ? 0.2 : 0]}>
        <torusGeometry args={[0.16, 0.025, 6, 12, Math.PI]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>
    </group>
  );
}

function Giant({ mine, attacking }: { mine: boolean; attacking: boolean }) {
  const body = teamColor(mine, '#fb7185', '#f43f5e');
  return (
    <group scale={1.25}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[0.55, 0.55, 0.4]} />
        <meshStandardMaterial color={body} />
      </mesh>
      <mesh position={[0, 0.85, 0]} castShadow>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshStandardMaterial color="#fecdd3" />
      </mesh>
      <mesh position={[-0.32, 0.5, 0]} scale={attacking ? 1.1 : 1}>
        <boxGeometry args={[0.2, 0.4, 0.2]} />
        <meshStandardMaterial color={body} />
      </mesh>
      <mesh position={[0.32, 0.5, 0]} scale={attacking ? 1.1 : 1}>
        <boxGeometry args={[0.2, 0.4, 0.2]} />
        <meshStandardMaterial color={body} />
      </mesh>
    </group>
  );
}

function Wizard({ mine, attacking }: { mine: boolean; attacking: boolean }) {
  const robe = teamColor(mine, '#7c3aed', '#c026d3');
  return (
    <group scale={0.9}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <coneGeometry args={[0.28, 0.55, 8]} />
        <meshStandardMaterial color={robe} />
      </mesh>
      <mesh position={[0, 0.7, 0]} castShadow>
        <sphereGeometry args={[0.14, 10, 10]} />
        <meshStandardMaterial color="#fde68a" />
      </mesh>
      <mesh position={[0, 0.92, 0]}>
        <coneGeometry args={[0.2, 0.28, 6]} />
        <meshStandardMaterial color="#5b21b6" />
      </mesh>
      <mesh position={[0.28, 0.45, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.55, 6]} />
        <meshStandardMaterial color="#a16207" />
      </mesh>
      <mesh position={[0.28, 0.75, 0]}>
        <sphereGeometry args={[attacking ? 0.12 : 0.08, 10, 10]} />
        <meshStandardMaterial color="#e9d5ff" emissive="#a855f7" emissiveIntensity={attacking ? 1.2 : 0.4} />
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
  const body = teamColor(mine, '#ef4444', '#b91c1c');
  const breathDir = useMemo(() => {
    if (!attackTarget) return new THREE.Vector3(0, 0, 1);
    return new THREE.Vector3(attackTarget.x, 0.2, attackTarget.z).normalize();
  }, [attackTarget]);

  return (
    <group scale={1.05}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <sphereGeometry args={[0.28, 12, 12]} />
        <meshStandardMaterial color={body} />
      </mesh>
      <mesh position={[0, 0.28, 0.05]}>
        <sphereGeometry args={[0.18, 10, 10]} />
        <meshStandardMaterial color="#fecaca" />
      </mesh>
      <mesh position={[0.22, 0.45, -0.05]} castShadow>
        <sphereGeometry args={[0.16, 10, 10]} />
        <meshStandardMaterial color={body} />
      </mesh>
      <mesh position={[-0.35, 0.4, 0]} rotation={[0.2, 0, 0.4]} castShadow>
        <boxGeometry args={[0.5, 0.08, 0.35]} />
        <meshStandardMaterial color="#991b1b" />
      </mesh>
      <mesh position={[-0.35, 0.4, 0]} rotation={[-0.2, 0, -0.4]} castShadow>
        <boxGeometry args={[0.5, 0.08, 0.35]} />
        <meshStandardMaterial color="#991b1b" />
      </mesh>
      <mesh position={[0.05, 0.55, -0.12]}>
        <coneGeometry args={[0.04, 0.12, 5]} />
        <meshStandardMaterial color="#fef3c7" />
      </mesh>
      {attacking && (
        <mesh
          position={[
            breathDir.x * 0.45,
            0.4 + breathDir.y * 0.2,
            breathDir.z * 0.45,
          ]}
        >
          <coneGeometry args={[0.12, 0.7, 8]} />
          <meshStandardMaterial
            color="#f97316"
            emissive="#fb923c"
            emissiveIntensity={1.4}
            transparent
            opacity={0.85}
          />
        </mesh>
      )}
    </group>
  );
}

function BuildTower({ mine, attacking }: { mine: boolean; attacking: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.34, 0.3, 8]} />
        <meshStandardMaterial color="#78716c" />
      </mesh>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.26, 0.45, 8]} />
        <meshStandardMaterial color={mine ? '#a8a29e' : '#9f1239'} />
      </mesh>
      <mesh position={[0, 0.78, 0.18]}>
        <boxGeometry args={[0.1, 0.1, 0.25]} />
        <meshStandardMaterial color="#1c1917" emissive={attacking ? '#fbbf24' : '#000'} emissiveIntensity={attacking ? 0.8 : 0} />
      </mesh>
    </group>
  );
}

function KingTower({ mine, attacking }: { mine: boolean; attacking: boolean }) {
  return (
    <group scale={1.35}>
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.7, 0.35, 0.7]} />
        <meshStandardMaterial color="#57534e" />
      </mesh>
      <mesh position={[0, 0.65, 0]} castShadow>
        <boxGeometry args={[0.55, 0.7, 0.55]} />
        <meshStandardMaterial color={mine ? '#d6d3d1' : '#881337'} />
      </mesh>
      <mesh position={[0, 1.05, 0]}>
        <boxGeometry args={[0.65, 0.12, 0.65]} />
        <meshStandardMaterial color="#44403c" />
      </mesh>
      <mesh position={[0, 1.2, 0]}>
        <coneGeometry args={[0.12, 0.2, 5]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.7, 0.3]}>
        <boxGeometry args={[0.12, 0.12, 0.2]} />
        <meshStandardMaterial color="#1c1917" emissive={attacking ? '#fde68a' : '#000'} emissiveIntensity={attacking ? 1 : 0} />
      </mesh>
    </group>
  );
}

function PrincessTower({ mine, attacking }: { mine: boolean; attacking: boolean }) {
  return (
    <group scale={1.1}>
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.3, 0.25, 8]} />
        <meshStandardMaterial color="#57534e" />
      </mesh>
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.22, 0.55, 8]} />
        <meshStandardMaterial color={mine ? '#a8a29e' : '#9f1239'} />
      </mesh>
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.24, 0.24, 0.12, 8]} />
        <meshStandardMaterial color="#44403c" />
      </mesh>
      <mesh position={[0, 1.05, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>
      {attacking && (
        <mesh position={[0, 0.95, 0.25]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color="#fef3c7" emissive="#fbbf24" emissiveIntensity={1} />
        </mesh>
      )}
    </group>
  );
}

function FireballCard() {
  return (
    <mesh>
      <sphereGeometry args={[0.25, 12, 12]} />
      <meshStandardMaterial color="#f97316" emissive="#fb923c" emissiveIntensity={0.8} />
    </mesh>
  );
}

export function ProjectileMesh({
  style,
  angle,
}: {
  style: string;
  angle: number;
}) {
  // angle in arena space; convert for XZ plane
  const rot = -angle + Math.PI / 2;
  if (style === 'arrow') {
    return (
      <group rotation={[0, rot, 0]}>
        <mesh>
          <cylinderGeometry args={[0.02, 0.02, 0.35, 6]} />
          <meshStandardMaterial color="#fef3c7" />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <coneGeometry args={[0.05, 0.1, 6]} />
          <meshStandardMaterial color="#fbbf24" />
        </mesh>
      </group>
    );
  }
  if (style === 'fire') {
    return (
      <mesh>
        <sphereGeometry args={[0.12, 10, 10]} />
        <meshStandardMaterial color="#f97316" emissive="#fb923c" emissiveIntensity={1.2} />
      </mesh>
    );
  }
  if (style === 'cannon') {
    return (
      <mesh>
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshStandardMaterial color="#57534e" metalness={0.6} />
      </mesh>
    );
  }
  return (
    <mesh>
      <sphereGeometry args={[0.1, 10, 10]} />
      <meshStandardMaterial color="#c084fc" emissive="#a855f7" emissiveIntensity={0.9} />
    </mesh>
  );
}
