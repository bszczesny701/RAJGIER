import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

interface PersonInfo {
  name: string;
  age: string;
  nationality: string;
  knownFor: string;
}

interface QaEntry {
  question: string;
  answer: 'yes' | 'no' | 'bad';
  answerLabel: string;
  answeredByName: string;
  time: number;
}

interface PendingQuestion {
  text: string;
  guesserName: string;
}

interface RoundResult {
  type: 'correct' | 'skipped' | 'answered';
  name?: string;
  personName?: string;
  guess?: string;
  guesserId: string;
  skippedBy?: string;
  answeredBy?: string;
  answer?: 'yes' | 'no' | 'bad';
  answerLabel?: string;
  question?: string;
}

interface CzolkoState {
  round: number;
  guesserId: string;
  playerIds: string[];
  role: 'guesser' | 'hinter';
  phase: 'asking' | 'answering';
  person: PersonInfo | null;
  pendingQuestion: PendingQuestion | null;
  nameLength: number;
  wordCount: number;
  qaLog: QaEntry[];
  scores: Record<string, number>;
  lastResult: RoundResult | null;
  winner: string | null;
  winScore: number;
  startTime: number;
  playerNames: Record<string, string>;
  myName: string;
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
  const [questionText, setQuestionText] = useState('');
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

  const handleAskQuestion = () => {
    if (!socket || !questionText.trim()) return;
    socket.emit('czolkoAskQuestion', {
      text: questionText,
      sessionId,
      roomCode,
    });
    setQuestionText('');
  };

  const handleAnswer = (answer: 'yes' | 'no' | 'bad') => {
    if (!socket) return;
    socket.emit('czolkoAnswerQuestion', { answer, sessionId, roomCode });
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
  const guesserName = state.playerNames[state.guesserId] || 'Gracz';
  const hinterNames = state.playerIds
    .filter((id) => id !== state.guesserId)
    .map((id) => state.playerNames[id] || 'Gracz');

  const isMyTurnAsGuesser = state.role === 'guesser' && state.phase === 'asking';
  const canAnswer = state.role === 'hinter' && state.phase === 'answering' && state.pendingQuestion;

  return (
    <div className="page czolko-page">
      <div className="game-header">
        <h2>🎯 Czółko</h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
      </div>

      <p className="czolko-subtitle">
        Pytania TAK/NIE · tura {state.round} · do {state.winScore} pkt
      </p>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button type="button" onClick={clearError} aria-label="Zamknij">×</button>
        </div>
      )}

      <div className={`czolko-scores-grid cols-${Math.min(state.playerIds.length, 4)}`}>
        {state.playerIds.map((id) => (
          <div
            key={id}
            className={`czolko-score-item${id === playerId ? ' me' : ''}${id === state.guesserId ? ' guessing' : ''}`}
          >
            <div className="label">{state.playerNames[id] || 'Gracz'}</div>
            <div className="value">{state.scores[id] || 0}</div>
            {id === state.guesserId && <span className="czolko-score-badge">zgaduje</span>}
          </div>
        ))}
      </div>

      <div className="czolko-roles">
        <div className={`czolko-role ${state.guesserId === playerId ? 'active' : ''}`}>
          <span className="czolko-role-icon">🤔</span>
          <div>
            <div className="czolko-role-label">Zgaduje</div>
            <div className="czolko-role-name">{guesserName}</div>
          </div>
        </div>
        <div className={`czolko-role ${state.role === 'hinter' ? 'active' : ''}`}>
          <span className="czolko-role-icon">💬</span>
          <div>
            <div className="czolko-role-label">Odpowiada</div>
            <div className="czolko-role-name">{hinterNames.join(', ')}</div>
          </div>
        </div>
      </div>

      {state.lastResult && (
        <div className={`czolko-result ${state.lastResult.type}`}>
          {state.lastResult.type === 'correct' && (
            <>✓ Trafione! <strong>{state.lastResult.name}</strong> — +1 pkt</>
          )}
          {state.lastResult.type === 'skipped' && (
            <>⏭ Pominięto — <strong>{state.lastResult.name}</strong></>
          )}
          {state.lastResult.type === 'answered' && (
            <>
              Odpowiedź: <strong>{state.lastResult.answerLabel}</strong>
              {state.lastResult.personName && (
                <> · osoba: <strong>{state.lastResult.personName}</strong></>
              )}
            </>
          )}
        </div>
      )}

