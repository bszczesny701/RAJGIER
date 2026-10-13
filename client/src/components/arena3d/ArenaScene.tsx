import { Canvas } from '@react-three/fiber';
import { Component, Suspense, type ErrorInfo, type ReactNode } from 'react';
import { arenaToWorld, ARENA_W, ARENA_H, RIVER_Y, RIVER_HALF, BRIDGES, WORLD_SCALE } from './coords';
import { ProjectileMesh, UnitModel, type AvatarId } from './UnitModels';

export interface ArenaSceneUnit {
  id: string;
  avatar: string;
  mine: boolean;
  x: number;
  y: number;
  flying: boolean;
  anim: string;
  attackAnim: number;
  hitFlash: number;
  attackTargetX?: number | null;
  attackTargetY?: number | null;
}

export interface ArenaSceneTower {
  id: string;
  type: 'king' | 'princess';
  mine: boolean;
  x: number;
  y: number;
  alive: boolean;
  attackAnim?: number;
}

export interface ArenaSceneProjectile {
  id: string;
  style: string;
  x: number;
  y: number;
  angle: number;
}

export interface ArenaSceneEffect {
  id: string;
  type: string;
  x: number;
  y: number;
  radius: number;
  ttl: number;
  tx?: number;
  ty?: number;
  angle?: number;
}

export interface ArenaSceneProps {
  arenaW: number;
  arenaH: number;
  units: ArenaSceneUnit[];
  towers: ArenaSceneTower[];
  projectiles: ArenaSceneProjectile[];
  effects: ArenaSceneEffect[];
  onPointerDeploy?: (arenaX: number, arenaY: number) => void;
  targeting?: boolean;
}

class WebGLErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { error: boolean }
> {
  state = { error: false };

  static getDerivedStateFromError() {
    return { error: true };
  }

  componentDidCatch(_e: Error, _info: ErrorInfo) {
    // silent — fallback UI
  }

  render() {
    if (this.state.error) return this.props.fallback;
    return this.props.children;
  }
}

function ArenaGround() {
  const w = ARENA_W * WORLD_SCALE;
  const h = ARENA_H * WORLD_SCALE;
  const riverZ = -(RIVER_Y - ARENA_H / 2) * WORLD_SCALE;
  const riverDepth = RIVER_HALF * 2 * WORLD_SCALE;

  return (
    <group>
      {/* grass halves */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, h * 0.25]} receiveShadow>
        <planeGeometry args={[w, h * 0.5 - riverDepth]} />
        <meshStandardMaterial color="#15803d" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -h * 0.25]} receiveShadow>
        <planeGeometry args={[w, h * 0.5 - riverDepth]} />
        <meshStandardMaterial color="#166534" />
      </mesh>
      {/* river */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, riverZ]} receiveShadow>
        <planeGeometry args={[w, riverDepth]} />
        <meshStandardMaterial color="#2563eb" metalness={0.3} roughness={0.25} />
      </mesh>
      {/* bridges */}
      {BRIDGES.map((b) => {
        const { x, z } = arenaToWorld(b.x, RIVER_Y);
        return (
          <mesh
            key={b.id}
            position={[x, 0.08, z]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[b.halfW * 2 * WORLD_SCALE, 0.12, riverDepth + 0.15]} />
            <meshStandardMaterial color="#a16207" roughness={0.7} />
          </mesh>
        );
      })}
      {/* bank rails */}
      <mesh position={[0, 0.04, riverZ + riverDepth / 2 + 0.05]}>
        <boxGeometry args={[w, 0.06, 0.08]} />
        <meshStandardMaterial color="#14532d" />
      </mesh>
      <mesh position={[0, 0.04, riverZ - riverDepth / 2 - 0.05]}>
        <boxGeometry args={[w, 0.06, 0.08]} />
        <meshStandardMaterial color="#14532d" />
      </mesh>
    </group>
  );
}

