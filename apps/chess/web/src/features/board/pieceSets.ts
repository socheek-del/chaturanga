import type { PieceType } from '@chaturanga/chess';
import bishopBlack from './pieces/traditional/bishop-black.svg';
import bishopWhite from './pieces/traditional/bishop-white.svg';
import kingBlack from './pieces/traditional/king-black.svg';
import kingWhite from './pieces/traditional/king-white.svg';
import knightBlack from './pieces/traditional/knight-black.svg';
import knightWhite from './pieces/traditional/knight-white.svg';
import pawnBlack from './pieces/traditional/pawn-black.svg';
import pawnWhite from './pieces/traditional/pawn-white.svg';
import queenBlack from './pieces/traditional/queen-black.svg';
import queenWhite from './pieces/traditional/queen-white.svg';
import rookBlack from './pieces/traditional/rook-black.svg';
import rookWhite from './pieces/traditional/rook-white.svg';

/**
 * The two ways this site can draw a piece (ch-012).
 *
 * `traditional` is the Staunton set Wikipedia's chess articles use, by Cburnett — the shape most players
 * picture when they think of a chess piece, and the default. `marble` is the set drawn for this site
 * (`PieceSvg.tsx`), which matches the board's own palette. The traditional files are stored verbatim with
 * their licence in `pieces/traditional/CREDITS.md`.
 */
export type PieceSetId = 'traditional' | 'marble';

export const PIECE_SETS: readonly PieceSetId[] = ['traditional', 'marble'];

export const DEFAULT_PIECE_SET: PieceSetId = 'traditional';

/** The traditional drawing of each piece, by colour. */
export const TRADITIONAL_PIECES: Readonly<Record<'w' | 'b', Readonly<Record<PieceType, string>>>> = {
  w: { k: kingWhite, q: queenWhite, r: rookWhite, b: bishopWhite, n: knightWhite, p: pawnWhite },
  b: { k: kingBlack, q: queenBlack, r: rookBlack, b: bishopBlack, n: knightBlack, p: pawnBlack },
};

export function isPieceSet(value: unknown): value is PieceSetId {
  return PIECE_SETS.includes(value as PieceSetId);
}
