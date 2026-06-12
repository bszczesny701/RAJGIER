import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

interface WordClue {
  id: string;
  number: number;
  dir: 'h' | 'v';
  row: number;
  col: number;
  length: number;
  clue: string;
  solved: boolean;
  solvedByMe: boolean;
  solvedByOpponent: boolean;
}

interface CrosswordState {
  puzzleId: string;
  title: string;
  size: number;
  blocks: boolean[][];
  numbers: number[][];
  words: WordClue[];
  revealed: Record<string, string>;
  scores: Record<string, number>;
  startTime: number;
  winner: string | null;
  myName: string;
  opponentName: string;
  myId: string;
}

function getWordCells(word: WordClue): { row: number; col: number }[] {
  const cells = [];
  for (let i = 0; i < word.length; i++) {
    cells.push({
      row: word.dir === 'h' ? word.row : word.row + i,
      col: word.dir === 'h' ? word.col + i : word.col,
    });
  }
  return cells;
}

export default function Crossword() {
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
  const [state, setState] = useState<CrosswordState | null>(null);
  const [activeWordId, setActiveWordId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const isHost = room?.hostId === playerId;

  useEffect(() => {
    if (!room || room.game !== 'crossword') {
      navigate('/lobby');
    }
  }, [room, navigate]);

  useEffect(() => {
    if (!state || activeWordId) return;
    const firstOpen = state.words.find((w) => !w.solved);
    if (firstOpen) setActiveWordId(firstOpen.id);
  }, [state, activeWordId]);

  useEffect(() => {
    if (!socket || !room) return;

    const handler = (data: CrosswordState) => {
      setState(data);
      setDraft({});
    };
    socket.on('crosswordUpdate', handler);
    requestGameState();

    return () => { socket.off('crosswordUpdate', handler); };
  }, [socket, room, requestGameState]);

  useEffect(() => {
    if (!state || !activeWordId) return;
    const current = state.words.find((w) => w.id === activeWordId);
    if (current?.solved) {
      const next = state.words.find((w) => !w.solved);
      setActiveWordId(next?.id || null);
      setDraft({});
    }
  }, [state, activeWordId]);

  const activeWord = useMemo(
    () => state?.words.find((w) => w.id === activeWordId) || null,
    [state, activeWordId]
  );

  const activeCells = useMemo(
    () => (activeWord ? getWordCells(activeWord) : []),
    [activeWord]
  );

  const isActiveCell = useCallback((row: number, col: number) =>
    activeCells.some((c) => c.row === row && c.col === col),
  [activeCells]);

  const getCellLetter = useCallback((row: number, col: number) => {
    const key = `${row},${col}`;
    if (state?.revealed[key]) return state.revealed[key];
    if (draft[key]) return draft[key];
    return '';
  }, [state, draft]);

  const handleCellChange = (row: number, col: number, value: string) => {
    if (!activeWord || activeWord.solved) return;
    const letter = value.slice(-1).toUpperCase();
    const key = `${row},${col}`;
    setDraft((prev) => {
      const next = { ...prev };
      if (!letter) {
        delete next[key];
      } else {
        next[key] = letter;
      }
      return next;
    });

    const idx = activeCells.findIndex((c) => c.row === row && c.col === col);
    if (letter && idx >= 0 && idx < activeCells.length - 1) {
      const next = activeCells[idx + 1];
      const el = document.querySelector(`[data-crossword="${next.row}-${next.col}"]`) as HTMLElement;
      el?.focus();
    }
  };

  const handleSubmitWord = () => {
    if (!socket || !activeWord || activeWord.solved) return;

    const answer = activeCells
      .map(({ row, col }) => draft[`${row},${col}`] || state?.revealed[`${row},${col}`] || '')
      .join('');

    if (answer.length !== activeWord.length) {
      return;
    }

    socket.emit('submitCrossword', {
      wordId: activeWord.id,
      answer,
      sessionId,
      roomCode,
    });
    setDraft({});
  };

  const selectWord = (word: WordClue) => {
    if (word.solved) return;
    setActiveWordId(word.id);
    setDraft({});
  };

  const opponentId = state && playerId
    ? Object.keys(state.scores).find((id) => id !== playerId)
    : null;

  const across = state?.words.filter((w) => w.dir === 'h') || [];
  const down = state?.words.filter((w) => w.dir === 'v') || [];

  if (!state) {
    return (
      <div className="page waiting-text">
        <div className="spinner">📝</div>
        <p>Ładowanie krzyżówki...</p>
      </div>
    );
  }

  const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <div className="page crossword-page">
      <div className="game-header">
        <h2>📝 Krzyżówka</h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
      </div>

      <p className="crossword-title">{state.title}</p>
      <p className="crossword-hint" style={{ marginBottom: 12 }}>
        Wybierz hasło, wpisz litery w podświetlone pola, potem „Sprawdź hasło”.
      </p>

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

      <div className="board-wrap">
        <div
          className="crossword-grid"
          style={{
            gridTemplateColumns: `repeat(${state.size}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${state.size}, minmax(0, 1fr))`,
          }}
        >
          {state.blocks.flatMap((row, ri) =>
            row.map((blocked, ci) => {
              if (blocked) {
                return <div key={`${ri}-${ci}`} className="crossword-cell block" />;
              }

              const wordAtCell = state.words.find((w) =>
                getWordCells(w).some((c) => c.row === ri && c.col === ci)
              );
              const letter = getCellLetter(ri, ci);
              const active = isActiveCell(ri, ci);
              const revealed = !!state.revealed[`${ri},${ci}`];

              let className = 'crossword-cell';
              if (active) className += ' active';
              if (revealed) className += ' revealed';
              if (wordAtCell?.solvedByMe) className += ' solved-me';
              if (wordAtCell?.solvedByOpponent) className += ' solved-opponent';

              return (
                <div key={`${ri}-${ci}`} className={className}>
                  {state.numbers[ri][ci] > 0 && (
                    <span className="crossword-num">{state.numbers[ri][ci]}</span>
                  )}
                  {revealed ? (
                    <span className="crossword-letter">{letter}</span>
                  ) : (
                    <input
                      type="text"
                      inputMode="text"
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      maxLength={1}
                      className="crossword-input"
                      data-crossword={`${ri}-${ci}`}
                      value={letter}
                      disabled={!active || !!activeWord?.solved}
                      onFocus={() => {
                        const word = state.words.find((w) =>
                          !w.solved && getWordCells(w).some((c) => c.row === ri && c.col === ci)
                        );
                        if (word) setActiveWordId(word.id);
                      }}
                      onChange={(e) => handleCellChange(ri, ci, e.target.value)}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {activeWord && !activeWord.solved && (
        <button type="button" className="btn btn-primary" style={{ marginBottom: 12 }} onClick={handleSubmitWord}>
          ✓ Sprawdź hasło {activeWord.number}
        </button>
      )}

      <div className="crossword-clues">
        {across.length > 0 && (
          <div className="clue-section">
            <h3>Poziomo →</h3>
            <ul>
              {across.map((w) => (
                <li key={w.id}>
                  <button
                    type="button"
                    className={`clue-btn ${activeWordId === w.id ? 'active' : ''} ${w.solvedByMe ? 'solved-me' : ''} ${w.solvedByOpponent ? 'solved-opponent' : ''}`}
                    onClick={() => selectWord(w)}
                    disabled={w.solved}
                  >
                    <strong>{w.number}.</strong> {w.clue}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {down.length > 0 && (
          <div className="clue-section">
            <h3>Pionowo ↓</h3>
            <ul>
              {down.map((w) => (
                <li key={w.id}>
                  <button
                    type="button"
                    className={`clue-btn ${activeWordId === w.id ? 'active' : ''} ${w.solvedByMe ? 'solved-me' : ''} ${w.solvedByOpponent ? 'solved-opponent' : ''}`}
                    onClick={() => selectWord(w)}
                    disabled={w.solved}
                  >
                    <strong>{w.number}.</strong> {w.clue}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {down.length === 0 && across.length > 0 && (
          <p className="crossword-hint">Wybierz hasło z listy, wpisz litery, potem „Sprawdź hasło”.</p>
        )}
      </div>

      {gameOver && (
        <div className="modal-overlay" onClick={clearGameOver}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="emoji-big">{gameOver.draw ? '🤝' : '🏆'}</div>
            <h2>{gameOver.draw ? 'Remis!' : `${gameOver.winnerName} wygrywa!`}</h2>
            <p>{gameOver.draw ? 'Macie tyle samo haseł!' : 'Rozwiązałeś więcej haseł!'}</p>
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
