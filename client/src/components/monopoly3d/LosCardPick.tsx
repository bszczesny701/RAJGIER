import { useState } from 'react';

/** Wybór 1 z 3 odwróconych kart Los. */
export default function LosCardPick({
  count,
  isMine,
  playerName,
  onPick,
}: {
  count: number;
  isMine: boolean;
  playerName: string;
  onPick: (slot: number) => void;
}) {
  const [flipping, setFlipping] = useState<number | null>(null);
  const slots = Array.from({ length: count }, (_, i) => i);

  const handlePick = (slot: number) => {
    if (!isMine || flipping != null) return;
    setFlipping(slot);
    window.setTimeout(() => onPick(slot), 520);
  };

  return (
    <div className="monopoly-los-overlay" role="dialog" aria-label="Wybór karty Los">
      <div className="monopoly-los-pick">
        <h2>{isMine ? 'Wybierz kartę LOS' : `${playerName} wybiera kartę…`}</h2>
        <p className="monopoly-los-hint">
          {isMine ? 'Dotknij jedną z trzech kart' : 'Poczekaj na wybór'}
        </p>
        <div className="monopoly-los-cards">
          {slots.map((slot) => (
            <button
              key={slot}
              type="button"
              className={`monopoly-los-card${flipping === slot ? ' is-flipping' : ''}${!isMine ? ' is-locked' : ''}`}
              disabled={!isMine || flipping != null}
              onClick={() => handlePick(slot)}
              aria-label={`Karta ${slot + 1}`}
            >
              <span className="monopoly-los-card-face monopoly-los-card-back">
                <span>LOS</span>
              </span>
              <span className="monopoly-los-card-face monopoly-los-card-front">
                <span>?</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
