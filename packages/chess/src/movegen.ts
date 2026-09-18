/**
 * Move generation, make and unmake on a mutable position.
 *
 * A move is a single integer so search code never allocates: from (bits 0-5), to (bits 6-11) and the
 * promotion piece type (bits 12-14, 0 when the move does not promote). `makeRaw` returns an integer that
 * `unmakeRaw` needs to put the position back, holding the captured piece and the square it stood on (an en
 * passant capture takes a pawn that is not on the destination square), the castling rights and the en
 * passant square.
 */
import type { Square } from '@chaturanga/rules-core';
import { findKing, isAttacked } from './attacks';
import {
  BISHOP,
  BISHOP_RAYS,
  BLACK,
  BLACK_KING_SIDE,
  BLACK_QUEEN_SIDE,
  type Board,
  type ColorIndex,
  colorBits,
  colorIndexOf,
  fileOf,
  forward,
  KING,
  KING_TARGETS,
  KNIGHT,
  KNIGHT_TARGETS,
  opposite,
  PAWN,
  PAWN_CAPTURES,
  pawnStartRank,
  promotionRank,
  PROMOTION_TYPES,
  QUEEN,
  rankOf,
  ROOK,
  ROOK_RAYS,
  TYPE_MASK,
  WHITE_KING_SIDE,
  WHITE_QUEEN_SIDE,
} from './board';

export interface Position {
  board: Board;
  turn: ColorIndex;
  /** Castling rights as WHITE_KING_SIDE | … bits. */
  castling: number;
  /** The square a pawn may be captured on in passing, or -1. */
  ep: Square;
}

export const encodeMove = (from: Square, to: Square, promotion = 0): number => from | (to << 6) | (promotion << 12);
export const moveFrom = (m: number): Square => m & 63;
export const moveTo = (m: number): Square => (m >> 6) & 63;
/** The piece type this move promotes to, or 0. */
export const movePromotion = (m: number): number => (m >> 12) & 7;
/** The piece code that makes this move, read from the position it is made in. */
export const movedCode = (pos: Position, m: number): number => pos.board[moveFrom(m)]!;

/** Rights a move from or to this square takes away. */
function rightsLostAt(sq: Square): number {
  switch (sq) {
    case 0:
      return WHITE_QUEEN_SIDE;
    case 7:
      return WHITE_KING_SIDE;
    case 4:
      return WHITE_KING_SIDE | WHITE_QUEEN_SIDE;
    case 56:
      return BLACK_QUEEN_SIDE;
    case 63:
      return BLACK_KING_SIDE;
    case 60:
      return BLACK_KING_SIDE | BLACK_QUEEN_SIDE;
    default:
      return 0;
  }
}

/** True when the move is a king stepping two files, i.e. castling. */
export function isCastling(pos: Position, m: number): boolean {
  const moved = pos.board[moveFrom(m)]!;
  return (moved & TYPE_MASK) === KING && Math.abs(fileOf(moveTo(m)) - fileOf(moveFrom(m))) === 2;
}

/** True when the move is a pawn capturing in passing. */
export function isEnPassant(pos: Position, m: number): boolean {
  const moved = pos.board[moveFrom(m)]!;
  const to = moveTo(m);
  return (moved & TYPE_MASK) === PAWN && to === pos.ep && pos.board[to] === 0 && fileOf(to) !== fileOf(moveFrom(m));
}

const packUndo = (captured: number, capturedSquare: number, castling: number, ep: Square): number =>
  captured | (capturedSquare << 4) | (castling << 10) | ((ep + 1) << 14);

const undoCaptured = (u: number): number => u & 15;
const undoCapturedSquare = (u: number): Square => (u >> 4) & 63;
const undoCastling = (u: number): number => (u >> 10) & 15;
const undoEp = (u: number): Square => ((u >> 14) & 127) - 1;

/** The captured piece of an undo token, for callers that need to know whether a move captured. */
export const capturedOf = (undo: number): number => undoCaptured(undo);

/**
 * Plays `m` without checking that it is legal, and returns the token `unmakeRaw` needs.
 * The caller keeps the halfmove and fullmove counters.
 */
