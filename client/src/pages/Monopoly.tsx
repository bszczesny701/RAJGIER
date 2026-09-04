import { Suspense, lazy, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import Board2DFallback from '../components/monopoly3d/Board2DFallback';
import PropertyDeed from '../components/monopoly3d/PropertyDeed';
import LosCardPick from '../components/monopoly3d/LosCardPick';
import type { MonopolySpace, MonopolyState } from '../components/monopoly3d/types';
import { GROUP_COLORS, TOKEN_COLORS } from '../components/monopoly3d/boardLayout';
import { PIECE_ICONS, PIECE_IDS, PIECE_LABELS, type PieceId } from '../components/monopoly3d/pieces';
import './Monopoly.css';

const MonopolyScene = lazy(() => import('../components/monopoly3d/MonopolyScene'));

const BOARD_MODE_KEY = 'monopolyBoardMode';
type BoardMode = '2d' | '3d';

/** Zawsze start od 2D — 3D tylko po świadomym kliknięciu (unika czarnego WebGL). */
function defaultBoardMode(): BoardMode {
  return '2d';
}

function TurnActions({
  state,
  onRoll,
  emit,
  compact,
  rolling,
}: {
  state: MonopolyState;
  onRoll: () => void;
  emit: (event: string, extra?: Record<string, unknown>) => void;
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

  if (state.phase === 'awaitCardPick' || state.canPickCard) {
    const count = Math.max(2, Math.min(3, state.pendingCardPick?.count ?? 3));
    if (state.canPickCard || state.pendingCardPick?.isMine) {
      return (
        <div className={`monopoly-action-btns${compact ? ' is-compact' : ''}`}>
          {Array.from({ length: count }, (_, slot) => (
            <button
              key={slot}
              type="button"
              className="btn btn-primary"
              onClick={() => emit('monopolyPickCard', { slot })}
            >
              {compact ? `Los ${slot + 1}` : `Wybierz kartę ${slot + 1}`}
            </button>
          ))}
        </div>
      );
    }
    return (
      <p className="monopoly-focus-meta">
        {state.pendingCardPick?.playerName || 'Gracz'} wybiera kartę Los…
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
  const [boardMode, setBoardMode] = useState<BoardMode>(() => defaultBoardMode());
  const [tradeOpen, setTradeOpen] = useState(false);
  const [tradePartnerId, setTradePartnerId] = useState<string | null>(null);
  const [tradeOfferCash, setTradeOfferCash] = useState('0');
  const [tradeAskCash, setTradeAskCash] = useState('0');
  const [tradeOfferSpaces, setTradeOfferSpaces] = useState<number[]>([]);
  const [tradeAskSpaces, setTradeAskSpaces] = useState<number[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const rollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const rollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHost = room?.hostId === playerId;

  const setBoardModePersist = (mode: BoardMode) => {
    setBoardMode(mode);
    try {
      localStorage.setItem(BOARD_MODE_KEY, mode);
    } catch {
      /* ignore */
    }
  };

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
    if (state || !socket || !room) return;
    const retry = window.setInterval(() => requestGameState(), 1200);
    const stop = window.setTimeout(() => window.clearInterval(retry), 12000);
    return () => {
      window.clearInterval(retry);
      window.clearTimeout(stop);
    };
  }, [state, socket, room, requestGameState]);

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

  useEffect(() => {
    if (!state?.pendingNotice?.id || noticeDismissed === state.pendingNotice.id) return;
    const t = setTimeout(() => setNoticeDismissed(state.pendingNotice!.id), 2500);
    return () => clearTimeout(t);
  }, [state?.pendingNotice?.id, noticeDismissed]);

  useEffect(() => {
    const card = state?.pendingCard;
    if (!card?.id || cardDismissed === card.id) return;
    if ((card.text || '').length > 90) return;
    const t = setTimeout(() => setCardDismissed(card.id), 3500);
    return () => clearTimeout(t);
  }, [state?.pendingCard?.id, state?.pendingCard?.text, cardDismissed]);

  const emit = (event: string, extra?: Record<string, unknown>) => {
    if (!socket) return;
    socket.emit(event, { sessionId, roomCode, ...extra });
  };

  const emitBuild = (spaceIndex: number) => emit('monopolyBuild', { spaceIndex });
  const emitSellHouse = (spaceIndex: number) => emit('monopolySellHouse', { spaceIndex });
  const emitMortgage = (spaceIndex: number) => emit('monopolyMortgage', { spaceIndex });
  const emitUnmortgage = (spaceIndex: number) => emit('monopolyUnmortgage', { spaceIndex });

  const openTrade = () => {
    const partner = state?.tokens.find((t) => t.id !== playerId && !t.bankrupt);
    setTradePartnerId(partner?.id || null);
    setTradeOfferCash('0');
    setTradeAskCash('0');
    setTradeOfferSpaces([]);
    setTradeAskSpaces([]);
    setTradeOpen(true);
  };

  const toggleTradeSpace = (list: number[], setList: (v: number[]) => void, idx: number) => {
    setList(list.includes(idx) ? list.filter((i) => i !== idx) : [...list, idx]);
  };

  const submitTrade = () => {
    if (!tradePartnerId) return;
    emit('monopolyTradePropose', {
      toId: tradePartnerId,
      offerCash: Number(tradeOfferCash) || 0,
      askCash: Number(tradeAskCash) || 0,
      offerSpaces: tradeOfferSpaces,
      askSpaces: tradeAskSpaces,
    });
    setTradeOpen(false);
  };

  const spaceTradeable = (s: MonopolySpace) => {
    if (s.type === 'investment') {
      const group = state?.spaces.filter((x) => x.group === s.group && x.type === 'investment') || [];
      if (group.some((x) => (x.houses || 0) > 0)) return false;
    }
    return true;
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
  const cardNeedsSheet = !!(showCard && state?.pendingCard && state.pendingCard.text.length > 90);

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
        onSelectSpace={(idx) => setDeedSpace(state.spaces[idx] || null)}
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
          <button
            type="button"
            className="btn btn-secondary"
            style={{ marginTop: 12 }}
            onClick={() => requestGameState()}
          >
            Odśwież
          </button>
        </div>
      ) : (
        <>
          <header className="monopoly-hud">
            <div className="monopoly-hud-main">
              <div className="monopoly-hud-cash" title="Twoje saldo">
                <span className="monopoly-hud-cash-label">$</span>
                <span className="monopoly-hud-cash-value">{state.myCash}</span>
              </div>
              <div className="monopoly-hud-turn">
                <span
                  className="monopoly-hud-turn-dot"
                  style={{ background: colorById[state.currentPlayerId || ''] }}
                  aria-hidden
                />
                <span className="monopoly-hud-turn-text">
                  {state.isMyTurn ? 'Twoja tura' : state.currentTurnName}
                </span>
              </div>
            </div>

            <div className="monopoly-hud-tools">
              <div
                className={`monopoly-die-wrap${diceRolling ? ' is-rolling' : ''}${bonusFlash ? ' is-bonus' : ''}`}
              >
                <div className="monopoly-die" aria-label="Kostka">
                  {dieFace ?? '·'}
                </div>
                {bonusFlash && <span className="monopoly-die-bonus">+6!</span>}
              </div>
              <button
                type="button"
                className="monopoly-menu-btn"
                aria-label="Menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(true)}
              >
                <span className="monopoly-menu-btn-bars" aria-hidden />
                {myProperties.length > 0 && (
                  <span className="monopoly-menu-badge">{myProperties.length}</span>
                )}
              </button>
            </div>
          </header>

          <div className="monopoly-layout">
            <div className="monopoly-board-wrap">
              {boardMode === '2d' ? (
                boardFallback
              ) : (
                <Suspense fallback={boardFallback}>
                  <MonopolyScene
                    state={state}
                    focusIndex={focusIndex}
                    myId={playerId}
                    colorById={colorById}
                    fallback={boardFallback}
                    onSelectSpace={(idx) => setDeedSpace(state.spaces[idx] || null)}
                    onFallbackTo2D={() => setBoardModePersist('2d')}
                  />
                </Suspense>
              )}
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

          {menuOpen && (
            <div className="monopoly-sheet-overlay" onClick={() => setMenuOpen(false)}>
              <div className="monopoly-sheet monopoly-menu-sheet" onClick={(e) => e.stopPropagation()}>
                <div className="monopoly-inventory-head">
                  <h2>Menu</h2>
                  <button
                    type="button"
                    className="monopoly-deed-close"
                    onClick={() => setMenuOpen(false)}
                    aria-label="Zamknij"
                  >
                    ×
                  </button>
                </div>

                <ul className="monopoly-menu-list">
                  <li>
                    <button
                      type="button"
                      className="monopoly-menu-item"
                      onClick={() => {
                        setMenuOpen(false);
                        setInventoryOpen(true);
                      }}
                    >
                      <span>Karty</span>
                      <span className="monopoly-menu-item-meta">
                        {myProperties.length > 0 ? myProperties.length : '—'}
                      </span>
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="monopoly-menu-item"
                      disabled={!state.canProposeTrade}
                      onClick={() => {
                        setMenuOpen(false);
                        openTrade();
                      }}
                    >
                      <span>Handel</span>
                      <span className="monopoly-menu-item-meta">
                        {state.canProposeTrade ? 'Otwórz' : 'Niedostępny'}
                      </span>
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="monopoly-menu-item"
                      onClick={() => {
                        setMenuOpen(false);
                        setPiecePickerOpen(true);
                      }}
                    >
                      <span>Pionek</span>
                      <span className="monopoly-menu-item-meta" aria-hidden>
                        {PIECE_ICONS[(myToken?.piece as PieceId) || 'pawn'] || '♟'}
                      </span>
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="monopoly-menu-item"
                      onClick={() => {
                        setBoardModePersist(boardMode === '2d' ? '3d' : '2d');
                        setMenuOpen(false);
                      }}
                    >
                      <span>Plansza</span>
                      <span className="monopoly-menu-item-meta">
                        {boardMode === '2d' ? 'Przełącz na 3D' : 'Przełącz na 2D'}
                      </span>
                    </button>
                  </li>
                </ul>

                <p className="monopoly-trade-section">Gracze</p>
                <ul className="monopoly-menu-players">
                  {state.tokens.map((t) => (
                    <li key={t.id} className={t.bankrupt ? 'is-out' : ''}>
                      <span className="monopoly-player-swatch" style={{ background: colorById[t.id] }}>
                        {PIECE_ICONS[(t.piece as PieceId)] || '♟'}
                      </span>
                      <span className="monopoly-player-name">
                        {t.name}
                        {t.id === playerId ? ' (Ty)' : ''}
                        {t.id === state.currentPlayerId ? ' · tura' : ''}
                      </span>
                      <span className="monopoly-player-cash">{t.bankrupt ? 'OUT' : t.cash}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
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
                {myProperties.map((s) => {
                  const live = state.spaces[s.index] || s;
                  const houses = live.houses || 0;
                  const isInvestment = live.type === 'investment';
                  const buyable =
                    isInvestment || live.type === 'rail' || live.type === 'utility';
                  return (
                    <li key={live.index} className="monopoly-inventory-row">
                      <button
                        type="button"
                        className={`monopoly-inventory-item${live.mortgaged ? ' is-mortgaged' : ''}`}
                        onClick={() => {
                          setInventoryOpen(false);
                          setDeedSpace(live);
                        }}
                      >
                        <span
                          className="monopoly-inventory-swatch"
                          style={{ background: GROUP_COLORS[live.group] || '#888' }}
                        />
                        <span className="monopoly-inventory-main">
                          <span className="monopoly-inventory-name">{live.name}</span>
                          {isInvestment && (
                            <span className="monopoly-inventory-houses">
                              {live.mortgaged
                                ? 'Zastaw'
                                : houses >= 5
                                  ? 'Hotel'
                                  : houses > 0
                                    ? `${'●'.repeat(houses)}`
                                    : 'Bez domów'}
                            </span>
                          )}
                          {!isInvestment && live.mortgaged && (
                            <span className="monopoly-inventory-houses">Zastaw</span>
                          )}
                        </span>
                        <span className="monopoly-inventory-price">{live.price ?? '—'}</span>
                      </button>
                      {isInvestment && (
                        <div className="monopoly-inventory-actions">
                          <button
                            type="button"
                            className="btn btn-primary monopoly-inv-action"
                            disabled={!live.canBuild}
                            onClick={() => emitBuild(live.index)}
                          >
                            Buduj{live.houseCost != null ? ` ${live.houseCost}` : ''}
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary monopoly-inv-action"
                            disabled={!live.canSellHouse}
                            onClick={() => emitSellHouse(live.index)}
                          >
                            Sprzedaj{live.sellRefund != null ? ` ${live.sellRefund}` : ''}
                          </button>
                        </div>
                      )}
                      {buyable && (
                        <div className="monopoly-inventory-actions">
                          <button
                            type="button"
                            className="btn btn-secondary monopoly-inv-action"
                            disabled={!live.canMortgage}
                            onClick={() => emitMortgage(live.index)}
                          >
                            Zastaw{live.mortgageAmount != null ? ` ${live.mortgageAmount}` : ''}
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary monopoly-inv-action"
                            disabled={!live.canUnmortgage}
                            onClick={() => emitUnmortgage(live.index)}
                          >
                            Wykup{live.unmortgageCost != null ? ` ${live.unmortgageCost}` : ''}
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {tradeOpen && state && (
        <div className="modal-overlay" onClick={() => setTradeOpen(false)}>
          <div className="monopoly-inventory monopoly-trade-modal" onClick={(e) => e.stopPropagation()}>
            <div className="monopoly-inventory-head">
              <h2>Handel</h2>
              <button type="button" className="monopoly-deed-close" onClick={() => setTradeOpen(false)}>×</button>
            </div>

            <label className="monopoly-trade-label">
              Gracz
              <select
                value={tradePartnerId || ''}
                onChange={(e) => {
                  setTradePartnerId(e.target.value || null);
                  setTradeAskSpaces([]);
                }}
              >
                {state.tokens
                  .filter((t) => t.id !== playerId && !t.bankrupt)
                  .map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.cash})</option>
                  ))}
              </select>
            </label>

            <div className="monopoly-trade-cash-row">
              <label>
                Dajesz
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={tradeOfferCash}
                  onChange={(e) => setTradeOfferCash(e.target.value)}
                />
              </label>
              <label>
                Chcesz
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={tradeAskCash}
                  onChange={(e) => setTradeAskCash(e.target.value)}
                />
              </label>
            </div>

            <p className="monopoly-trade-section">Twoje pola</p>
            <ul className="monopoly-trade-space-list">
              {myProperties.map((s) => {
                const live = state.spaces[s.index] || s;
                const ok = spaceTradeable(live);
                return (
                  <li key={live.index}>
                    <label className={!ok ? 'is-disabled' : undefined}>
                      <input
                        type="checkbox"
                        disabled={!ok}
                        checked={tradeOfferSpaces.includes(live.index)}
                        onChange={() => toggleTradeSpace(tradeOfferSpaces, setTradeOfferSpaces, live.index)}
                      />
                      <span
                        className="monopoly-inventory-swatch"
                        style={{ background: GROUP_COLORS[live.group] || '#888' }}
                      />
                      {live.name}
                      {!ok && <em> (domy)</em>}
                    </label>
                  </li>
                );
              })}
            </ul>

            <p className="monopoly-trade-section">Pola gracza</p>
            <ul className="monopoly-trade-space-list">
              {state.spaces
                .filter((s) => s.ownerId === tradePartnerId)
                .map((live) => {
                  const ok = spaceTradeable(live);
                  return (
                    <li key={live.index}>
                      <label className={!ok ? 'is-disabled' : undefined}>
                        <input
                          type="checkbox"
                          disabled={!ok}
                          checked={tradeAskSpaces.includes(live.index)}
                          onChange={() => toggleTradeSpace(tradeAskSpaces, setTradeAskSpaces, live.index)}
                        />
                        <span
                          className="monopoly-inventory-swatch"
                          style={{ background: GROUP_COLORS[live.group] || '#888' }}
                        />
                        {live.name}
                        {!ok && <em> (domy)</em>}
                      </label>
                    </li>
                  );
                })}
            </ul>

            <button type="button" className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} onClick={submitTrade}>
              Wyślij ofertę
            </button>
          </div>
        </div>
      )}

      {state?.pendingTrade && state.canCancelTrade && (
        <div className="monopoly-trade-banner">
          <p>Czekasz na odpowiedź: {state.pendingTrade.toName}</p>
          <button type="button" className="btn btn-secondary" onClick={() => emit('monopolyTradeCancel')}>
            Anuluj
          </button>
        </div>
      )}

      {state?.pendingTrade && state.canRespondTrade && (
        <div className="monopoly-sheet-overlay">
          <div className="monopoly-sheet monopoly-trade-sheet" onClick={(e) => e.stopPropagation()}>
            <h2>Oferta od {state.pendingTrade.fromName}</h2>
            <p>
              Daje: {state.pendingTrade.offerCash}
              {state.pendingTrade.offerSpaceNames.length > 0
                ? ` + ${state.pendingTrade.offerSpaceNames.join(', ')}`
                : ''}
            </p>
            <p>
              Chce: {state.pendingTrade.askCash}
              {state.pendingTrade.askSpaceNames.length > 0
                ? ` + ${state.pendingTrade.askSpaceNames.join(', ')}`
                : ''}
            </p>
            <div className="monopoly-build-actions">
              <button type="button" className="btn btn-primary" onClick={() => emit('monopolyTradeAccept')}>
                Przyjmij
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => emit('monopolyTradeReject')}>
                Odrzuć
              </button>
            </div>
          </div>
        </div>
      )}

      {deedSpace && state && (
        <PropertyDeed
          space={state.spaces[deedSpace.index] || deedSpace}
          ownerName={
            (state.spaces[deedSpace.index] || deedSpace).ownerId
              ? state.tokens.find((t) => t.id === (state.spaces[deedSpace.index] || deedSpace).ownerId)?.name || null
              : null
          }
          onClose={() => setDeedSpace(null)}
          onBuild={() => emitBuild(deedSpace.index)}
          onSellHouse={() => emitSellHouse(deedSpace.index)}
          onMortgage={() => emitMortgage(deedSpace.index)}
          onUnmortgage={() => emitUnmortgage(deedSpace.index)}
        />
      )}

      {showNotice && state?.pendingNotice && (
        <div
          className={`monopoly-toast monopoly-toast-notice kind-${state.pendingNotice.kind || 'rent'}`}
          role="status"
          onClick={() => setNoticeDismissed(state.pendingNotice!.id)}
        >
          <strong>{state.pendingNotice.title}</strong>
          <span>{state.pendingNotice.text}</span>
        </div>
      )}

      {state?.pendingCardPick && (
        <LosCardPick
          count={state.pendingCardPick.count}
          isMine={!!state.pendingCardPick.isMine}
          playerName={state.pendingCardPick.playerName}
          onPick={(slot) => emit('monopolyPickCard', { slot })}
        />
      )}

      {showCard && state?.pendingCard && !cardNeedsSheet && !state.pendingCardPick && (
        <div
          className="monopoly-toast monopoly-toast-card"
          role="status"
          onClick={() => setCardDismissed(state.pendingCard!.id)}
        >
          <strong>Los</strong>
          <span>{state.pendingCard.text}</span>
        </div>
      )}

      {showCard && state?.pendingCard && cardNeedsSheet && !state.pendingCardPick && (
        <div className="monopoly-sheet-overlay" onClick={() => setCardDismissed(state.pendingCard!.id)}>
          <div className="monopoly-sheet" onClick={(e) => e.stopPropagation()}>
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
