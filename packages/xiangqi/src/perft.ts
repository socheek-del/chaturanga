import type { ColorIndex } from '@chaturanga/rules-core';
import { parseFen } from './fen';
import { generateLegalMoves, makeRaw, moveFrom, unmakeRaw } from './movegen';

function count(board: Uint8Array, side: ColorIndex, depth: number): number {
  const moves = generateLegalMoves(board, side);
  if (depth === 1) return moves.length;
  const next: ColorIndex = side === 0 ? 1 : 0;
  let nodes = 0;
  for (const m of moves) {
    const moved = board[moveFrom(m)]!;
    const captured = makeRaw(board, m);
    nodes += count(board, next, depth - 1);
    unmakeRaw(board, m, moved, captured);
  }
  return nodes;
}

/** Number of leaf nodes of the legal move tree to `depth` plies (no game-end adjudication). */
export function perft(fen: string, depth: number): number {
  if (depth <= 0) return 1;
  const { board, turn } = parseFen(fen);
  return count(board, turn, depth);
}
