import { Canvas, useThree } from '@react-three/fiber';
import { MapControls, OrthographicCamera } from '@react-three/drei';
import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ErrorInfo,
  type ReactNode,
} from 'react';
import * as THREE from 'three';
import Board3D from './Board3D';
import Token3D from './Token3D';
import type { MonopolyState } from './types';
import { BOARD_SPAN, TOKEN_COLORS } from './boardLayout';

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

/** Dopasuj zoom ortograficzny do rozmiaru canvas — bez tego na telefonie widać czarny pusty ekran. */
function FitBoardCamera() {
  const { camera, size, controls, invalidate } = useThree();

  useEffect(() => {
    if (!(camera instanceof THREE.OrthographicCamera)) return;
    if (size.width < 2 || size.height < 2) return;

    const span = BOARD_SPAN * 1.25;
    const zoom = Math.min(size.width, size.height) / span;
    camera.zoom = Math.max(18, Math.min(90, zoom));
    camera.position.set(11, 13, 11);
    camera.near = 0.1;
    camera.far = 120;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();

    const c = controls as { target?: THREE.Vector3; update?: () => void } | null;
    if (c?.target) {
      c.target.set(0, 0, 0);
      c.update?.();
    }
    invalidate();
  }, [camera, size.width, size.height, controls, invalidate]);

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
      <color attach="background" args={['#1a1a1a']} />
      <ambientLight intensity={0.85} />
      <directionalLight intensity={0.9} position={[8, 14, 6]} />
      <hemisphereLight args={['#f5f5f5', '#222222', 0.45]} />

      <OrthographicCamera makeDefault position={[11, 13, 11]} zoom={42} near={0.1} far={120} />
      <MapControls
        makeDefault
        enableRotate={false}
        enableDamping={false}
        minZoom={16}
        maxZoom={95}
        screenSpacePanning
        target={[0, 0, 0]}
      />
      <FitBoardCamera />
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

export function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      canvas.getContext('webgl', { failIfMajorPerformanceCaveat: false }) ||
      canvas.getContext('experimental-webgl') ||
      canvas.getContext('webgl2')
    );
  } catch {
    return false;
  }
}

class SceneErrorBoundary extends Component<
  { fallback: ReactNode; onError?: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    this.props.onError?.();
  }

  render() {
    if (this.state.failed) return <>{this.props.fallback}</>;
    return this.props.children;
  }
}

function WebGlContextGuard({ onLost }: { onLost: () => void }) {
  const { gl } = useThree();
  useEffect(() => {
    const el = gl.domElement;
    const handler = (e: Event) => {
      e.preventDefault();
      onLost();
    };
    el.addEventListener('webglcontextlost', handler, false);
    return () => el.removeEventListener('webglcontextlost', handler, false);
  }, [gl, onLost]);
  return null;
}

function SceneReadySignal({
  onReady,
  onBadSize,
}: {
  onReady: () => void;
  onBadSize: () => void;
}) {
  const { size, gl } = useThree();

  useEffect(() => {
    let frames = 0;
    let raf = 0;
    const tick = () => {
      frames += 1;
      const w = gl.domElement.clientWidth || size.width;
      const h = gl.domElement.clientHeight || size.height;
      if (w >= 8 && h >= 8) {
        onReady();
        return;
      }
      if (frames > 45) {
        onBadSize();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [gl, size.width, size.height, onReady, onBadSize]);

  return null;
}

export default function MonopolyScene({
  state,
  focusIndex,
  myId,
  colorById,
  fallback,
  onSelectSpace,
  onFallbackTo2D,
}: {
  state: MonopolyState;
  focusIndex: number;
  myId: string | null;
  colorById: Record<string, string>;
  fallback: ReactNode;
  onSelectSpace?: (index: number) => void;
  onFallbackTo2D?: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [glReady, setGlReady] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const ok = useMemo(() => supportsWebGL(), []);
  const ready = glReady && sceneReady;

  const fail = useMemo(
    () => () => {
      setFailed(true);
      onFallbackTo2D?.();
    },
    [onFallbackTo2D]
  );

  const markSceneReady = useMemo(() => () => setSceneReady(true), []);

  useEffect(() => {
    if (failed || ready) return;
    const t = window.setTimeout(() => fail(), 4000);
    return () => window.clearTimeout(t);
  }, [failed, ready, fail]);

  if (!ok || failed) {
    return <>{fallback}</>;
  }

  return (
    <SceneErrorBoundary fallback={fallback} onError={fail}>
      <div ref={wrapRef} className="monopoly-canvas" style={{ position: 'relative' }}>
        {!ready && (
          <div className="monopoly-canvas-placeholder" aria-hidden>
            {fallback}
          </div>
        )}
        <Canvas
          /* Cienie na mobile często dają czarny ekran / context lost */
          shadows={false}
          dpr={1}
          frameloop="always"
          style={{
            opacity: ready ? 1 : 0,
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            zIndex: ready ? 2 : 0,
            pointerEvents: ready ? 'auto' : 'none',
            background: '#1a1a1a',
          }}
          gl={{
            antialias: false,
            powerPreference: 'default',
            alpha: false,
            failIfMajorPerformanceCaveat: false,
            preserveDrawingBuffer: false,
          }}
          onCreated={({ gl, camera }) => {
            gl.setClearColor('#1a1a1a');
            gl.setPixelRatio(1);
            if (camera instanceof THREE.OrthographicCamera) {
              camera.position.set(11, 13, 11);
              camera.lookAt(0, 0, 0);
              camera.updateProjectionMatrix();
            }
            const parent = wrapRef.current;
            if (parent && (parent.clientWidth < 8 || parent.clientHeight < 8)) {
              fail();
              return;
            }
            setGlReady(true);
          }}
        >
          <WebGlContextGuard onLost={fail} />
          <Suspense fallback={null}>
            <SceneReadySignal onReady={markSceneReady} onBadSize={fail} />
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
    </SceneErrorBoundary>
  );
}
