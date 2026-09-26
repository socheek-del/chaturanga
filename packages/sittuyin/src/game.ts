import {
  BLACK,
  type Board,
  type ColorIndex,
  collectAttacked,
  colorBits,
  FERZ,
  fileOf,
  IllegalMoveError,
  inCheck,
  isAttacked,
  KING,
  KNIGHT,
  parseSquare,
  PAWN,
  rankOf,
  ROOK,
  SILVER,
  squareName,
  toColor,
  toColorIndex,
  TYPE_MASK,
} from '@chaturanga/rules-core';
import { codeToPiece, HAND_ORDER, handCount, typeFromChar } from './board';
import { handsOf, parseFen, placementOf, serializeFen, START_FEN } from './fen';
import {
  dropType,
  encodeDrop,
  encodeMove,
  generateLegalMoves,
  isDrop,
  isPromotion,
  makeRaw,
  moveFrom,
  moveTo,
  type Position,
  PROMOTION_FLAG,
  unmakeRaw,
} from './movegen';
import type { Color, CountingState, GameStatus, Move, MoveRecord, Piece, PieceType, Square } from './types';

export { IllegalMoveError };

interface HistoryEntry {
  move: number;
  moved: number;
  captured: number;
  rule50: number;
  countingLimit: number;
  countingPly: number;
  fullmove: number;
  record: MoveRecord;
}

const SAN_LETTER = ['', '', 'N', 'S', 'F', 'R', 'K'];
const UCI = /^(?:([KSFRN])@([a-h][1-8])|([a-h][1-8])([a-h][1-8])(f?))$/;
/** Fairy-Stockfish sittuyin nMoveRule: 50 moves without a capture, Ne move or placement. */
const FIFTY_MOVE_PLIES = 100;

function pieceCount(board: Board, c: ColorIndex): number {
  let n = 0;
  for (const p of board) if (p && (p & BLACK ? 1 : 0) === c) n++;
  return n;
}

/**
 * Counting limit in full moves for `side` (Fairy-Stockfish ASEAN counting): only when no Ne is left
 * and `side` has a lone Min-gyi — 16 if the opponent has a Yahhta, else 44 with a Sin, else 64 with a
 * Myin; otherwise no count.
 */
function countLimit(board: Board, side: ColorIndex): number {
  let rook = false;
  let sin = false;
  let knight = false;
  for (const p of board) {
    if (!p) continue;
    const type = p & TYPE_MASK;
    if (type === PAWN) return 0;
    if ((p & BLACK ? 1 : 0) === side) continue;
    if (type === ROOK) rook = true;
    else if (type === SILVER) sin = true;
    else if (type === KNIGHT) knight = true;
  }
  if (pieceCount(board, side) !== 1) return 0;
  return rook ? 16 : sin ? 44 : knight ? 64 : 0;
}

/**
 * Mirrors Fairy-Stockfish `has_insufficient_material` (the same rule as Makruk): a Yahhta or Sin can
 * mate, a Sit-ke is colour-bound, a Myin or Ne needs a helper piece. Pieces in hand can still be placed.
 */
function hasInsufficientMaterial(pos: Position, c: ColorIndex): boolean {
  if (handCount(pos.hands[c]) > 0) return false;
  const own = colorBits(c);
  let ownFerz = false;
  let ownUnbound = false;
  let ferzDark = false;
  let ferzLight = false;
  let unbound = 0;
  let nonKing = 0;
  for (let sq = 0; sq < 64; sq++) {
    const p = pos.board[sq]!;
    if (!p) continue;
    const type = p & TYPE_MASK;
    if (type === KING) continue;
    nonKing++;
    const mine = (p & BLACK) === own;
    if (mine && (type === ROOK || type === SILVER)) return false;
    if (type === FERZ) {
      if ((fileOf(sq) + rankOf(sq)) % 2 === 0) ferzDark = true;
      else ferzLight = true;
      if (mine) ownFerz = true;
    } else {
      unbound++;
      if (mine) ownUnbound = true;
    }
  }
  if (ownFerz && ((ferzDark && ferzLight) || unbound > 0)) return false;
  if (ownUnbound && nonKing >= 2) return false;
  return true;
}

export class Game {
  private readonly pos: Position;
  private countingLimit: number;
  private countingPly: number;
  private rule50: number;
  private fullmove: number;
  private readonly history: HistoryEntry[] = [];
  private readonly keys: string[] = [];

  constructor(fen: string = START_FEN) {
    const data = parseFen(fen);
    this.pos = { board: data.board, hands: data.hands, turn: data.turn };
    this.countingLimit = data.countingLimit;
    this.countingPly = data.countingPly;
    this.rule50 = data.rule50;
    this.fullmove = data.fullmove;
    this.keys.push(this.key());
  }

  get turn(): Color {
    return toColor(this.pos.turn);
  }

