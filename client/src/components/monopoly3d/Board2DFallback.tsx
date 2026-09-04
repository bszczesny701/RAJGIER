import { useEffect, useMemo, useState } from 'react';
import type { MonopolySpace, MonopolyToken } from './types';
import { spaceToGrid, shortLabel, GROUP_COLORS } from './boardLayout';

/** Flat 2D board used when WebGL is unavailable / preferred. */
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
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

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
    <div className="monopoly-board monopoly-board-2d" role="grid" aria-label="Plansza Monopoly">
      <div className="monopoly-center" aria-hidden>MONOPOLY</div>
      {spaces.map((space) => {
        const { row, col } = spaceToGrid(space.index);
        const isFocus = focusIndex === space.index;
        const isCorner = [0, 10, 20, 30].includes(space.index);
        const bar = GROUP_COLORS[space.group] || GROUP_COLORS.special;

        return (
          <div
            key={space.index}
            role="button"
            tabIndex={0}
            className={`monopoly-cell${isFocus ? ' is-focus' : ''}${isCorner ? ' is-corner' : ''}${space.mortgaged ? ' is-mortgaged' : ''}`}
            style={{ gridRow: row + 1, gridColumn: col + 1 }}
            title={space.name}
            onClick={() => onSelectSpace?.(space.index)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onSelectSpace?.(space.index);
            }}
          >
            <span className="monopoly-cell-bar" style={{ background: bar }} />
            <span className="monopoly-cell-label">{shortLabel(space)}</span>
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
            title={`${t.name}${t.piece ? ` (${t.piece})` : ''}`}
          >
            <span
              className="monopoly-token-float-inner"
              style={{ background: colorById[t.id] }}
            >
              {(t.piece || 'pawn').slice(0, 1).toUpperCase()}
            </span>
          </span>
        );
      })}
    </div>
  );
}
