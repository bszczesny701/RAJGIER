import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import Board2DFallback from '../components/monopoly3d/Board2DFallback';
import type { MonopolyState } from '../components/monopoly3d/types';
import { TOKEN_COLORS } from '../components/monopoly3d/boardLayout';
import './Monopoly.css';

const MonopolyScene = lazy(() => import('../components/monopoly3d/MonopolyScene'));

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

  const focusIndex = useMemo(() => {
    if (!state) return 0;
    if (state.isMyTurn) return state.myPosition;
    return state.tokens.find((t) => t.id === state.currentPlayerId)?.position ?? state.myPosition;
  }, [state]);

  const focusSpace = state?.spaces[focusIndex] ?? null;
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
                Tura:{' '}
                <strong style={{ color: colorById[state.currentPlayerId || ''] }}>
                  {state.currentTurnName}
                </strong>
                {state.isMyTurn ? ' (Ty)' : ''}
              </p>
              <p className="monopoly-cash">
                Twój stan: <strong>{state.myCash}</strong>
              </p>
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
              <Suspense
                fallback={(
                  <Board2DFallback
                    spaces={state.spaces}
                    tokens={state.tokens}
                    focusIndex={focusIndex}
                    colorById={colorById}
                    myId={playerId}
                  />
                )}
              >
                <MonopolyScene
                  state={state}
                  focusIndex={focusIndex}
                  myId={playerId}
                  colorById={colorById}
                  fallback={(
                    <Board2DFallback
                      spaces={state.spaces}
                      tokens={state.tokens}
                      focusIndex={focusIndex}
                      colorById={colorById}
                      myId={playerId}
                    />
                  )}
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
                    {focusSpace.tax != null && (
                      <p className="monopoly-focus-meta">Podatek: {focusSpace.tax}</p>
                    )}
                    {focusSpace.ownerId && (
                      <p className="monopoly-focus-meta">
                        Właściciel:{' '}
                        {state.tokens.find((t) => t.id === focusSpace.ownerId)?.name || '—'}
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
