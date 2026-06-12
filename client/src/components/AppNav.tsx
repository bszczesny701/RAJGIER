import { useLocation, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { getGameIdFromPath, getGameLabel } from '../lib/gameRoutes';

export default function AppNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { room, roomCode, leaveRoom, backToLobby, playerId } = useGame();

  const path = location.pathname;
  const isHome = path === '/';
  const isLobby = path === '/lobby';
  const gameId = getGameIdFromPath(path);
  const isGame = !!gameId;
  const isHost = room?.hostId === playerId;

  const handleLeaveRoom = () => {
    const msg = room?.status === 'playing'
      ? 'Opuścić pokój w trakcie gry? Partner dostanie informację o wyjściu.'
      : 'Opuścić pokój i wrócić na stronę startową?';
    if (!window.confirm(msg)) return;
    leaveRoom();
    navigate('/');
  };

  const handleBackToLobby = () => {
    if (room?.status === 'playing' && isHost) {
      if (!window.confirm('Zakończyć bieżącą grę i wrócić do wyboru gier?')) return;
      backToLobby();
    }
    navigate('/lobby');
  };

  if (isHome) {
    return (
      <header className="app-nav app-nav-home">
        <div className="app-nav-brand">
          <span className="app-nav-logo">🎮</span>
          <span className="app-nav-title">RAJ GIER</span>
        </div>
      </header>
    );
  }

  return (
    <header className="app-nav">
      <div className="app-nav-left">
        {isLobby ? (
          <button type="button" className="app-nav-btn" onClick={handleLeaveRoom}>
            ← Start
          </button>
        ) : isGame ? (
          <button type="button" className="app-nav-btn" onClick={handleBackToLobby}>
            ← Lobby
          </button>
        ) : (
          <button type="button" className="app-nav-btn" onClick={() => navigate('/')}>
            ← Start
          </button>
        )}
      </div>

      <div className="app-nav-center">
        {isGame && (
          <span className="app-nav-context">{getGameLabel(gameId)}</span>
        )}
        {isLobby && roomCode && (
          <span className="app-nav-context">Pokój {roomCode}</span>
        )}
      </div>

      <div className="app-nav-right">
        {isGame && (
          <button type="button" className="app-nav-btn app-nav-btn-ghost" onClick={() => navigate('/lobby')}>
            Lobby
          </button>
        )}
        {!isHome && (
          <button type="button" className="app-nav-btn app-nav-btn-ghost" onClick={handleLeaveRoom} title="Opuść pokój">
            Wyjdź
          </button>
        )}
      </div>
    </header>
  );
}
