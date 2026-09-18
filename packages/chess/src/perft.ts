/** Move-generation node counts, the standard way to prove a chess move generator. */
import { generateMoves, isLegal, makeRaw, type Position, unmakeRaw } from './movegen';

export function perft(pos: Position, depth: number): number {
  if (depth === 0) return 1;
  const moves = generateMoves(pos);
  if (depth === 1) return moves.filter((m) => isLegal(pos, m)).length;
  let nodes = 0;
  for (const m of moves) {
    if (!isLegal(pos, m)) continue;
    const undo = makeRaw(pos, m);
    nodes += perft(pos, depth - 1);
    unmakeRaw(pos, m, undo);
  }
  return nodes;
}
