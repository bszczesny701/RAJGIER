export const PIECE_IDS = ['pawn', 'car', 'hat', 'dog', 'shoe', 'boat'] as const;

export type PieceId = (typeof PIECE_IDS)[number];

export const PIECE_LABELS: Record<PieceId, string> = {
  pawn: 'Pionek',
  car: 'Auto',
  hat: 'Kapelusz',
  dog: 'Pies',
  shoe: 'But',
  boat: 'Łódka',
};

export const PIECE_ICONS: Record<PieceId, string> = {
  pawn: '♟',
  car: '🚗',
  hat: '🎩',
  dog: '🐕',
  shoe: '👟',
  boat: '⛵',
};

export function isPieceId(value: string): value is PieceId {
  return (PIECE_IDS as readonly string[]).includes(value);
}
