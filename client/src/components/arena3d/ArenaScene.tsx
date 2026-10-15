import { Canvas, useFrame } from '@react-three/fiber';
import {
  Component,
  Suspense,
  useEffect,
  useRef,
  type ErrorInfo,
  type MutableRefObject,
  type ReactNode,
} from 'react';
import * as THREE from 'three';
import { arenaToWorld, ARENA_W, ARENA_H, WORLD_SCALE } from './coords';
import {
  createArenaGround,
  createEffectModel,
  createProjectileModel,
  createTowerModel,
  createUnitModel,
  setHpBar,
} from './LiteModels';
import type { FieldSnapshot } from './types';

export type { FieldSnapshot } from './types';

interface ArenaSceneProps {
  stateRef: MutableRefObject<FieldSnapshot | null>;
  targeting?: boolean;
  onDeploy?: (arenaX: number, arenaY: number) => void;
}

class WebGLErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  componentDidCatch(_e: Error, _info: ErrorInfo) {}
  render() {
    if (this.state.error) return this.props.fallback;
    return this.props.children;
  }
}

type Ent = {
  obj: THREE.Object3D;
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  kind: 'unit' | 'tower' | 'proj' | 'fx';
  avatar?: string;
  mine?: boolean;
  flying?: boolean;
  anim?: string;
  attackAnim?: number;
  hitFlash?: number;
  towerType?: 'king' | 'princess';
  alive?: boolean;
  style?: string;
  fxType?: string;
  radius?: number;
};

function BattleWorld({
  stateRef,
  targeting,
  onDeploy,
}: {
  stateRef: MutableRefObject<FieldSnapshot | null>;
  targeting?: boolean;
  onDeploy?: (arenaX: number, arenaY: number) => void;
}) {
  const root = useRef<THREE.Group>(null);
  const ents = useRef(new Map<string, Ent>());
  const groundReady = useRef(false);
  useEffect(() => {
    if (!root.current || groundReady.current) return;
    root.current.add(createArenaGround());
    groundReady.current = true;
  }, []);

  useFrame(({ clock }, dt) => {
    const snap = stateRef.current;
    const group = root.current;
    if (!snap || !group) return;

    const seen = new Set<string>();
    const lerp = 1 - Math.exp(-14 * Math.min(0.05, dt));
    const t = clock.elapsedTime;

    // —— towers ——
    for (const tw of snap.towers) {
      seen.add(tw.id);
      let e = ents.current.get(tw.id);
      const needNew =
        !e ||
        e.kind !== 'tower' ||
        e.alive !== tw.alive ||
        e.towerType !== tw.type ||
        e.mine !== tw.mine;
      if (needNew) {
        if (e) {
          group.remove(e.obj);
          disposeObj(e.obj);
        }
        const obj = createTowerModel(tw.type, tw.mine, tw.alive);
        group.add(obj);
        const p = arenaToWorld(tw.x, tw.y);
        obj.position.set(p.x, 0, p.z);
        e = {
          obj,
          sx: tw.x,
          sy: tw.y,
          tx: tw.x,
          ty: tw.y,
          kind: 'tower',
          mine: tw.mine,
          towerType: tw.type,
          alive: tw.alive,
          attackAnim: tw.attackAnim || 0,
        };
        ents.current.set(tw.id, e);
      } else {
        e!.tx = tw.x;
        e!.ty = tw.y;
        e!.attackAnim = tw.attackAnim || 0;
      }
      if (tw.alive) setHpBar(e!.obj as THREE.Group, tw.hp, tw.maxHp, tw.mine);
      const muzzle = e!.obj.getObjectByName('muzzle');
      if (muzzle) muzzle.visible = (tw.attackAnim || 0) > 0;
    }

    // —— units ——
    for (const u of snap.units) {
      seen.add(u.id);
      let e = ents.current.get(u.id);
      if (!e || e.kind !== 'unit' || e.avatar !== u.avatar || e.mine !== u.mine) {
        if (e) {
          group.remove(e.obj);
          disposeObj(e.obj);
        }
        const obj = createUnitModel(u.avatar, u.mine);
        group.add(obj);
        e = {
          obj,
          sx: u.x,
          sy: u.y,
          tx: u.x,
          ty: u.y,
          kind: 'unit',
          avatar: u.avatar,
          mine: u.mine,
          flying: u.flying,
          anim: u.anim,
          attackAnim: u.attackAnim,
          hitFlash: u.hitFlash,
        };
        ents.current.set(u.id, e);
      } else {
        e.tx = u.x;
        e.ty = u.y;
        e.flying = u.flying;
        e.anim = u.anim;
        e.attackAnim = u.attackAnim;
        e.hitFlash = u.hitFlash;
      }
      setHpBar(e.obj as THREE.Group, u.hp, u.maxHp, u.mine);
      const breath = e.obj.getObjectByName('breath');
      if (breath) breath.visible = u.attackAnim > 0 && u.avatar === 'dragon';
    }

    // —— projectiles ——
    for (const p of snap.projectiles) {
      seen.add(p.id);
      let e = ents.current.get(p.id);
      if (!e || e.kind !== 'proj' || e.style !== p.style) {
        if (e) {
          group.remove(e.obj);
          disposeObj(e.obj);
        }
        const obj = createProjectileModel(p.style);
        group.add(obj);
        e = {
          obj,
          sx: p.x,
          sy: p.y,
          tx: p.x,
          ty: p.y,
          kind: 'proj',
          style: p.style,
        };
        ents.current.set(p.id, e);
      } else {
        e.tx = p.x;
        e.ty = p.y;
      }
      e.obj.rotation.y = -p.angle + Math.PI / 2;
    }

    // —— effects ——
    for (const fx of snap.effects) {
      seen.add(fx.id);
      let e = ents.current.get(fx.id);
      if (!e || e.kind !== 'fx') {
        if (e) {
          group.remove(e.obj);
          disposeObj(e.obj);
        }
        const obj = createEffectModel(fx.type);
        group.add(obj);
        e = {
          obj,
          sx: fx.x,
          sy: fx.y,
          tx: fx.x,
          ty: fx.y,
          kind: 'fx',
          fxType: fx.type,
          radius: fx.radius,
        };
        ents.current.set(fx.id, e);
      } else {
        e.tx = fx.x;
        e.ty = fx.y;
        e.radius = fx.radius;
      }
      const r = (fx.radius || 1) * WORLD_SCALE;
      e.obj.scale.setScalar(Math.max(0.2, r));
      const mat = (e.obj as THREE.Mesh).material as THREE.MeshLambertMaterial | undefined;
      if (mat && 'opacity' in mat) {
        mat.transparent = true;
        mat.opacity = Math.min(0.5, fx.ttl);
      }
    }

    // prune
    for (const [id, e] of ents.current) {
      if (seen.has(id)) continue;
      group.remove(e.obj);
      disposeObj(e.obj);
      ents.current.delete(id);
    }

    // lerp + bob
    for (const e of ents.current.values()) {
      e.sx += (e.tx - e.sx) * lerp;
      e.sy += (e.ty - e.sy) * lerp;
      const p = arenaToWorld(e.sx, e.sy);
      let y = 0;
      if (e.kind === 'unit') {
        const bob =
          e.anim === 'walk'
            ? Math.sin(t * 9 + e.sx) * 0.035
            : Math.sin(t * 2 + e.sy) * 0.012;
        const fly = e.flying ? 0.38 + Math.sin(t * 2.8) * 0.05 : 0;
        const punch = (e.attackAnim || 0) > 0 ? 0.06 : 0;
        y = bob + fly + punch;
        e.obj.scale.setScalar((e.hitFlash || 0) > 0 ? 1.06 : 1);
      } else if (e.kind === 'proj') {
        y = e.style === 'fire' ? 0.55 : 0.35;
      } else if (e.kind === 'fx') {
        y = 0.2;
      }
      e.obj.position.set(p.x, y, p.z);
    }
  });

  return (
    <>
      {/* Imperative entities live here — no React children (avoids R3F wiping them). */}
      <group ref={root} />
      {targeting && onDeploy ? <DeployHit onDeploy={onDeploy} /> : null}
    </>
  );
}

