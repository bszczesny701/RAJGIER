import { useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { getGameRoute } from '../lib/gameRoutes';
import AppNav from './AppNav';
import Home from '../pages/Home';
import Lobby from '../pages/Lobby';
import Battleship from '../pages/Battleship';
import WordSearch from '../pages/WordSearch';
import Crossword from '../pages/Crossword';
import Sudoku from '../pages/Sudoku';
import Unos from '../pages/Unos';
import Czolko from '../pages/Czolko';

function GameAutoStart() {
  const navigate = useNavigate();
  const location = useLocation();
  const { room } = useGame();
  const prevStatus = useRef(room?.status);

  useEffect(() => {
    const wasWaiting = prevStatus.current === 'waiting';
    const nowPlaying = room?.status === 'playing' && room.game;
    prevStatus.current = room?.status;

    if (wasWaiting && nowPlaying && location.pathname === '/lobby') {
      const route = getGameRoute(room.game);
      if (route) navigate(route);
    }
  }, [room, location.pathname, navigate]);

  return null;
}

export default function AppLayout() {
  return (
    <div className="app-shell">
      <AppNav />
      <main className="app-main">
        <GameAutoStart />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/statki" element={<Battleship />} />
          <Route path="/wykreslanka" element={<WordSearch />} />
          <Route path="/krzyzowka" element={<Crossword />} />
          <Route path="/sudoku" element={<Sudoku />} />
          <Route path="/unos" element={<Unos />} />
          <Route path="/czolko" element={<Czolko />} />
        </Routes>
      </main>
    </div>
  );
}
