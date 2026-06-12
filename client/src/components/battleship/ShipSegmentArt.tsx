import { useId } from 'react';
import type { ShipOrientation, ShipSegment } from './shipUtils';

interface ShipSegmentArtProps {
  orientation: ShipOrientation;
  segment: ShipSegment;
  sunk?: boolean;
  size?: number;
  index?: number;
  preview?: boolean;
}

export default function ShipSegmentArt({
  orientation,
  segment,
  sunk = false,
  size = 1,
  index = 0,
  preview = false,
}: ShipSegmentArtProps) {
  const uid = useId().replace(/:/g, '');
  const isV = orientation === 'v';

  const hullTop = sunk ? '#9ca3af' : '#94a3b8';
  const hullMid = sunk ? '#6b7280' : '#64748b';
  const hullBot = sunk ? '#374151' : '#334155';
  const deck = sunk ? '#52525b' : '#78716c';
  const bow = sunk ? '#4b5563' : '#475569';
  const porthole = sunk ? '#6b7280' : '#fef08a';
  const waterline = sunk ? '#4b5563' : '#1e40af';

  const showBridge = size >= 3 && segment === 'middle' && index === Math.floor(size / 2);
  const showStack = size >= 3 && segment === 'middle' && index === size - 2;
  const showCabin = size === 2 && segment === 'start';

  return (
    <svg
      className={`ship-segment-art${sunk ? ' ship-segment-sunk' : ''}${preview ? ' ship-segment-preview' : ''}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${uid}-hull`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={hullTop} />
          <stop offset="45%" stopColor={hullMid} />
          <stop offset="100%" stopColor={hullBot} />
        </linearGradient>
        <linearGradient id={`${uid}-deck`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={deck} />
          <stop offset="100%" stopColor={sunk ? '#3f3f46' : '#57534e'} />
        </linearGradient>
        <pattern id={`${uid}-planks`} width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill={sunk ? '#52525b' : '#64748b'} opacity="0.15" />
          <line x1="0" y1="8" x2="8" y2="8" stroke={sunk ? '#3f3f46' : '#475569'} strokeWidth="0.6" opacity="0.5" />
        </pattern>
      </defs>

      <g transform={isV ? 'rotate(90 50 50)' : undefined}>
        {segment === 'single' && (
          <>
            <ellipse cx="50" cy="58" rx="34" ry="18" fill={`url(#${uid}-hull)`} stroke={hullBot} strokeWidth="1.2" />
            <path d="M 78 58 L 92 58 L 84 48 Z" fill={bow} />
            <rect x="38" y="42" width="18" height="12" rx="2" fill={`url(#${uid}-deck)`} stroke={hullBot} strokeWidth="0.8" />
            <circle cx="46" cy="58" r="2.5" fill={porthole} opacity="0.85" />
            <rect x="8" y="66" width="84" height="6" rx="2" fill={waterline} opacity="0.55" />
          </>
        )}

        {segment === 'start' && (
          <>
            <path
              d="M 8 34 L 100 30 L 100 70 L 8 66 Q 2 50 8 34 Z"
              fill={`url(#${uid}-hull)`}
              stroke={hullBot}
              strokeWidth="1"
            />
            <rect x="10" y="30" width="88" height="40" fill={`url(#${uid}-planks)`} opacity="0.35" />
            <circle cx="28" cy="52" r="3" fill={porthole} opacity="0.9" />
            <circle cx="44" cy="52" r="3" fill={porthole} opacity="0.9" />
            {showCabin && (
              <rect x="52" y="36" width="22" height="14" rx="2" fill={`url(#${uid}-deck)`} stroke={hullBot} strokeWidth="0.8" />
            )}
            <rect x="0" y="68" width="100" height="7" fill={waterline} opacity="0.45" />
          </>
        )}

        {segment === 'middle' && (
          <>
            <rect x="0" y="30" width="100" height="40" fill={`url(#${uid}-hull)`} stroke={hullBot} strokeWidth="0.8" />
            <rect x="0" y="30" width="100" height="40" fill={`url(#${uid}-planks)`} opacity="0.3" />
            <line x1="0" y1="38" x2="100" y2="38" stroke={hullBot} strokeWidth="0.6" opacity="0.35" />
            <circle cx="35" cy="52" r="3" fill={porthole} opacity="0.85" />
            <circle cx="65" cy="52" r="3" fill={porthole} opacity="0.85" />
            {showBridge && (
              <>
                <rect x="36" y="18" width="28" height="16" rx="2.5" fill={`url(#${uid}-deck)`} stroke={hullBot} strokeWidth="0.8" />
                <rect x="42" y="12" width="8" height="8" rx="1" fill={sunk ? '#71717a' : '#a8a29e'} />
              </>
            )}
            {showStack && (
              <rect x="58" y="10" width="7" height="14" rx="1.5" fill={sunk ? '#71717a' : '#a8a29e'} stroke={hullBot} strokeWidth="0.5" />
            )}
            <rect x="0" y="68" width="100" height="7" fill={waterline} opacity="0.45" />
          </>
        )}

        {segment === 'end' && (
          <>
            <path
              d="M 0 30 L 72 30 L 98 50 L 72 70 L 0 70 Z"
              fill={`url(#${uid}-hull)`}
              stroke={hullBot}
              strokeWidth="1"
            />
            <path d="M 72 30 L 98 50 L 72 70 Z" fill={bow} stroke={hullBot} strokeWidth="0.8" />
            <rect x="0" y="30" width="72" height="40" fill={`url(#${uid}-planks)`} opacity="0.25" />
            <circle cx="24" cy="52" r="3" fill={porthole} opacity="0.85" />
            <rect x="0" y="68" width="100" height="7" fill={waterline} opacity="0.45" />
          </>
        )}

        {sunk && (
          <line x1="8" y1="92" x2="92" y2="8" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" opacity="0.9" />
        )}
      </g>
    </svg>
  );
}
