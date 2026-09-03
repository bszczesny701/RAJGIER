import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame, type CzolkoCharacterPool } from '../context/GameContext';
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
  game: Exclude<GameId, 'czolko'>;
  playerCount: number;
  onSelect: (game: Exclude<GameId, 'czolko'>) => void;
}) {
  const enabled = canStartGame(game, playerCount);
  const range = getGamePlayerRangeLabel(game);

  const meta: Record<Exclude<GameId, 'czolko'>, { emoji: string; title: string; desc: string }> = {
    battleship: { emoji: '🚢', title: 'Statki', desc: 'Zatop flotę rywala' },
    wordsearch: { emoji: '🔍', title: 'Wykreślanka', desc: 'Kto pierwszy znajdzie słowa' },
    crossword: { emoji: '📝', title: 'Krzyżówka', desc: 'Kto więcej haseł odgadnie' },
    sudoku: { emoji: '🔢', title: 'Sudoku', desc: 'Kto szybciej ułoży' },
    unos: { emoji: '🃏', title: 'UNOS', desc: 'Pojedynek kart' },
    monopoly: { emoji: '🏠', title: 'Monopoly', desc: 'Inwestycje, losy, 2–6 graczy' },
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

function CzolkoGameOption({
  playerCount,
  onStart,
}: {
  playerCount: number;
  onStart: (characterPool: CzolkoCharacterPool) => void;
}) {
  const [characterPool, setCharacterPool] = useState<CzolkoCharacterPool>('all');
  const enabled = canStartGame('czolko', playerCount);
  const range = getGamePlayerRangeLabel('czolko');

  const pools: {
    id: CzolkoCharacterPool;
    icon: string;
    title: string;
    count: string;
    hint: string;
  }[] = [
    { id: 'all', icon: '🌍', title: 'Wszystkie', count: '300', hint: 'Świat + fikcja' },
    { id: 'poland', icon: '🇵🇱', title: 'Polska', count: '64', hint: 'Sport, film, historia' },
  ];

  return (
    <div className={`czolko-setup-card${enabled ? '' : ' is-disabled'}`}>
      <div className="czolko-setup-glow" aria-hidden />

      <div className="czolko-setup-header">
        <div className="czolko-setup-icon-wrap">
          <span className="czolko-setup-icon">🎯</span>
        </div>
        <div className="czolko-setup-titles">
          <h3>Czółko</h3>
          <p>Pytania TAK/NIE · każdy zgaduje swoją postać</p>
        </div>
        <span className="czolko-setup-badge">{range}</span>
      </div>

      <div className="czolko-setup-body">
        <p className="czolko-setup-label">Pula postaci</p>
        <div className="czolko-segment" role="radiogroup" aria-label="Pula postaci">
          {pools.map((pool) => {
            const active = characterPool === pool.id;
            return (
              <button
                key={pool.id}
                type="button"
                role="radio"
                aria-checked={active}
                className={`czolko-segment-btn${active ? ' active' : ''}`}
                disabled={!enabled}
                onClick={() => setCharacterPool(pool.id)}
              >
                <span className="czolko-segment-icon">{pool.icon}</span>
                <span className="czolko-segment-text">
                  <strong>{pool.title}</strong>
                  <small>{pool.hint}</small>
                </span>
                <span className="czolko-segment-count">{pool.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        className="czolko-setup-start"
        disabled={!enabled}
        onClick={() => onStart(characterPool)}
      >
        <span className="czolko-setup-start-icon">▶</span>
        <span>Rozpocznij Czółko</span>
      </button>
    </div>
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
    <div className="page lobby-page">
      <header className="lobby-hero">
        <p className="lobby-hero-label">Pokój</p>
        <h1 className="lobby-hero-code">{room.code}</h1>
        <p className="lobby-hero-meta">
          {playerCount}/{MAX_ROOM_PLAYERS} graczy
          {isHost ? ' · jesteś gospodarzem' : ''}
        </p>
      </header>

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
            Kontynuuj
          </button>
          {isHost && (
            <button type="button" className="btn btn-secondary" onClick={backToLobby}>
              Zakończ
            </button>
          )}
        </div>
      )}

      <section className="card lobby-players-card">
        <h3 className="lobby-section-title">Gracze</h3>
        <ul className="player-list">
          {room.players.map((p) => (
            <li key={p.id}>
              <div className="player-avatar">{p.name[0]?.toUpperCase()}</div>
              <span>{p.name}</span>
              {p.id === room.hostId && (
                <span className="lobby-host-badge">host</span>
              )}
            </li>
          ))}
          {playerCount < 2 && (
            <li className="lobby-hint">
              Oczekiwanie na graczy (min. 2)…
            </li>
          )}
          {playerCount >= 2 && playerCount < MAX_ROOM_PLAYERS && (
            <li className="lobby-hint">
              Możesz czekać na więcej (Monopoly do {MAX_ROOM_PLAYERS}, UNOS/Czółko do 4)
            </li>
          )}
        </ul>
      </section>

      {canStart && isHost && room.status === 'waiting' && (
        <section className="card">
          <h3 className="lobby-section-title">Wybierz grę</h3>
          <p className="lobby-section-sub">
            Tylko gospodarz · {playerCount} w pokoju
          </p>
          <div className="game-grid">
            <GameOptionButton game="battleship" playerCount={playerCount} onSelect={selectGame} />
            <GameOptionButton game="wordsearch" playerCount={playerCount} onSelect={selectGame} />
            <GameOptionButton game="crossword" playerCount={playerCount} onSelect={selectGame} />
            <GameOptionButton game="sudoku" playerCount={playerCount} onSelect={selectGame} />
            <GameOptionButton game="unos" playerCount={playerCount} onSelect={selectGame} />
            <GameOptionButton game="monopoly" playerCount={playerCount} onSelect={selectGame} />
          </div>
          <CzolkoGameOption
            playerCount={playerCount}
            onStart={(characterPool) => selectGame('czolko', { characterPool })}
          />
        </section>
      )}

      {canStart && !isHost && room.status === 'waiting' && (
        <div className="card waiting-text">
          <div className="spinner">🎲</div>
          <p>Czekaj, aż gospodarz wybierze grę…</p>
        </div>
      )}

      {room.status === 'finished' && isHost && (
        <button className="btn btn-primary" onClick={backToLobby} style={{ marginTop: 8 }}>
          Wróć do wyboru gry
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
                            : gameOver.game === 'monopoly'
                              ? 'Ostatni z majątkiem wygrywa!'
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
