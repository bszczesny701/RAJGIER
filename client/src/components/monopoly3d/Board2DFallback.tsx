import type { MonopolySpace, MonopolyToken } from './types';
import { spaceToGrid, shortLabel, GROUP_COLORS } from './boardLayout';

/** Flat 2D board used when WebGL is unavailable. */
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
  return (
    <div className="monopoly-board monopoly-board-2d" role="grid" aria-label="Plansza Monopoly">
      <div className="monopoly-center" aria-hidden>MONOPOLY</div>
      {spaces.map((space) => {
        const { row, col } = spaceToGrid(space.index);
        const tokensHere = tokens.filter((t) => !t.bankrupt && t.position === space.index);
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
            <div className="monopoly-tokens">
              {tokensHere.map((t) => (
                <span
                  key={t.id}
                  className={`monopoly-token${t.id === myId ? ' is-me' : ''}`}
                  style={{ background: colorById[t.id] }}
                  title={`${t.name}${t.piece ? ` (${t.piece})` : ''}`}
                >
                  {(t.piece || 'pawn').slice(0, 1).toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
