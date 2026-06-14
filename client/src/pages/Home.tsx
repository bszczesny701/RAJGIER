import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

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
    <div className="page">
      <div className="logo">
        <span className="logo-icon">🎮</span>
        <h1>RAJ GIER</h1>
        <p>Gry dla dwojga — rywalizujcie i bawcie się!</p>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 16, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <span className={`status-dot ${connected ? 'online' : 'offline'}`} />
        {connected ? 'Połączono' : 'Łączenie...'}
      </div>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button type="button" onClick={clearError} aria-label="Zamknij">×</button>
        </div>
      )}

      {room && roomCode && (
        <div className="card home-room-banner" style={{ marginBottom: 16 }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
            Jesteś w pokoju <strong style={{ color: 'var(--accent-gold)' }}>{roomCode}</strong>
          </p>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/lobby')}>
            → Wróć do pokoju
          </button>
        </div>
      )}

      <div className="card">
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
          />
        </div>

        {mode === 'menu' ? (
          <>
            <button
              className="btn btn-primary"
              onClick={handleCreate}
              disabled={!connected || !playerName.trim() || loading}
            >
              {loading ? 'Tworzenie...' : '✨ Utwórz pokój'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setMode('join')}
              disabled={!connected || !playerName.trim()}
            >
              🔗 Dołącz do pokoju
            </button>
          </>
        ) : (
          <>
            <div className="input-group">
              <label htmlFor="code">Kod pokoju</label>
              <input
                id="code"
                className="input"
                type="text"
                placeholder="np. ABC123"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                style={{ textTransform: 'uppercase', letterSpacing: '4px', textAlign: 'center', fontFamily: 'monospace' }}
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={handleJoin}
              disabled={!connected || !playerName.trim() || joinCode.length < 4 || loading}
            >
              {loading ? 'Dołączanie...' : 'Dołącz'}
            </button>
            <button className="btn btn-secondary" onClick={() => setMode('menu')}>
              ← Wróć
            </button>
          </>
        )}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: '0.95rem', marginBottom: 12, color: 'var(--text-secondary)' }}>Dostępne gry</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          <div style={{ textAlign: 'center', padding: '12px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: 10 }}>
            <span style={{ fontSize: '1.5rem' }}>🚢</span>
            <p style={{ fontSize: '0.8rem', marginTop: 4 }}>Statki</p>
          </div>
          <div style={{ textAlign: 'center', padding: '12px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: 10 }}>
            <span style={{ fontSize: '1.5rem' }}>🔍</span>
            <p style={{ fontSize: '0.8rem', marginTop: 4 }}>Wykreślanka</p>
          </div>
          <div style={{ textAlign: 'center', padding: '12px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: 10 }}>
            <span style={{ fontSize: '1.5rem' }}>📝</span>
            <p style={{ fontSize: '0.8rem', marginTop: 4 }}>Krzyżówka</p>
          </div>
          <div style={{ textAlign: 'center', padding: '12px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: 10 }}>
            <span style={{ fontSize: '1.5rem' }}>🔢</span>
            <p style={{ fontSize: '0.8rem', marginTop: 4 }}>Sudoku</p>
          </div>
          <div style={{ textAlign: 'center', padding: '12px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: 10 }}>
            <span style={{ fontSize: '1.5rem' }}>🃏</span>
            <p style={{ fontSize: '0.8rem', marginTop: 4 }}>UNOS</p>
          </div>
          <div style={{ textAlign: 'center', padding: '12px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: 10 }}>
            <span style={{ fontSize: '1.5rem' }}>🎯</span>
            <p style={{ fontSize: '0.8rem', marginTop: 4 }}>Czółko</p>
          </div>
        </div>
      </div>
    </div>
  );
}
