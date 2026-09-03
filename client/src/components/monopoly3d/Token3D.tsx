import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { MonopolyToken } from './types';
import { indexToWorld } from './boardLayout';

const OFFSETS = [
  [0, 0],
  [0.22, 0.18],
  [-0.22, 0.18],
  [0.22, -0.18],
  [-0.22, -0.18],
  [0, 0.28],
];

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
  const prevPos = useRef(token.position);
  const { invalidate } = useThree();

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

    if (bounce.current > 0) {
      bounce.current = Math.max(0, bounce.current - dt * 2.2);
      cur.y = Math.sin((1 - bounce.current) * Math.PI) * 0.35 * bounce.current;
      invalidate();
    } else {
      cur.y = 0;
    }
  });

  const scale = isMe ? 1.15 : 1;

  return (
    <group ref={group} position={[target.x, 0, target.z]} scale={scale}>
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.2, 0.22, 16]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.34, 0]} castShadow>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.25} />
      </mesh>
      {isMe && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[0.22, 0.28, 24]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
        </mesh>
      )}
    </group>
  );
}
