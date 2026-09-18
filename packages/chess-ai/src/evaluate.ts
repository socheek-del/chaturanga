/**
 * Chess evaluation in centipawns: material, piece-square tables tapered between the opening and the
 * endgame, pawn structure, the bishop pair, rook placement and king safety. Pure and allocation-light, so
 * the search can call it in the hot loop.
 */
import {
  BISHOP,
  BISHOP_RAYS,
  BLACK,
  type Board,
  type ColorIndex,
  fileOf,
  KING,
  KNIGHT,
  PAWN,
  QUEEN,
  rankOf,
  ROOK,
  ROOK_RAYS,
  TYPE_MASK,
} from '@chaturanga/chess/core';

/** Base material, indexed by piece type: -, pawn, knight, bishop, rook, queen, king. */
export const PIECE_VALUE = [0, 100, 320, 330, 500, 900, 0] as const;

const BISHOP_PAIR = 30;
const DOUBLED_PAWN = -12;
const ISOLATED_PAWN = -14;
const PASSED_PAWN = [0, 5, 10, 20, 35, 60, 100, 0] as const;
const ROOK_OPEN_FILE = 18;
const ROOK_HALF_OPEN_FILE = 8;
const ROOK_ON_SEVENTH = 20;
const KING_SHIELD = 12;
const MOBILITY = 2;
/** Non-pawn material of both sides at the start, used to taper the king table. */
const OPENING_MATERIAL = 2 * (2 * PIECE_VALUE[KNIGHT] + 2 * PIECE_VALUE[BISHOP] + 2 * PIECE_VALUE[ROOK] + PIECE_VALUE[QUEEN]);

/** Piece-square tables from White's point of view, a1 first. */
const PAWN_TABLE = [
  0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, -20, -20, 10, 10, 5, 5, -5, -10, 0, 0, -10, -5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, 5, 10, 25, 25, 10, 5, 5,
  10, 10, 20, 30, 30, 20, 10, 10, 50, 50, 50, 50, 50, 50, 50, 50, 0, 0, 0, 0, 0, 0, 0, 0,
];
const KNIGHT_TABLE = [
  -50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 5, 5, 0, -20, -40, -30, 5, 10, 15, 15, 10, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30,
  -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 10, 15, 15, 10, 0, -30, -40, -20, 0, 0, 0, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50,
];
const BISHOP_TABLE = [
  -20, -10, -10, -10, -10, -10, -10, -20, -10, 5, 0, 0, 0, 0, 5, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10,
  5, 5, 10, 10, 5, 5, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 0, 0, 0, 0, 0, 0, -10, -20, -10, -10, -10, -10, -10, -10, -20,
];
const ROOK_TABLE = [
  0, 0, 5, 10, 10, 5, 0, 0, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0,
  0, 0, 0, 0, -5, 5, 10, 10, 10, 10, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0,
];
const QUEEN_TABLE = [
  -20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 5, 0, 0, 0, 0, -10, -10, 5, 5, 5, 5, 5, 0, -10, 0, 0, 5, 5, 5, 5, 0, -5, -5, 0, 5, 5, 5, 5,
  0, -5, -10, 0, 5, 5, 5, 5, 0, -10, -10, 0, 0, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20,
];
const KING_OPENING_TABLE = [
  20, 30, 10, 0, 0, 10, 30, 20, 20, 20, 0, 0, 0, 0, 20, 20, -10, -20, -20, -20, -20, -20, -20, -10, -20, -30, -30, -40, -40, -30, -30, -20,
  -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40,
  -50, -50, -40, -40, -30,
];
const KING_ENDGAME_TABLE = [
  -50, -30, -30, -30, -30, -30, -30, -50, -30, -30, 0, 0, 0, 0, -30, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -10, 30, 40, 40, 30, -10,
  -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -20, -10, 0, 0, -10, -20, -30, -50, -40, -30, -20, -20,
  -30, -40, -50,
];

const TABLES: Readonly<Record<number, readonly number[]>> = {
  [PAWN]: PAWN_TABLE,
  [KNIGHT]: KNIGHT_TABLE,
  [BISHOP]: BISHOP_TABLE,
  [ROOK]: ROOK_TABLE,
  [QUEEN]: QUEEN_TABLE,
};

/** The same square seen from Black's side of the board. */
const mirror = (sq: number): number => sq ^ 56;

/** Material of one side, without kings; used for the endgame taper and by the app's conversion mode. */
export function material(board: Board, color: ColorIndex): number {
  const bits = color === 1 ? BLACK : 0;
  let total = 0;
  for (let sq = 0; sq < 64; sq++) {
    const code = board[sq]!;
    if (code === 0 || (code & BLACK) !== bits) continue;
    total += PIECE_VALUE[code & TYPE_MASK]!;
  }
  return total;
}

/** How far ahead `color` is in material, in centipawns. */
export function materialBalance(board: Board, color: ColorIndex): number {
  return material(board, color) - material(board, color === 0 ? 1 : 0);
}

function slidingMobility(board: Board, sq: number, rays: readonly (readonly number[])[]): number {
  let squares = 0;
  for (const ray of rays) {
    for (const target of ray) {
      squares++;
      if (board[target] !== 0) break;
    }
  }
  return squares;
}

