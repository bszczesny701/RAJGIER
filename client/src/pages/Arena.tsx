import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import './Arena.css';

interface ArenaCard {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  kind: string;
  playable?: boolean;
}

interface ArenaTower {
  id: string;
  type: 'king' | 'princess';
  mine: boolean;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  alive: boolean;
}

interface ArenaUnit {
  id: string;
  cardId: string;
  emoji: string;
  name: string;
  mine: boolean;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  flying: boolean;
  kind: string;
}

interface ArenaEffect {
  id: string;
  type: string;
  x: number;
  y: number;
  radius: number;
  ttl: number;
}

interface ArenaState {
  phase: string;
  arenaW: number;
  arenaH: number;
  elixir: number;
  elixirMax: number;
  hand: ArenaCard[];
  nextCard: ArenaCard | null;
  myCrowns: number;
  enemyCrowns: number;
  myName: string;
  enemyName: string;
  towers: ArenaTower[];
  units: ArenaUnit[];
  effects: ArenaEffect[];
  remainingMs: number;
  doubleElixir: boolean;
  winner: string | null;
  winReason: string | null;
}

function formatTime(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

function Crowns({ count, mine }: { count: number; mine?: boolean }) {
  return (
    <div className={`arena-crowns${mine ? ' mine' : ''}`} aria-label={`${count} korony`}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={i < count ? 'on' : ''}>👑</span>
      ))}
    </div>
  );
}

