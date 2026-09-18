/**
 * How a chess game ends: checkmate, stalemate, insufficient material, threefold repetition and the
 * fifty-move rule. The last two follow owner decision D11 (`apps/chess/docs/PLAN.md`): this engine ends
 * the game itself rather than waiting for a claim, which `RULES.md` records as a divergence from the FIDE
 * claim procedure.
 */
import { BISHOP, BLACK, type Board, type ColorIndex, colorBits, fileOf, KING, PAWN, QUEEN, rankOf, ROOK, TYPE_MASK } from './board';

/** Plies without a pawn move or a capture that end the game as a draw. */
export const FIFTY_MOVE_PLIES = 100;
/** How often a position may appear before the game is a draw. */
export const REPETITION_LIMIT = 3;

/**
 * True when side `us` cannot mate at all in this position, the way Fairy-Stockfish scores it (probed
 * against ffish 0.7.10):
 *
 * - a lone king never mates;
 * - a pawn, rook or queen always can;
 * - while the opponent still has a piece of their own, a mate can be constructed with it, so even a lone
 *   bishop counts as enough (`KB vs KB` is a playable position there, not a draw);
 * - against a bare king, one minor piece is not enough, and neither is any number of bishops that all
 *   stand on squares of one colour (`KBB` on one colour vs `K` is a draw, on both colours it is not).
 */
export function insufficientMaterial(board: Board, us: ColorIndex): boolean {
  const ourBits = colorBits(us);
  let ourMinors = 0;
  let ourBishops = 0;
  let bishopColors = 0;
  let theirPieces = 0;

  for (let sq = 0; sq < 64; sq++) {
    const code = board[sq]!;
    if (code === 0) continue;
    const type = code & TYPE_MASK;
    if (type === KING) continue;
    if ((code & BLACK) !== ourBits) {
      theirPieces++;
      continue;
    }
    if (type === PAWN || type === ROOK || type === QUEEN) return false;
    ourMinors++;
    if (type === BISHOP) {
      ourBishops++;
      bishopColors |= 1 << ((fileOf(sq) + rankOf(sq)) & 1);
    }
  }

  if (ourMinors === 0) return true;
  if (theirPieces > 0) return false;
  if (ourMinors === 1) return true;
  return ourBishops === ourMinors && bishopColors !== 3;
}

/** True when neither side can mate, so the game is a draw. */
export function deadPosition(board: Board): boolean {
  return insufficientMaterial(board, 0) && insufficientMaterial(board, 1);
}

/** How often `key` appears in the game's position history. */
export function repetitionCount(keys: readonly string[], key: string): number {
  let count = 0;
  for (const seen of keys) if (seen === key) count++;
  return count;
}

export { BLACK };
