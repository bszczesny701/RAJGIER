import { Suspense, lazy, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import Board2DFallback from '../components/monopoly3d/Board2DFallback';
import PropertyDeed from '../components/monopoly3d/PropertyDeed';
import type { MonopolySpace, MonopolyState } from '../components/monopoly3d/types';
import { GROUP_COLORS, TOKEN_COLORS } from '../components/monopoly3d/boardLayout';
import { PIECE_ICONS, PIECE_IDS, PIECE_LABELS, type PieceId } from '../components/monopoly3d/pieces';
import './Monopoly.css';

const MonopolyScene = lazy(() => import('../components/monopoly3d/MonopolyScene'));

function TurnActions({
  state,
  onRoll,
  emit,
  compact,
  rolling,
}: {
  state: MonopolyState;
  onRoll: () => void;
  emit: (event: string) => void;
  compact?: boolean;
  rolling?: boolean;
}) {
  if (state.myBankrupt) {
    return <p className="monopoly-focus-meta">Jesteś bankrutem — czekasz na koniec.</p>;
  }

  if (!state.isMyTurn) {
    return (
      <p className="monopoly-focus-meta">
        Czekaj na {state.currentTurnName}…
      </p>
    );
  }

  return (
    <div className={`monopoly-action-btns${compact ? ' is-compact' : ''}`}>
      {state.canPayJail && (
        <button type="button" className="btn btn-secondary" onClick={() => emit('monopolyPayJail')}>
          {compact ? `Kaucja ${state.jailFee}` : `Zapłać kaucję (${state.jailFee})`}
        </button>
      )}
      {state.canRoll && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={onRoll}
          disabled={rolling}
        >
          {rolling ? '…' : compact ? 'Rzuć' : 'Rzuć kostką'}
        </button>
      )}
      {state.canBuy && state.buyOffer && (
        <button type="button" className="btn btn-primary" onClick={() => emit('monopolyBuy')}>
          {compact
            ? `Kup ${state.buyOffer.price}`
            : `Kup ${state.buyOffer.name} (${state.buyOffer.price})`}
        </button>
      )}
      {state.canSkipBuy && (
        <button type="button" className="btn btn-secondary" onClick={() => emit('monopolySkipBuy')}>
          {compact ? 'Odpuść' : 'Odpuść zakup'}
        </button>
      )}
      {state.phase === 'awaitBuy' && state.buyOffer && !state.canBuy && (
        <p className="monopoly-focus-meta">
          Za mało gotówki na {state.buyOffer.name} ({state.buyOffer.price})
        </p>
      )}
      {state.canEndTurn && (
        <button type="button" className="btn btn-primary" onClick={() => emit('monopolyEndTurn')}>
          {compact ? 'Koniec' : 'Zakończ turę'}
        </button>
      )}
    </div>
  );
}