export function makeRaw(pos: Position, m: number): number {
  const from = moveFrom(m);
  const to = moveTo(m);
  const board = pos.board;
  const moved = board[from]!;
  const us = colorIndexOf(moved);
  const type = moved & TYPE_MASK;
  const prevCastling = pos.castling;
  const prevEp = pos.ep;

  let captured = board[to]!;
  let capturedSquare = to;
  if (type === PAWN && to === prevEp && captured === 0 && fileOf(to) !== fileOf(from)) {
    capturedSquare = to - forward(us);
    captured = board[capturedSquare]!;
    board[capturedSquare] = 0;
  }

  board[from] = 0;
  const promotion = movePromotion(m);
  board[to] = promotion ? promotion | colorBits(us) : moved;

  if (type === KING && Math.abs(fileOf(to) - fileOf(from)) === 2) {
    // The rook jumps over the king: h-file rook to f-file, or a-file rook to d-file.
    const kingSide = fileOf(to) > fileOf(from);
    const rookFrom = kingSide ? to + 1 : to - 2;
    const rookTo = kingSide ? to - 1 : to + 1;
    board[rookTo] = board[rookFrom]!;
    board[rookFrom] = 0;
  }

  pos.castling &= ~(rightsLostAt(from) | rightsLostAt(to));
  pos.turn = opposite(us);
  pos.ep = -1;
  if (type === PAWN && Math.abs(rankOf(to) - rankOf(from)) === 2) {
    const square = from + forward(us);
    // Fairy-Stockfish writes the en passant square only when the capture is actually available, so this
    // engine records it only then too (probed against ffish 0.7.10).
    if (epCaptureExists(pos, square)) pos.ep = square;
  }

  return packUndo(captured, capturedSquare, prevCastling, prevEp);
}

/** Puts back what `makeRaw(pos, m)` changed. */
export function unmakeRaw(pos: Position, m: number, undo: number): void {
  const from = moveFrom(m);
  const to = moveTo(m);
  const board = pos.board;
  const moved = board[to]!;
  const us = colorIndexOf(moved);
  const promotion = movePromotion(m);

  board[from] = promotion ? PAWN | colorBits(us) : moved;
  board[to] = 0;
  const captured = undoCaptured(undo);
  if (captured) board[undoCapturedSquare(undo)] = captured;

  if ((moved & TYPE_MASK) === KING && Math.abs(fileOf(to) - fileOf(from)) === 2) {
    const kingSide = fileOf(to) > fileOf(from);
    const rookFrom = kingSide ? to + 1 : to - 2;
    const rookTo = kingSide ? to - 1 : to + 1;
    board[rookFrom] = board[rookTo]!;
    board[rookTo] = 0;
  }

  pos.castling = undoCastling(undo);
  pos.ep = undoEp(undo);
  pos.turn = us;
}

/**
 * True when a pawn of the side to move stands where it could capture in passing onto `square`. The test is
 * pseudo-legal on purpose: Fairy-Stockfish writes the en passant square into a FEN whenever an enemy pawn
 * attacks it, even when the capture would leave that side's own king in check (probed against ffish
 * 0.7.10), and the legal-move generator drops the illegal capture anyway.
 */
export function epCaptureExists(pos: Position, square: Square): boolean {
  const pawn = PAWN | colorBits(pos.turn);
  for (const from of PAWN_CAPTURES[opposite(pos.turn)][square]!) {
    if (pos.board[from] === pawn) return true;
  }
  return false;
}

function inCheckAfter(pos: Position, mover: ColorIndex): boolean {
  const king = findKing(pos.board, mover);
  return king >= 0 && isAttacked(pos.board, king, opposite(mover));
}

function pushPawnMove(out: number[], from: Square, to: Square, us: ColorIndex): void {
  if (rankOf(to) === promotionRank(us)) {
    for (const type of PROMOTION_TYPES) out.push(encodeMove(from, to, type));
  } else {
    out.push(encodeMove(from, to));
  }
}

