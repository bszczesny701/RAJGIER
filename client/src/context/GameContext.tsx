import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ||
  (import.meta.env.DEV ? 'http://localhost:3001' : window.location.origin);

function getSessionId(): string {
  let id = localStorage.getItem('raj-gier-session');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('raj-gier-session', id);
  }
  return id;
}

export interface Player {
  id: string;
  name: string;
}

export interface Room {
  code: string;
  players: Player[];
  hostId: string;
  status: 'waiting' | 'playing' | 'finished';
  game: 'battleship' | 'wordsearch' | 'crossword' | 'sudoku' | 'unos' | 'czolko' | 'monopoly' | null;
}

export interface GameOverEvent {
  winnerId: string;
  winnerName: string | null;
  game: string;
  draw?: boolean;
  forfeit?: boolean;
}

export type CzolkoCharacterPool = 'all' | 'poland';

export interface CzolkoGameOptions {
  characterPool: CzolkoCharacterPool;
}

interface GameContextValue {
  socket: Socket | null;
  connected: boolean;
  playerId: string | null;
  sessionId: string;
  playerName: string;
  setPlayerName: (name: string) => void;
  room: Room | null;
  roomCode: string | null;
  error: string | null;
  clearError: () => void;
  gameOver: GameOverEvent | null;
  clearGameOver: () => void;
  createRoom: () => Promise<boolean>;
  joinRoom: (code: string) => Promise<boolean>;
  selectGame: (
    game: 'battleship' | 'wordsearch' | 'crossword' | 'sudoku' | 'unos' | 'czolko' | 'monopoly',
    options?: CzolkoGameOptions,
  ) => void;
  backToLobby: () => void;
  leaveRoom: () => void;
  requestGameState: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [sessionId] = useState(getSessionId);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState(
    () => localStorage.getItem('raj-gier-name') || ''
  );
  const [room, setRoom] = useState<Room | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(
    () => localStorage.getItem('raj-gier-room') || null
  );
  const [error, setError] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState<GameOverEvent | null>(null);

  useEffect(() => {
    localStorage.setItem('raj-gier-name', playerName);
  }, [playerName]);

  useEffect(() => {
    const s = io(SERVER_URL, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });
    setSocket(s);

    const tryRejoin = () => {
      const savedRoom = localStorage.getItem('raj-gier-room');
      const savedName = localStorage.getItem('raj-gier-name');
      if (!savedRoom || !savedName) return;

      s.emit('rejoinRoom', {
        roomCode: savedRoom,
        playerName: savedName,
        sessionId,
      }, (res: {
        success: boolean;
        room?: Room;
        playerId?: string;
      }) => {
        if (res.success && res.room && res.playerId) {
          setPlayerId(res.playerId);
          setRoom(res.room);
          setRoomCode(res.room.code);
        }
      });
    };

    s.on('connect', () => {
      setConnected(true);
      tryRejoin();
    });
    s.on('disconnect', () => setConnected(false));
    s.on('roomUpdate', (r: Room) => {
      setRoom(r);
      setRoomCode(r.code);
      localStorage.setItem('raj-gier-room', r.code);
    });
    s.on('error', ({ message }: { message: string }) => setError(message));
    s.on('gameOver', (data: GameOverEvent) => setGameOver(data));
    s.on('gameStart', () => {
      const savedRoom = localStorage.getItem('raj-gier-room');
      if (!savedRoom) return;
      s.emit('requestGameState', {
        sessionId,
        roomCode: savedRoom,
        playerName,
      });
    });

    return () => {
      s.disconnect();
    };
  }, [sessionId, playerName]);

  const clearError = useCallback(() => setError(null), []);
  const clearGameOver = useCallback(() => setGameOver(null), []);

  const requestGameState = useCallback(() => {
    if (!socket || !roomCode) return;
    socket.emit('requestGameState', {
      sessionId,
      roomCode,
      playerName,
    });
  }, [socket, sessionId, roomCode, playerName]);

  const createRoom = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!socket) return resolve(false);
      socket.emit('createRoom', { playerName, sessionId }, (res: {
        success: boolean;
        playerId?: string;
        error?: string;
      }) => {
        if (res.success && res.playerId) {
          setPlayerId(res.playerId);
          resolve(true);
        } else {
          setError(res.error || 'Nie udało się utworzyć pokoju');
          resolve(false);
        }
      });
    });
  }, [socket, playerName, sessionId]);

  const joinRoom = useCallback((code: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!socket) return resolve(false);
      socket.emit('joinRoom', { roomCode: code, playerName, sessionId }, (res: {
        success: boolean;
        playerId?: string;
        error?: string;
      }) => {
        if (res.success && res.playerId) {
          setPlayerId(res.playerId);
          resolve(true);
        } else {
          setError(res.error || 'Nie udało się dołączyć');
          resolve(false);
        }
      });
    });
  }, [socket, playerName, sessionId]);

  const selectGame = useCallback((
    game: 'battleship' | 'wordsearch' | 'crossword' | 'sudoku' | 'unos' | 'czolko' | 'monopoly',
    options?: CzolkoGameOptions,
  ) => {
    socket?.emit('selectGame', {
      game,
      sessionId,
      roomCode,
      gameOptions: game === 'czolko' ? options : undefined,
    });
  }, [socket, sessionId, roomCode]);

  const backToLobby = useCallback(() => {
    clearGameOver();
    socket?.emit('backToLobby', { sessionId, roomCode });
  }, [socket, sessionId, roomCode, clearGameOver]);

  const leaveRoom = useCallback(() => {
    clearGameOver();
    if (roomCode) {
      socket?.emit('leaveRoom', { sessionId, roomCode });
    }
    localStorage.removeItem('raj-gier-room');
    setRoom(null);
    setRoomCode(null);
    setPlayerId(null);
  }, [socket, sessionId, roomCode, clearGameOver]);

  return (
    <GameContext.Provider
      value={{
        socket,
        connected,
        playerId,
        sessionId,
        playerName,
        setPlayerName,
        room,
        roomCode,
        error,
        clearError,
        gameOver,
        clearGameOver,
        createRoom,
        joinRoom,
        selectGame,
        backToLobby,
        leaveRoom,
        requestGameState,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
