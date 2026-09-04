export const CELL = 1.05;
export const BOARD_SPAN = 11 * CELL;
export const HALF = BOARD_SPAN / 2;

/** Monopoly index 0–39 → grid row/col (0–10), Start at bottom-right. */
export function spaceToGrid(index: number): { row: number; col: number } {
  if (index >= 0 && index <= 10) return { row: 10, col: 10 - index };
  if (index >= 11 && index <= 20) return { row: 10 - (index - 10), col: 0 };
  if (index >= 21 && index <= 30) return { row: 0, col: index - 20 };
  return { row: index - 30, col: 10 };
}

/** World XZ for a board index (Y up). */
export function indexToWorld(index: number): { x: number; z: number } {
  const { row, col } = spaceToGrid(index);
  return {
    x: col * CELL - HALF + CELL / 2,
    z: row * CELL - HALF + CELL / 2,
  };
}

export function isCorner(index: number): boolean {
  return index === 0 || index === 10 || index === 20 || index === 30;
}

export const GROUP_COLORS: Record<string, string> = {
  brown: '#a0522d',
  lightblue: '#38bdf8',
  pink: '#f472b6',
  orange: '#fb923c',
  red: '#ef4444',
  yellow: '#facc15',
  green: '#22c55e',
  darkblue: '#2563eb',
  rail: '#94a3b8',
  utility: '#22d3ee',
  special: '#fbbf24',
};

export const TOKEN_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#f97316'];

export function shortLabel(space: { type: string; name: string; tax: number | null }): string {
  if (space.type === 'go') return 'START';
  if (space.type === 'jail') return 'Kościuch';
  if (space.type === 'parking') return 'Anielin';
  if (space.type === 'gotojail') return 'Kościuch!';
  if (space.type === 'chance') return 'LOS';
  if (space.type === 'chest') return 'Kasa';
  if (space.type === 'tax') return 'KUPON';
  if (space.type === 'rail') {
    if (space.name.includes('PRUSZK')) return 'Pruszk.';
    if (space.name.includes('MICHAŁ') || space.name.includes('MICHAL')) return 'Michał.';
    if (space.name.includes('TWORK')) return 'Tworki';
    if (space.name.includes('MALICH')) return 'Malichy';
    return 'WKD';
  }
  if (space.type === 'utility') {
    if (space.name.includes('Elektro')) return 'El.';
    if (space.name.includes('Wodo')) return 'Wod.';
    return 'Med.';
  }
  if (space.name.startsWith('WC')) return 'WC';
  if (space.name.startsWith('Bagno')) return 'Bagno';
  if (space.name === 'Polna') return 'Polna';
  if (space.name.includes('Nowa Stacja') && space.name.includes('Zdrofit')) return 'Zd. NS';
  if (space.name.includes('Nowa Stacja')) return 'Nowa St.';
  if (space.name.includes('WPR')) return 'WPR';
  if (space.name.includes('Costa')) return 'Costa';
  if (space.name === 'Empik') return 'Empik';
  if (space.name.includes('Van Graaf') || space.name.includes('Van')) return 'Van Gr.';
  if (space.name.includes('Civitas')) return 'Civitas';
  if (space.name.includes('Uniwersytet Warszawski')) return 'UW';
  if (space.name.includes('Politechnika')) return 'PW';
  if (space.name.includes('Smak')) return 'Smak';
  if (space.name.includes('Złote')) return 'Zł. Łuki';
  if (space.name.includes('Zdrofit Leszcz')) return 'Zdrofit';
  if (space.name.includes('Kałęczyn') || space.name.includes('Kaleczyn')) return 'Kałęczyn';
  const first = space.name.split(/\s+/)[0] || space.name;
  return first.length <= 8 ? first : `${first.slice(0, 7)}.`;
}

export const RENT_LABELS = ['Bez ulepszeń', '1 dom', '2 domy', '3 domy', '4 domy', 'Hotel'];

