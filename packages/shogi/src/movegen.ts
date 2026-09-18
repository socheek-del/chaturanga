/**
 * Shogi move generation.
 *
 * A move is one integer: `from | to << 7 | flags`. A drop keeps the dropped piece type in the `from`
 * bits. Flags are `PROMO_FLAG` (the move promotes) and `DROP_FLAG`.
 */
import {
  BISHOP,
  BISHOP_RAYS,
  BLACK,
  type Board,
  canPromote,
  type ColorIndex,
  colorBits,
  fileOf,
  FILES,
  HAND_ORDER,
  type Hands,
  inPromotionZone,
  LANCE,
  LANCE_RAYS,
  mustPromote,
  opposite,
  PAWN,
  PROMOTED,
  RANKS,
  rankOf,
  ROOK,
  ROOK_RAYS,
  SIZE,
  stepTargets,
  typeOf,
  TYPE_MASK,
} from './board';
import { inCheck } from './attacks';
import type { Square } from './types';

const TO_SHIFT = 7;
const SQUARE_MASK = (1 << TO_SHIFT) - 1;

export const PROMO_FLAG = 1 << 14;
export const DROP_FLAG = 1 << 15;

export const encodeMove = (from: Square, to: Square, flags = 0): number => from | (to << TO_SHIFT) | flags;
export const encodeDrop = (type: number, to: Square): number => type | (to << TO_SHIFT) | DROP_FLAG;
export const moveFrom = (m: number): Square => m & SQUARE_MASK;
export const moveTo = (m: number): Square => (m >> TO_SHIFT) & SQUARE_MASK;
export const isDrop = (m: number): boolean => (m & DROP_FLAG) !== 0;
export const isPromotion = (m: number): boolean => (m & PROMO_FLAG) !== 0;
/** Piece type placed by a drop. */
export const dropType = (m: number): number => m & SQUARE_MASK;

export interface Position {
  board: Board;
  hands: Hands;
  turn: ColorIndex;
}

const isOwn = (code: number, bits: number): boolean => code !== 0 && (code & BLACK) === bits;

/** Adds a board move, as both the plain and the promoting version when the rules allow a choice. */
function pushMove(from: Square, to: Square, code: number, c: ColorIndex, out: number[]): void {
  const type = typeOf(code);
  const promotable =
    (code & PROMOTED) === 0 && canPromote(type) && (inPromotionZone(from, c) || inPromotionZone(to, c));
  if (promotable) {
    if (mustPromote(type, c, rankOf(to))) {
      out.push(encodeMove(from, to, PROMO_FLAG));
      return;
    }
    out.push(encodeMove(from, to));
    out.push(encodeMove(from, to, PROMO_FLAG));
    return;
  }
  out.push(encodeMove(from, to));
}

function pushRay(
  board: Board,
  from: Square,
  ray: readonly Square[],
  code: number,
  c: ColorIndex,
  out: number[],
): void {
  const bits = colorBits(c);
  for (const to of ray) {
    const q = board[to]!;
    if (q === 0) {
      pushMove(from, to, code, c, out);
      continue;
    }
    if (!isOwn(q, bits)) pushMove(from, to, code, c, out);
    break;
  }
}

/** Pseudo-legal moves of every piece colour `c` has on the board (self-check is not considered). */
export function generatePieceMoves(board: Board, c: ColorIndex, out: number[] = []): number[] {
  const bits = colorBits(c);
  for (let from = 0; from < SIZE; from++) {
    const code = board[from]!;
    if (!isOwn(code, bits)) continue;
    for (const to of stepTargets(code, from)) {
      if (!isOwn(board[to]!, bits)) pushMove(from, to, code, c, out);
    }
    const type = typeOf(code);
    const promoted = (code & PROMOTED) !== 0;
    if (type === LANCE && !promoted) pushRay(board, from, LANCE_RAYS[c][from]!, code, c, out);
    if (type === ROOK) for (const ray of ROOK_RAYS[from]!) pushRay(board, from, ray, code, c, out);
    if (type === BISHOP) for (const ray of BISHOP_RAYS[from]!) pushRay(board, from, ray, code, c, out);
  }
  return out;
}

/** True when colour `c` already has an unpromoted pawn on this file (nifu: a second one may not be dropped). */
function fileHasPawn(board: Board, file: number, c: ColorIndex): boolean {
  const code = PAWN | colorBits(c);
  for (let rank = 0; rank < RANKS; rank++) if (board[rank * FILES + file] === code) return true;
  return false;
}

