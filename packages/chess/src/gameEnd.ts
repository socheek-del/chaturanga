/**
 * How a chess game ends: checkmate, stalemate, insufficient material, threefold repetition and the
 * fifty-move rule. The last two follow owner decision D11 (`apps/chess/docs/PLAN.md`): this engine ends
 * the game itself rather than waiting for a claim, which `RULES.md` records as a divergence from the FIDE
 * claim procedure.
 */
import { BISHOP, BLACK, type Board, fileOf, KNIGHT, PAWN, QUEEN, rankOf, ROOK, TYPE_MASK } from './board';

/** Plies without a pawn move or a capture that end the game as a draw. */
export const FIFTY_MOVE_PLIES = 100;
/** How often a position may appear before the game is a draw. */
export const REPETITION_LIMIT = 3;

/**
 * True when neither side can mate, the way Fairy-Stockfish scores it (probed against ffish 0.7.10):
 *
 * - a pawn, a rook or a queen is always enough, so any of them means the game goes on;
 * - one minor piece on the board is never enough — king and bishop, or king and knight, against a bare
 *   king is a draw;
 * - bishops alone, all on squares of **one** colour, can never mate however many there are, whoever owns
 *   them: `KB vs KB` on one colour is a draw, on both colours it is not;
 * - a knight beside another minor can, so two knights, or a knight and a bishop, keep the game alive.
 */
export function deadPosition(board: Board): boolean {
  let knights = 0;
  let bishops = 0;
  /** Bit 0 = a bishop stands on a dark square, bit 1 = on a light one. */
  let bishopColors = 0;

  for (let sq = 0; sq < 64; sq++) {
    const code = board[sq]!;
    if (code === 0) continue;
    const type = code & TYPE_MASK;
    if (type === PAWN || type === ROOK || type === QUEEN) return false;
    if (type === KNIGHT) knights++;
    else if (type === BISHOP) {
      bishops++;
      bishopColors |= 1 << ((fileOf(sq) + rankOf(sq)) & 1);
    }
  }

  if (knights + bishops <= 1) return true;
  return knights === 0 && bishopColors !== 3;
}

/** Alias kept for callers that read the rule from one side's point of view; the rule is board-wide. */
export const insufficientMaterial = deadPosition;

/** How often `key` appears in the game's position history. */
export function repetitionCount(keys: readonly string[], key: string): number {
  let count = 0;
  for (const seen of keys) if (seen === key) count++;
  return count;
}

export { BLACK };
