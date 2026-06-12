import ShipSvg from './ShipSvg';
import { mergeFleetWithSunkCounts } from './fleetStatus';

interface ShipType {
  id: string;
  size: number;
  count: number;
}

interface FleetShip {
  id: string;
  size: number;
  sunk: boolean;
}

interface FleetPanelProps {
  title: string;
  shipTypes: ShipType[];
  fleet?: FleetShip[];
  sunkCounts?: Record<number, number>;
  variant?: 'mine' | 'enemy';
}

export default function FleetPanel({
  title,
  shipTypes,
  fleet,
  sunkCounts,
  variant = 'mine',
}: FleetPanelProps) {
  const items: { key: string; size: number; sunk: boolean }[] = [];

  if (fleet?.length) {
    const merged = sunkCounts
      ? mergeFleetWithSunkCounts(fleet, shipTypes, sunkCounts)
      : fleet;
    for (const ship of merged) {
      items.push({ key: ship.id, size: ship.size, sunk: ship.sunk });
    }
  } else if (sunkCounts) {
    for (const type of shipTypes) {
      const sunk = sunkCounts[type.size] || 0;
      for (let i = 0; i < type.count; i++) {
        items.push({
          key: `${type.id}-${i}`,
          size: type.size,
          sunk: i < sunk,
        });
      }
    }
  }

  const sunkTotal = items.filter((i) => i.sunk).length;

  return (
    <div className={`fleet-panel fleet-panel-${variant}`}>
      <p className="fleet-panel-title">
        {title}
        <span className="fleet-panel-count">
          {items.length - sunkTotal}/{items.length}
        </span>
      </p>
      <div className="fleet-panel-ships">
        {items.map((item) => (
          <div
            key={item.key}
            className={`fleet-ship-item${item.sunk ? ' fleet-ship-sunk' : ''}`}
            title={item.sunk ? `Statek zatopiony (${item.size})` : `Statek ${item.size}-masztowy`}
          >
            <ShipSvg size={item.size} sunk={item.sunk} compact />
            {item.sunk && <span className="fleet-sunk-label">Zatopiony</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
