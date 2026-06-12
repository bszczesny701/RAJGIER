import ShipSegmentArt from './ShipSegmentArt';
import type { ShipSegmentInfo } from './shipUtils';

interface ShipCellVisualProps {
  segment: ShipSegmentInfo;
  preview?: boolean;
}

export default function ShipCellVisual({ segment, preview = false }: ShipCellVisualProps) {
  return (
    <ShipSegmentArt
      orientation={segment.orientation}
      segment={segment.segment}
      sunk={segment.sunk}
      size={segment.size}
      index={segment.index}
      preview={preview}
    />
  );
}