export default function Monopoly() {
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

  const [state, setState] = useState<MonopolyState | null>(null);
  const [cardDismissed, setCardDismissed] = useState<string | null>(null);
  const [noticeDismissed, setNoticeDismissed] = useState<string | null>(null);
  const [deedSpace, setDeedSpace] = useState<MonopolySpace | null>(null);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [piecePickerOpen, setPiecePickerOpen] = useState(false);
  const [diceRolling, setDiceRolling] = useState(false);
  const [displayDie, setDisplayDie] = useState<number | null>(null);
  const [bonusFlash, setBonusFlash] = useState(false);
  const rollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const rollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHost = room?.hostId === playerId;

  useEffect(() => {
    if (!room) {
      navigate('/');
      return;
    }
    if (room.game !== 'monopoly') {
      navigate('/lobby');
    }
  }, [room, navigate]);

  useEffect(() => {
    if (!socket || !room) return;

    const handler = (data: MonopolyState) => {
      setState(data);
      if (data.lastDice) {
        if (rollTimer.current) clearInterval(rollTimer.current);
        if (rollTimeout.current) clearTimeout(rollTimeout.current);
        setDiceRolling(true);
        setBonusFlash(false);
        rollTimer.current = setInterval(() => {
          setDisplayDie(1 + Math.floor(Math.random() * 6));
        }, 70);
        rollTimeout.current = setTimeout(() => {
          if (rollTimer.current) clearInterval(rollTimer.current);
          setDisplayDie(data.lastDice!.d1);
          setDiceRolling(false);
          if (data.lastDice!.bonus) {
            setBonusFlash(true);
            setTimeout(() => setBonusFlash(false), 1600);
          }
        }, 900);
      }
    };
    socket.on('monopolyUpdate', handler);
    requestGameState();

    return () => {
      socket.off('monopolyUpdate', handler);
      if (rollTimer.current) clearInterval(rollTimer.current);
      if (rollTimeout.current) clearTimeout(rollTimeout.current);
    };
  }, [socket, room, requestGameState]);

  useEffect(() => {
    if (state?.pendingCard?.id && state.pendingCard.id !== cardDismissed) {
      setCardDismissed(null);
    }
  }, [state?.pendingCard?.id, cardDismissed]);

  useEffect(() => {
    if (state?.pendingNotice?.id && state.pendingNotice.id !== noticeDismissed) {
      setNoticeDismissed(null);
    }
  }, [state?.pendingNotice?.id, noticeDismissed]);

  const emit = (event: string, extra?: Record<string, unknown>) => {
    if (!socket) return;
    socket.emit(event, { sessionId, roomCode, ...extra });
  };

  const handleRoll = () => {
    if (diceRolling) return;
    setDiceRolling(true);
    setBonusFlash(false);
    if (rollTimer.current) clearInterval(rollTimer.current);
    rollTimer.current = setInterval(() => {
      setDisplayDie(1 + Math.floor(Math.random() * 6));
    }, 70);
    emit('monopolyRoll');
  };

  const colorById = useMemo(() => {
    const map: Record<string, string> = {};
    state?.tokens.forEach((t, i) => {
      map[t.id] = TOKEN_COLORS[i % TOKEN_COLORS.length];
    });
    return map;
  }, [state?.tokens]);

  const focusIndex = useMemo(() => {
    if (!state) return 0;
    if (state.isMyTurn) return state.myPosition;
    return state.tokens.find((t) => t.id === state.currentPlayerId)?.position ?? state.myPosition;
  }, [state]);

  const focusSpace = state?.spaces[focusIndex] ?? null;
  const showCard = state?.pendingCard && state.pendingCard.id !== cardDismissed;
  const showNotice = state?.pendingNotice && state.pendingNotice.id !== noticeDismissed;

  const myProperties = useMemo(() => {
    if (!state) return [];
    const idxs = state.myPropertyIndexes || state.spaces
      .filter((s) => s.ownerId === playerId)
      .map((s) => s.index);
    return idxs.map((i) => state.spaces[i]).filter(Boolean);
  }, [state, playerId]);

  const myToken = useMemo(
    () => state?.tokens.find((t) => t.id === playerId) || null,
    [state?.tokens, playerId]
  );

  const takenPieces = useMemo(() => {
    const set = new Set<string>();
    state?.tokens.forEach((t) => {
      if (!t.bankrupt && t.id !== playerId && t.piece) set.add(t.piece);
    });
    return set;
  }, [state?.tokens, playerId]);

  const dieFace = displayDie ?? state?.lastDice?.d1 ?? null;

  let boardFallback: ReactNode = null;
  if (state) {
    boardFallback = (
      <Board2DFallback
        spaces={state.spaces}
        tokens={state.tokens}
        focusIndex={focusIndex}
        colorById={colorById}
        myId={playerId}
      />
    );
  }

  if (!room) return null;

  return (
    <div className="page monopoly-page">
      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button type="button" onClick={clearError} aria-label="Zamknij">×</button>
        </div>
      )}

      {!state ? (
        <div className="card waiting-text">
          <div className="spinner">🏠</div>
          <p>Ładowanie Monopoly...</p>
        </div>
      ) : (
        <>
          <div className="monopoly-hud">
            <div className="monopoly-hud-chips">
              <div className="monopoly-chip">
                <span className="monopoly-chip-label">Tura</span>
                <span
                  className="monopoly-chip-value"
                  style={{ color: colorById[state.currentPlayerId || ''] }}
                >
                  {state.currentTurnName}
                  {state.isMyTurn ? ' · Ty' : ''}
                </span>
              </div>
              <div className="monopoly-chip monopoly-chip-cash">
                <span className="monopoly-chip-label">Saldo</span>
                <span className="monopoly-chip-value">{state.myCash}</span>
              </div>
            </div>

            <div className="monopoly-hud-right">
              <button
                type="button"
                className="monopoly-inv-btn"
                onClick={() => setPiecePickerOpen(true)}
              >
                Pionek
                {myToken?.piece && (
                  <span className="monopoly-piece-icon" aria-hidden>
                    {PIECE_ICONS[(myToken.piece as PieceId)] || '♟'}
                  </span>
                )}
              </button>
              <button
                type="button"
                className="monopoly-inv-btn"
                onClick={() => setInventoryOpen(true)}
              >
                Karty
                {myProperties.length > 0 && (
                  <span className="monopoly-inv-count">{myProperties.length}</span>
                )}
              </button>

              <div className={`monopoly-die-wrap${diceRolling ? ' is-rolling' : ''}${bonusFlash ? ' is-bonus' : ''}`}>
                <div className="monopoly-die" aria-label="Kostka">
                  {dieFace ?? '·'}
                </div>
                {bonusFlash && <span className="monopoly-die-bonus">+6!</span>}
              </div>
            </div>
          </div>

          <div className="monopoly-layout">
            <div className="monopoly-board-wrap">
              <Suspense fallback={boardFallback}>
                <MonopolyScene
                  state={state}
                  focusIndex={focusIndex}
                  myId={playerId}
                  colorById={colorById}
                  fallback={boardFallback}
                  onSelectSpace={(idx) => setDeedSpace(state.spaces[idx] || null)}
                />
              </Suspense>
            </div>

            <div className="monopoly-side">
              <div className="card monopoly-focus">
                <h3>Aktualne pole</h3>
                {focusSpace ? (
                  <>
                    <p className="monopoly-focus-name">{focusSpace.name}</p>
                    {focusSpace.price != null && (
                      <p className="monopoly-focus-meta">Cena: {focusSpace.price}</p>
                    )}
                    {focusSpace.ownerId && (
                      <p className="monopoly-focus-meta">
                        Właściciel:{' '}
                        {state.tokens.find((t) => t.id === focusSpace.ownerId)?.name || '—'}
                      </p>
                    )}
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ marginTop: 8 }}
                      onClick={() => setDeedSpace(focusSpace)}
                    >
                      Zobacz kartę
                    </button>
                  </>
                ) : (
                  <p className="monopoly-focus-meta">—</p>
                )}
              </div>

              <div className="card monopoly-players">
                <h3>Gracze</h3>
                <ul>
                  {state.tokens.map((t) => (
                    <li key={t.id} className={t.bankrupt ? 'is-out' : ''}>
                      <span className="monopoly-player-swatch" style={{ background: colorById[t.id] }}>
                        {PIECE_ICONS[(t.piece as PieceId)] || '♟'}
                      </span>
                      <span className="monopoly-player-name">
                        {t.name}
                        {t.id === playerId ? ' (Ty)' : ''}
                        {t.id === state.currentPlayerId ? ' · tura' : ''}
                        {t.inJail ? ' · więzienie' : ''}
                      </span>
                      <span className="monopoly-player-cash">{t.bankrupt ? 'OUT' : t.cash}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="card monopoly-actions monopoly-actions-desktop">
                <h3>Akcje</h3>
                <TurnActions state={state} emit={emit} onRoll={handleRoll} rolling={diceRolling} />
              </div>
            </div>
          </div>

          <div className="monopoly-action-bar" aria-label="Akcje tury">
            <TurnActions state={state} emit={emit} onRoll={handleRoll} rolling={diceRolling} compact />
          </div>
        </>
      )}

      {piecePickerOpen && state && (
        <div className="modal-overlay" onClick={() => setPiecePickerOpen(false)}>
          <div className="monopoly-inventory monopoly-piece-picker" onClick={(e) => e.stopPropagation()}>
            <div className="monopoly-inventory-head">
              <h2>Wybierz pionek</h2>
              <button type="button" className="monopoly-deed-close" onClick={() => setPiecePickerOpen(false)}>×</button>
            </div>
            <ul className="monopoly-piece-grid">
              {PIECE_IDS.map((id) => {
                const taken = takenPieces.has(id);
                const selected = myToken?.piece === id;
                return (
                  <li key={id}>
                    <button
                      type="button"
                      className={`monopoly-piece-option${selected ? ' is-selected' : ''}${taken ? ' is-taken' : ''}`}
                      disabled={taken}
                      onClick={() => {
                        if (taken) return;
                        emit('monopolySetPiece', { piece: id });
                        setPiecePickerOpen(false);
                      }}
                    >
                      <span className="monopoly-piece-option-icon" aria-hidden>
                        {PIECE_ICONS[id]}
                      </span>
                      <span className="monopoly-piece-option-label">{PIECE_LABELS[id]}</span>
                      {taken && <span className="monopoly-piece-option-meta">Zajęty</span>}
                      {selected && !taken && <span className="monopoly-piece-option-meta">Twój</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {inventoryOpen && state && (
        <div className="modal-overlay" onClick={() => setInventoryOpen(false)}>
          <div className="monopoly-inventory" onClick={(e) => e.stopPropagation()}>
            <div className="monopoly-inventory-head">
              <h2>Twoje karty</h2>
              <button type="button" className="monopoly-deed-close" onClick={() => setInventoryOpen(false)}>×</button>
            </div>
            {myProperties.length === 0 ? (
              <p className="monopoly-focus-meta">Brak kart — kup inwestycje na planszy.</p>
            ) : (
              <ul className="monopoly-inventory-list">
                {myProperties.map((s) => (
                  <li key={s.index}>
                    <button
                      type="button"
                      className="monopoly-inventory-item"
                      onClick={() => {
                        setInventoryOpen(false);
                        setDeedSpace(s);
                      }}
                    >
                      <span
                        className="monopoly-inventory-swatch"
                        style={{ background: GROUP_COLORS[s.group] || '#888' }}
                      />
                      <span className="monopoly-inventory-name">{s.name}</span>
                      <span className="monopoly-inventory-price">{s.price ?? '—'}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {deedSpace && state && (
        <PropertyDeed
          space={deedSpace}
          ownerName={
            deedSpace.ownerId
              ? state.tokens.find((t) => t.id === deedSpace.ownerId)?.name || null
              : null
          }
          onClose={() => setDeedSpace(null)}
        />
      )}

      {showCard && state?.pendingCard && (
        <div className="modal-overlay" onClick={() => setCardDismissed(state.pendingCard!.id)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="emoji-big">📜</div>
            <h2>Los</h2>
            <p>{state.pendingCard.text}</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setCardDismissed(state.pendingCard!.id)}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {showNotice && state?.pendingNotice && !showCard && !deedSpace && (
        <div className="modal-overlay" onClick={() => setNoticeDismissed(state.pendingNotice!.id)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="emoji-big">
              {state.pendingNotice.kind === 'jail' ? '🔒' : '💰'}
            </div>
            <h2>{state.pendingNotice.title}</h2>
            <p>{state.pendingNotice.text}</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setNoticeDismissed(state.pendingNotice!.id)}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {gameOver && (
        <div className="modal-overlay" onClick={clearGameOver}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="emoji-big">{gameOver.forfeit ? '😢' : '🏆'}</div>
            <h2>{gameOver.winnerName} wygrywa!</h2>
            <p>{gameOver.forfeit ? 'Ktoś opuścił grę' : 'Ostatni z majątkiem wygrywa!'}</p>
            {isHost ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  clearGameOver();
                  backToLobby();
                }}
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
