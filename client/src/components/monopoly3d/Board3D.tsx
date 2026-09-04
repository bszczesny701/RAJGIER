import { RoundedBox } from '@react-three/drei';
import { useMemo } from 'react';
import type { MonopolySpace } from './types';
import {
  BOARD_SPAN,
  CELL,
  GROUP_COLORS,
  indexToWorld,
  isCorner,
} from './boardLayout';

function SpaceMesh({
  space,
  focused,
  ownerColor,
}: {
  space: MonopolySpace;
  focused: boolean;
  ownerColor: string | null;
}) {
  const { x, z } = indexToWorld(space.index);
  const corner = isCorner(space.index);
  const baseH = corner ? 0.22 : 0.14;
  const strip = GROUP_COLORS[space.group] || GROUP_COLORS.special;
  const houses = space.houses || 0;
  const isJail = space.type === 'jail' || space.type === 'gotojail';
  const isLos = space.type === 'chance';
  const isChest = space.type === 'chest';
  const cellColor = isLos
    ? '#1d4ed8'
    : isChest
      ? '#f59e0b'
      : corner
        ? '#fff8ea'
        : focused
          ? '#fff1c2'
          : '#fffcf5';

  return (
    <group position={[x, 0, z]} userData={{ spaceIndex: space.index }}>
      <RoundedBox
        args={[CELL * 0.94, baseH, CELL * 0.94]}
        radius={0.04}
        smoothness={2}
        position={[0, baseH / 2, 0]}
      >
        <meshStandardMaterial color={cellColor} roughness={0.65} metalness={0} />
      </RoundedBox>

      {!isLos && !isChest && (
        <mesh position={[0, baseH + 0.02, -CELL * 0.32]}>
          <boxGeometry args={[CELL * 0.82, 0.1, CELL * 0.18]} />
          <meshStandardMaterial color={strip} roughness={0.4} metalness={0.05} />
        </mesh>
      )}

      {ownerColor && (
        <mesh position={[CELL * 0.3, baseH + 0.06, CELL * 0.3]}>
          <sphereGeometry args={[0.09, 12, 12]} />
          <meshStandardMaterial color={ownerColor} />
        </mesh>
      )}

      {houses > 0 && houses < 5 && (
        <group position={[-CELL * 0.22, baseH + 0.08, CELL * 0.22]}>
          {Array.from({ length: houses }).map((_, i) => (
            <mesh key={i} position={[(i % 2) * 0.16, Math.floor(i / 2) * 0.12, 0]}>
              <boxGeometry args={[0.12, 0.1, 0.12]} />
              <meshStandardMaterial color="#16a34a" roughness={0.5} />
            </mesh>
          ))}
        </group>
      )}

      {houses >= 5 && (
        <mesh position={[-CELL * 0.18, baseH + 0.14, CELL * 0.2]}>
          <boxGeometry args={[0.22, 0.2, 0.18]} />
          <meshStandardMaterial color="#dc2626" roughness={0.45} />
        </mesh>
      )}

      {space.mortgaged && (
        <mesh position={[CELL * 0.28, baseH + 0.08, -CELL * 0.05]}>
          <boxGeometry args={[0.16, 0.06, 0.16]} />
          <meshStandardMaterial color="#52525b" roughness={0.5} />
        </mesh>
      )}

      {focused && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
          <ringGeometry args={[CELL * 0.36, CELL * 0.46, 28]} />
          <meshBasicMaterial color="#ef4444" transparent opacity={0.75} />
        </mesh>
      )}

      {isJail && (
        <group position={[0, baseH + 0.12, 0]}>
          {[-0.18, 0, 0.18].map((ox) => (
            <mesh key={ox} position={[ox, 0.12, 0]}>
              <boxGeometry args={[0.04, 0.28, 0.04]} />
              <meshStandardMaterial color="#444" metalness={0.4} roughness={0.3} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

export default function Board3D({
  spaces,
  focusIndex,
  colorById,
}: {
  spaces: MonopolySpace[];
  focusIndex: number;
  colorById: Record<string, string>;
}) {
  const cells = useMemo(() => spaces, [spaces]);

  return (
    <group>
      <RoundedBox
        args={[BOARD_SPAN + 0.4, 0.18, BOARD_SPAN + 0.4]}
        radius={0.08}
        smoothness={3}
        position={[0, -0.1, 0]}
      >
        <meshStandardMaterial color="#1a1a1c" roughness={0.7} metalness={0.05} />
      </RoundedBox>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <planeGeometry args={[BOARD_SPAN * 0.7, BOARD_SPAN * 0.7]} />
        <meshStandardMaterial color="#2a2a2e" roughness={0.85} />
      </mesh>

      <group position={[-0.7, 0.08, 0.2]}>
        <RoundedBox args={[1.1, 0.12, 1.5]} radius={0.04} position={[0, 0.06, 0]}>
          <meshStandardMaterial color="#1d4ed8" />
        </RoundedBox>
      </group>
      <group position={[0.7, 0.08, -0.2]}>
        <RoundedBox args={[1.1, 0.12, 1.5]} radius={0.04} position={[0, 0.06, 0]}>
          <meshStandardMaterial color="#f59e0b" />
        </RoundedBox>
      </group>

      {cells.map((space) => (
        <SpaceMesh
          key={space.index}
          space={space}
          focused={space.index === focusIndex}
          ownerColor={space.ownerId ? colorById[space.ownerId] || '#fff' : null}
        />
      ))}
    </group>
  );
}
