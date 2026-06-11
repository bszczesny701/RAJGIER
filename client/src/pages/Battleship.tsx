import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

interface Cell {
  row: number;
  col: number;
}

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

interface BoardCell {
  ship: string | null;
  hit: boolean;
}

interface EnemyCell {
  hit: boolean;
  miss: boolean;
}

interface BattleshipState {
  phase: 'placement' | 'battle' | 'finished';
  currentTurn: string | null;
  myBoard: BoardCell[][] | null;
  enemyBoard: EnemyCell[][] | null;
  placementReady: boolean;
  opponentReady: boolean;
  winner: string | null;
  lastShot: { row: number; col: number; hit: boolean; shooter: string } | null;
  shipTypes: ShipType[];
  gridSize: number;
  myName: string;
  opponentName: string;
}

export default function Battleship() {
  const navigate = useNavigate();
  const { socket, room, playerId, error, clearError, gameOver, clearGameOver, backToLobby } = useGame();
  const [state, setState] = useState<BattleshipState | null>(null);
  const isHost = room?.hostId === playerId;

  const [selectedShip, setSelectedShip] = useState<{ id: string; size: number } | null>(null);
  const [horizontal, setHorizontal] = useState(true);
  const [placedShips, setPlacedShips] = useState<PlacedShip[]>([]);
  const [hoverCell, setHoverCell] = useState<Cell | null>(null);

  useEffect(() => {
    if (!room || room.game !== 'battleship') {
      navigate('/lobby');
    }
  }, [room, navigate]);

  useEffect(() => {
    if (!socket || !room) return;

    const handler = (data: BattleshipState) => setState(data);
    socket.on('battleshipUpdate', handler);
    socket.emit('requestGameState');

    return () => { socket.off('battleshipUpdate', handler); };
  }, [socket, room]);

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
  };

  const handleConfirmPlacement = () => {
    if (!socket || placedShips.length !== 10) return;
    socket.emit('placeShips', { ships: placedShips });
  };

  const handleShoot = (row: number, col: number) => {
    if (!socket || !state || state.phase !== 'battle') return;
    if (state.currentTurn !== playerId) return;
    const cell = state.enemyBoard?.[row]?.[col];
    if (cell?.hit || cell?.miss) return;
    socket.emit('shoot', { row, col });
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

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button type="button" onClick={clearError} aria-label="Zamknij">×</button>
        </div>
      )}

      {state.phase === 'placement' && !state.placementReady && (
        <>
          <div className="card" style={{ padding: 16 }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
              Ustaw 10 statków na planszy
            </p>
            <div className="ship-picker">
              {available.map((ship, idx) => (
                <button
                  key={`${ship.size}-${idx}`}
                  type="button"
                  className={`ship-btn ${selectedShip?.size === ship.size && selectedShip?.id === ship.id ? 'active' : ''}`}
                  onClick={() => setSelectedShip(ship)}
                >
                  {'█'.repeat(ship.size)} ({ship.size})
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

          <p className="board-label">Twoja flota ({placedShips.length}/10)</p>
          <div
            className="grid-board"
            style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)`, maxWidth: 340 }}
          >
            {Array.from({ length: gridSize * gridSize }, (_, i) => {
              const row = Math.floor(i / gridSize);
              const col = i % gridSize;
              const placed = placedShips.some((s) => s.cells.some((c) => c.row === row && c.col === col));
              const isPreview = previewCells?.some((c) => c.row === row && c.col === col);

              let className = 'grid-cell water';
              if (placed) className += ' ship';
              if (isPreview) className += previewValid ? ' preview-ship' : ' preview-invalid';

              return (
                <div
                  key={i}
                  className={className}
                  onMouseEnter={() => setHoverCell({ row, col })}
                  onMouseLeave={() => setHoverCell(null)}
                  onPointerEnter={() => setHoverCell({ row, col })}
                  onClick={() => handlePlaceShip(row, col)}
                />
              );
            })}
          </div>

          <button
            className="btn btn-primary"
            style={{ marginTop: 16 }}
            disabled={placedShips.length !== 10}
            onClick={handleConfirmPlacement}
          >
            ✅ Gotowy!
          </button>
        </>
      )}

      {state.phase === 'placement' && state.placementReady && !state.opponentReady && (
        <div className="waiting-text">
          <div className="spinner">⏳</div>
          <p>Czekam na {state.opponentName}...</p>
        </div>
      )}

      {state.phase === 'battle' && (
        <>
          <p className="board-label">Twoja flota</p>
          <div
            className="grid-board"
            style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)`, maxWidth: 340, marginBottom: 16 }}
          >
            {state.myBoard?.flatMap((row, ri) =>
              row.map((cell, ci) => {
                let className = 'grid-cell water';
                if (cell.ship && !cell.hit) className += ' ship';
                if (cell.hit && cell.ship) className += ' hit';
                if (cell.hit && !cell.ship) className += ' miss';
                return <div key={`${ri}-${ci}`} className={className} />;
              })
            )}
          </div>

          <p className="board-label">Plansza {state.opponentName} — strzelaj!</p>
          <div
            className="grid-board"
            style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)`, maxWidth: 340 }}
          >
            {state.enemyBoard?.flatMap((row, ri) =>
              row.map((cell, ci) => {
                let className = 'grid-cell water';
                if (cell.hit) className += ' hit';
                if (cell.miss) className += ' miss';
                if (!cell.hit && !cell.miss && isMyTurn) className += ' clickable';
                return (
                  <div
                    key={`${ri}-${ci}`}
                    className={className}
                    onClick={() => handleShoot(ri, ci)}
                  />
                );
              })
            )}
          </div>
        </>
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
