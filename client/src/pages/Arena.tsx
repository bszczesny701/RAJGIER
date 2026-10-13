import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import CardThumb from '../components/arena3d/CardThumb';
import './Arena.css';

const ArenaScene = lazy(() => import('../components/arena3d/ArenaScene'));

interface ArenaCard {
  id: string;
  name: string;
  emoji: string;
  avatar?: string;
  cost: number;
  kind: string;
  playable?: boolean;
}

interface ArenaTower {
  id: string;
  type: 'king' | 'princess';
  lane?: string;
  mine: boolean;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  facing?: number;
  attackAnim?: number;
}

interface ArenaUnit {
  id: string;
  cardId: string;
  avatar: string;
  emoji: string;
  name: string;
  mine: boolean;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  flying: boolean;
  kind: string;
  facing: number;
  anim: string;
  attackAnim: number;
  hitFlash: number;
  attackTargetX?: number | null;
  attackTargetY?: number | null;
}

interface ArenaProjectile {
  id: string;
  style: string;
  x: number;
  y: number;
  tx: number;
  ty: number;
  angle: number;
  mine: boolean;
}

interface ArenaEffect {
  id: string;
  type: string;
  x: number;
  y: number;
  radius: number;
  ttl: number;
  tx?: number;
  ty?: number;
  angle?: number;
}

interface DeployZone {
  baseMaxY: number;
  leftMaxY: number;
  rightMaxY: number;
  leftPush: number;
  rightPush: number;
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
  projectiles: ArenaProjectile[];
  effects: ArenaEffect[];
  deployZone: DeployZone;
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

function Crowns({ count }: { count: number }) {
  const n = Math.max(0, Math.min(3, Number(count) || 0));
  return (
    <div className="arena-crowns" aria-label={`${n} korony`}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={i < n ? 'on' : ''} aria-hidden>👑</span>
      ))}
    </div>
  );
}

function canPlaceAt(state: ArenaState, cardId: string | null, x: number, y: number): boolean {
  if (!cardId) return false;
  const card = state.hand.find((c) => c.id === cardId);
  if (!card) return false;
  if (card.kind === 'spell') return true;
  const half = state.arenaW / 2;
  const maxY = x < half ? state.deployZone.leftMaxY : state.deployZone.rightMaxY;
  return y >= 0.5 && y <= maxY;
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
    if (!card || card.playable === false) setSelectedCard(null);
  }, [state, selectedCard]);

  const pct = (value: number, max: number) =>
    `${Math.max(0, Math.min(100, (value / max) * 100))}%`;

  const toPercent = (x: number, y: number, w: number, h: number) => ({
    left: `${(x / w) * 100}%`,
    top: `${((h - y) / h) * 100}%`,
  });

  const deploy = (x: number, y: number) => {
    if (!socket || !selectedCard || !state) return;
    const card = state.hand.find((c) => c.id === selectedCard);
    if (!card || !card.playable) return;
    if (!canPlaceAt(state, selectedCard, x, y)) return;

    socket.emit('arenaPlayCard', {
      cardId: selectedCard,
      x,
      y,
      sessionId,
      roomCode,
    });
    setSelectedCard(null);
  };

  const elixirFill = useMemo(() => {
    if (!state) return 0;
    return Math.min(100, (state.elixir / state.elixirMax) * 100);
  }, [state]);

  const zoneExpanded = !!(state && (state.deployZone.leftPush > 0 || state.deployZone.rightPush > 0));

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
          <ArenaSprite avatar="knight" size="lg" anim="walk" />
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
              {zoneExpanded && <span className="arena-zone-badge">Strefa +</span>}
            </div>
            <div className="arena-hud-side mine">
              <Crowns count={state.myCrowns} />
              <span className="arena-hud-name">{state.myName || 'Ty'}</span>
            </div>
          </header>

          <div className={`arena-field${selectedCard ? ' targeting' : ''}`}>
            <Suspense fallback={<div className="arena-webgl-fallback">Ładowanie 3D…</div>}>
              <ArenaScene
                arenaW={state.arenaW}
                arenaH={state.arenaH}
                units={state.units}
                towers={state.towers}
                projectiles={state.projectiles}
                effects={state.effects}
                targeting={!!selectedCard}
                onPointerDeploy={deploy}
              />
            </Suspense>

            {/* HP overlay (2D) */}
            <div className="arena-hp-overlay" aria-hidden>
              {state.towers.filter((t) => t.alive).map((t) => (
                <div
                  key={`hp-${t.id}`}
                  className={`arena-hp-float${t.mine ? ' mine' : ' enemy'}`}
                  style={toPercent(t.x, t.y, state.arenaW, state.arenaH)}
                >
                  <div className="arena-hp">
                    <div className="arena-hp-fill" style={{ width: pct(t.hp, t.maxHp) }} />
                  </div>
                </div>
              ))}
              {state.units.map((u) => (
                <div
                  key={`hp-${u.id}`}
                  className={`arena-hp-float tiny${u.mine ? ' mine' : ' enemy'}`}
                  style={toPercent(u.x, u.y, state.arenaW, state.arenaH)}
                >
                  <div className="arena-hp tiny">
                    <div className="arena-hp-fill" style={{ width: pct(u.hp, u.maxHp) }} />
                  </div>
                </div>
              ))}
            </div>

            {selectedCard && state.hand.find((c) => c.id === selectedCard)?.kind !== 'spell' && (
              <>
                <div
                  className="arena-zone left"
                  style={{ height: `${(state.deployZone.leftMaxY / state.arenaH) * 100}%` }}
                />
                <div
                  className="arena-zone right"
                  style={{ height: `${(state.deployZone.rightMaxY / state.arenaH) * 100}%` }}
                />
              </>
            )}

            {selectedCard && (
              <p className="arena-hint">
                {state.hand.find((c) => c.id === selectedCard)?.kind === 'spell'
                  ? 'Dotknij arenę, by rzucić czar'
                  : zoneExpanded
                    ? 'Strefa poszerzona — wystaw za mostem w otwartym pasie'
                    : 'Dotknij swoją połowę / most, by wystawić jednostkę'}
              </p>
            )}
          </div>

          <footer className="arena-dock">
            <div className="arena-next" title="Następna karta">
              {state.nextCard ? (
                <>
                  <CardThumb avatar={state.nextCard.avatar || 'knight'} alt={state.nextCard.name} />
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
                    <div className="arena-card-art">
                      <CardThumb avatar={card.avatar || 'knight'} alt={card.name} />
                    </div>
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
