import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

interface SudokuState {
  puzzleId: string;
  difficulty: string;
  initial: number[][];
  startTime: number;
  myFinished: boolean;
  myTime: number | null;
  opponentFinished: boolean;
  opponentTime: number | null;
  winner: string | null;
  myName: string;
  opponentName: string;
}

function formatTime(ms: number) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function cloneGrid(initial: number[][]) {
  return initial.map((row) => [...row]);
}

export default function Sudoku() {
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
  const [state, setState] = useState<SudokuState | null>(null);
  const [grid, setGrid] = useState<number[][]>([]);
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);
  const [now, setNow] = useState(Date.now());
  const isHost = room?.hostId === playerId;

  useEffect(() => {
    if (!room || room.game !== 'sudoku') {
      navigate('/lobby');
    }
  }, [room, navigate]);

  useEffect(() => {
    if (!socket || !room) return;

    const handler = (data: SudokuState) => {
      setState(data);
      setGrid((prev) => (prev.length === 0 ? cloneGrid(data.initial) : prev));
    };
    socket.on('sudokuUpdate', handler);
    requestGameState();

    return () => { socket.off('sudokuUpdate', handler); };
  }, [socket, room, requestGameState]);

  useEffect(() => {
    if (state?.initial) {
      setGrid(cloneGrid(state.initial));
    }
  }, [state?.puzzleId]);

  useEffect(() => {
    if (!state || state.myFinished) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [state]);

  const isFixed = useCallback((row: number, col: number) =>
    (state?.initial[row][col] ?? 0) !== 0,
  [state]);

  const setCell = (value: number) => {
    if (!selected || !state || state.myFinished) return;
    if (isFixed(selected.row, selected.col)) return;
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      next[selected.row][selected.col] = value;
      return next;
    });
  };

  const clearCell = () => setCell(0);

  const handleSubmit = () => {
    if (!socket || !state || state.myFinished) return;
    socket.emit('submitSudoku', { grid, sessionId, roomCode });
  };

  if (!state) {
    return (
      <div className="page waiting-text">
        <div className="spinner">🔢</div>
        <p>Ładowanie sudoku...</p>
      </div>
    );
  }

  const elapsed = state.myFinished && state.myTime != null
    ? state.myTime
    : now - state.startTime;

  return (
    <div className="page sudoku-page">
      <div className="game-header">
        <h2>🔢 Sudoku</h2>
        <span className="turn-indicator my-turn" style={{ fontFamily: 'monospace' }}>
          {formatTime(elapsed)}
        </span>
      </div>

      <p className="crossword-title">{state.difficulty} — kto szybciej ułoży!</p>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button type="button" onClick={clearError} aria-label="Zamknij">×</button>
        </div>
      )}

      <div className="sudoku-status">
        <span>{state.myName}: {state.myFinished ? `✅ ${formatTime(state.myTime!)}` : '⏳ gra...'}</span>
        <span>{state.opponentName}: {state.opponentFinished ? `✅ ${formatTime(state.opponentTime!)}` : '⏳ gra...'}</span>
      </div>

      <div className="board-wrap">
        <div className="sudoku-grid">
          {grid.map((row, ri) =>
            row.map((val, ci) => {
              const fixed = isFixed(ri, ci);
              const isSel = selected?.row === ri && selected?.col === ci;
              let className = 'sudoku-cell';
              if (ci % 3 === 0) className += ' box-left';
              if (ri % 3 === 0) className += ' box-top';
              if (fixed) className += ' fixed';
              if (isSel) className += ' selected';

              return (
                <button
                  key={`${ri}-${ci}`}
                  type="button"
                  className={className}
                  disabled={state.myFinished || fixed}
                  onClick={() => setSelected({ row: ri, col: ci })}
                >
                  {val > 0 ? val : ''}
                </button>
              );
            })
          )}
        </div>
      </div>

      {!state.myFinished && (
        <>
          <div className="sudoku-pad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button key={n} type="button" className="sudoku-pad-btn" onClick={() => setCell(n)}>
                {n}
              </button>
            ))}
            <button type="button" className="sudoku-pad-btn sudoku-pad-clear" onClick={clearCell}>
              ⌫
            </button>
          </div>
          <button type="button" className="btn btn-primary" onClick={handleSubmit}>
            ✅ Gotowe!
          </button>
        </>
      )}

      {state.myFinished && !gameOver && (
        <div className="waiting-text" style={{ padding: '24px 0' }}>
          <p>Czekam na wynik rywala...</p>
        </div>
      )}

      {gameOver && (
        <div className="modal-overlay" onClick={clearGameOver}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="emoji-big">🏆</div>
            <h2>{gameOver.winnerName} wygrywa!</h2>
            <p>Ułożył sudoku szybciej!</p>
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
