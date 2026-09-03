import { Canvas, useThree } from '@react-three/fiber';
import { MapControls, OrthographicCamera } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import Board3D from './Board3D';
import Token3D from './Token3D';
import type { MonopolyState } from './types';
import { TOKEN_COLORS } from './boardLayout';

const TAP_PX = 10;

/** Po zgubionym pointerup MapControls zostaje w stanie „drag” i mapa umiera. */
function forceReleaseControls(controls: unknown) {
  const c = controls as {
    enabled?: boolean;
    state?: number;
    _pointers?: unknown[];
    _pointerPositions?: Record<string, unknown>;
  } | null;
  if (!c) return;
  c.enabled = true;
  if (Array.isArray(c._pointers)) c._pointers.length = 0;
  if (c._pointerPositions) {
    for (const key of Object.keys(c._pointerPositions)) delete c._pointerPositions[key];
  }
  // OrbitControls STATE.NONE === -1
  if (typeof c.state === 'number') c.state = -1;
}

function ControlsSafetyNet() {
  const controls = useThree((s) => s.controls);

  useEffect(() => {
    const release = () => forceReleaseControls(controls);
    window.addEventListener('pointercancel', release);
    window.addEventListener('blur', release);
    document.addEventListener('visibilitychange', release);
    return () => {
      window.removeEventListener('pointercancel', release);
      window.removeEventListener('blur', release);
      document.removeEventListener('visibilitychange', release);
    };
  }, [controls]);

  return null;
}

/** Tap → pole bez handlerów R3F na meshach (nie kradną gestów MapControls). */
function SpaceTapSelect({ onSelect }: { onSelect?: (index: number) => void }) {
  const { gl, camera, scene, controls } = useThree();
  const down = useRef<{ x: number; y: number } | null>(null);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const ndc = useMemo(() => new THREE.Vector2(), []);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    const el = gl.domElement;

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      // Capture przed MapControls: zdejmij zombie-drag, potem sterowanie dostaje czysty gest.
      if (e.isPrimary) forceReleaseControls(controls);
      down.current = { x: e.clientX, y: e.clientY };
    };

    const onUp = (e: PointerEvent) => {
      const start = down.current;
      down.current = null;

      const select = onSelectRef.current;
      if (!start || !select) return;
      if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > TAP_PX) return;

      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);

      const hits = raycaster.intersectObjects(scene.children, true);
      for (const hit of hits) {
        let obj: THREE.Object3D | null = hit.object;
        while (obj) {
          const idx = obj.userData?.spaceIndex;
          if (typeof idx === 'number') {
            select(idx);
            return;
          }
          obj = obj.parent;
        }
      }
    };

    const onCancel = () => {
      down.current = null;
      forceReleaseControls(controls);
    };

    el.addEventListener('pointerdown', onDown, { capture: true, passive: true });
    el.addEventListener('pointerup', onUp, { passive: true });
    el.addEventListener('pointercancel', onCancel, { passive: true });
    return () => {
      el.removeEventListener('pointerdown', onDown, true);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onCancel);
    };
  }, [gl, camera, scene, controls, raycaster, ndc]);

  return null;
}

function SceneContent({
  state,
  focusIndex,
  myId,
  colorById,
  onSelectSpace,
}: {
  state: MonopolyState;
  focusIndex: number;
  myId: string | null;
  colorById: Record<string, string>;
  onSelectSpace?: (index: number) => void;
}) {
  const { invalidate } = useThree();

  useEffect(() => {
    invalidate();
  }, [state, focusIndex, invalidate]);

  const slotsBySpace = useMemo(() => {
    const map: Record<number, string[]> = {};
    for (const t of state.tokens) {
      if (t.bankrupt) continue;
      if (!map[t.position]) map[t.position] = [];
      map[t.position].push(t.id);
    }
    return map;
  }, [state.tokens]);

  return (
    <>
      <color attach="background" args={['#0a0a0b']} />
      <ambientLight intensity={0.65} />
      <directionalLight
        castShadow
        intensity={1.0}
        position={[8, 14, 6]}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={1}
        shadow-camera-far={40}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
      />
      <hemisphereLight args={['#f5f5f5', '#111111', 0.35]} />

      <OrthographicCamera makeDefault position={[10, 12, 10]} zoom={42} near={0.1} far={80} />
      <MapControls
        makeDefault
        enableRotate={false}
        enableDamping={false}
        minZoom={28}
        maxZoom={70}
        screenSpacePanning
      />
      <ControlsSafetyNet />
      <SpaceTapSelect onSelect={onSelectSpace} />

      <Board3D spaces={state.spaces} focusIndex={focusIndex} colorById={colorById} />

      {state.tokens
        .filter((t) => !t.bankrupt)
        .map((t) => {
          const ids = slotsBySpace[t.position] || [t.id];
          const slot = Math.max(0, ids.indexOf(t.id));
          return (
            <Token3D
              key={t.id}
              token={t}
              color={colorById[t.id] || TOKEN_COLORS[0]}
              isMe={t.id === myId}
              slot={slot}
            />
          );
        })}
    </>
  );
}

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl') ||
      canvas.getContext('webgl2')
    );
  } catch {
    return false;
  }
}

export default function MonopolyScene({
  state,
  focusIndex,
  myId,
  colorById,
  fallback,
  onSelectSpace,
}: {
  state: MonopolyState;
  focusIndex: number;
  myId: string | null;
  colorById: Record<string, string>;
  fallback: ReactNode;
  onSelectSpace?: (index: number) => void;
}) {
  const ok = useMemo(() => supportsWebGL(), []);

  if (!ok) {
    return <>{fallback}</>;
  }

  return (
    <div className="monopoly-canvas">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        frameloop="always"
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor('#0a0a0b');
        }}
      >
        <Suspense fallback={null}>
          <SceneContent
            state={state}
            focusIndex={focusIndex}
            myId={myId}
            colorById={colorById}
            onSelectSpace={onSelectSpace}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