  fen(): string {
    return serializeFen({
      ...this.pos,
      countingLimit: this.countingLimit,
      countingPly: this.countingPly,
      rule50: this.rule50,
      fullmove: this.fullmove,
    });
  }

  pieceAt(square: Square): Piece | null {
    const p = this.pos.board[square];
    return p ? codeToPiece(p) : null;
  }

  pieces(): Array<{ square: Square; piece: Piece }> {
    const out: Array<{ square: Square; piece: Piece }> = [];
    this.pos.board.forEach((p, square) => {
      if (p) out.push({ square, piece: codeToPiece(p) });
    });
    return out;
  }

  /** Pieces a side still has to place, in Fairy-Stockfish order, e.g. ['k', 's', 's', 'f', 'r', 'r', 'n', 'n']. */
  hand(color: Color): PieceType[] {
    const hand = this.pos.hands[color === 'b' ? 1 : 0];
    return HAND_ORDER.flatMap((type) => Array<PieceType>(hand[type]!).fill(codeToPiece(type).type));
  }

  /** True until both sides have placed every piece from hand. */
  inSetup(): boolean {
    return handCount(this.pos.hands[0]) + handCount(this.pos.hands[1]) > 0;
  }

  legalMoves(): Move[] {
    return generateLegalMoves(this.pos).map(toMove);
  }

  /** Legal moves in coordinate notation (`K@h3`, `e3e4`, `h5g4f`). */
  legalUci(): string[] {
    return generateLegalMoves(this.pos).map(encodedToUci);
  }

  legalMovesFrom(square: Square): Move[] {
    return this.legalMoves().filter((m) => m.kind === 'move' && m.from === square);
  }

  inCheck(): boolean {
    return inCheck(this.pos.board, this.pos.turn);
  }

  /** Square of the side-to-move's Min-gyi if it is in check, otherwise null. */
  checkedKingSquare(): Square | null {
    if (!this.inCheck()) return null;
    return this.pos.board.findIndex((p) => p === (KING | colorBits(this.pos.turn)));
  }

  attackedSquares(color: Color): Square[] {
    return collectAttacked(64, (sq) => isAttacked(this.pos.board, sq, toColorIndex(color)));
  }

  moves(): MoveRecord[] {
    return this.history.map((h) => h.record);
  }

  lastMove(): MoveRecord | null {
    return this.history.at(-1)?.record ?? null;
  }

  /** Accepts a Move or coordinate notation (`K@h3`, `e3e4`, `h5g4f`). */
  move(input: Move | string): MoveRecord {
    const legal = generateLegalMoves(this.pos);
    const encoded = resolve(input, legal);
    if (encoded === undefined) throw new IllegalMoveError(typeof input === 'string' ? input : moveToUci(input));

    const mover = this.pos.turn;
    const moved = isDrop(encoded) ? dropType(encoded) | colorBits(mover) : this.pos.board[moveFrom(encoded)]!;
    const sanBase = this.sanBase(encoded, legal, moved);
    const entry: Omit<HistoryEntry, 'record' | 'captured'> = {
      move: encoded,
      moved,
      rule50: this.rule50,
      countingLimit: this.countingLimit,
      countingPly: this.countingPly,
      fullmove: this.fullmove,
    };

    this.rule50++;
    if (this.countingLimit) this.countingPly++;
    const captured = makeRaw(this.pos, encoded, mover);
    if (captured || isDrop(encoded) || (moved & TYPE_MASK) === PAWN) this.rule50 = 0;
    if (mover === 1) this.fullmove++;
    this.pos.turn = mover === 0 ? 1 : 0;
    this.applyCounting(captured, isPromotion(encoded));
    this.keys.push(this.key());

    const replies = generateLegalMoves(this.pos);
    const check = inCheck(this.pos.board, this.pos.turn);
    const move = toMove(encoded);
    const record: MoveRecord = {
      ...move,
      uci: moveToUci(move),
      san: sanBase + (check ? (replies.length === 0 ? '#' : '+') : ''),
      piece: codeToPiece(moved),
      captured: captured ? codeToPiece(captured) : null,
      color: toColor(mover),
      fenAfter: this.fen(),
    };
    this.history.push({ ...entry, captured, record });
    return record;
  }

  undo(): MoveRecord | null {
    const entry = this.history.pop();
    if (!entry) return null;
    const mover: ColorIndex = entry.moved & BLACK ? 1 : 0;
    unmakeRaw(this.pos, entry.move, mover, entry.moved, entry.captured);
    this.pos.turn = mover;
    this.rule50 = entry.rule50;
    this.countingLimit = entry.countingLimit;
    this.countingPly = entry.countingPly;
    this.fullmove = entry.fullmove;
    this.keys.pop();
    return entry.record;
  }

