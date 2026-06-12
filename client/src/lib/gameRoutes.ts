export type GameId = 'battleship' | 'wordsearch' | 'crossword' | 'sudoku' | 'unos';

const GAME_ROUTES: Record<GameId, string> = {
  battleship: '/statki',
  wordsearch: '/wykreslanka',
  crossword: '/krzyzowka',
  sudoku: '/sudoku',
  unos: '/unos',
};

const GAME_LABELS: Record<GameId, string> = {
  battleship: 'Statki',
  wordsearch: 'Wykreślanka',
  crossword: 'Krzyżówka',
  sudoku: 'Sudoku',
  unos: 'UNOS',
};

export function getGameRoute(game: GameId | null | undefined): string | null {
  if (!game) return null;
  return GAME_ROUTES[game] ?? null;
}

export function getGameLabel(game: GameId | null | undefined): string {
  if (!game) return 'Gra';
  return GAME_LABELS[game] ?? 'Gra';
}

export function getGameIdFromPath(pathname: string): GameId | null {
  const entry = Object.entries(GAME_ROUTES).find(([, route]) => route === pathname);
  return (entry?.[0] as GameId) ?? null;
}
