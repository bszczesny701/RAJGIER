import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import './Monopoly.css';

interface MonopolySpace {
  index: number;
  type: string;
  name: string;
  group: string;
  price: number | null;
  tax: number | null;
  ownerId: string | null;
}

interface MonopolyToken {
  id: string;
  name: string;
  cash: number;
  position: number;
  inJail: boolean;
  jailTurns: number;
  bankrupt: boolean;
}

interface MonopolyState {
  phase: string;
  currentPlayerId: string | null;
  currentTurnName: string;
  winner: string | null;
  lastDice: { d1: number; d2: number; total: number; doubles: boolean } | null;
  pendingCard: { id: string; text: string } | null;
  log: string[];
  spaces: MonopolySpace[];
  tokens: MonopolyToken[];
  myId: string;
  myCash: number;
  myPosition: number;
  myBankrupt: boolean;
  inJail: boolean;
  isMyTurn: boolean;
  canRoll: boolean;
  canPayJail: boolean;
  canBuy: boolean;
  canSkipBuy: boolean;
  canEndTurn: boolean;
  buyOffer: { index: number; name: string; price: number } | null;
  jailFee: number;
  myName: string;
}

const TOKEN_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#f97316'];

function spaceToGrid(index: number): { row: number; col: number } {
  if (index >= 0 && index <= 10) return { row: 10, col: 10 - index };
  if (index >= 11 && index <= 20) return { row: 10 - (index - 10), col: 0 };
  if (index >= 21 && index <= 30) return { row: 0, col: index - 20 };
  return { row: index - 30, col: 10 };
}

