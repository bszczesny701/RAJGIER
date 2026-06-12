import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

type CardColor = 'red' | 'blue' | 'green' | 'yellow' | 'wild';
type CardType = 'number' | 'skip' | 'draw2' | 'wild';

interface Card {
  id: string;
  color: CardColor;
  type: CardType;
  value: number | null;
}

interface UnosState {
  phase: string;
  currentTurn: string | null;
  topCard: Card | null;
  activeColor: CardColor | null;
  wildColor: CardColor | null;
  myHand: Card[];
  opponentHandCount: number;
  deckCount: number;
  playableCardIds: string[];
  canPlayDrawnCardId: string | null;
  needsUnosCall: boolean;
  mustChooseColor: boolean;
  winner: string | null;
  colors: CardColor[];
  colorLabels: Record<string, string>;
  opponentName: string;
  myName: string;
}

const COLOR_STYLES: Record<string, { bg: string; label: string }> = {
  red: { bg: '#ef4444', label: 'Czerwony' },
  blue: { bg: '#3b82f6', label: 'Niebieski' },
  green: { bg: '#22c55e', label: 'Zielony' },
  yellow: { bg: '#eab308', label: 'Żółty' },
  wild: { bg: 'linear-gradient(135deg, #ef4444, #3b82f6, #22c55e, #eab308)', label: 'Wild' },
};

function cardLabel(card: Card): string {
  if (card.type === 'number') return String(card.value);
  if (card.type === 'skip') return '⊘';
  if (card.type === 'draw2') return '+2';
  return 'W';
}

function UnosCard({
  card,
  playable,
  onClick,
  small,
}: {
  card: Card;
  playable?: boolean;
  onClick?: () => void;
  small?: boolean;
}) {
  const style = COLOR_STYLES[card.color] || COLOR_STYLES.wild;
  const isWild = card.type === 'wild';

  return (
    <button
      type="button"
      className={`unos-card${playable ? ' playable' : ''}${small ? ' unos-card-small' : ''}`}
      style={{ background: isWild ? undefined : style.bg }}
      onClick={onClick}
      disabled={!onClick}
      aria-label={`Karta ${card.type} ${card.color}`}
    >
      {isWild && <span className="unos-card-wild-bg" aria-hidden="true" />}
      <span className="unos-card-corner unos-card-corner-tl">{cardLabel(card)}</span>
      <span className="unos-card-center">{cardLabel(card)}</span>
      <span className="unos-card-corner unos-card-corner-br">{cardLabel(card)}</span>
    </button>
  );
}