function Entities({
  units,
  towers,
  projectiles,
  effects,
}: {
  units: ArenaSceneUnit[];
  towers: ArenaSceneTower[];
  projectiles: ArenaSceneProjectile[];
  effects: ArenaSceneEffect[];
}) {
  return (
    <group>
      {towers.map((t) => {
        if (!t.alive && t.type !== 'king') {
          const p = arenaToWorld(t.x, t.y);
          return (
            <mesh key={t.id} position={[p.x, 0.08, p.z]}>
              <boxGeometry args={[0.35, 0.12, 0.35]} />
              <meshStandardMaterial color="#44403c" />
            </mesh>
          );
        }
        const p = arenaToWorld(t.x, t.y);
        return (
          <group key={t.id} position={[p.x, 0, p.z]}>
            <UnitModel
              avatar={t.type === 'king' ? 'king' : 'princess'}
              mine={t.mine}
              anim="idle"
              attackAnim={t.attackAnim || 0}
              hitFlash={0}
            />
          </group>
        );
      })}

      {units.map((u) => {
        const p = arenaToWorld(u.x, u.y);
        let attackTarget: { x: number; z: number } | null = null;
        if (u.attackAnim > 0 && u.attackTargetX != null && u.attackTargetY != null) {
          const tip = arenaToWorld(u.attackTargetX, u.attackTargetY);
          attackTarget = { x: tip.x - p.x, z: tip.z - p.z };
        }
        return (
          <group key={u.id} position={[p.x, 0, p.z]}>
            <UnitModel
              avatar={u.avatar as AvatarId}
              mine={u.mine}
              anim={u.anim}
              attackAnim={u.attackAnim}
              hitFlash={u.hitFlash}
              flying={u.flying}
              attackTarget={attackTarget}
            />
          </group>
        );
      })}

      {projectiles.map((pr) => {
        const p = arenaToWorld(pr.x, pr.y);
        return (
          <group key={pr.id} position={[p.x, pr.style === 'fire' ? 0.55 : 0.35, p.z]}>
            <ProjectileMesh style={pr.style} angle={pr.angle} />
          </group>
        );
      })}

      {effects.map((e) => {
        const p = arenaToWorld(e.x, e.y);
        if (e.type === 'dragon-breath' && e.tx != null && e.ty != null) {
          const tip = arenaToWorld(e.tx, e.ty);
          const dx = tip.x - p.x;
          const dz = tip.z - p.z;
          const len = Math.sqrt(dx * dx + dz * dz) || 0.1;
          const ang = Math.atan2(dx, dz);
          return (
            <mesh
              key={e.id}
              position={[p.x + dx / 2, 0.45, p.z + dz / 2]}
              rotation={[0, ang, 0]}
            >
              <coneGeometry args={[0.18, len, 8]} />
              <meshStandardMaterial
                color="#f97316"
                emissive="#fb923c"
                emissiveIntensity={1.2}
                transparent
                opacity={Math.min(1, e.ttl * 2.5)}
              />
            </mesh>
          );
        }
        const r = (e.radius || 1) * WORLD_SCALE;
        return (
          <mesh key={e.id} position={[p.x, 0.2, p.z]}>
            <sphereGeometry args={[r, 12, 12]} />
            <meshStandardMaterial
              color={e.type.includes('fire') ? '#f97316' : '#e2e8f0'}
              transparent
              opacity={Math.min(0.55, e.ttl)}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function DeployPlane({
  onDeploy,
  enabled,
}: {
  onDeploy?: (arenaX: number, arenaY: number) => void;
  enabled?: boolean;
}) {
  const w = ARENA_W * WORLD_SCALE;
  const h = ARENA_H * WORLD_SCALE;

  if (!enabled || !onDeploy) return null;

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.12, 0]}
      onPointerUp={(ev) => {
        ev.stopPropagation();
        const lx = ev.point.x / WORLD_SCALE + ARENA_W / 2;
        const ly = -ev.point.z / WORLD_SCALE + ARENA_H / 2;
        onDeploy(lx, ly);
      }}
    >
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}

function SceneInner(props: ArenaSceneProps) {
  return (
    <>
      <color attach="background" args={['#0a1f12']} />
      <ambientLight intensity={0.65} />
      <directionalLight
        castShadow
        position={[4, 12, 6]}
        intensity={1.15}
        shadow-mapSize={[1024, 1024]}
      />
      <hemisphereLight args={['#87ceeb', '#14532d', 0.35]} />
      <ArenaGround />
      <Entities
        units={props.units}
        towers={props.towers}
        projectiles={props.projectiles}
        effects={props.effects}
      />
      <DeployPlane onDeploy={props.onPointerDeploy} enabled={props.targeting} />
    </>
  );
}

export default function ArenaScene(props: ArenaSceneProps) {
  const fallback = (
    <div className="arena-webgl-fallback">
      WebGL niedostępne — odśwież stronę
    </div>
  );

  return (
    <WebGLErrorBoundary fallback={fallback}>
      <div className={`arena-canvas-wrap${props.targeting ? ' targeting' : ''}`}>
        <Canvas
          shadows
          dpr={[1, 1.75]}
          gl={{ antialias: true, alpha: false }}
          camera={{ position: [0, 11.5, 7.5], fov: 42, near: 0.1, far: 80 }}
          onCreated={({ camera }) => {
            camera.lookAt(0, 0, 0);
          }}
        >
          <Suspense fallback={null}>
            <SceneInner {...props} />
          </Suspense>
        </Canvas>
      </div>
    </WebGLErrorBoundary>
  );
}
