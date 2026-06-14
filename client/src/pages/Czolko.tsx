import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

interface Hint {
  text: string;
  time: number;
}

interface RoundResult {
  type: 'correct' | 'skipped';
  word: string;
  guess?: string;
  guesserId: string;
  skippedBy?: string;
}

interface CzolkoState {
  round: number;
  guesserId: string;
  hinterId: string;
  role: 'guesser' | 'hinter' | 'spectator';
  word: string | null;
  wordLength: number;
  hints: Hint[];
  scores: Record<string, number>;
  lastResult: RoundResult | null;
  winner: string | null;
  winScore: number;
  startTime: number;
  myName: string;
  opponentName: string;
  myId: string;
}

export default function Czolko() {
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
  const [state, setState] = useState<CzolkoState | null>(null);
  const [hintText, setHintText] = useState('');
  const [guessText, setGuessText] = useState('');
  const isHost = room?.hostId === playerId;

  useEffect(() => {
    if (!room) {
      navigate('/');
      return;
    }
    if (room.game !== 'czolko') {
      navigate('/lobby');
    }
  }, [room, navigate]);

  useEffect(() => {
    if (!socket || !room) return;

    const handler = (data: CzolkoState) => {
      setState(data);
    };
    socket.on('czolkoUpdate', handler);
    requestGameState();

    return () => { socket.off('czolkoUpdate', handler); };
  }, [socket, room, requestGameState]);

  const opponentId = state && playerId
    ? Object.keys(state.scores).find((id) => id !== playerId)
    : null;

  const guesserName = state?.guesserId === playerId
    ? state.myName
    : state?.opponentName;

  const hinterName = state?.hinterId === playerId
    ? state.myName
    : state?.opponentName;

  const handleSendHint = () => {
    if (!socket || !hintText.trim()) return;
    socket.emit('czolkoSendHint', {
      text: hintText,
      sessionId,
      roomCode,
    });
    setHintText('');
  };

  const handleGuess = () => {
    if (!socket || !guessText.trim()) return;
    socket.emit('czolkoGuess', {
      guess: guessText,
      sessionId,
      roomCode,
    });
    setGuessText('');
  };

  const handleSkip = () => {
    if (!socket) return;
    socket.emit('czolkoSkip', { sessionId, roomCode });
  };

  if (!state) {
    return (
      <div className="page waiting-text">
        <div className="spinner">🎯</div>
        <p>Ładowanie Czółka...</p>
      </div>
    );
  }

  const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <div className="page czolko-page">
      <div className="game-header">
        <h2>🎯 Czółko</h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
      </div>

      <p className="czolko-subtitle">
        Runda {state.round} · do {state.winScore} pkt
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

      <div className="czolko-roles">
        <div className={`czolko-role ${state.guesserId === playerId ? 'active' : ''}`}>
          <span className="czolko-role-icon">🤔</span>
          <div>
            <div className="czolko-role-label">Zgaduje</div>
            <div className="czolko-role-name">{guesserName}</div>
          </div>
        </div>
        <div className={`czolko-role ${state.hinterId === playerId ? 'active' : ''}`}>
          <span className="czolko-role-icon">💡</span>
          <div>
            <div className="czolko-role-label">Podpowiada</div>
            <div className="czolko-role-name">{hinterName}</div>
          </div>
        </div>
      </div>

      {state.lastResult && (
        <div className={`czolko-result ${state.lastResult.type}`}>
          {state.lastResult.type === 'correct' ? (
            <>✓ Trafione! Słowo: <strong>{state.lastResult.word}</strong></>
          ) : (
            <>⏭ Pominięto — słowo: <strong>{state.lastResult.word}</strong></>
          )}
        </div>
      )}

      {state.role === 'hinter' && state.word && (
        <div className="czolko-word-card hinter">
          <p className="czolko-word-label">Twoje słowo (nie mów go!)</p>
          <div className="czolko-word">{state.word}</div>
          <p className="czolko-word-hint">Opisz je słowami — bez nazwy i bez liter z odpowiedzi</p>
        </div>
      )}

      {state.role === 'guesser' && (
        <div className="czolko-word-card guesser">
          <p className="czolko-word-label">Masz słowo na czole!</p>
          <div className="czolko-blanks">
            {Array.from({ length: state.wordLength }, (_, i) => (
              <span key={i} className="czolko-blank">?</span>
            ))}
          </div>
          <p className="czolko-word-hint">Słuchaj podpowiedzi i zgaduj</p>
        </div>
      )}

      <div className="czolko-hints">
        <h3>Podpowiedzi</h3>
        {state.hints.length === 0 ? (
          <p className="czolko-hints-empty">Jeszcze brak podpowiedzi...</p>
        ) : (
          <ul>
            {state.hints.map((hint, idx) => (
              <li key={`${hint.time}-${idx}`}>{hint.text}</li>
            ))}
          </ul>
        )}
      </div>

      {state.role === 'hinter' && (
        <div className="czolko-input-section">
          <div className="input-group">
            <label htmlFor="hint">Twoja podpowiedź</label>
            <input
              id="hint"
              className="input"
              type="text"
              placeholder="np. pije się rano..."
              value={hintText}
              onChange={(e) => setHintText(e.target.value)}
              maxLength={120}
              onKeyDown={(e) => e.key === 'Enter' && handleSendHint()}
            />
          </div>
          <button type="button" className="btn btn-primary" onClick={handleSendHint} disabled={!hintText.trim()}>
            Wyślij podpowiedź
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleSkip}>
            Pomiń słowo
          </button>
        </div>
      )}

      {state.role === 'guesser' && (
        <div className="czolko-input-section">
          <div className="input-group">
            <label htmlFor="guess">Twoja odpowiedź</label>
            <input
              id="guess"
              className="input"
              type="text"
              placeholder="Wpisz słowo..."
              value={guessText}
              onChange={(e) => setGuessText(e.target.value.toUpperCase())}
              maxLength={30}
              style={{ textTransform: 'uppercase' }}
              onKeyDown={(e) => e.key === 'Enter' && handleGuess()}
            />
          </div>
          <button type="button" className="btn btn-primary" onClick={handleGuess} disabled={!guessText.trim()}>
            Zgaduj!
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleSkip}>
            Poddaj się
          </button>
        </div>
      )}

      {gameOver && (
        <div className="modal-overlay" onClick={clearGameOver}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="emoji-big">{gameOver.draw ? '🤝' : '🏆'}</div>
            <h2>{gameOver.draw ? 'Remis!' : `${gameOver.winnerName} wygrywa!`}</h2>
            <p>{gameOver.draw ? 'Macie tyle samo punktów!' : 'Pierwszy do 5 trafień!'}</p>
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
