import { RoundedBox } from '@react-three/drei';
import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import type { MonopolySpace } from './types';
import {
  BOARD_SPAN,
  CELL,
  GROUP_COLORS,
  indexToWorld,
  isCorner,
  shortLabel,
} from './boardLayout';

type LabelOpts = { bold?: boolean; stroke?: string };

/** Lokalne napisy HD — bez drei Text (CDN wiesza 3D na telefonie). */
function makeLabelTexture(text: string, color: string, opts: LabelOpts = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const size = opts.bold ? 96 : 78;
  ctx.font = `${opts.bold ? 900 : 800} ${size}px system-ui, Segoe UI, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  if (opts.stroke) {
    ctx.lineWidth = opts.bold ? 10 : 7;
    ctx.strokeStyle = opts.stroke;
    ctx.lineJoin = 'round';
    ctx.strokeText(text, cx, cy, canvas.width - 24);
  }
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = color;
  ctx.fillText(text, cx, cy, canvas.width - 24);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}

function WcIcon3D({ y }: { y: number }) {
  const [map, setMap] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    let alive = true;
    loader.load('/wc-icon.png', (tex) => {
      if (!alive) return;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      setMap(tex);
    });
    return () => {
      alive = false;
    };
  }, []);
  if (!map) return null;
  return (
    <mesh position={[0, y, 0.22]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[0.32, 0.32]} />
      <meshBasicMaterial map={map} transparent depthWrite={false} />
    </mesh>
  );
}

function CellLabel({
  text,
  color,
  y,
  bold,
  stroke,
  wide,
}: {
  text: string;
  color: string;
  y: number;
  bold?: boolean;
  stroke?: string;
  wide?: boolean;
}) {
  const map = useMemo(
    () => makeLabelTexture(text, color, { bold, stroke }),
    [text, color, bold, stroke]
  );
  if (!map) return null;
  const w = wide ? CELL * 0.88 : CELL * 0.84;
  const h = wide ? CELL * 0.48 : CELL * 0.42;
  return (
    <mesh position={[0, y, 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={map} transparent depthWrite={false} />
    </mesh>
  );
}

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
  const baseH = corner ? 0.24 : 0.16;
  const strip = GROUP_COLORS[space.group] || GROUP_COLORS.special;
  const label = shortLabel(space);
  const isJail = space.type === 'jail' || space.type === 'gotojail';
  const houses = space.houses || 0;
  const isLos = space.type === 'chance';
  const isChest = space.type === 'chest';
  const isKupon = space.type === 'tax';
  const specialFill = isLos || isChest || isKupon;

  const cellColor = isLos
    ? '#2563eb'
    : isChest
      ? '#f59e0b'
      : isKupon
        ? '#dc2626'
        : corner
          ? '#fff6e0'
          : focused
            ? '#ffe8a3'
            : '#fffdf7';
  const labelColor = isLos || isKupon ? '#ffffff' : isChest ? '#1a1a1a' : '#1a1208';
  const labelStroke = isLos || isKupon ? '#0f172a' : isChest ? '#ffffff' : undefined;

  return (
    <group position={[x, 0, z]} userData={{ spaceIndex: space.index }}>
      <RoundedBox
        args={[CELL * 0.94, baseH, CELL * 0.94]}
        radius={0.06}
        smoothness={3}
        position={[0, baseH / 2, 0]}
      >
        <meshStandardMaterial
          color={cellColor}
          roughness={specialFill ? 0.35 : 0.45}
          metalness={specialFill ? 0.15 : 0.05}
        />
      </RoundedBox>

      {!specialFill && (
        <mesh position={[0, baseH + 0.03, -CELL * 0.32]}>
          <boxGeometry args={[CELL * 0.82, 0.12, CELL * 0.2]} />
          <meshStandardMaterial color={strip} roughness={0.3} metalness={0.12} />
        </mesh>
      )}

      <CellLabel
        text={label}
        color={labelColor}
        y={baseH + 0.06}
        bold={specialFill}
        stroke={labelStroke}
        wide={specialFill}
      />

      {space.name.startsWith('WC') && <WcIcon3D y={baseH + 0.05} />}

      {ownerColor && (
        <mesh position={[CELL * 0.3, baseH + 0.07, CELL * 0.3]}>
          <sphereGeometry args={[0.1, 14, 14]} />
          <meshStandardMaterial color={ownerColor} roughness={0.25} metalness={0.35} />
        </mesh>
      )}

      {houses > 0 && houses < 5 && (
        <group position={[-CELL * 0.22, baseH + 0.08, CELL * 0.22]}>
          {Array.from({ length: houses }).map((_, i) => (
            <mesh key={i} position={[(i % 2) * 0.16, Math.floor(i / 2) * 0.12, 0]}>
              <boxGeometry args={[0.12, 0.1, 0.12]} />
              <meshStandardMaterial color="#22c55e" roughness={0.4} metalness={0.1} />
            </mesh>
          ))}
        </group>
      )}

      {houses >= 5 && (
        <mesh position={[-CELL * 0.18, baseH + 0.14, CELL * 0.2]}>
          <boxGeometry args={[0.22, 0.2, 0.18]} />
          <meshStandardMaterial color="#ef4444" roughness={0.35} metalness={0.15} />
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
          <ringGeometry args={[CELL * 0.36, CELL * 0.48, 28]} />
          <meshBasicMaterial color="#ef4444" transparent opacity={0.8} />
        </mesh>
      )}

      {isJail && (
        <group position={[0, baseH + 0.12, 0]}>
          {[-0.18, 0, 0.18].map((ox) => (
            <mesh key={ox} position={[ox, 0.12, 0]}>
              <boxGeometry args={[0.04, 0.28, 0.04]} />
              <meshStandardMaterial color="#374151" metalness={0.45} roughness={0.25} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

function DeckLabel({ text, color, stroke }: { text: string; color: string; stroke?: string }) {
  const map = useMemo(
    () => makeLabelTexture(text, color, { bold: true, stroke }),
    [text, color, stroke]
  );
  if (!map) return null;
  return (
    <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[1.0, 0.52]} />
      <meshBasicMaterial map={map} transparent depthWrite={false} />
    </mesh>
  );
}

function CenterBrand3D() {
  const titleMap = useMemo(
    () => makeLabelTexture('MONOPOLY', '#fbbf24', { bold: true, stroke: '#7f1d1d' }),
    []
  );
  const [mascot, setMascot] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    let alive = true;
    loader.load('/monopoly-mascot.png', (tex) => {
      if (!alive) return;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      tex.needsUpdate = true;
      setMascot(tex);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <group>
      {titleMap && (
        <mesh position={[0, 0.14, -1.15]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3.6, 0.85]} />
          <meshBasicMaterial map={titleMap} transparent depthWrite={false} />
        </mesh>
      )}
      {mascot && (
        <mesh position={[0, 0.14, 0.55]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.4, 3.0]} />
          <meshBasicMaterial map={mascot} transparent depthWrite={false} />
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
        args={[BOARD_SPAN + 0.45, 0.2, BOARD_SPAN + 0.45]}
        radius={0.1}
        smoothness={4}
        position={[0, -0.1, 0]}
      >
        <meshStandardMaterial color="#1a1a1c" roughness={0.55} metalness={0.08} />
      </RoundedBox>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <planeGeometry args={[BOARD_SPAN * 0.72, BOARD_SPAN * 0.72]} />
        <meshStandardMaterial color="#2a2a2e" roughness={0.7} />
      </mesh>

      <group position={[-2.35, 0.08, 0]}>
        <RoundedBox args={[1.15, 0.14, 1.55]} radius={0.06} position={[0, 0.07, 0]}>
          <meshStandardMaterial color="#2563eb" roughness={0.3} metalness={0.2} />
        </RoundedBox>
        <DeckLabel text="LOS" color="#ffffff" stroke="#0f172a" />
      </group>
      <group position={[2.35, 0.08, 0]}>
        <RoundedBox args={[1.15, 0.14, 1.55]} radius={0.06} position={[0, 0.07, 0]}>
          <meshStandardMaterial color="#f59e0b" roughness={0.3} metalness={0.15} />
        </RoundedBox>
        <DeckLabel text="KASA" color="#1a1a1a" stroke="#ffffff" />
      </group>

      <CenterBrand3D />

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
