import { Canvas, useThree } from '@react-three/fiber';
import { MapControls, OrthographicCamera } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Board3D from './Board3D';
import Token3D from './Token3D';
import type { MonopolyState } from './types';
import { TOKEN_COLORS } from './boardLayout';

function SceneContent({
  state,
  focusIndex,
  myId,
  colorById,
  onSelectSpace,
  onControlsBusy,
}: {
  state: MonopolyState;
  focusIndex: number;
  myId: string | null;
  colorById: Record<string, string>;
  onSelectSpace?: (index: number) => void;
  onControlsBusy: (busy: boolean) => void;
}) {
  const { invalidate } = useThree();
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    invalidate();
  }, [state, focusIndex, invalidate]);

  useEffect(() => {
    return () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
    };
  }, []);

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
        onStart={() => {
          if (settleTimer.current) clearTimeout(settleTimer.current);
          onControlsBusy(true);
        }}
        onChange={() => invalidate()}
        onEnd={() => {
          if (settleTimer.current) clearTimeout(settleTimer.current);
          settleTimer.current = setTimeout(() => onControlsBusy(false), 50);
        }}
      />

      <Board3D
        spaces={state.spaces}
        focusIndex={focusIndex}
        colorById={colorById}
        onSelectSpace={onSelectSpace}
      />

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
  const [controlsBusy, setControlsBusy] = useState(false);

  if (!ok) {
    return <>{fallback}</>;
  }

  return (
    <div className="monopoly-canvas">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        frameloop={controlsBusy ? 'always' : 'demand'}
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
            onControlsBusy={setControlsBusy}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