/**
 * Pseudo-legal drops: an empty square, never one where the piece could never move again, and never a
 * second unpromoted pawn on a file (nifu). Whether a pawn drop mates — uchifuzume — is decided in
 * `isLegal`, because it needs the opponent's replies.
 */
export function generateDrops(pos: Position, out: number[] = []): number[] {
  const c = pos.turn;
  const hand = pos.hands[c];
  for (const type of HAND_ORDER) {
    if (!hand[type]) continue;
    for (let sq = 0; sq < SIZE; sq++) {
      if (pos.board[sq] !== 0) continue;
      if (mustPromote(type, c, rankOf(sq))) continue;
      if (type === PAWN && fileHasPawn(pos.board, fileOf(sq), c)) continue;
      out.push(encodeDrop(type, sq));
    }
  }
  return out;
}

/** Applies a move for the side to move, flips the turn, and returns the captured code (0 if none). */
export function makeRaw(pos: Position, m: number): number {
  const c = pos.turn;
  const to = moveTo(m);
  if (isDrop(m)) {
    const type = dropType(m);
    pos.board[to] = type | colorBits(c);
    pos.hands[c][type] = pos.hands[c][type]! - 1;
    pos.turn = opposite(c);
    return 0;
  }
  const from = moveFrom(m);
  const moved = pos.board[from]!;
  const captured = pos.board[to]!;
  pos.board[from] = 0;
  pos.board[to] = isPromotion(m) ? moved | PROMOTED : moved;
  if (captured) pos.hands[c][captured & TYPE_MASK] = pos.hands[c][captured & TYPE_MASK]! + 1;
  pos.turn = opposite(c);
  return captured;
}

export function unmakeRaw(pos: Position, m: number, moved: number, captured: number): void {
  const c = opposite(pos.turn);
  pos.turn = c;
  const to = moveTo(m);
  if (isDrop(m)) {
    pos.board[to] = 0;
    pos.hands[c][dropType(m)] = pos.hands[c][dropType(m)]! + 1;
    return;
  }
  pos.board[moveFrom(m)] = moved;
  pos.board[to] = captured;
  if (captured) pos.hands[c][captured & TYPE_MASK] = pos.hands[c][captured & TYPE_MASK]! - 1;
}

/** The piece code a move starts from: the piece on the board, or the piece that a drop places. */
export function movedCode(pos: Position, m: number): number {
  return isDrop(m) ? dropType(m) | colorBits(pos.turn) : pos.board[moveFrom(m)]!;
}

function hasAnyLegalMove(pos: Position, enforceUchifuzume: boolean): boolean {
  const c = pos.turn;
  const moves = generatePieceMoves(pos.board, c);
  generateDrops(pos, moves);
  for (const m of moves) if (isLegal(pos, m, enforceUchifuzume)) return true;
  return false;
}

/**
 * True when a move is legal: it must not leave its own king attacked, and — unless `enforceUchifuzume`
 * is switched off — a pawn drop must not deliver checkmate (打ち歩詰め).
 *
 * Fairy-Stockfish's `shogi` variant does **not** implement uchifuzume, so `enforceUchifuzume = false`
 * reproduces the reference engine exactly and the tests use it to compare move lists. See RULES.md.
 *
 * The nested "can the opponent reply?" test does not itself re-apply the pawn-drop rule, so a reply that
 * is only illegal because it is itself an uchifuzume still counts as a reply.
 */
export function isLegal(pos: Position, m: number, enforceUchifuzume = true): boolean {
  const c = pos.turn;
  const moved = movedCode(pos, m);
  const captured = makeRaw(pos, m);
  let legal = !inCheck(pos.board, c);
  if (legal && enforceUchifuzume && isDrop(m) && dropType(m) === PAWN && inCheck(pos.board, pos.turn)) {
    legal = hasAnyLegalMove(pos, false);
  }
  unmakeRaw(pos, m, moved, captured);
  return legal;
}

export function generateLegalMoves(pos: Position, enforceUchifuzume = true): number[] {
  const moves = generatePieceMoves(pos.board, pos.turn);
  generateDrops(pos, moves);
  return moves.filter((m) => isLegal(pos, m, enforceUchifuzume));
}

/** The pawn drops that only the uchifuzume rule forbids: legal but for delivering checkmate. */
export function uchifuzumeDrops(pos: Position): number[] {
  const out: number[] = [];
  for (const m of generateDrops(pos)) {
    if (dropType(m) !== PAWN) continue;
    if (isLegal(pos, m, false) && !isLegal(pos, m, true)) out.push(m);
  }
  return out;
}
