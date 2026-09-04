import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { MonopolyToken } from './types';
import type { PieceId } from './pieces';
import { indexToWorld } from './boardLayout';

const OFFSETS = [
  [0, 0],
  [0.22, 0.18],
  [-0.22, 0.18],
  [0.22, -0.18],
  [-0.22, -0.18],
  [0, 0.28],
];

function makeNickTexture(letter: string, bg: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.clearRect(0, 0, 128, 128);
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(64, 64, 60, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = '900 70px system-ui, Segoe UI, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(letter, 64, 70);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function BodyMat({ color }: { color: string }) {
  return <meshStandardMaterial color={color} roughness={0.22} metalness={0.35} />;
}

function PieceMesh({ piece, color }: { piece: PieceId; color: string }) {
  if (piece === 'car') {
    return (
      <group>
        <mesh position={[0, 0.1, 0]} castShadow>
          <boxGeometry args={[0.38, 0.12, 0.22]} />
          <BodyMat color={color} />
        </mesh>
        <mesh position={[0.02, 0.2, 0]} castShadow>
          <boxGeometry args={[0.2, 0.1, 0.18]} />
          <BodyMat color={color} />
        </mesh>
        {[
          [-0.12, 0.12],
          [-0.12, -0.12],
          [0.12, 0.12],
          [0.12, -0.12],
        ].map(([wx, wz]) => (
          <mesh key={`${wx},${wz}`} position={[wx, 0.05, wz]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 0.06, 10]} />
            <meshStandardMaterial color="#1f2937" roughness={0.5} />
          </mesh>
        ))}
      </group>
    );
  }

  if (piece === 'hat') {
    return (
      <group>
        <mesh position={[0, 0.04, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.22, 0.04, 20]} />
          <BodyMat color={color} />
        </mesh>
        <mesh position={[0, 0.18, 0]} castShadow>
          <cylinderGeometry args={[0.14, 0.14, 0.24, 16]} />
          <BodyMat color={color} />
        </mesh>
      </group>
    );
  }

  if (piece === 'dog') {
    return (
      <group>
        <mesh position={[0, 0.14, 0]} castShadow>
          <boxGeometry args={[0.28, 0.14, 0.14]} />
          <BodyMat color={color} />
        </mesh>
        <mesh position={[0.16, 0.2, 0]} castShadow>
          <boxGeometry args={[0.12, 0.12, 0.12]} />
          <BodyMat color={color} />
        </mesh>
        <mesh position={[0.22, 0.16, 0]} castShadow>
          <boxGeometry args={[0.08, 0.04, 0.04]} />
          <BodyMat color={color} />
        </mesh>
        {[
          [-0.08, 0.06],
          [-0.08, -0.06],
          [0.08, 0.06],
          [0.08, -0.06],
        ].map(([lx, lz]) => (
          <mesh key={`${lx},${lz}`} position={[lx, 0.06, lz]} castShadow>
            <boxGeometry args={[0.05, 0.1, 0.05]} />
            <BodyMat color={color} />
          </mesh>
        ))}
        <mesh position={[-0.16, 0.18, 0]} castShadow>
          <boxGeometry args={[0.06, 0.04, 0.04]} />
          <BodyMat color={color} />
        </mesh>
      </group>
    );
  }

  if (piece === 'shoe') {
    return (
      <group>
        <mesh position={[0.02, 0.08, 0]} castShadow>
          <boxGeometry args={[0.32, 0.1, 0.16]} />
          <BodyMat color={color} />
        </mesh>
        <mesh position={[-0.08, 0.16, 0]} castShadow>
          <boxGeometry args={[0.14, 0.14, 0.16]} />
          <BodyMat color={color} />
        </mesh>
      </group>
    );
  }

  if (piece === 'boat') {
    return (
      <group>
        <mesh position={[0, 0.08, 0]} castShadow>
          <boxGeometry args={[0.36, 0.1, 0.16]} />
          <BodyMat color={color} />
        </mesh>
        <mesh position={[0, 0.22, 0]} castShadow>
          <boxGeometry args={[0.04, 0.28, 0.04]} />
          <BodyMat color={color} />
        </mesh>
        <mesh position={[0.06, 0.24, 0]} rotation={[0, 0, -0.4]} castShadow>
          <boxGeometry args={[0.18, 0.02, 0.12]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.5} />
        </mesh>
      </group>
    );
  }

  return (
    <group>
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.2, 0.22, 16]} />
        <BodyMat color={color} />
      </mesh>
      <mesh position={[0, 0.34, 0]} castShadow>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.25} />
      </mesh>
    </group>
  );
}

export default function Token3D({
  token,
  color,
  isMe,
  slot,
}: {
  token: MonopolyToken;
  color: string;
  isMe: boolean;
  slot: number;
}) {
  const group = useRef<THREE.Group>(null);
  const bounce = useRef(0);
  const shake = useRef(0);
  const wasJail = useRef(token.inJail);
  const prevPos = useRef(token.position);
  const { invalidate } = useThree();
  const piece = (token.piece || 'pawn') as PieceId;

  const target = useMemo(() => {
    const { x, z } = indexToWorld(token.position);
    const [ox, oz] = OFFSETS[slot % OFFSETS.length];
    return new THREE.Vector3(x + ox, 0, z + oz);
  }, [token.position, slot]);

  useEffect(() => {
    if (prevPos.current !== token.position) {
      bounce.current = 1;
      prevPos.current = token.position;
      invalidate();
    }
  }, [token.position, invalidate]);

  useEffect(() => {
    if (token.inJail && !wasJail.current) {
      shake.current = 1;
      invalidate();
    }
    wasJail.current = token.inJail;
  }, [token.inJail, invalidate]);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;

    const cur = g.position;
    const dx = target.x - cur.x;
    const dz = target.z - cur.z;
    const dist = Math.hypot(dx, dz);

    if (dist > 0.002) {
      const t = 1 - Math.exp(-10 * dt);
      cur.x += dx * t;
      cur.z += dz * t;
      invalidate();
    } else {
      cur.x = target.x;
      cur.z = target.z;
    }

    let y = 0;
    if (bounce.current > 0) {
      bounce.current = Math.max(0, bounce.current - dt * 2.2);
      y = Math.sin((1 - bounce.current) * Math.PI) * 0.35 * bounce.current;
      invalidate();
    }

    let sx = 0;
    if (shake.current > 0) {
      shake.current = Math.max(0, shake.current - dt * 1.8);
      sx = Math.sin(shake.current * 40) * 0.08 * shake.current;
      invalidate();
    }

    cur.y = y;
    g.rotation.z = sx * 2;
    g.position.x = target.x + (dist > 0.002 ? cur.x - target.x : 0) + sx;
  });

  const scale = isMe ? 1.15 : 1;
  const initial = (token.name || '?').trim().charAt(0).toUpperCase() || '?';
  const letterMap = useMemo(() => makeNickTexture(initial, color), [initial, color]);

  return (
    <group ref={group} position={[target.x, 0, target.z]} scale={scale}>
      <PieceMesh piece={piece} color={color} />
      {letterMap && (
        <mesh position={[0, 0.48, 0]} rotation={[-0.4, 0, 0]}>
          <planeGeometry args={[0.28, 0.28]} />
          <meshBasicMaterial map={letterMap} transparent depthWrite={false} />
        </mesh>
      )}
      {token.inJail && (
        <mesh position={[0, 0.42, 0]}>
          <torusGeometry args={[0.2, 0.025, 8, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.5} roughness={0.3} />
        </mesh>
      )}
      {isMe && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[0.22, 0.28, 24]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
        </mesh>
      )}
    </group>
  );
}
