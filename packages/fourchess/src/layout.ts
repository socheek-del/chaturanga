import type { FourPiece, PieceType, Player } from './types';

export const FILES = 14;
export const RANKS = 14;
const RED_YELLOW_ORDER: readonly PieceType[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
const BLUE_GREEN_ORDER: readonly PieceType[] = ['r', 'n', 'b', 'k', 'q', 'b', 'n', 'r'];

export function startOrder(player: Player): readonly PieceType[] {
  return player === 'r' || player === 'y' ? RED_YELLOW_ORDER : BLUE_GREEN_ORDER;
}

export function kingHomeIndex(player: Player): number {
  return player === 'r' || player === 'y' ? 4 : 3;
}

export const fileOf = (square: number): number => square % FILES;
export const rankOf = (square: number): number => Math.floor(square / FILES);
export const squareAt = (file: number, rank: number): number => rank * FILES + file;

export function isPlayable(file: number, rank: number): boolean {
  return Number.isInteger(file) && Number.isInteger(rank) && file >= 0 && file < FILES && rank >= 0 && rank < RANKS &&
    ((file >= 3 && file <= 10) || (rank >= 3 && rank <= 10));
}

export function isPlayableSquare(square: number): boolean {
  return Number.isInteger(square) && square >= 0 && square < FILES * RANKS && isPlayable(fileOf(square), rankOf(square));
}

export function squareName(square: number): string {
  if (!isPlayableSquare(square)) throw new RangeError(`Invalid Four-handed chess square: ${square}`);
  return `${String.fromCharCode(97 + fileOf(square))}${rankOf(square) + 1}`;
}

export function parseSquare(name: string): number | null {
  const match = /^([a-n])(1[0-4]|[1-9])$/.exec(name);
  if (!match) return null;
  const square = squareAt(match[1]!.charCodeAt(0) - 97, Number(match[2]) - 1);
  return isPlayableSquare(square) ? square : null;
}

/** Back-rank squares, ordered from the player's left to right while facing the center. */
export function homeLine(player: Player): number[] {
  if (player === 'r') return Array.from({ length: 8 }, (_, i) => squareAt(i + 3, 0));
  if (player === 'b') return Array.from({ length: 8 }, (_, i) => squareAt(0, 10 - i));
  if (player === 'y') return Array.from({ length: 8 }, (_, i) => squareAt(10 - i, 13));
  return Array.from({ length: 8 }, (_, i) => squareAt(13, i + 3));
}

export function pawnLine(player: Player): number[] {
  if (player === 'r') return Array.from({ length: 8 }, (_, i) => squareAt(i + 3, 1));
  if (player === 'b') return Array.from({ length: 8 }, (_, i) => squareAt(1, 10 - i));
  if (player === 'y') return Array.from({ length: 8 }, (_, i) => squareAt(10 - i, 12));
  return Array.from({ length: 8 }, (_, i) => squareAt(12, i + 3));
}

export function startBoard(): Array<FourPiece | null> {
  const board: Array<FourPiece | null> = Array(FILES * RANKS).fill(null);
  for (const player of ['r', 'b', 'y', 'g'] as const) {
    homeLine(player).forEach((square, i) => {
      board[square] = { color: player, type: startOrder(player)[i]!, promoted: false, moved: false };
    });
    pawnLine(player).forEach((square) => {
      board[square] = { color: player, type: 'p', promoted: false, moved: false };
    });
  }
  return board;
}