      {state.role === 'hinter' && state.person && (
        <div className="czolko-word-card hinter">
          <p className="czolko-word-label">Widzisz kartę — odpowiadaj tylko TAK, NIE lub ŹLE PYTANIE</p>
          <div className="czolko-word">{state.person.name}</div>
          <div className="czolko-person-info">
            <div className="czolko-person-field">
              <span className="czolko-person-key">Wiek</span>
              <span className="czolko-person-value">{state.person.age}</span>
            </div>
            <div className="czolko-person-field">
              <span className="czolko-person-key">Narodowość</span>
              <span className="czolko-person-value">{state.person.nationality}</span>
            </div>
            <div className="czolko-person-field">
              <span className="czolko-person-key">Znany/a z</span>
              <span className="czolko-person-value">{state.person.knownFor}</span>
            </div>
          </div>
        </div>
      )}

      {state.role === 'guesser' && (
        <div className="czolko-word-card guesser">
          <p className="czolko-word-label">Masz osobę na czole!</p>
          <div className="czolko-person-silhouette">👤</div>
          <p className="czolko-person-meta">
            {state.wordCount} {state.wordCount === 1 ? 'słowo' : state.wordCount < 5 ? 'słowa' : 'słów'}
            {' · '}
            {state.nameLength} {state.nameLength === 1 ? 'litera' : state.nameLength < 5 ? 'litery' : 'liter'}
          </p>
          <p className="czolko-word-hint">
            {state.phase === 'answering'
              ? 'Czekasz na odpowiedź...'
              : 'Zadaj pytanie TAK/NIE lub zgadnij kto to'}
          </p>
        </div>
      )}

      {state.pendingQuestion && (
        <div className="czolko-question-card">
          <p className="czolko-question-label">Pytanie od {state.pendingQuestion.guesserName}</p>
          <p className="czolko-question-text">„{state.pendingQuestion.text}"</p>
        </div>
      )}

      {canAnswer && (
        <div className="czolko-answer-buttons">
          <button type="button" className="czolko-answer-btn yes" onClick={() => handleAnswer('yes')}>
            ✓ TAK
          </button>
          <button type="button" className="czolko-answer-btn no" onClick={() => handleAnswer('no')}>
            ✗ NIE
          </button>
          <button type="button" className="czolko-answer-btn bad" onClick={() => handleAnswer('bad')}>
            ? ŹLE PYTANIE
          </button>
        </div>
      )}

      <div className="czolko-hints">
        <h3>Historia pytań</h3>
        {state.qaLog.length === 0 ? (
          <p className="czolko-hints-empty">Jeszcze brak pytań w tej turze...</p>
        ) : (
          <ul className="czolko-qa-list">
            {state.qaLog.map((entry, idx) => (
              <li key={`${entry.time}-${idx}`} className={`czolko-qa-item answer-${entry.answer}`}>
                <p className="czolko-qa-question">„{entry.question}"</p>
                <p className="czolko-qa-answer">
                  <strong>{entry.answerLabel}</strong>
                  <span className="czolko-qa-by"> — {entry.answeredByName}</span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {state.role === 'guesser' && state.phase === 'asking' && (
        <div className="czolko-input-section">
          <div className="input-group">
            <label htmlFor="question">Twoje pytanie</label>
            <input
              id="question"
              className="input"
              type="text"
              placeholder="np. Czy to sportowiec?"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              maxLength={160}
              onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
            />
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleAskQuestion}
            disabled={!questionText.trim()}
          >
            Zadaj pytanie
          </button>

          <div className="czolko-divider"><span>albo zgadnij</span></div>

          <div className="input-group">
            <label htmlFor="guess">Kto to jest?</label>
            <input
              id="guess"
              className="input"
              type="text"
              placeholder="Imię i nazwisko..."
              value={guessText}
              onChange={(e) => setGuessText(e.target.value.toUpperCase())}
              maxLength={30}
              style={{ textTransform: 'uppercase' }}
              onKeyDown={(e) => e.key === 'Enter' && handleGuess()}
            />
          </div>
          <button type="button" className="btn btn-primary" onClick={handleGuess} disabled={!guessText.trim()}>
            Zgaduj! (+1 pkt)
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleSkip}>
            Pomiń osobę
          </button>
        </div>
      )}

      {state.role === 'hinter' && !canAnswer && (
        <p className="czolko-waiting-hint">
          {state.phase === 'answering'
            ? 'Inny gracz może odpowiedzieć...'
            : 'Czekaj, aż zgadujący zada pytanie...'}
        </p>
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
