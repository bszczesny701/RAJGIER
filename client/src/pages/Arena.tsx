import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import CardThumb from '../components/arena3d/CardThumb';
import type { FieldSnapshot } from '../components/arena3d/types';
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

interface DeployZone {
  baseMaxY: number;
  leftMaxY: number;
  rightMaxY: number;
  leftPush: number;
  rightPush: number;
}

interface ArenaHud {
  phase: string;
  elixir: number;
  elixirMax: number;
  hand: ArenaCard[];
  nextCard: ArenaCard | null;
  myCrowns: number;
  enemyCrowns: number;
  myName: string;
  enemyName: string;
  deployZone: DeployZone;
  remainingSec: number;
  doubleElixir: boolean;
  arenaH: number;
}

interface ArenaFull extends ArenaHud {
  arenaW: number;
  remainingMs: number;
  units: FieldSnapshot['units'];
  towers: FieldSnapshot['towers'];
  projectiles: FieldSnapshot['projectiles'];
  effects: FieldSnapshot['effects'];
}

function formatTime(sec: number): string {
  const s = Math.max(0, sec);
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

function handKey(hand: ArenaCard[]) {
  return hand.map((c) => `${c.id}:${c.playable ? 1 : 0}`).join('|');
}

function hudEqual(a: ArenaHud, b: ArenaHud) {
  return (
    a.phase === b.phase &&
    Math.floor(a.elixir) === Math.floor(b.elixir) &&
    a.elixirMax === b.elixirMax &&
    a.myCrowns === b.myCrowns &&
    a.enemyCrowns === b.enemyCrowns &&
    a.myName === b.myName &&
    a.enemyName === b.enemyName &&
    a.remainingSec === b.remainingSec &&
    a.doubleElixir === b.doubleElixir &&
    a.arenaH === b.arenaH &&
    a.deployZone.leftMaxY === b.deployZone.leftMaxY &&
    a.deployZone.rightMaxY === b.deployZone.rightMaxY &&
    a.deployZone.leftPush === b.deployZone.leftPush &&
    a.deployZone.rightPush === b.deployZone.rightPush &&
    handKey(a.hand) === handKey(b.hand) &&
    (a.nextCard?.id || '') === (b.nextCard?.id || '')
  );
}

function toHud(data: ArenaFull): ArenaHud {
  return {
    phase: data.phase,
    elixir: data.elixir,
    elixirMax: data.elixirMax,
    hand: data.hand,
    nextCard: data.nextCard,
    myCrowns: data.myCrowns,
    enemyCrowns: data.enemyCrowns,
    myName: data.myName,
    enemyName: data.enemyName,
    deployZone: data.deployZone,
    remainingSec: Math.max(0, Math.ceil(data.remainingMs / 1000)),
    doubleElixir: data.doubleElixir,
    arenaH: data.arenaH,
  };
}

function canPlaceAt(hud: ArenaHud, cardId: string | null, x: number, y: number, arenaW: number): boolean {
  if (!cardId) return false;
  const card = hud.hand.find((c) => c.id === cardId);
  if (!card) return false;
  if (card.kind === 'spell') return true;
  const half = arenaW / 2;
  const maxY = x < half ? hud.deployZone.leftMaxY : hud.deployZone.rightMaxY;
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

  const battleRef = useRef<FieldSnapshot | null>(null);
  const fullRef = useRef<ArenaFull | null>(null);
  const [hud, setHud] = useState<ArenaHud | null>(null);
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
    const handler = (data: ArenaFull) => {
      fullRef.current = data;
      battleRef.current = {
        arenaW: data.arenaW,
        arenaH: data.arenaH,
        units: data.units,
        towers: data.towers,
        projectiles: data.projectiles,
        effects: data.effects,
      };
      const nextHud = toHud(data);
      setHud((prev) => (prev && hudEqual(prev, nextHud) ? prev : nextHud));
    };
    socket.on('arenaUpdate', handler);
    requestGameState();
    return () => { socket.off('arenaUpdate', handler); };
  }, [socket, room, requestGameState]);

  useEffect(() => {
    if (!selectedCard || !hud) return;
    const card = hud.hand.find((c) => c.id === selectedCard);
    if (!card || card.playable === false) setSelectedCard(null);
  }, [hud, selectedCard]);

  const deploy = useCallback((x: number, y: number) => {
    if (!socket || !selectedCard || !hud || !fullRef.current) return;
    const card = hud.hand.find((c) => c.id === selectedCard);
    if (!card || !card.playable) return;
    if (!canPlaceAt(hud, selectedCard, x, y, fullRef.current.arenaW)) return;

    socket.emit('arenaPlayCard', {
      cardId: selectedCard,
      x,
      y,
      sessionId,
      roomCode,
    });
    setSelectedCard(null);
  }, [socket, selectedCard, hud, sessionId, roomCode]);

  const elixirFill = useMemo(() => {
    if (!hud) return 0;
    return Math.min(100, (hud.elixir / hud.elixirMax) * 100);
  }, [hud]);

  const zoneExpanded = !!(hud && (hud.deployZone.leftPush > 0 || hud.deployZone.rightPush > 0));

  if (!room) return null;

  return (
    <div className="page arena-page">
      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button type="button" onClick={clearError} aria-label="Zamknij">×</button>
        </div>
      )}

      {!hud ? (
        <div className="arena-loading">
          <CardThumb avatar="knight" alt="" className="arena-loading-thumb" />
          <p>Ładowanie areny…</p>
        </div>
      ) : (
        <>
          <header className="arena-hud">
            <div className="arena-hud-side enemy">
              <span className="arena-hud-name">{hud.enemyName || 'Rywal'}</span>
              <Crowns count={hud.enemyCrowns} />
            </div>
            <div className="arena-hud-center">
              <span className={`arena-timer${hud.doubleElixir ? ' double' : ''}`}>
                {formatTime(hud.remainingSec)}
              </span>
              {hud.doubleElixir && <span className="arena-double">2× eliksir</span>}
              {zoneExpanded && <span className="arena-zone-badge">Strefa +</span>}
            </div>
            <div className="arena-hud-side mine">
              <Crowns count={hud.myCrowns} />
              <span className="arena-hud-name">{hud.myName || 'Ty'}</span>
            </div>
          </header>

          <div className={`arena-field${selectedCard ? ' targeting' : ''}`}>
            <Suspense fallback={<div className="arena-webgl-fallback">Ładowanie 3D…</div>}>
              <ArenaScene
                stateRef={battleRef}
                targeting={!!selectedCard}
                onDeploy={deploy}
              />
            </Suspense>

            {selectedCard && hud.hand.find((c) => c.id === selectedCard)?.kind !== 'spell' && (
              <>
                <div
                  className="arena-zone left"
                  style={{ height: `${(hud.deployZone.leftMaxY / hud.arenaH) * 100}%` }}
                />
                <div
                  className="arena-zone right"
                  style={{ height: `${(hud.deployZone.rightMaxY / hud.arenaH) * 100}%` }}
                />
              </>
            )}

            {selectedCard && (
              <p className="arena-hint">
                {hud.hand.find((c) => c.id === selectedCard)?.kind === 'spell'
                  ? 'Dotknij arenę, by rzucić czar'
                  : zoneExpanded
                    ? 'Strefa poszerzona — wystaw za mostem w otwartym pasie'
                    : 'Dotknij swoją połowę / most, by wystawić jednostkę'}
              </p>
            )}
          </div>

          <footer className="arena-dock">
            <div className="arena-next" title="Następna karta">
              {hud.nextCard ? (
                <>
                  <CardThumb avatar={hud.nextCard.avatar || 'knight'} alt={hud.nextCard.name} />
                  <span className="arena-next-label">Dalej</span>
                </>
              ) : (
                <span>—</span>
              )}
            </div>

            <div className="arena-hand">
              {hud.hand.map((card, index) => {
                const selected = selectedCard === card.id;
                const disabled = !card.playable || hud.phase !== 'playing';
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

            <div className="arena-elixir" aria-label={`Eliksir ${Math.floor(hud.elixir)}`}>
              <div className="arena-elixir-bar">
                <div
                  className={`arena-elixir-fill${hud.doubleElixir ? ' double' : ''}`}
                  style={{ height: `${elixirFill}%` }}
                />
              </div>
              <span className="arena-elixir-num">{Math.floor(hud.elixir)}</span>
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