function shortLabel(space: MonopolySpace): string {
  if (space.type === 'go') return 'START';
  if (space.type === 'jail') return 'Więzienie';
  if (space.type === 'parking') return 'Parking';
  if (space.type === 'gotojail') return 'Do więzienia';
  if (space.type === 'chance') return 'Szansa';
  if (space.type === 'chest') return 'Kasa';
  if (space.type === 'tax') return `Podatek ${space.tax}`;
  if (space.type === 'rail') return space.name;
  if (space.type === 'utility') return space.name;
  return space.name.replace(/^Inwestycja\s+/i, '');
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
    };
    socket.on('monopolyUpdate', handler);
    requestGameState();

    return () => {
      socket.off('monopolyUpdate', handler);
    };
  }, [socket, room, requestGameState]);

  useEffect(() => {
    if (state?.pendingCard?.id && state.pendingCard.id !== cardDismissed) {
      setCardDismissed(null);
    }
  }, [state?.pendingCard?.id, cardDismissed]);

  const emit = (event: string) => {
    if (!socket) return;
    socket.emit(event, { sessionId, roomCode });
  };

  const colorById = useMemo(() => {
    const map: Record<string, string> = {};
    state?.tokens.forEach((t, i) => {
      map[t.id] = TOKEN_COLORS[i % TOKEN_COLORS.length];
    });
    return map;
  }, [state?.tokens]);

  const focusSpace = useMemo(() => {
    if (!state?.spaces?.length) return null;
    const idx = state.isMyTurn ? state.myPosition : (state.tokens.find((t) => t.id === state.currentPlayerId)?.position ?? state.myPosition);
    return state.spaces[idx] || null;
  }, [state]);

  const showCard = state?.pendingCard && state.pendingCard.id !== cardDismissed;

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
            <div className="monopoly-hud-main">
              <p className="monopoly-turn">
                Tura: <strong style={{ color: colorById[state.currentPlayerId || ''] }}>{state.currentTurnName}</strong>
                {state.isMyTurn ? ' (Ty)' : ''}
              </p>
              <p className="monopoly-cash">Twój stan: <strong>{state.myCash}</strong></p>
            </div>
            {state.lastDice && (
              <div className="monopoly-dice" aria-label="Ostatni rzut">
                <span>{state.lastDice.d1}</span>
                <span>{state.lastDice.d2}</span>
              </div>
            )}
          </div>

          <div className="monopoly-layout">
            <div className="monopoly-board-wrap">
              <div className="monopoly-board" role="grid" aria-label="Plansza Monopoly">
                <div className="monopoly-center" aria-hidden>MONOPOLY</div>
                {state.spaces.map((space) => {
                  const { row, col } = spaceToGrid(space.index);
                  const tokensHere = state.tokens.filter((t) => !t.bankrupt && t.position === space.index);
                  const isFocus = focusSpace?.index === space.index;
                  const isCorner = [0, 10, 20, 30].includes(space.index);

                  return (
                    <div
                      key={space.index}
                      className={`monopoly-cell group-${space.group}${isFocus ? ' is-focus' : ''}${isCorner ? ' is-corner' : ''}`}
                      style={{ gridRow: row + 1, gridColumn: col + 1 }}
                      title={space.name}
                    >
                      <span className={`monopoly-cell-bar group-${space.group}`} />
                      <span className="monopoly-cell-label">{shortLabel(space)}</span>
                      {space.ownerId && (
                        <span
                          className="monopoly-owner-dot"
                          style={{ background: colorById[space.ownerId] }}
                          title="Właściciel"
                        />
                      )}
                      <div className="monopoly-tokens">
                        {tokensHere.map((t) => (
                          <span
                            key={t.id}
                            className={`monopoly-token${t.id === playerId ? ' is-me' : ''}`}
                            style={{ background: colorById[t.id] }}
                            title={t.name}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
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
                    {focusSpace.tax != null && (
                      <p className="monopoly-focus-meta">Podatek: {focusSpace.tax}</p>
                    )}
                    {focusSpace.ownerId && (
                      <p className="monopoly-focus-meta">
                        Właściciel: {state.tokens.find((t) => t.id === focusSpace.ownerId)?.name || '—'}
                      </p>
                    )}
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
                      <span className="monopoly-player-swatch" style={{ background: colorById[t.id] }} />
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

              <div className="card monopoly-actions">
                <h3>Akcje</h3>
                {state.myBankrupt ? (
                  <p className="monopoly-focus-meta">Jesteś bankrutem — czekasz na koniec.</p>
                ) : !state.isMyTurn ? (
                  <p className="monopoly-focus-meta">Poczekaj na swoją turę.</p>
                ) : (
                  <div className="monopoly-action-btns">
                    {state.canPayJail && (
                      <button type="button" className="btn btn-secondary" onClick={() => emit('monopolyPayJail')}>
                        Zapłać kaucję ({state.jailFee})
                      </button>
                    )}
                    {state.canRoll && (
                      <button type="button" className="btn btn-primary" onClick={() => emit('monopolyRoll')}>
                        Rzuć kostkami
                      </button>
                    )}
                    {state.canBuy && state.buyOffer && (
                      <button type="button" className="btn btn-primary" onClick={() => emit('monopolyBuy')}>
                        Kup {state.buyOffer.name} ({state.buyOffer.price})
                      </button>
                    )}
                    {state.canSkipBuy && (
                      <button type="button" className="btn btn-secondary" onClick={() => emit('monopolySkipBuy')}>
                        Odpuść zakup
                      </button>
                    )}
                    {state.phase === 'awaitBuy' && state.buyOffer && !state.canBuy && (
                      <p className="monopoly-focus-meta">
                        Za mało gotówki na {state.buyOffer.name} ({state.buyOffer.price})
                      </p>
                    )}
                    {state.canEndTurn && (
                      <button type="button" className="btn btn-primary" onClick={() => emit('monopolyEndTurn')}>
                        Zakończ turę
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="card monopoly-log">
                <h3>Dziennik</h3>
                <ul>
                  {[...state.log].reverse().map((line, i) => (
                    <li key={`${line}-${i}`}>{line}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </>
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
