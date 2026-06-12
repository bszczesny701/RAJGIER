import { useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import FleetPanel from '../components/battleship/FleetPanel';
import ShipSvg from '../components/battleship/ShipSvg';
import {
  getShipSegmentInfo,
  shipSegmentClass,
  type Cell,
  type BoardCell,
} from '../components/battleship/shipUtils';
import {
  enrichMyFleetFromBoard,
  mergeFleetWithSunkCounts,
} from '../components/battleship/fleetStatus';

interface ShipType {
  id: string;
  size: number;
  count: number;
}

interface PlacedShip {
  id: string;
  size: number;
  cells: Cell[];
}

interface EnemyCell {
  hit: boolean;
  miss: boolean;
  sunk?: boolean;
  ship?: string | null;
}

interface FleetShip {
  id: string;
  size: number;
  sunk: boolean;
}

interface BattleshipState {
  phase: 'placement' | 'battle' | 'finished';
  currentTurn: string | null;
  myBoard: BoardCell[][] | null;
  enemyBoard: EnemyCell[][] | null;
  myFleet: FleetShip[];
  enemyFleet: FleetShip[];
  enemySunkCounts: Record<number, number>;
  placementReady: boolean;
  opponentReady: boolean;
  winner: string | null;
  lastShot: { row: number; col: number; hit: boolean; shooter: string } | null;
  lastSunk: {
    eventId: number;
    size: number;
    shooter: string;
    victim: string;
    shipId: string;
    cells: Cell[];
  } | null;
  shipTypes: ShipType[];
  gridSize: number;
  myName: string;
  opponentName: string;
}

function CellContent({
  hit,
  miss,
  showHit,
}: {
  hit?: boolean;
  miss?: boolean;
  showHit?: boolean;
}) {
  if (hit && showHit) return <span className="cell-marker hit-marker">💥</span>;
  if (miss) return <span className="cell-marker miss-marker">💧</span>;
  return null;
}

function BoardGrid({
  gridSize,
  className,
  children,
}: {
  gridSize: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className="board-wrap">
      <div
        className={`grid-board battleship-board${className ? ` ${className}` : ''}`}
        style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))` }}
      >
        {children}
      </div>
    </div>
  );
}

export default function Battleship() {
  const navigate = useNavigate();
  const {
    socket,
    room,
    playerId,
    sessionId,
    roomCode,
    error,
    clearError,
    gameOver,
    clearGameOver,
    backToLobby,
    requestGameState,
  } = useGame();
  const [state, setState] = useState<BattleshipState | null>(null);
  const isHost = room?.hostId === playerId;

  const [selectedShip, setSelectedShip] = useState<{ id: string; size: number } | null>(null);
  const [horizontal, setHorizontal] = useState(true);
  const [placedShips, setPlacedShips] = useState<PlacedShip[]>([]);
  const [hoverCell, setHoverCell] = useState<Cell | null>(null);
  const [sunkToast, setSunkToast] = useState<string | null>(null);
  const lastSunkEventRef = useRef(0);

  useEffect(() => {
    if (!room) {
      navigate('/');
      return;
    }
    if (room.game !== 'battleship') {
      navigate('/lobby');
    }
  }, [room, navigate]);

  useEffect(() => {
    if (!socket || !room) return;

    const handler = (data: BattleshipState) => setState(data);
    socket.on('battleshipUpdate', handler);
    requestGameState();

    return () => { socket.off('battleshipUpdate', handler); };
  }, [socket, room, requestGameState]);

  useEffect(() => {
    if (!state?.lastSunk || state.lastSunk.eventId === lastSunkEventRef.current) return;
    lastSunkEventRef.current = state.lastSunk.eventId;

    const byMe = state.lastSunk.shooter === playerId;
    const iAmVictim = state.lastSunk.victim === playerId;

    if (byMe) {
      setSunkToast(`🎯 Zatopiłeś statek ${state.lastSunk.size}-masztowy przeciwnika!`);
    } else if (iAmVictim) {
      setSunkToast(`💥 Twój statek ${state.lastSunk.size}-masztowy został zatopiony!`);
    } else {
      setSunkToast(`🚢 Statek ${state.lastSunk.size}-masztowy został zatopiony!`);
    }

    const timer = setTimeout(() => setSunkToast(null), 3500);
    return () => clearTimeout(timer);
  }, [state?.lastSunk, playerId]);

  const buildRevealedEnemyBoard = useCallback((enemyBoard: EnemyCell[][] | null): BoardCell[][] | null => {
    if (!enemyBoard) return null;
    return enemyBoard.map((row) =>
      row.map((cell) => ({
        ship: cell.sunk ? cell.ship ?? 'revealed' : null,
        hit: cell.hit,
      })),
    );
  }, []);

  const getPreviewCells = useCallback((row: number, col: number): Cell[] | null => {
    if (!selectedShip || !state) return null;
    const cells: Cell[] = [];
    for (let i = 0; i < selectedShip.size; i++) {
      const r = horizontal ? row : row + i;
      const c = horizontal ? col + i : col;
      if (r >= state.gridSize || c >= state.gridSize) return null;
      cells.push({ row: r, col: c });
    }
    return cells;
  }, [selectedShip, horizontal, state]);

  const isPreviewValid = useCallback((cells: Cell[] | null): boolean => {
    if (!cells) return false;
    for (const { row, col } of cells) {
      if (placedShips.some((s) => s.cells.some((c) => c.row === row && c.col === col))) {
        return false;
      }
    }
    return true;
  }, [placedShips]);

  const handlePlaceShip = (row: number, col: number) => {
    if (!selectedShip || !state || state.phase !== 'placement' || state.placementReady) return;
    const cells = getPreviewCells(row, col);
    if (!cells || !isPreviewValid(cells)) return;

    setPlacedShips((prev) => [...prev, { ...selectedShip, cells }]);
    setSelectedShip(null);
    setHoverCell(null);
  };

  const handleConfirmPlacement = () => {
    if (!socket || placedShips.length !== 10) return;
    socket.emit('placeShips', { ships: placedShips, sessionId, roomCode });
  };

  const handleShoot = (row: number, col: number) => {
    if (!socket || !state || state.phase !== 'battle') return;
    if (state.currentTurn !== playerId) return;
    const cell = state.enemyBoard?.[row]?.[col];
    if (cell?.hit || cell?.miss) return;
    socket.emit('shoot', { row, col, sessionId, roomCode });
  };

  const getAvailableShips = (): { id: string; size: number }[] => {
    if (!state) return [];
    const available: { id: string; size: number }[] = [];
    for (const type of state.shipTypes) {
      const placed = placedShips.filter((s) => s.size === type.size).length;
      for (let i = placed; i < type.count; i++) {
        available.push({ id: type.id, size: type.size });
      }
    }
    return available;
  };

  const available = getAvailableShips();
  const previewCells = hoverCell ? getPreviewCells(hoverCell.row, hoverCell.col) : null;
  const previewValid = isPreviewValid(previewCells);

  if (!state) {
    return (
      <div className="page waiting-text">
        <div className="spinner">🚢</div>
        <p>Ładowanie gry...</p>
      </div>
    );
  }

  const isMyTurn = state.currentTurn === playerId;
  const gridSize = state.gridSize;
  const revealedEnemyBoard = buildRevealedEnemyBoard(state.enemyBoard);
  const myFleetDisplay = enrichMyFleetFromBoard(state.myBoard, state.myFleet ?? []);
  const enemyFleetDisplay = mergeFleetWithSunkCounts(
    state.enemyFleet ?? [],
    state.shipTypes,
    state.enemySunkCounts,
  );

  return (
    <div className="page">
      <div className="game-header">
        <h2>🚢 Statki</h2>
        {state.phase === 'battle' && (
          <span className={`turn-indicator ${isMyTurn ? 'my-turn' : 'opponent-turn'}`}>
            {isMyTurn ? 'Twój ruch' : 'Ruch przeciwnika'}
          </span>
        )}
      </div>

      {sunkToast && <div className="sunk-toast">{sunkToast}</div>}

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button type="button" onClick={clearError} aria-label="Zamknij">×</button>
        </div>
      )}

      {state.phase === 'placement' && !state.placementReady && (
        <div className="battleship-placement">
          <div className="card battleship-controls" style={{ padding: 16 }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
              Wybierz statek, potem tapnij planszę
            </p>
            <div className="ship-picker">
              {available.map((ship, idx) => (
                <button
                  key={`${ship.size}-${idx}`}
                  type="button"
                  className={`ship-btn ${selectedShip?.size === ship.size && selectedShip?.id === ship.id ? 'active' : ''}`}
                  onClick={() => setSelectedShip(ship)}
                >
                  <ShipSvg size={ship.size} compact />
                  <span className="ship-btn-label">{ship.size}-masztowiec</span>
                </button>
              ))}
            </div>
            <div className="placement-controls">
              <button type="button" className="btn btn-secondary" onClick={() => setHorizontal(!horizontal)}>
                {horizontal ? '↔ Poziomo' : '↕ Pionowo'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => { setPlacedShips([]); setSelectedShip(null); }}>
                Resetuj
              </button>
            </div>
          </div>

          <p className="placement-hint">
            {selectedShip
              ? `Tapnij pole na planszy (${selectedShip.size}-masztowiec)`
              : 'Najpierw wybierz statek powyżej'}
          </p>

          <p className="board-label">Twoja flota ({placedShips.length}/10)</p>
          <BoardGrid gridSize={gridSize}>
            {Array.from({ length: gridSize * gridSize }, (_, i) => {
              const row = Math.floor(i / gridSize);
              const col = i % gridSize;
              const placed = placedShips.some((s) => s.cells.some((c) => c.row === row && c.col === col));
              const isPreview = previewCells?.some((c) => c.row === row && c.col === col);

              let className = 'grid-cell water';
              if (placed) {
                const segment = getShipSegmentInfo(null, placedShips, row, col);
                className = segment ? `grid-cell ${shipSegmentClass(segment)}` : 'grid-cell ship';
              }
              if (isPreview) className += previewValid ? ' preview-ship' : ' preview-invalid';

              return (
                <button
                  key={i}
                  type="button"
                  className={className}
                  aria-label={`Pole ${row + 1}, ${col + 1}`}
                  onClick={() => handlePlaceShip(row, col)}
                >
                  {placed && <span className="ship-cell-inner" aria-hidden="true" />}
                </button>
              );
            })}
          </BoardGrid>

          <button
            className="btn btn-primary battleship-controls"
            disabled={placedShips.length !== 10}
            onClick={handleConfirmPlacement}
          >
            ✅ Gotowy! ({placedShips.length}/10)
          </button>
        </div>
      )}

      {state.phase === 'placement' && state.placementReady && !state.opponentReady && (
        <div className="waiting-text">
          <div className="spinner">⏳</div>
          <p>Czekam na {state.opponentName}...</p>
        </div>
      )}

      {state.phase === 'battle' && (
        <div className="battleship-battle">
          <FleetPanel
            title="Twoja flota"
            shipTypes={state.shipTypes}
            fleet={myFleetDisplay}
            variant="mine"
          />

          <p className="board-label">Twoja flota — na morzu</p>
          <BoardGrid gridSize={gridSize}>
            {state.myBoard?.flatMap((row, ri) =>
              row.map((cell, ci) => {
                let className = 'grid-cell water';
                const segment = getShipSegmentInfo(state.myBoard, null, ri, ci);
                if (segment) className = `grid-cell ${shipSegmentClass(segment)}`;
                if (cell.hit && cell.ship) className += ' hit';
                if (cell.hit && !cell.ship) className += ' miss';

                return (
                  <div key={`${ri}-${ci}`} className={className}>
                    {segment && <span className="ship-cell-inner" aria-hidden="true" />}
                    <CellContent hit={cell.hit && !!cell.ship} miss={cell.hit && !cell.ship} showHit />
                  </div>
                );
              })
            )}
          </BoardGrid>

          <FleetPanel
            title={`Flota ${state.opponentName}`}
            shipTypes={state.shipTypes}
            fleet={enemyFleetDisplay}
            sunkCounts={state.enemySunkCounts}
            variant="enemy"
          />

          <p className="board-label">Plansza {state.opponentName} — tapnij, aby strzelić!</p>
          <BoardGrid gridSize={gridSize}>
            {state.enemyBoard?.flatMap((row, ri) =>
              row.map((cell, ci) => {
                const segment = cell.sunk
                  ? getShipSegmentInfo(revealedEnemyBoard, null, ri, ci)
                  : null;

                let className = 'grid-cell water';
                if (segment) className = `grid-cell ${shipSegmentClass(segment)}`;
                else if (cell.hit) className += ' hit';
                if (cell.miss) className += ' miss';
                if (!cell.hit && !cell.miss && isMyTurn) className += ' clickable';

                return (
                  <button
                    key={`${ri}-${ci}`}
                    type="button"
                    className={className}
                    disabled={!isMyTurn || cell.hit || cell.miss}
                    aria-label={`Strzał ${ri + 1}, ${ci + 1}${cell.sunk ? ' — statek zatopiony' : ''}`}
                    onClick={() => handleShoot(ri, ci)}
                  >
                    {segment && <span className="ship-cell-inner" aria-hidden="true" />}
                    {!segment && <CellContent hit={cell.hit} miss={cell.miss} showHit />}
                    {segment?.sunk && (segment.segment === 'start' || segment.segment === 'single') && (
                      <span className="cell-marker sunk-marker">☠️</span>
                    )}
                  </button>
                );
              })
            )}
          </BoardGrid>
        </div>
      )}

      {gameOver && (
        <div className="modal-overlay" onClick={clearGameOver}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="emoji-big">🏆</div>
            <h2>{gameOver.winnerName} wygrywa!</h2>
            <p>Flota przeciwnika zatopiona!</p>
            {isHost ? (
              <button className="btn btn-primary" onClick={() => { clearGameOver(); backToLobby(); }}>
                Zagraj jeszcze raz
              </button>
            ) : (
              <button className="btn btn-primary" onClick={clearGameOver}>OK</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
