interface ShipSvgProps {
  size: number;
  sunk?: boolean;
  compact?: boolean;
  className?: string;
}

export default function ShipSvg({ size, sunk = false, compact = false, className = '' }: ShipSvgProps) {
  const width = compact ? 36 + size * 10 : 48 + size * 14;
  const height = compact ? 18 : 24;
  const hullY = compact ? 6 : 8;
  const hullH = compact ? 10 : 14;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={`ship-svg${sunk ? ' ship-svg-sunk' : ''}${className ? ` ${className}` : ''}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`hull-${size}-${compact ? 'c' : 'n'}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={sunk ? '#6b7280' : '#94a3b8'} />
          <stop offset="100%" stopColor={sunk ? '#374151' : '#475569'} />
        </linearGradient>
      </defs>

      {/* Kadłub */}
      <rect
        x={4}
        y={hullY}
        width={width - 8}
        height={hullH}
        rx={compact ? 3 : 4}
        fill={`url(#hull-${size}-${compact ? 'c' : 'n'})`}
        stroke={sunk ? '#4b5563' : '#334155'}
        strokeWidth={1}
      />

      {/* Dziób */}
      <polygon
        points={`${width - 4},${hullY + hullH / 2} ${width - 12},${hullY} ${width - 12},${hullY + hullH}`}
        fill={sunk ? '#4b5563' : '#64748b'}
      />

      {/* Nadbudówka / mostek */}
      {size >= 2 && (
        <rect
          x={8 + size * (compact ? 4 : 6)}
          y={compact ? 2 : 3}
          width={compact ? 10 : 14}
          height={compact ? 6 : 8}
          rx={2}
          fill={sunk ? '#52525b' : '#78716c'}
          stroke={sunk ? '#3f3f46' : '#57534e'}
          strokeWidth={0.5}
        />
      )}

      {/* Komin */}
      {size >= 3 && (
        <rect
          x={width - (compact ? 22 : 28)}
          y={compact ? 1 : 2}
          width={compact ? 4 : 5}
          height={compact ? 7 : 9}
          rx={1}
          fill={sunk ? '#71717a' : '#a8a29e'}
        />
      )}

      {/* Okna */}
      {size >= 4 && (
        <>
          <circle cx={14} cy={hullY + hullH / 2} r={1.2} fill={sunk ? '#52525b' : '#fef08a'} opacity={0.8} />
          <circle cx={22} cy={hullY + hullH / 2} r={1.2} fill={sunk ? '#52525b' : '#fef08a'} opacity={0.8} />
        </>
      )}

      {sunk && (
        <line
          x1={6}
          y1={height - 4}
          x2={width - 6}
          y2={4}
          stroke="#ef4444"
          strokeWidth={2}
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
