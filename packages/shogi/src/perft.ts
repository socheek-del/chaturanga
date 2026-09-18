import { emptyHands, type Hands } from './board';
import { parseFen } from './fen';
import { generateLegalMoves, makeRaw, movedCode, type Position, unmakeRaw } from './movegen';

function count(pos: Position, depth: number, enforceUchifuzume: boolean): number {
  const moves = generateLegalMoves(pos, enforceUchifuzume);
  if (depth === 1) return moves.length;
  let nodes = 0;
  for (const m of moves) {
    const moved = movedCode(pos, m);
    const captured = makeRaw(pos, m);
    nodes += count(pos, depth - 1, enforceUchifuzume);
    unmakeRaw(pos, m, moved, captured);
  }
  return nodes;
}

/**
 * Number of leaf nodes of the legal move tree to `depth` plies (no game-end adjudication).
 * `enforceUchifuzume = false` reproduces Fairy-Stockfish, which does not implement that rule (RULES.md).
 */
export function perft(fen: string, depth: number, enforceUchifuzume = true): number {
  if (depth <= 0) return 1;
  const data = parseFen(fen);
  const hands: Hands = data.hands ?? emptyHands();
  return count({ board: data.board, hands, turn: data.turn }, depth, enforceUchifuzume);
}
