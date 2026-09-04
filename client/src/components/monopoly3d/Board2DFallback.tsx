import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MonopolySpace, MonopolyToken } from './types';
import { spaceToGrid, shortLabel, GROUP_COLORS } from './boardLayout';

const MIN_ZOOM = 1;
const MAX_ZOOM = 2.5;
const TAP_PX = 10;

type Transform = { scale: number; x: number; y: number };

function clampPan(t: Transform, vw: number, vh: number): Transform {
  const scaled = vw * t.scale;
  const maxX = Math.max(0, (scaled - vw) / 2);
  const maxY = Math.max(0, (scaled - vh) / 2);
  return {
    scale: t.scale,
    x: Math.min(maxX, Math.max(-maxX, t.x)),
    y: Math.min(maxY, Math.max(-maxY, t.y)),
  };
}

/** Flat 2D board used when WebGL is unavailable / preferred. Pinch-zoom on mobile. */
export default function Board2DFallback({
  spaces,
  tokens,
  focusIndex,
  colorById,
  myId,
  onSelectSpace,
}: {
  spaces: MonopolySpace[];
  tokens: MonopolyToken[];
  focusIndex: number;
  colorById: Record<string, string>;
  myId: string | null;
  onSelectSpace?: (index: number) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<Transform>({ scale: 1, x: 0, y: 0 });
  const [transform, setTransform] = useState<Transform>({ scale: 1, x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchStart = useRef<{ dist: number; scale: number; midX: number; midY: number; x: number; y: number } | null>(
    null
  );
  const panStart = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const tapStart = useRef<{ x: number; y: number; t: number } | null>(null);
  const lastTap = useRef(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const applyTransform = useCallback((next: Transform) => {
    const el = viewportRef.current;
    const vw = el?.clientWidth || 1;
    const vh = el?.clientHeight || 1;
    const clamped = clampPan(
      { ...next, scale: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next.scale)) },
      vw,
      vh
    );
    transformRef.current = clamped;
    setTransform(clamped);
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const onDown = (e: PointerEvent) => {
      // Mysz: nie przejmuj pointera — klik w pole ma działać normalnie (karta).
      // Zoom myszą: kółko. Touch: pinch / pan / tap.
      if (e.pointerType === 'mouse') return;

      el.setPointerCapture(e.pointerId);
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      tapStart.current = { x: e.clientX, y: e.clientY, t: Date.now() };

      if (pointers.current.size === 2) {
        const pts = [...pointers.current.values()];
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        pinchStart.current = {
          dist: Math.max(1, dist),
          scale: transformRef.current.scale,
          midX: (pts[0].x + pts[1].x) / 2,
          midY: (pts[0].y + pts[1].y) / 2,
          x: transformRef.current.x,
          y: transformRef.current.y,
        };
        panStart.current = null;
      } else if (pointers.current.size === 1 && transformRef.current.scale > 1.02) {
        panStart.current = {
          x: e.clientX,
          y: e.clientY,
          tx: transformRef.current.x,
          ty: transformRef.current.y,
        };
        pinchStart.current = null;
      }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return;
      if (!pointers.current.has(e.pointerId)) return;
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.current.size === 2 && pinchStart.current) {
        const pts = [...pointers.current.values()];
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        const ratio = dist / pinchStart.current.dist;
        applyTransform({
          scale: pinchStart.current.scale * ratio,
          x: pinchStart.current.x,
          y: pinchStart.current.y,
        });
        return;
      }

      if (pointers.current.size === 1 && panStart.current) {
        const dx = e.clientX - panStart.current.x;
        const dy = e.clientY - panStart.current.y;
        applyTransform({
          scale: transformRef.current.scale,
          x: panStart.current.tx + dx,
          y: panStart.current.ty + dy,
        });
      }
    };

    const onUp = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return;

      pointers.current.delete(e.pointerId);
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }

      if (pointers.current.size < 2) pinchStart.current = null;
      if (pointers.current.size === 0) {
        const start = tapStart.current;
        tapStart.current = null;
        const wasPanning = !!panStart.current;
        panStart.current = null;

        if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) < TAP_PX) {
          const now = Date.now();
          if (now - lastTap.current < 320) {
            applyTransform({ scale: 1, x: 0, y: 0 });
            lastTap.current = 0;
            return;
          }
          lastTap.current = now;

          if (!wasPanning) {
            const hit = document.elementFromPoint(e.clientX, e.clientY);
            const cell = hit?.closest('[data-space-index]') as HTMLElement | null;
            const idx = cell ? Number(cell.dataset.spaceIndex) : NaN;
            if (Number.isInteger(idx)) onSelectSpace?.(idx);
          }
        }
      } else if (pointers.current.size === 1) {
        const pt = [...pointers.current.values()][0];
        panStart.current = {
          x: pt.x,
          y: pt.y,
          tx: transformRef.current.x,
          ty: transformRef.current.y,
        };
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.92 : 1.08;
      applyTransform({
        scale: transformRef.current.scale * delta,
        x: transformRef.current.x,
        y: transformRef.current.y,
      });
    };

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      el.removeEventListener('wheel', onWheel);
    };
  }, [applyTransform, onSelectSpace]);

  const slotsBySpace = useMemo(() => {
    const map: Record<number, string[]> = {};
    for (const t of tokens) {
      if (t.bankrupt) continue;
      if (!map[t.position]) map[t.position] = [];
      map[t.position].push(t.id);
    }
    return map;
  }, [tokens]);

  const aliveTokens = useMemo(() => tokens.filter((t) => !t.bankrupt), [tokens]);

  return (
    <div ref={viewportRef} className="monopoly-board-viewport">
      <div
        className="monopoly-board monopoly-board-2d"
        role="grid"
        aria-label="Plansza Monopoly"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        }}
      >
        <div className="monopoly-center" aria-hidden>
          <div className="monopoly-deck monopoly-deck-los">
            <span>LOS</span>
          </div>
          <div className="monopoly-center-brand">
            <p className="monopoly-center-title">MONOPOLY</p>
            <img
              className="monopoly-center-mascot"
              src="/monopoly-mascot.png"
              alt=""
              draggable={false}
            />
          </div>
          <div className="monopoly-deck monopoly-deck-chest">
            <span>KASA</span>
          </div>
        </div>
        {spaces.map((space) => {
          const { row, col } = spaceToGrid(space.index);
          const isFocus = focusIndex === space.index;
          const isCorner = [0, 10, 20, 30].includes(space.index);
          const isLos = space.type === 'chance';
          const isChest = space.type === 'chest';
          const isKupon = space.type === 'tax';
          const isKosciuch = space.type === 'jail' || space.type === 'gotojail';
          const isGo = space.type === 'go';
          const bar = GROUP_COLORS[space.group] || GROUP_COLORS.special;
          const hideBar = isLos || isChest || isKupon || isKosciuch;

          return (
            <div
              key={space.index}
              role="button"
              tabIndex={0}
              data-space-index={space.index}
              className={`monopoly-cell${isFocus ? ' is-focus' : ''}${isCorner ? ' is-corner' : ''}${space.mortgaged ? ' is-mortgaged' : ''}${isLos ? ' is-los' : ''}${isChest ? ' is-chest' : ''}${isKupon ? ' is-kupon' : ''}${isKosciuch ? ' is-kosciuch' : ''}`}
              style={{ gridRow: row + 1, gridColumn: col + 1 }}
              title={space.name}
              onClick={() => onSelectSpace?.(space.index)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelectSpace?.(space.index);
              }}
            >
              {!hideBar && <span className="monopoly-cell-bar" style={{ background: bar }} />}
              <span className="monopoly-cell-label">{shortLabel(space)}</span>
              {space.name.startsWith('WC') && (
                <img className="monopoly-cell-icon" src="/wc-icon.png" alt="" draggable={false} />
              )}
              {isGo && (
                <img className="monopoly-cell-icon monopoly-cell-icon--go" src="/go-icon.png" alt="" draggable={false} />
              )}
              {space.ownerId && (
                <span
                  className="monopoly-owner-dot"
                  style={{ background: colorById[space.ownerId] }}
                  title="Właściciel"
                />
              )}
              {(space.houses || 0) > 0 && (
                <span
                  className={`monopoly-houses-badge${(space.houses || 0) >= 5 ? ' is-hotel' : ''}`}
                  title={(space.houses || 0) >= 5 ? 'Hotel' : `${space.houses} dom(y)`}
                >
                  {(space.houses || 0) >= 5 ? 'H' : space.houses}
                </span>
              )}
              {space.mortgaged && (
                <span className="monopoly-mortgage-badge" title="Zastawione">
                  Z
                </span>
              )}
            </div>
          );
        })}

        {aliveTokens.map((t) => {
          const { row, col } = spaceToGrid(t.position);
          const ids = slotsBySpace[t.position] || [t.id];
          const slot = Math.max(0, ids.indexOf(t.id));
          const ox = ((slot % 3) - 1) * 6;
          const oy = Math.floor(slot / 3) * 6;
          const initial = (t.name || '?').trim().charAt(0).toUpperCase() || '?';
          return (
            <span
              key={t.id}
              className={`monopoly-token-float${t.id === myId ? ' is-me' : ''}${mounted ? ' is-ready' : ''}`}
              style={{
                left: `${(col / 11) * 100}%`,
                top: `${(row / 11) * 100}%`,
                width: `${100 / 11}%`,
                height: `${100 / 11}%`,
                ['--token-shift' as string]: `translate(${ox}px, ${oy}px)`,
              }}
              title={t.name}
            >
              <span className="monopoly-token-float-inner" style={{ background: colorById[t.id] }}>
                {initial}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
