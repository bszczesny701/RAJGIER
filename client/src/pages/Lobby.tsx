import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import {
  getGameLabel,
  getGameRoute,
  canStartGame,
  getGamePlayerRangeLabel,
  MAX_ROOM_PLAYERS,
  type GameId,
} from '../lib/gameRoutes';

function GameOptionButton({
  game,
  playerCount,
  onSelect,
}: {
  game: GameId;
  playerCount: number;
  onSelect: (game: GameId) => void;
}) {
  const enabled = canStartGame(game, playerCount);
  const range = getGamePlayerRangeLabel(game);

  const meta: Record<GameId, { emoji: string; title: string; desc: string }> = {
    battleship: { emoji: '🚢', title: 'Statki', desc: 'Zatop flotę rywala' },
    wordsearch: { emoji: '🔍', title: 'Wykreślanka', desc: 'Kto pierwszy znajdzie słowa' },
    crossword: { emoji: '📝', title: 'Krzyżówka', desc: 'Kto więcej haseł odgadnie' },
    sudoku: { emoji: '🔢', title: 'Sudoku', desc: 'Kto szybciej ułoży' },
    unos: { emoji: '🃏', title: 'UNOS', desc: 'Pojedynek kart' },
    czolko: { emoji: '🎯', title: 'Czółko', desc: 'Każdy ma swoją postać' },
  };

  const info = meta[game];

  return (
    <button
      type="button"
      className={`game-option${enabled ? '' : ' disabled'}`}
      onClick={() => enabled && onSelect(game)}
      disabled={!enabled}
      title={enabled ? undefined : `Wymaga: ${range}`}
    >
      <span className="emoji">{info.emoji}</span>
      <h3>{info.title}</h3>
      <p>{info.desc}</p>
      <span className="game-option-range">{range}</span>
    </button>
  );
}

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
  const playerCount = room?.players.length ?? 0;
  const canStart = room && playerCount >= 2;
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
          <span>Kod pokoju — wyślij znajomym</span>
          <strong>{room.code}</strong>
        </div>

        <p className="lobby-player-count">
          Gracze: {playerCount}/{MAX_ROOM_PLAYERS}
        </p>

        <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 8 }}>W pokoju</h3>
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
          {playerCount < 2 && (
            <li style={{ color: 'var(--text-muted)', fontSize: '0.85rem', paddingTop: 12 }}>
              <span className="spinner" style={{ animation: 'pulse 1.5s infinite' }}>⏳</span>
              Oczekiwanie na graczy (min. 2)...
            </li>
          )}
          {playerCount >= 2 && playerCount < MAX_ROOM_PLAYERS && (
            <li style={{ color: 'var(--text-muted)', fontSize: '0.85rem', paddingTop: 12 }}>
              Możesz czekać na więcej graczy (Czółko i UNOS: do {MAX_ROOM_PLAYERS})
            </li>
          )}
        </ul>
      </div>

      {canStart && isHost && room.status === 'waiting' && (
        <div className="card">
          <h3 style={{ fontSize: '0.95rem', marginBottom: 4 }}>Wybierz grę</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>
            Tylko gospodarz wybiera grę · {playerCount} graczy w pokoju
          </p>
          <div className="game-grid">
            <GameOptionButton game="battleship" playerCount={playerCount} onSelect={selectGame} />
            <GameOptionButton game="wordsearch" playerCount={playerCount} onSelect={selectGame} />
            <GameOptionButton game="crossword" playerCount={playerCount} onSelect={selectGame} />
            <GameOptionButton game="sudoku" playerCount={playerCount} onSelect={selectGame} />
            <GameOptionButton game="unos" playerCount={playerCount} onSelect={selectGame} />
            <GameOptionButton game="czolko" playerCount={playerCount} onSelect={selectGame} />
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
                ? 'Ktoś opuścił grę'
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
