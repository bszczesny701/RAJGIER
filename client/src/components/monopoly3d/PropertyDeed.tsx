import { GROUP_COLORS, RENT_LABELS } from './boardLayout';
import type { MonopolySpace } from './types';

const GROUP_NAMES: Record<string, string> = {
  brown: 'Brązowa',
  lightblue: 'Jasnoniebieska',
  pink: 'Różowa',
  orange: 'Pomarańczowa',
  red: 'Czerwona',
  yellow: 'Żółta',
  green: 'Zielona',
  darkblue: 'Granatowa',
  rail: 'Stacje',
  utility: 'Media',
  special: 'Specjalne',
};

function housesLabel(houses: number) {
  if (houses >= 5) return 'Hotel';
  if (houses <= 0) return 'Bez ulepszeń';
  return `${houses} ${houses === 1 ? 'dom' : 'domy'}`;
}

export default function PropertyDeed({
  space,
  ownerName,
  onClose,
  onBuild,
  onSellHouse,
}: {
  space: MonopolySpace;
  ownerName: string | null;
  onClose: () => void;
  onBuild?: () => void;
  onSellHouse?: () => void;
}) {
  const color = GROUP_COLORS[space.group] || GROUP_COLORS.special;
  const isInvestment = space.type === 'investment';
  const isRail = space.type === 'rail';
  const isUtility = space.type === 'utility';
  const buyable = isInvestment || isRail || isUtility;
  const houses = space.houses || 0;
  const showBuildActions = isInvestment && (space.canBuild || space.canSellHouse);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="monopoly-deed" onClick={(e) => e.stopPropagation()}>
        <div className="monopoly-deed-stripe" style={{ background: color }} />
        <button type="button" className="monopoly-deed-close" onClick={onClose} aria-label="Zamknij">
          ×
        </button>
        <p className="monopoly-deed-group">{GROUP_NAMES[space.group] || space.group}</p>
        <h2 className="monopoly-deed-title">{space.name}</h2>

        {space.price != null && (
          <p className="monopoly-deed-price">Cena zakupu: <strong>{space.price}</strong></p>
        )}
        {space.tax != null && (
          <p className="monopoly-deed-price">Podatek: <strong>{space.tax}</strong></p>
        )}

        {ownerName && (
          <p className="monopoly-deed-owner">Właściciel: <strong>{ownerName}</strong></p>
        )}
        {!ownerName && buyable && (
          <p className="monopoly-deed-owner">Wolna — do kupienia</p>
        )}

        {isInvestment && (
          <p className="monopoly-deed-owner">
            Ulepszenie: <strong>{housesLabel(houses)}</strong>
          </p>
        )}

        {isInvestment && space.rent && (
          <>
            <h3 className="monopoly-deed-section">Czynsz</h3>
            <ul className="monopoly-deed-rents">
              {space.rent.map((r, i) => (
                <li key={i} className={houses === i ? 'is-current' : undefined}>
                  <span>{RENT_LABELS[i] || `Poziom ${i}`}</span>
                  <strong>{r}</strong>
                </li>
              ))}
            </ul>
            {space.houseCost != null && (
              <p className="monopoly-deed-upgrade">
                Koszt ulepszenia (dom): <strong>{space.houseCost}</strong>
              </p>
            )}
          </>
        )}

        {isRail && space.rent && (
          <>
            <h3 className="monopoly-deed-section">Czynsz (za liczbę stacji)</h3>
            <ul className="monopoly-deed-rents">
              {space.rent.map((r, i) => (
                <li key={i}>
                  <span>{i + 1} stacj{i === 0 ? 'a' : 'e/i'}</span>
                  <strong>{r}</strong>
                </li>
              ))}
            </ul>
          </>
        )}

        {isUtility && (
          <p className="monopoly-deed-meta">
            Czynsz = wynik kostki × 4 (1 media) lub × 10 (obie).
          </p>
        )}

        {!buyable && space.type !== 'tax' && (
          <p className="monopoly-deed-meta">Pole specjalne — bez zakupu.</p>
        )}

        {showBuildActions && (
          <div className="monopoly-build-actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={!space.canBuild}
              onClick={() => onBuild?.()}
            >
              Buduj{space.houseCost != null ? ` (−${space.houseCost})` : ''}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={!space.canSellHouse}
              onClick={() => onSellHouse?.()}
            >
              Sprzedaj{space.sellRefund != null ? ` (+${space.sellRefund})` : ''}
            </button>
          </div>
        )}

        <button type="button" className="btn btn-primary" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
}
