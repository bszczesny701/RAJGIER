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
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, h * 0.25]}>
        <planeGeometry args={[w, h * 0.5 - riverDepth]} />
        <meshBasicMaterial color="#15803d" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -h * 0.25]}>
        <planeGeometry args={[w, h * 0.5 - riverDepth]} />
        <meshBasicMaterial color="#166534" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, riverZ]}>
        <planeGeometry args={[w, riverDepth]} />
        <meshBasicMaterial color="#1d4ed8" />
      </mesh>
      {BRIDGES.map((b) => {
        const { x, z } = arenaToWorld(b.x, RIVER_Y);
        return (
          <mesh key={b.id} position={[x, 0.08, z]}>
            <boxGeometry args={[b.halfW * 2 * WORLD_SCALE, 0.12, riverDepth + 0.15]} />
            <meshLambertMaterial color="#a16207" flatShading />
          </mesh>
        );
      })}
      {/* bridge rails */}
      {BRIDGES.map((b) => {
        const { x, z } = arenaToWorld(b.x, RIVER_Y);
        const hw = b.halfW * WORLD_SCALE;
        return (
          <group key={`${b.id}-rails`}>
            <mesh position={[x - hw + 0.04, 0.16, z]}>
              <boxGeometry args={[0.06, 0.1, riverDepth + 0.1]} />
              <meshBasicMaterial color="#78350f" />
            </mesh>
            <mesh position={[x + hw - 0.04, 0.16, z]}>
              <boxGeometry args={[0.06, 0.1, riverDepth + 0.1]} />
              <meshBasicMaterial color="#78350f" />
            </mesh>
          </group>
        );
      })}
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
              <boxGeometry args={[0.45, 0.14, 0.45]} />
              <meshBasicMaterial color="#292524" />
            </mesh>
          );
        }
        if (!t.alive) return null;
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
              <coneGeometry args={[0.16, len, 6]} />
              <meshBasicMaterial
                color="#f97316"
                transparent
                opacity={Math.min(1, e.ttl * 2.5)}
              />
            </mesh>
          );
        }
        const r = (e.radius || 1) * WORLD_SCALE;
        return (
          <mesh key={e.id} position={[p.x, 0.18, p.z]}>
            <sphereGeometry args={[r, 8, 8]} />
            <meshBasicMaterial
              color={e.type.includes('fire') ? '#f97316' : '#e2e8f0'}
              transparent
              opacity={Math.min(0.45, e.ttl)}
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
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

function SceneInner(props: ArenaSceneProps) {
  return (
    <>
      <color attach="background" args={['#071a10']} />
      <ambientLight intensity={0.95} />
      <directionalLight position={[5, 10, 4]} intensity={0.55} />
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
          shadows={false}
          dpr={[1, 1.25]}
          gl={{
            antialias: false,
            alpha: false,
            powerPreference: 'high-performance',
            stencil: false,
            depth: true,
          }}
          camera={{ position: [0, 12, 8.2], fov: 40, near: 0.2, far: 60 }}
          performance={{ min: 0.5 }}
          onCreated={({ camera, gl }) => {
            camera.lookAt(0, 0, 0);
            gl.setClearColor('#071a10');
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
