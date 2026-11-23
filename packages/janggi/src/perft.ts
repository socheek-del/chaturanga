import type { ColorIndex } from '@chaturanga/rules-core';
import { generalsFace } from './attacks';
import { parseFen } from './fen';
import { generateLegalMoves, isPass, makeRaw, moveFrom, unmakeRaw } from './movegen';

interface Last {
  bikjang: boolean;
  pass: boolean;
}

function count(board: Uint8Array, side: ColorIndex, depth: number, last: Last | null, pass: boolean): number {
  const bikjang = generalsFace(board);
  // Facing generals or a pass twice in a row ended the game: no moves from here, as in ffish.
  if (last && ((bikjang && last.bikjang) || (pass && last.pass))) return 0;
  const moves = generateLegalMoves(board, side);
  if (depth === 1) return moves.length;
  const next: ColorIndex = side === 0 ? 1 : 0;
  let nodes = 0;
  for (const m of moves) {
    const moved = board[moveFrom(m)]!;
    const captured = makeRaw(board, m);
    nodes += count(board, next, depth - 1, { bikjang, pass }, isPass(m));
    unmakeRaw(board, m, moved, captured);
  }
  return nodes;
}

/** Number of leaf nodes of the legal move tree to `depth` plies (bikjang and double passes end a line). */
export function perft(fen: string, depth: number): number {
  if (depth <= 0) return 1;
  const { board, turn } = parseFen(fen);
  return count(board, turn, depth, null, false);
}
