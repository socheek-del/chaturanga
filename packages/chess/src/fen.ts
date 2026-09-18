/** Reading and writing chess FEN, in the form Fairy-Stockfish prints it. */
import { FenError, parseSquare, squareName } from '@chaturanga/rules-core';
import { inCheck } from './attacks';
import {
  BLACK,
  BLACK_KING_SIDE,
  BLACK_QUEEN_SIDE,
  type Board,
  type ColorIndex,
  codeFromFenChar,
  colorBits,
  fenChar,
  fileOf,
  KING,
  opposite,
  rankOf,
  ROOK,
  TYPE_MASK,
  WHITE_KING_SIDE,
  WHITE_QUEEN_SIDE,
} from './board';
import { epCaptureExists, type Position } from './movegen';

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export interface PositionData {
  board: Board;
  turn: ColorIndex;
  castling: number;
  ep: number;
  rule50: number;
  fullmove: number;
}

const CASTLING_BITS: Record<string, number> = {
  K: WHITE_KING_SIDE,
  Q: WHITE_QUEEN_SIDE,
  k: BLACK_KING_SIDE,
  q: BLACK_QUEEN_SIDE,
};

/** The placement field of a board, e.g. `rnbqkbnr/pppppppp/8/…`. */
export function placementOf(board: Board): string {
  const ranks: string[] = [];
  for (let rank = 7; rank >= 0; rank--) {
    let row = '';
    let empty = 0;
    for (let file = 0; file < 8; file++) {
      const code = board[rank * 8 + file]!;
      if (code === 0) {
        empty++;
        continue;
      }
      if (empty) {
        row += String(empty);
        empty = 0;
      }
      row += fenChar(code);
    }
    if (empty) row += String(empty);
    ranks.push(row);
  }
  return ranks.join('/');
}

/** The castling field, e.g. `KQkq` or `-`. */
export function castlingOf(castling: number): string {
  let out = '';
  if (castling & WHITE_KING_SIDE) out += 'K';
  if (castling & WHITE_QUEEN_SIDE) out += 'Q';
  if (castling & BLACK_KING_SIDE) out += 'k';
  if (castling & BLACK_QUEEN_SIDE) out += 'q';
  return out || '-';
}

export function serializeFen(data: PositionData): string {
  const ep = data.ep >= 0 ? squareName(data.ep) : '-';
  return `${placementOf(data.board)} ${data.turn === 0 ? 'w' : 'b'} ${castlingOf(data.castling)} ${ep} ${data.rule50} ${data.fullmove}`;
}

function parsePlacement(field: string, fen: string): Board {
  const rows = field.split('/');
  if (rows.length !== 8) throw new FenError(`expected 8 ranks, got ${rows.length}`, fen);
  const board: Board = new Uint8Array(64);
  for (let i = 0; i < 8; i++) {
    const rank = 7 - i;
    let file = 0;
    for (const char of rows[i]!) {
      if (char >= '1' && char <= '8') {
        file += Number(char);
        continue;
      }
      const code = codeFromFenChar(char);
      if (!code) throw new FenError(`unknown piece '${char}'`, fen);
      if (file > 7) throw new FenError(`rank ${rank + 1} is too long`, fen);
      board[rank * 8 + file] = code;
      file++;
    }
    if (file !== 8) throw new FenError(`rank ${rank + 1} describes ${file} squares, not 8`, fen);
  }
  return board;
}

/** Drops rights whose king or rook is not on its home square, the way Stockfish validates a FEN. */
function sanitizeCastling(board: Board, castling: number): number {
  let out = castling;
  for (const [right, king, rook] of [
    [WHITE_KING_SIDE, 4, 7],
    [WHITE_QUEEN_SIDE, 4, 0],
    [BLACK_KING_SIDE, 60, 63],
    [BLACK_QUEEN_SIDE, 60, 56],
  ] as const) {
    const color: ColorIndex = king === 4 ? 0 : 1;
    const kingOk = board[king] === (KING | colorBits(color));
    const rookOk = board[rook] === (ROOK | colorBits(color));
    if (!kingOk || !rookOk) out &= ~right;
  }
  return out;
}

export function parseFen(fen: string): PositionData {
  const fields = fen.trim().split(/\s+/);
  if (fields.length < 4 || fields.length > 6) throw new FenError(`expected 4 to 6 fields, got ${fields.length}`, fen);
  const [placement, side, castlingField, epField, rule50Field = '0', fullmoveField = '1'] = fields as [
    string,
    string,
    string,
    string,
    string?,
    string?,
  ];

  const board = parsePlacement(placement, fen);
  if (side !== 'w' && side !== 'b') throw new FenError(`side to move must be 'w' or 'b', got '${side}'`, fen);
  const turn: ColorIndex = side === 'b' ? 1 : 0;

  let castling = 0;
  if (castlingField !== '-') {
    for (const char of castlingField) {
      const bit = CASTLING_BITS[char];
      if (bit === undefined) throw new FenError(`unknown castling right '${char}'`, fen);
      if (castling & bit) throw new FenError(`castling right '${char}' is repeated`, fen);
      castling |= bit;
    }
  }
  castling = sanitizeCastling(board, castling);

  let ep = -1;
  if (epField !== '-') {
    ep = parseSquare(epField);
    if (ep < 0) throw new FenError(`'${epField}' is not a square`, fen);
    const expectedRank = turn === 0 ? 5 : 2;
    if (rankOf(ep) !== expectedRank) throw new FenError(`en passant square '${epField}' is on the wrong rank`, fen);
  }

  const rule50 = Number(rule50Field);
  const fullmove = Number(fullmoveField);
  if (!Number.isInteger(rule50) || rule50 < 0) throw new FenError(`halfmove clock '${rule50Field}' is not a count`, fen);
  if (!Number.isInteger(fullmove) || fullmove < 1) throw new FenError(`fullmove number '${fullmoveField}' is not a move number`, fen);

  for (const color of [0, 1] as const) {
    const kings = [...board].filter((code) => code === (KING | colorBits(color))).length;
    if (kings !== 1) throw new FenError(`${color === 0 ? 'White' : 'Black'} must have exactly one king, found ${kings}`, fen);
  }
  for (let sq = 0; sq < 64; sq++) {
    const code = board[sq]!;
    if (code && (code & TYPE_MASK) === 1 && (rankOf(sq) === 0 || rankOf(sq) === 7)) {
      throw new FenError(`a pawn cannot stand on ${squareName(sq)}`, fen);
    }
  }
  if (inCheck(board, opposite(turn))) throw new FenError('the side that is not to move is in check', fen);

  return { board, turn, castling, ep, rule50, fullmove };
}

/**
 * Keeps the en passant square only when the capture is really available, which is what Fairy-Stockfish
 * writes into a FEN (probed against ffish 0.7.10). Called once a position exists, because the test needs
 * move generation.
 */
export function normalizeEp(pos: Position): void {
  if (pos.ep >= 0 && !epCaptureExists(pos, pos.ep)) pos.ep = -1;
}

/** File and rank helpers re-exported so FEN callers do not reach into the board module. */
export { fileOf, rankOf, BLACK };