export default function Arena() {
  const navigate = useNavigate();
  const {
    socket,
    room,
    playerId,
    sessionId,
    roomCode,
    error,
    clearError,
    gameOver,
    clearGameOver,
    backToLobby,
    requestGameState,
  } = useGame();

  const [state, setState] = useState<ArenaState | null>(null);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const isHost = room?.hostId === playerId;

  useEffect(() => {
    if (!room) {
      navigate('/');
      return;
    }
    if (room.game !== 'arena') {
      navigate('/lobby');
    }
  }, [room, navigate]);

  useEffect(() => {
    if (!socket || !room) return;
    const handler = (data: ArenaState) => setState(data);
    socket.on('arenaUpdate', handler);
    requestGameState();
    return () => { socket.off('arenaUpdate', handler); };
  }, [socket, room, requestGameState]);

  useEffect(() => {
    if (!selectedCard) return;
    const card = state?.hand.find((c) => c.id === selectedCard);
    if (!card || card.playable === false) {
      setSelectedCard(null);
    }
  }, [state, selectedCard]);

  const pct = (value: number, max: number) =>
    `${Math.max(0, Math.min(100, (value / max) * 100))}%`;

  // Arena y=0 to tył gracza (dół ekranu), y=max = tył rywala (góra).
  const toPercent = (x: number, y: number, w: number, h: number) => ({
    left: `${(x / w) * 100}%`,
    top: `${((h - y) / h) * 100}%`,
  });

  const pointerToArena = (clientX: number, clientY: number) => {
    const el = fieldRef.current;
    if (!el || !state) return null;
    const rect = el.getBoundingClientRect();
    const nx = (clientX - rect.left) / rect.width;
    const ny = (clientY - rect.top) / rect.height;
    if (nx < 0 || nx > 1 || ny < 0 || ny > 1) return null;
    return {
      x: nx * state.arenaW,
      y: (1 - ny) * state.arenaH,
    };
  };

  const deploy = (x: number, y: number) => {
    if (!socket || !selectedCard || !state) return;
    const card = state.hand.find((c) => c.id === selectedCard);
    if (!card || !card.playable) return;

    socket.emit('arenaPlayCard', {
      cardId: selectedCard,
      x,
      y,
      sessionId,
      roomCode,
    });
    setSelectedCard(null);
    setHoverPos(null);
  };

  const onFieldPointer = (e: ReactPointerEvent) => {
    const pos = pointerToArena(e.clientX, e.clientY);
    if (!pos) return;
    if (e.type === 'pointermove' && selectedCard) {
      setHoverPos(pos);
      return;
    }
    if (e.type === 'pointerup' && selectedCard) {
      deploy(pos.x, pos.y);
    }
  };

  const elixirFill = useMemo(() => {
    if (!state) return 0;
    return Math.min(100, (state.elixir / state.elixirMax) * 100);
  }, [state]);

  if (!room) return null;

  return (
    <div className="page arena-page">
      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button type="button" onClick={clearError} aria-label="Zamknij">×</button>
        </div>
      )}

      {!state ? (
        <div className="arena-loading">
          <div className="spinner">⚔️</div>
          <p>Ładowanie areny…</p>
        </div>
      ) : (
        <>
          <header className="arena-hud">
            <div className="arena-hud-side enemy">
              <span className="arena-hud-name">{state.enemyName || 'Rywal'}</span>
              <Crowns count={state.enemyCrowns} />
            </div>
            <div className="arena-hud-center">
              <span className={`arena-timer${state.doubleElixir ? ' double' : ''}`}>
                {formatTime(state.remainingMs)}
              </span>
              {state.doubleElixir && <span className="arena-double">2× eliksir</span>}
            </div>
            <div className="arena-hud-side mine">
              <Crowns count={state.myCrowns} mine />
              <span className="arena-hud-name">{state.myName || 'Ty'}</span>
            </div>
          </header>

          <div
            className={`arena-field${selectedCard ? ' targeting' : ''}`}
            ref={fieldRef}
            onPointerDown={onFieldPointer}
            onPointerMove={onFieldPointer}
            onPointerUp={onFieldPointer}
            onPointerLeave={() => setHoverPos(null)}
          >
            <div className="arena-river" />
            <div className="arena-bridges" aria-hidden>
              <span />
              <span />
            </div>

            {state.towers.map((t) => {
              if (!t.alive && t.type !== 'king') return null;
              const style = toPercent(t.x, t.y, state.arenaW, state.arenaH);
              return (
                <div
                  key={t.id}
                  className={`arena-tower ${t.type}${t.mine ? ' mine' : ' enemy'}${t.alive ? '' : ' dead'}`}
                  style={style}
                >
                  <div className="arena-tower-icon">
                    {t.type === 'king' ? (t.mine ? '🏰' : '🏯') : '🗼'}
                  </div>
                  {t.alive && (
                    <div className="arena-hp">
                      <div className="arena-hp-fill" style={{ width: pct(t.hp, t.maxHp) }} />
                    </div>
                  )}
                </div>
              );
            })}

            {state.units.map((u) => {
              const style = toPercent(u.x, u.y, state.arenaW, state.arenaH);
              return (
                <div
                  key={u.id}
                  className={`arena-unit${u.mine ? ' mine' : ' enemy'}${u.flying ? ' flying' : ''}`}
                  style={style}
                  title={u.name}
                >
                  <span className="arena-unit-emoji">{u.emoji}</span>
                  <div className="arena-hp tiny">
                    <div className="arena-hp-fill" style={{ width: pct(u.hp, u.maxHp) }} />
                  </div>
                </div>
              );
            })}

            {state.effects.map((e) => {
              const style = {
                ...toPercent(e.x, e.y, state.arenaW, state.arenaH),
                width: `${(e.radius * 2 / state.arenaW) * 100}%`,
                height: `${(e.radius * 2 / state.arenaH) * 100}%`,
                opacity: Math.min(1, e.ttl * 2),
              };
              return <div key={e.id} className="arena-effect fireball" style={style} />;
            })}

            {selectedCard && hoverPos && (
              <div
                className={`arena-ghost${
                  state.hand.find((c) => c.id === selectedCard)?.kind === 'spell'
                  || hoverPos.y < state.arenaH / 2
                    ? ' ok'
                    : ' bad'
                }`}
                style={toPercent(hoverPos.x, hoverPos.y, state.arenaW, state.arenaH)}
              />
            )}

            {selectedCard && (
              <p className="arena-hint">
                {state.hand.find((c) => c.id === selectedCard)?.kind === 'spell'
                  ? 'Dotknij arenę, by rzucić czar'
                  : 'Dotknij swoją połowę, by wystawić jednostkę'}
              </p>
            )}
          </div>

          <footer className="arena-dock">
            <div className="arena-next" title="Następna karta">
              {state.nextCard ? (
                <>
                  <span className="arena-next-emoji">{state.nextCard.emoji}</span>
                  <span className="arena-next-label">Dalej</span>
                </>
              ) : (
                <span>—</span>
              )}
            </div>

            <div className="arena-hand">
              {state.hand.map((card, index) => {
                const selected = selectedCard === card.id;
                const disabled = !card.playable || state.phase !== 'playing';
                return (
                  <button
                    key={`${card.id}-${index}`}
                    type="button"
                    className={`arena-card${selected ? ' selected' : ''}${disabled ? ' disabled' : ''}`}
                    disabled={disabled}
                    onClick={() => setSelectedCard(selected ? null : card.id)}
                  >
                    <span className="arena-card-cost">{card.cost}</span>
                    <span className="arena-card-emoji">{card.emoji}</span>
                    <span className="arena-card-name">{card.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="arena-elixir" aria-label={`Eliksir ${Math.floor(state.elixir)}`}>
              <div className="arena-elixir-bar">
                <div
                  className={`arena-elixir-fill${state.doubleElixir ? ' double' : ''}`}
                  style={{ height: `${elixirFill}%` }}
                />
              </div>
              <span className="arena-elixir-num">{Math.floor(state.elixir)}</span>
            </div>
          </footer>
        </>
      )}

      {gameOver && (
        <div className="modal-overlay" onClick={clearGameOver}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="emoji-big">
              {gameOver.draw ? '🤝' : gameOver.forfeit ? '😢' : gameOver.winnerId === playerId ? '🏆' : '💀'}
            </div>
            <h2>
              {gameOver.draw
                ? 'Remis!'
                : gameOver.winnerId === playerId
                  ? 'Zwycięstwo!'
                  : `${gameOver.winnerName} wygrywa!`}
            </h2>
            <p>
              {gameOver.forfeit
                ? 'Ktoś opuścił grę'
                : gameOver.draw
                  ? 'Równe korony i HP wież'
                  : 'Zniszcz wieżę króla albo zdobądź więcej koron!'}
            </p>
            {isHost ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => { clearGameOver(); backToLobby(); }}
              >
                Zagraj jeszcze raz
              </button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={clearGameOver}>
                OK
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