function DeployHit({ onDeploy }: { onDeploy: (x: number, y: number) => void }) {
  const w = ARENA_W * WORLD_SCALE;
  const h = ARENA_H * WORLD_SCALE;
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.1, 0]}
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

function disposeObj(obj: THREE.Object3D) {
  // geometries/materials are shared — do not dispose
  obj.traverse(() => undefined);
}

export default function ArenaScene({ stateRef, targeting, onDeploy }: ArenaSceneProps) {
  const fallback = (
    <div className="arena-webgl-fallback">WebGL niedostępne — odśwież stronę</div>
  );

  return (
    <WebGLErrorBoundary fallback={fallback}>
      <div className={`arena-canvas-wrap${targeting ? ' targeting' : ''}`}>
        <Canvas
          shadows={false}
          dpr={1}
          frameloop="always"
          gl={{
            antialias: false,
            alpha: false,
            powerPreference: 'high-performance',
            stencil: false,
            depth: true,
            preserveDrawingBuffer: false,
          }}
          camera={{ position: [0, 11.8, 8], fov: 40, near: 0.3, far: 50 }}
          onCreated={({ camera, gl }) => {
            camera.lookAt(0, 0, 0);
            gl.setClearColor('#071a10');
            gl.setPixelRatio(1);
          }}
        >
          <color attach="background" args={['#071a10']} />
          <ambientLight intensity={1.05} />
          <directionalLight position={[4, 10, 3]} intensity={0.45} />
          <Suspense fallback={null}>
            <BattleWorld stateRef={stateRef} targeting={targeting} onDeploy={onDeploy} />
          </Suspense>
        </Canvas>
      </div>
    </WebGLErrorBoundary>
  );
}
