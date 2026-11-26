import type { Color } from '@chaturanga/rules-core';
import type { Piece, Position, PieceType } from '@chaturanga/chu-shogi';

/** Material values are calibrated to keep promotions and Lion trades visible without outweighing a royal. */
export const PIECE_VALUE: Readonly<Record<PieceType, number>> = {
  king: 0,
  lion: 1_500,
  'free-king': 1_050,
  'drunk-elephant': 360,
  kirin: 520,
  phoenix: 520,
  rook: 720,
  bishop: 680,
  'dragon-king': 900,
  'dragon-horse': 880,
  'vertical-mover': 500,
  'side-mover': 500,
  'reverse-chariot': 390,
  lance: 260,
  'blind-tiger': 370,
  'ferocious-leopard': 340,
  'gold-general': 380,
  'silver-general': 300,
  'copper-general': 250,
  'go-between': 150,
  pawn: 100,
};

const PROMOTION_BONUS: Readonly<Record<PieceType, number>> = {
  king: 0,
  lion: 0,
  'free-king': 0,
  'drunk-elephant': 0,
  kirin: 520,
  phoenix: 500,
  rook: 180,
  bishop: 200,
  'dragon-king': 180,
  'dragon-horse': 220,
  'vertical-mover': 260,
  'side-mover': 270,
  'reverse-chariot': 260,
  lance: 230,
  'blind-tiger': 280,
  'ferocious-leopard': 340,
  'gold-general': 400,
  'silver-general': 260,
  'copper-general': 270,
  'go-between': 200,
  pawn: 280,
};

const royalValue = (piece: Piece): number =>
  piece.type === 'king' ? 8_000 : piece.type === 'drunk-elephant' && piece.promoted ? 5_500 : 0;

/** Static score from the given side's point of view. Chu has no hands, so captures remove material. */
export function evaluate(position: Position, side: Color): number {
  let score = 0;
  for (let square = 0; square < position.board.length; square++) {
    const piece = position.board[square];
    if (!piece) continue;
    const sign = piece.color === 'w' ? 1 : -1;
    const rank = Math.floor(square / 12) + 1;
    const advance = piece.color === 'w' ? rank - 1 : 12 - rank;
    let value = royalValue(piece) || PIECE_VALUE[piece.type]!;
    if (piece.promoted) value += PROMOTION_BONUS[piece.type]!;
    if (!piece.promoted && !['king', 'lion', 'free-king'].includes(piece.type)) {
      value += Math.max(0, advance - 3) * 5;
      if (rank >= 4 && rank <= 9) value += (5 - Math.abs(5.5 - square % 12)) * 3;
    }
    score += sign * value;
  }

  return side === 'w' ? score : -score;
}
