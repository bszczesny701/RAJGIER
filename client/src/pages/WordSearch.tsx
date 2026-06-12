import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

interface WordInfo {
  word: string;
  found: boolean;
  foundByMe: boolean;
  foundByOpponent: boolean;
}

interface WordSearchState {
  grid: string[][];
  words: WordInfo[];
  scores: Record<string, number>;
  startTime: number;
  winner: string | null;
  myName: string;
  opponentName: string;
  myId: string;
}

interface Cell {
  row: number;
  col: number;
}

export default function WordSearch() {
  const navigate = useNavigate();
  const { socket, room, playerId, sessionId, roomCode, error, clearError, gameOver, clearGameOver, backToLobby, requestGameState } = useGame();
  const [state, setState] = useState<WordSearchState | null>(null);
  const isHost = room?.hostId === playerId;

  const [selecting, setSelecting] = useState(false);
  const [selection, setSelection] = useState<Cell[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!room || room.game !== 'wordsearch') {
      navigate('/lobby');
    }
  }, [room, navigate]);

  useEffect(() => {
    if (!socket || !room) return;

    const handler = (data: WordSearchState) => setState(data);
    socket.on('wordsearchUpdate', handler);
    requestGameState();

    return () => { socket.off('wordsearchUpdate', handler); };
  }, [socket, room, requestGameState]);

  const getCellFromPoint = useCallback((clientX: number, clientY: number): Cell | null => {
    const el = document.elementFromPoint(clientX, clientY);
    if (!el || !el.classList.contains('grid-cell')) return null;
    const row = parseInt(el.getAttribute('data-row') || '-1', 10);
    const col = parseInt(el.getAttribute('data-col') || '-1', 10);
    if (row < 0 || col < 0) return null;
    return { row, col };
  }, []);

  const buildSelection = useCallback((start: Cell, end: Cell): Cell[] => {
    const dr = end.row - start.row;
    const dc = end.col - start.col;
    const absDr = Math.abs(dr);
    const absDc = Math.abs(dc);

    if (dr === 0 && dc === 0) return [start];
    if (dr !== 0 && dc !== 0 && absDr !== absDc) return [start];

    const steps = Math.max(absDr, absDc);
    const stepR = dr === 0 ? 0 : dr / absDr;
    const stepC = dc === 0 ? 0 : dc / absDc;

    const cells: Cell[] = [];
    for (let i = 0; i <= steps; i++) {
      cells.push({ row: start.row + stepR * i, col: start.col + stepC * i });
    }
    return cells;
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (state?.winner) return;
    const cell = getCellFromPoint(e.clientX, e.clientY);
    if (!cell) return;
    setSelecting(true);
    setSelection([cell]);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!selecting || selection.length === 0) return;
    const cell = getCellFromPoint(e.clientX, e.clientY);
    if (!cell) return;
    const newSelection = buildSelection(selection[0], cell);
    setSelection(newSelection);
  };

  const handlePointerUp = () => {
    if (!selecting || !socket || selection.length < 2) {
      setSelecting(false);
      setSelection([]);
      return;
    }

    socket.emit('findWord', { cells: selection, sessionId, roomCode });
    setSelecting(false);
    setSelection([]);
  };

  const isSelected = (row: number, col: number) =>
    selection.some((c) => c.row === row && c.col === col);

  const opponentId = state && playerId
    ? Object.keys(state.scores).find((id) => id !== playerId)
    : null;

  if (!state) {
    return (
      <div className="page waiting-text">
        <div className="spinner">🔍</div>
        <p>Generowanie wykreślanki...</p>
      </div>
    );
  }

  const gridSize = state.grid.length;
  const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <div className="page">
      <div className="game-header">
        <h2>🔍 Wykreślanka</h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
      </div>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button type="button" onClick={clearError} aria-label="Zamknij">×</button>
        </div>
      )}

      <div className="score-bar">
        <div className="score-item">
          <div className="label">{state.myName}</div>
          <div className="value">{state.scores[playerId || ''] || 0}</div>
        </div>
        <div className="score-item">
          <div className="label">vs</div>
          <div className="value" style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>⚔️</div>
        </div>
        <div className="score-item">
          <div className="label">{state.opponentName}</div>
          <div className="value">{opponentId ? (state.scores[opponentId] || 0) : 0}</div>
        </div>
      </div>

      <div className="word-list">
        {state.words.map((w) => (
          <span
            key={w.word}
            className={`word-chip ${w.foundByMe ? 'found-me' : w.foundByOpponent ? 'found-opponent' : ''}`}
          >
            {w.word}
          </span>
        ))}
      </div>

      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: 8 }}>
        Przeciągnij palcem po literach, aby zaznaczyć słowo
      </p>

      <div
        ref={gridRef}
        className="grid-board"
        style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)`, maxWidth: '100%' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {state.grid.flatMap((row, ri) =>
          row.map((letter, ci) => {
            let className = 'grid-cell water-light';
            if (isSelected(ri, ci)) className += ' selected';

            return (
              <div
                key={`${ri}-${ci}`}
                className={className}
                data-row={ri}
                data-col={ci}
              >
                {letter}
              </div>
            );
          })
        )}
      </div>

      {gameOver && (
        <div className="modal-overlay" onClick={clearGameOver}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="emoji-big">{gameOver.draw ? '🤝' : '🏆'}</div>
            <h2>{gameOver.draw ? 'Remis!' : `${gameOver.winnerName} wygrywa!`}</h2>
            <p>{gameOver.draw ? 'Macie tyle samo punktów!' : 'Znalazłeś więcej słów!'}</p>
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
