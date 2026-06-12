import { GameProvider } from './context/GameContext';
import AppLayout from './components/AppLayout';

export default function App() {
  return (
    <GameProvider>
      <div className="app">
        <AppLayout />
      </div>
    </GameProvider>
  );
}
