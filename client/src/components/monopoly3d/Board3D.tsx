import { RoundedBox, Text } from '@react-three/drei';
import { useMemo } from 'react';
import type { MonopolySpace } from './types';
import {
  BOARD_SPAN,
  CELL,
  GROUP_COLORS,
  indexToWorld,
  isCorner,
  shortLabel,
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
  const baseH = corner ? 0.28 : 0.18;
  const strip = GROUP_COLORS[space.group] || GROUP_COLORS.special;
  const baseColor = corner ? '#e8d9b8' : '#f4ead5';
  const label = shortLabel(space);

  return (
    <group position={[x, 0, z]}>
      <RoundedBox
        args={[CELL * 0.92, baseH, CELL * 0.92]}
        radius={0.06}
        smoothness={2}
        position={[0, baseH / 2, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={focused ? '#fff6e0' : baseColor}
          roughness={0.5}
          metalness={0.05}
          emissive={focused ? '#c9a227' : '#000000'}
          emissiveIntensity={focused ? 0.22 : 0}
        />
      </RoundedBox>

      <RoundedBox
        args={[CELL * 0.78, 0.07, CELL * 0.22]}
        radius={0.03}
        smoothness={2}
        position={[0, baseH + 0.04, -CELL * 0.28]}
      >
        <meshStandardMaterial color={strip} roughness={0.35} metalness={0.15} />
      </RoundedBox>

      {ownerColor && (
        <mesh position={[CELL * 0.28, baseH + 0.08, CELL * 0.28]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial color={ownerColor} emissive={ownerColor} emissiveIntensity={0.25} />
        </mesh>
      )}

      <Text
        position={[0, baseH + 0.12, 0.05]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={corner ? 0.18 : 0.14}
        color="#1c1408"
        anchorX="center"
        anchorY="middle"
        maxWidth={CELL * 0.75}
        textAlign="center"
        outlineWidth={0.01}
        outlineColor="#f4ead5"
      >
        {label}
      </Text>

      {focused && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[CELL * 0.38, CELL * 0.48, 32]} />
          <meshBasicMaterial color="#c41e3a" transparent opacity={0.85} />
        </mesh>
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
        args={[BOARD_SPAN + 0.35, 0.22, BOARD_SPAN + 0.35]}
        radius={0.1}
        smoothness={3}
        position={[0, -0.12, 0]}
        receiveShadow
      >
        <meshStandardMaterial color="#111111" roughness={0.6} metalness={0.1} />
      </RoundedBox>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]} receiveShadow>
        <planeGeometry args={[BOARD_SPAN * 0.72, BOARD_SPAN * 0.72]} />
        <meshStandardMaterial color="#2a2a2e" roughness={0.8} />
      </mesh>

      <Text
        position={[0, 0.05, 0]}
        rotation={[-Math.PI / 2, 0, Math.PI / 4]}
        fontSize={0.7}
        color="#ef444488"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.12}
      >
        MONOPOLY
      </Text>

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