/** Scratch space reused by `evaluate`, so the search's hot loop allocates nothing. */
const pawnCount = [new Int32Array(8), new Int32Array(8)];
/** One bit per rank that holds a pawn of that colour on that file. */
const pawnRankMask = [new Int32Array(8), new Int32Array(8)];
const rookSquares = [new Int32Array(10), new Int32Array(10)];
const rookCount = [0, 0];
const sideScore = [0, 0];

/** Evaluation from the point of view of the side to move. */
export function evaluate(board: Board, turn: ColorIndex): number {
  sideScore[0] = 0;
  sideScore[1] = 0;
  pawnCount[0]!.fill(0);
  pawnCount[1]!.fill(0);
  pawnRankMask[0]!.fill(0);
  pawnRankMask[1]!.fill(0);
  rookCount[0] = 0;
  rookCount[1] = 0;
  let whiteBishops = 0;
  let blackBishops = 0;
  let whiteKing = -1;
  let blackKing = -1;
  let nonPawnMaterial = 0;

  for (let sq = 0; sq < 64; sq++) {
    const code = board[sq]!;
    if (code === 0) continue;
    const color = code & BLACK ? 1 : 0;
    const type = code & TYPE_MASK;
    sideScore[color]! += PIECE_VALUE[type]!;
    if (type !== PAWN && type !== KING) nonPawnMaterial += PIECE_VALUE[type]!;
    const view = color === 0 ? sq : mirror(sq);
    const table = TABLES[type];
    if (table) sideScore[color]! += table[view]!;

    switch (type) {
      case PAWN: {
        const file = fileOf(sq);
        pawnCount[color]![file]!++;
        pawnRankMask[color]![file]! |= 1 << rankOf(sq);
        break;
      }
      case BISHOP:
        if (color === 0) whiteBishops++;
        else blackBishops++;
        sideScore[color]! += MOBILITY * slidingMobility(board, sq, BISHOP_RAYS[sq]!);
        break;
      case ROOK: {
        sideScore[color]! += MOBILITY * slidingMobility(board, sq, ROOK_RAYS[sq]!);
        if (rankOf(sq) === (color === 0 ? 6 : 1)) sideScore[color]! += ROOK_ON_SEVENTH;
        if (rookCount[color]! < rookSquares[color]!.length) rookSquares[color]![rookCount[color]!++] = sq;
        break;
      }
      case KING:
        if (color === 0) whiteKing = sq;
        else blackKing = sq;
        break;
      default:
        break;
    }
  }

  if (whiteBishops >= 2) sideScore[0]! += BISHOP_PAIR;
  if (blackBishops >= 2) sideScore[1]! += BISHOP_PAIR;

  const phase = Math.min(1, nonPawnMaterial / OPENING_MATERIAL);
  for (const color of [0, 1] as const) {
    const them = color === 0 ? 1 : 0;
    const ours = pawnCount[color]!;
    const ourRanks = pawnRankMask[color]!;
    const theirRanks = pawnRankMask[them]!;

    for (let file = 0; file < 8; file++) {
      const count = ours[file]!;
      if (count === 0) continue;
      if (count > 1) sideScore[color]! += DOUBLED_PAWN * (count - 1);
      const left = file > 0 ? ours[file - 1]! : 0;
      const right = file < 7 ? ours[file + 1]! : 0;
      if (left === 0 && right === 0) sideScore[color]! += ISOLATED_PAWN;

      let mask = ourRanks[file]!;
      while (mask) {
        const rank = 31 - Math.clz32(mask & -mask);
        mask &= mask - 1;
        // Ahead of a White pawn is a higher rank, ahead of a Black pawn a lower one.
        const ahead = color === 0 ? (0xff << (rank + 1)) & 0xff : (1 << rank) - 1;
        const blockers =
          (theirRanks[file]! & ahead) |
          (file > 0 ? theirRanks[file - 1]! & ahead : 0) |
          (file < 7 ? theirRanks[file + 1]! & ahead : 0);
        if (blockers === 0) sideScore[color]! += PASSED_PAWN[color === 0 ? rank : 7 - rank]!;
      }
    }

    for (let i = 0; i < rookCount[color]!; i++) {
      const file = fileOf(rookSquares[color]![i]!);
      if (ours[file] === 0) sideScore[color]! += pawnCount[them]![file] === 0 ? ROOK_OPEN_FILE : ROOK_HALF_OPEN_FILE;
    }

    const king = color === 0 ? whiteKing : blackKing;
    if (king >= 0) {
      // Taper the king's table: castled and covered in the opening, active in the endgame.
      const view = color === 0 ? king : mirror(king);
      sideScore[color]! += Math.round(phase * KING_OPENING_TABLE[view]! + (1 - phase) * KING_ENDGAME_TABLE[view]!);
      if (phase > 0.4) {
        const shieldRank = rankOf(king) + (color === 0 ? 1 : -1);
        if (shieldRank >= 0 && shieldRank < 8) {
          const first = Math.max(0, fileOf(king) - 1);
          const last = Math.min(7, fileOf(king) + 1);
          for (let file = first; file <= last; file++) {
            const code = board[shieldRank * 8 + file]!;
            if (code !== 0 && (code & TYPE_MASK) === PAWN && (code & BLACK ? 1 : 0) === color) sideScore[color]! += KING_SHIELD;
          }
        }
      }
    }
  }

  return sideScore[turn]! - sideScore[turn === 0 ? 1 : 0]!;
}