export default function Unos() {
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

  const [state, setState] = useState<UnosState | null>(null);
  const [pendingWildId, setPendingWildId] = useState<string | null>(null);
  const isHost = room?.hostId === playerId;

  useEffect(() => {
    if (!room) {
      navigate('/');
      return;
    }
    if (room.game !== 'unos') {
      navigate('/lobby');
    }
  }, [room, navigate]);

  useEffect(() => {
    if (!socket || !room) return;

    const handler = (data: UnosState) => {
      setState(data);
      if (data.mustChooseColor) {
        setPendingWildId(null);
      }
    };
    socket.on('unosUpdate', handler);
    requestGameState();

    return () => { socket.off('unosUpdate', handler); };
  }, [socket, room, requestGameState]);

  const isMyTurn = state?.currentTurn === playerId;

  const playCard = (cardId: string, color?: string) => {
    if (!socket) return;
    socket.emit('unosPlayCard', { cardId, color, sessionId, roomCode });
    setPendingWildId(null);
  };

  const handleCardClick = (card: Card) => {
    if (!isMyTurn || state?.mustChooseColor) return;
    if (!state.playableCardIds.includes(card.id) && card.id !== state.canPlayDrawnCardId) return;

    if (card.type === 'wild') {
      setPendingWildId(card.id);
      return;
    }

    playCard(card.id);
  };

  const chooseColor = (color: string) => {
    if (!socket || !state) return;

    if (state.mustChooseColor) {
      socket.emit('unosChooseColor', { color, sessionId, roomCode });
      return;
    }

    if (pendingWildId) {
      playCard(pendingWildId, color);
    }
  };

  const drawCard = () => {
    if (!socket || !isMyTurn) return;
    socket.emit('unosDrawCard', { sessionId, roomCode });
  };

  const callUnos = () => {
    if (!socket) return;
    socket.emit('unosCallUnos', { sessionId, roomCode });
  };

  const passTurn = () => {
    if (!socket || !isMyTurn) return;
    socket.emit('unosPassTurn', { sessionId, roomCode });
  };

  if (!state) {
    return (
      <div className="page waiting-text">
        <div className="spinner">🃏</div>
        <p>Ładowanie UNOS...</p>
      </div>
    );
  }

  const activeColorLabel = state.activeColor
    ? state.colorLabels[state.activeColor] || state.activeColor
    : '—';

  return (
    <div className="page unos-page">
      <div className="game-header">
        <h2>🃏 UNOS</h2>
        <span className={`turn-indicator ${isMyTurn ? 'my-turn' : 'opponent-turn'}`}>
          {isMyTurn ? 'Twój ruch' : `Ruch: ${state.opponentName}`}
        </span>
      </div>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button type="button" onClick={clearError} aria-label="Zamknij">×</button>
        </div>
      )}

      <div className="unos-info-bar">
        <span>Kolor gry: <strong style={{ color: COLOR_STYLES[state.activeColor || 'red']?.bg }}>{activeColorLabel}</strong></span>
        <span>Talia: {state.deckCount}</span>
        <span>{state.opponentName}: {state.opponentHandCount} kart</span>
      </div>

      <div className="unos-table">
        <div className="unos-opponent-hand">
          {Array.from({ length: state.opponentHandCount }, (_, i) => (
            <div key={i} className="unos-card-back" />
          ))}
        </div>

        <div className="unos-pile">
          <div className="unos-deck" aria-hidden="true">
            <div className="unos-card-back" />
            <span className="unos-deck-count">{state.deckCount}</span>
          </div>
          {state.topCard && (
            <div className="unos-discard">
              <UnosCard card={state.topCard} />
            </div>
          )}
        </div>
      </div>

      {(state.mustChooseColor || pendingWildId) && isMyTurn && (
        <div className="card unos-color-picker">
          <p>Wybierz kolor:</p>
          <div className="unos-color-buttons">
            {state.colors.map((color) => (
              <button
                key={color}
                type="button"
                className="unos-color-btn"
                style={{ background: COLOR_STYLES[color].bg }}
                onClick={() => chooseColor(color)}
              >
                {state.colorLabels[color]}
              </button>
            ))}
          </div>
        </div>
      )}

      {state.myHand.length === 1 && (
        <button
          type="button"
          className="btn btn-primary unos-call-btn"
          onClick={callUnos}
        >
          🃏 UNOS!
        </button>
      )}

      <div className="unos-my-hand">
        {state.myHand.map((card) => {
          const playable = isMyTurn && (
            state.playableCardIds.includes(card.id) || card.id === state.canPlayDrawnCardId
          );
          return (
            <UnosCard
              key={card.id}
              card={card}
              playable={playable}
              onClick={playable ? () => handleCardClick(card) : undefined}
            />
          );
        })}
      </div>

      {isMyTurn && !state.mustChooseColor && !pendingWildId && (
        <div className="unos-actions">
          <button type="button" className="btn btn-secondary" onClick={drawCard}>
            Dobierz kartę
          </button>
          {state.canPlayDrawnCardId && (
            <button type="button" className="btn btn-secondary" onClick={passTurn}>
              Pasuj
            </button>
          )}
        </div>
      )}

      {gameOver && (
        <div className="modal-overlay" onClick={clearGameOver}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="emoji-big">🏆</div>
            <h2>{gameOver.winnerName} wygrywa!</h2>
            <p>Brak kart — zwycięstwo w UNOS!</p>
            {isHost ? (
              <button className="btn btn-primary" onClick={() => { clearGameOver(); backToLobby(); }}>
                Zagraj jeszcze raz
              </button>
            ) : (
              <button className="btn btn-primary" onClick={clearGameOver}>OK</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
