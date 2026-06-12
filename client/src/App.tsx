import { Routes, Route } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import Battleship from './pages/Battleship';
import WordSearch from './pages/WordSearch';
import Crossword from './pages/Crossword';

export default function App() {
  return (
    <GameProvider>
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/statki" element={<Battleship />} />
          <Route path="/wykreslanka" element={<WordSearch />} />
          <Route path="/krzyzowka" element={<Crossword />} />
        </Routes>
      </div>
    </GameProvider>
  );
}