/** Pseudo-legal moves of the piece on `from`: legal but for leaving one's own king in check. */
export function generatePieceMoves(pos: Position, from: Square, out: number[] = []): number[] {
  const board = pos.board;
  const piece = board[from]!;
  if (piece === 0) return out;
  const us = colorIndexOf(piece);
  if (us !== pos.turn) return out;
  const bits = colorBits(us);
  const type = piece & TYPE_MASK;

  const canLandOn = (sq: Square): boolean => {
    const p = board[sq]!;
    return p === 0 || (p & BLACK) !== bits;
  };

  if (type === PAWN) {
    const step = forward(us);
    const one = from + step;
    if (one >= 0 && one < 64 && board[one] === 0) {
      pushPawnMove(out, from, one, us);
      const two = one + step;
      if (rankOf(from) === pawnStartRank(us) && board[two] === 0) out.push(encodeMove(from, two));
    }
    for (const to of PAWN_CAPTURES[us][from]!) {
      const target = board[to]!;
      if (target !== 0 && (target & BLACK) !== bits) pushPawnMove(out, from, to, us);
      else if (target === 0 && to === pos.ep) out.push(encodeMove(from, to));
    }
    return out;
  }

  if (type === KNIGHT) {
    for (const to of KNIGHT_TARGETS[from]!) if (canLandOn(to)) out.push(encodeMove(from, to));
    return out;
  }

  if (type === KING) {
    for (const to of KING_TARGETS[from]!) if (canLandOn(to)) out.push(encodeMove(from, to));
    generateCastling(pos, from, us, out);
    return out;
  }

  const rays = type === BISHOP ? BISHOP_RAYS[from]! : type === ROOK ? ROOK_RAYS[from]! : [...ROOK_RAYS[from]!, ...BISHOP_RAYS[from]!];
  for (const ray of rays) {
    for (const to of ray) {
      const target = board[to]!;
      if (target === 0) {
        out.push(encodeMove(from, to));
        continue;
      }
      if ((target & BLACK) !== bits) out.push(encodeMove(from, to));
      break;
    }
  }
  return out;
}

function generateCastling(pos: Position, king: Square, us: ColorIndex, out: number[]): void {
  const board = pos.board;
  const them = opposite(us);
  const home = us === 0 ? 4 : 60;
  if (king !== home) return;
  if (isAttacked(board, home, them)) return;
  const rook = ROOK | colorBits(us);

  const kingSideRight = us === 0 ? WHITE_KING_SIDE : BLACK_KING_SIDE;
  if (pos.castling & kingSideRight && board[home + 3] === rook) {
    if (board[home + 1] === 0 && board[home + 2] === 0 && !isAttacked(board, home + 1, them)) {
      out.push(encodeMove(home, home + 2));
    }
  }
  const queenSideRight = us === 0 ? WHITE_QUEEN_SIDE : BLACK_QUEEN_SIDE;
  if (pos.castling & queenSideRight && board[home - 4] === rook) {
    if (board[home - 1] === 0 && board[home - 2] === 0 && board[home - 3] === 0 && !isAttacked(board, home - 1, them)) {
      out.push(encodeMove(home, home - 2));
    }
  }
}

/** Every pseudo-legal move of the side to move. */
export function generateMoves(pos: Position, out: number[] = []): number[] {
  const bits = colorBits(pos.turn);
  for (let sq = 0; sq < 64; sq++) {
    const p = pos.board[sq]!;
    if (p !== 0 && (p & BLACK) === bits) generatePieceMoves(pos, sq, out);
  }
  return out;
}

/** True when `m` leaves the mover's own king safe. */
export function isLegal(pos: Position, m: number): boolean {
  const mover = pos.turn;
  const undo = makeRaw(pos, m);
  const legal = !inCheckAfter(pos, mover);
  unmakeRaw(pos, m, undo);
  return legal;
}

/** Every legal move of the side to move. */
export function generateLegalMoves(pos: Position): number[] {
  return generateMoves(pos).filter((m) => isLegal(pos, m));
}

/** A legal move exists; cheaper than generating them all. */
export function hasLegalMove(pos: Position): boolean {
  return generateMoves(pos).some((m) => isLegal(pos, m));
}

/** Moves worth searching in quiescence: captures (including in passing) and promotions. */
export function isTactical(pos: Position, m: number): boolean {
  return pos.board[moveTo(m)] !== 0 || movePromotion(m) !== 0 || isEnPassant(pos, m);
}

/** The queen is the strongest slider; used by search code that needs the piece's own value. */
export const isSlider = (type: number): boolean => type === BISHOP || type === ROOK || type === QUEEN;
