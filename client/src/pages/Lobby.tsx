import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { getGameLabel, getGameRoute } from '../lib/gameRoutes';

export default function Lobby() {
  const navigate = useNavigate();
  const {
    room,
    playerId,
    selectGame,
    error,
    clearError,
    gameOver,
    clearGameOver,
    backToLobby,
  } = useGame();

  const isHost = room?.hostId === playerId;
  const canStart = room && room.players.length === 2;
  const gameRoute = getGameRoute(room?.game);

  useEffect(() => {
    if (!room) {
      navigate('/');
    }
  }, [room, navigate]);

  if (!room) return null;

  return (
    <div className="page">
      <div className="logo" style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.8rem' }}>Pokój gry</h1>
      </div>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button type="button" onClick={clearError} aria-label="Zamknij">×</button>
        </div>
      )}

      {room.status === 'playing' && room.game && gameRoute && (
        <div className="card active-game-banner">
          <div>
            <p className="active-game-label">Gra w toku</p>
            <h3 className="active-game-title">{getGameLabel(room.game)}</h3>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => navigate(gameRoute)}>
            ▶ Kontynuuj grę
          </button>
          {isHost && (
            <button type="button" className="btn btn-secondary" onClick={backToLobby}>
              Zakończ grę
            </button>
          )}
        </div>
      )}

      <div className="card">
        <div className="room-code">
          <span>Kod pokoju — wyślij partnerowi</span>
          <strong>{room.code}</strong>
        </div>

        <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Gracze</h3>
        <ul className="player-list">
          {room.players.map((p) => (
            <li key={p.id}>
              <div className="player-avatar">{p.name[0]?.toUpperCase()}</div>
              <span>{p.name}</span>
              {p.id === room.hostId && (
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--accent-gold)' }}>
                  gospodarz
                </span>
              )}
            </li>
          ))}
          {room.players.length < 2 && (
            <li style={{ color: 'var(--text-muted)', fontSize: '0.85rem', paddingTop: 12 }}>
              <span className="spinner" style={{ animation: 'pulse 1.5s infinite' }}>⏳</span>
              Oczekiwanie na partnera...
            </li>
          )}
        </ul>
      </div>

      {canStart && isHost && room.status === 'waiting' && (
        <div className="card">
          <h3 style={{ fontSize: '0.95rem', marginBottom: 4 }}>Wybierz grę</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>
            Tylko gospodarz wybiera grę
          </p>
          <div className="game-grid">
            <button
              type="button"
              className="game-option"
              onClick={() => selectGame('battleship')}
            >
              <span className="emoji">🚢</span>
              <h3>Statki</h3>
              <p>Zatop flotę rywala</p>
            </button>
            <button
              type="button"
              className="game-option"
              onClick={() => selectGame('wordsearch')}
            >
              <span className="emoji">🔍</span>
              <h3>Wykreślanka</h3>
              <p>Kto pierwszy znajdzie słowa</p>
            </button>
            <button
              type="button"
              className="game-option"
              onClick={() => selectGame('crossword')}
            >
              <span className="emoji">📝</span>
              <h3>Krzyżówka</h3>
              <p>Kto więcej haseł odgadnie</p>
            </button>
            <button
              type="button"
              className="game-option"
              onClick={() => selectGame('sudoku')}
            >
              <span className="emoji">🔢</span>
              <h3>Sudoku</h3>
              <p>Kto szybciej ułoży</p>
            </button>
            <button
              type="button"
              className="game-option"
              onClick={() => selectGame('unos')}
            >
              <span className="emoji">🃏</span>
              <h3>UNOS</h3>
              <p>Pojedynek kart 1 na 1</p>
            </button>
            <button
              type="button"
              className="game-option"
              onClick={() => selectGame('czolko')}
            >
              <span className="emoji">🎯</span>
              <h3>Czółko</h3>
              <p>Zgaduj słowo na czole</p>
            </button>
          </div>
        </div>
      )}

      {canStart && !isHost && room.status === 'waiting' && (
        <div className="card waiting-text">
          <div className="spinner">🎲</div>
          <p>Czekaj, aż gospodarz wybierze grę...</p>
        </div>
      )}

      {room.status === 'finished' && isHost && (
        <button className="btn btn-primary" onClick={backToLobby} style={{ marginTop: 16 }}>
          🔄 Wróć do wyboru gry
        </button>
      )}

      {gameOver && (
        <div className="modal-overlay" onClick={clearGameOver}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="emoji-big">
              {gameOver.draw ? '🤝' : gameOver.forfeit ? '😢' : '🏆'}
            </div>
            <h2>
              {gameOver.draw
                ? 'Remis!'
                : gameOver.forfeit
                  ? `${gameOver.winnerName} wygrywa!`
                  : `${gameOver.winnerName} wygrywa!`}
            </h2>
            <p>
              {gameOver.forfeit
                ? 'Partner opuścił grę'
                : gameOver.draw
                  ? 'Macie tyle samo punktów!'
                  : gameOver.game === 'battleship'
                    ? 'Wszystkie statki zatopione!'
                    : gameOver.game === 'crossword'
                      ? 'Rozwiązałeś więcej haseł!'
                      : gameOver.game === 'sudoku'
                        ? 'Ułożyłeś sudoku szybciej!'
                        : gameOver.game === 'unos'
                          ? 'Pierwszy bez kart!'
                          : gameOver.game === 'czolko'
                            ? 'Pierwszy do 5 trafień!'
                            : 'Znalazłeś więcej słów!'}
            </p>
            {isHost ? (
              <button className="btn btn-primary" onClick={() => { clearGameOver(); backToLobby(); }}>
                Zagraj jeszcze raz
              </button>
            ) : (
              <button className="btn btn-primary" onClick={clearGameOver}>
                OK
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
