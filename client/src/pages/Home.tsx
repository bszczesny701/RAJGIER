import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

const GAMES = [
  { emoji: '🚢', name: 'Statki', players: '2' },
  { emoji: '🔍', name: 'Wykreślanka', players: '2' },
  { emoji: '📝', name: 'Krzyżówka', players: '2' },
  { emoji: '🔢', name: 'Sudoku', players: '2' },
  { emoji: '🃏', name: 'UNOS', players: '2–4' },
  { emoji: '🎯', name: 'Czółko', players: '2–4' },
  { emoji: '🏠', name: 'Monopoly', players: '2–6' },
] as const;

export default function Home() {
  const navigate = useNavigate();
  const { playerName, setPlayerName, createRoom, joinRoom, connected, error, clearError, room, roomCode } = useGame();
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'menu' | 'join'>('menu');

  const handleCreate = async () => {
    if (!playerName.trim()) return;
    setLoading(true);
    clearError();
    const ok = await createRoom();
    setLoading(false);
    if (ok) navigate('/lobby');
  };

  const handleJoin = async () => {
    if (!playerName.trim() || !joinCode.trim()) return;
    setLoading(true);
    clearError();
    const ok = await joinRoom(joinCode);
    setLoading(false);
    if (ok) navigate('/lobby');
  };

  return (
    <div className="page home-page">
      <header className="home-hero">
        <div className={`home-status${connected ? ' is-online' : ''}`}>
          <span className={`status-dot ${connected ? 'online' : 'offline'}`} />
          {connected ? 'Online' : 'Łączenie…'}
        </div>
        <h1 className="home-title">RAJ GIER</h1>
        <p className="home-sub">Pokój 2–6 osób · grajcie z telefonu</p>
      </header>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button type="button" onClick={clearError} aria-label="Zamknij">×</button>
        </div>
      )}

      {room && roomCode && (
        <button type="button" className="home-resume" onClick={() => navigate('/lobby')}>
          <div className="home-resume-text">
            <span className="home-resume-label">Aktywny pokój</span>
            <strong>{roomCode}</strong>
          </div>
          <span className="home-resume-cta">Wejdź</span>
        </button>
      )}

      <section className="home-sheet">
        <div className="input-group">
          <label htmlFor="name">Twoje imię</label>
          <input
            id="name"
            className="input"
            type="text"
            placeholder="np. Ania"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={20}
            autoComplete="nickname"
            enterKeyHint="next"
          />
        </div>

        {mode === 'menu' ? (
          <div className="home-actions">
            <button
              className="btn btn-primary"
              onClick={handleCreate}
              disabled={!connected || !playerName.trim() || loading}
            >
              {loading ? 'Tworzenie…' : 'Utwórz pokój'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setMode('join')}
              disabled={!connected || !playerName.trim()}
            >
              Dołącz kodem
            </button>
          </div>
        ) : (
          <div className="home-actions">
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label htmlFor="code">Kod pokoju</label>
              <input
                id="code"
                className="input home-code-input"
                type="text"
                placeholder="ABC123"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                inputMode="text"
                enterKeyHint="go"
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={handleJoin}
              disabled={!connected || !playerName.trim() || joinCode.length < 4 || loading}
            >
              {loading ? 'Dołączanie…' : 'Dołącz'}
            </button>
            <button className="btn btn-secondary" onClick={() => setMode('menu')}>
              Wróć
            </button>
          </div>
        )}
      </section>

      <section className="home-catalog">
        <div className="home-catalog-head">
          <h2>Gry</h2>
          <span>{GAMES.length}</span>
        </div>
        <div className="home-game-grid">
          {GAMES.map((g) => (
            <div key={g.name} className="home-game-tile">
              <span className="home-game-emoji" aria-hidden>{g.emoji}</span>
              <span className="home-game-name">{g.name}</span>
              <span className="home-game-meta">{g.players}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
