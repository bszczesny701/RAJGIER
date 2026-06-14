export type GameId = 'battleship' | 'wordsearch' | 'crossword' | 'sudoku' | 'unos' | 'czolko';

export const MAX_ROOM_PLAYERS = 4;

export interface GamePlayerLimits {
  min: number;
  max: number;
}

export const GAME_PLAYER_LIMITS: Record<GameId, GamePlayerLimits> = {
  battleship: { min: 2, max: 2 },
  wordsearch: { min: 2, max: 2 },
  crossword: { min: 2, max: 2 },
  sudoku: { min: 2, max: 2 },
  unos: { min: 2, max: 4 },
  czolko: { min: 2, max: 4 },
};

const GAME_ROUTES: Record<GameId, string> = {
  battleship: '/statki',
  wordsearch: '/wykreslanka',
  crossword: '/krzyzowka',
  sudoku: '/sudoku',
  unos: '/unos',
  czolko: '/czolko',
};

const GAME_LABELS: Record<GameId, string> = {
  battleship: 'Statki',
  wordsearch: 'Wykreślanka',
  crossword: 'Krzyżówka',
  sudoku: 'Sudoku',
  unos: 'UNOS',
  czolko: 'Czółko',
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

export function canStartGame(game: GameId, playerCount: number): boolean {
  const limits = GAME_PLAYER_LIMITS[game];
  return playerCount >= limits.min && playerCount <= limits.max;
}

export function getGamePlayerRangeLabel(game: GameId): string {
  const { min, max } = GAME_PLAYER_LIMITS[game];
  if (min === max) return `${min} graczy`;
  return `${min}–${max} graczy`;
}