  status(): GameStatus {
    if (generateLegalMoves(this.pos).length === 0) {
      return this.inCheck() ? { kind: 'checkmate', winner: toColor(this.pos.turn === 0 ? 1 : 0) } : { kind: 'stalemate' };
    }
    if (this.isRepetition()) return { kind: 'repetition' };
    if (this.countingLimit && this.countingPly > this.countingLimit) return { kind: 'counting' };
    if (this.rule50 >= FIFTY_MOVE_PLIES) return { kind: 'fifty-move' };
    if (hasInsufficientMaterial(this.pos, 0) && hasInsufficientMaterial(this.pos, 1)) {
      return { kind: 'insufficient-material' };
    }
    return { kind: 'ongoing' };
  }

  isGameOver(): boolean {
    return this.status().kind !== 'ongoing';
  }

  counting(): CountingState | null {
    if (!this.countingLimit) return null;
    return { limitPlies: this.countingLimit, plies: this.countingPly };
  }

  /** Position identity used for repetition: placement, pieces in hand and side to move. */
  private key(): string {
    return `${placementOf(this.pos.board)}[${handsOf(this.pos.hands)}] ${this.pos.turn}`;
  }

  /** Threefold repetition within the reversible-move window (Fairy-Stockfish n-fold rule). */
  private isRepetition(): boolean {
    const n = this.keys.length - 1;
    const end = Math.min(this.rule50, n);
    if (end < 4) return false;
    let count = 0;
    for (let i = 4; i <= end; i += 2) {
      if (this.keys[n - i] === this.keys[n] && ++count + 1 >= 3) return true;
    }
    return false;
  }

  /**
   * Fairy-Stockfish ASEAN counting: the count (re)starts from 0 when none is running, or when a capture
   * or promotion leaves the side to move with a lone Min-gyi — but only if that position has a limit.
   * Otherwise (a lone Min-gyi's own capture, bare Min-gyi) the running count is kept.
   */
  private applyCounting(captured: number, promotion: boolean): void {
    const stm = this.pos.turn;
    if (this.countingLimit && !((captured || promotion) && pieceCount(this.pos.board, stm) === 1)) return;
    const limit = countLimit(this.pos.board, stm);
    if (!limit) return;
    this.countingLimit = 2 * limit;
    this.countingPly = 0;
  }

  private sanBase(m: number, legal: number[], moved: number): string {
    const to = moveTo(m);
    const target = squareName(to);
    if (isDrop(m)) return `${SAN_LETTER[dropType(m)]}@${target}`;

    const from = moveFrom(m);
    const type = moved & TYPE_MASK;
    // Fairy-Stockfish names both squares of a promotion (`d5c4=F`), or one when it is in place (`d5=F`).
    if (isPromotion(m)) return `${squareName(from)}${from === to ? '' : target}=F`;
    const capture = this.pos.board[to] !== 0;
    if (type === PAWN) return (capture ? `${'abcdefgh'[fileOf(from)]}x` : '') + target;

    const rivals = legal.filter(
      (o) => o !== m && !isDrop(o) && moveTo(o) === to && this.pos.board[moveFrom(o)] === moved,
    );
    let disambiguation = '';
    if (rivals.length) {
      const sameFile = rivals.some((o) => fileOf(moveFrom(o)) === fileOf(from));
      const sameRank = rivals.some((o) => rankOf(moveFrom(o)) === rankOf(from));
      if (!sameFile) disambiguation = 'abcdefgh'[fileOf(from)]!;
      else if (!sameRank) disambiguation = String(rankOf(from) + 1);
      else disambiguation = squareName(from);
    }
    return `${SAN_LETTER[type]}${disambiguation}${capture ? 'x' : ''}${target}`;
  }
}

function resolve(input: Move | string, legal: number[]): number | undefined {
  let target: number;
  if (typeof input === 'string') {
    const m = UCI.exec(input);
    if (!m) return undefined;
    target = m[1]
      ? encodeDrop(typeFromChar(m[1]), parseSquare(m[2]!))
      : encodeMove(parseSquare(m[3]!), parseSquare(m[4]!), m[5] ? PROMOTION_FLAG : 0);
  } else {
    target =
      input.kind === 'drop'
        ? encodeDrop(typeFromChar(input.type), input.to)
        : encodeMove(input.from, input.to, input.promotion ? PROMOTION_FLAG : 0);
  }
  return legal.includes(target) ? target : undefined;
}

function toMove(m: number): Move {
  if (isDrop(m)) return { kind: 'drop', type: codeToPiece(dropType(m)).type, to: moveTo(m) };
  return { kind: 'move', from: moveFrom(m), to: moveTo(m), promotion: isPromotion(m) };
}

/** Coordinate notation of an encoded move (see movegen.ts). */
export function encodedToUci(m: number): string {
  return moveToUci(toMove(m));
}

export function moveToUci(m: Move): string {
  if (m.kind === 'drop') return `${m.type.toUpperCase()}@${squareName(m.to)}`;
  return squareName(m.from) + squareName(m.to) + (m.promotion ? 'f' : '');
}
