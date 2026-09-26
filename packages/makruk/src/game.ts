import {
  BLACK,
  type Board,
  codeToPiece,
  type ColorIndex,
  fileOf,
  KHON,
  KING,
  KNIGHT,
  MET,
  parseSquare,
  PAWN,
  rankOf,
  ROOK,
  squareName,
  toColor,
  TYPE_MASK,
} from './board';
import { parseFen, placementOf, serializeFen, START_FEN } from './fen';
import {
  encodeMove,
  generateLegalMoves,
  inCheck,
  isAttacked,
  isPromotion,
  makeRaw,
  moveFrom,
  moveTo,
  unmakeRaw,
} from './movegen';
import { collectAttacked, IllegalMoveError, toColorIndex } from '@chaturanga/rules-core';
import type { Color, CountingState, GameStatus, Move, MoveRecord, Piece, PieceType, Square } from './types';

export { IllegalMoveError };

interface HistoryEntry {
  move: number;
  moved: number;
  captured: number;
  rule50: number;
  countingLimit: number;
  countingPly: number;
  countingSide: ColorIndex;
  fullmove: number;
  record: MoveRecord;
}

interface Tally {
  pawns: number;
  pieces: [number, number];
  rooks: [number, number];
  khons: [number, number];
  knights: [number, number];
}

function tally(board: Board): Tally {
  const t: Tally = { pawns: 0, pieces: [0, 0], rooks: [0, 0], khons: [0, 0], knights: [0, 0] };
  for (let sq = 0; sq < 64; sq++) {
    const p = board[sq]!;
    if (!p) continue;
    const c = p & BLACK ? 1 : 0;
    t.pieces[c]++;
    switch (p & TYPE_MASK) {
      case PAWN:
        t.pawns++;
        break;
      case ROOK:
        t.rooks[c]++;
        break;
      case KHON:
        t.khons[c]++;
        break;
      case KNIGHT:
        t.knights[c]++;
        break;
    }
  }
  return t;
}

/** Counting limit in full moves for `side`, or 0 if that side cannot count (Fairy-Stockfish MAKRUK_COUNTING). */
function countLimit(t: Tally, side: ColorIndex): number {
  const opp = side === 0 ? 1 : 0;
  if (t.pawns > 0 || t.pieces[opp] === 1) return 0;
  if (t.pieces[side] > 1) return 64; // board's honour
  if (t.rooks[opp] > 1) return 8; // pieces' honour
  if (t.rooks[opp] === 1) return 16;
  if (t.khons[opp] > 1) return 22;
  if (t.knights[opp] > 1) return 32;
  if (t.khons[opp] === 1) return 44;
  return 64;
}

/**
 * Mirrors Fairy-Stockfish `has_insufficient_material` for Makruk: Ruea and Khon can mate;
 * Met is colour-bound; Ma and Bia need a helper piece.
 */
function hasInsufficientMaterial(board: Board, c: ColorIndex): boolean {
  const own = c === 1 ? BLACK : 0;
  let ownMet = false;
  let ownUnbound = false;
  let metDark = false;
  let metLight = false;
  let unbound = 0;
  let nonKing = 0;
  for (let sq = 0; sq < 64; sq++) {
    const p = board[sq]!;
    if (!p) continue;
    const type = p & TYPE_MASK;
    if (type === KING) continue;
    nonKing++;
    const mine = (p & BLACK) === own;
    if (mine && (type === ROOK || type === KHON)) return false;
    if (type === MET) {
      if ((fileOf(sq) + rankOf(sq)) % 2 === 0) metDark = true;
      else metLight = true;
      if (mine) ownMet = true;
    } else {
      unbound++;
      if (mine) ownUnbound = true;
    }
  }
  if (ownMet && ((metDark && metLight) || unbound > 0)) return false;
  if (ownUnbound && nonKing >= 2) return false;
  return true;
}

const SAN_LETTER: Record<number, string> = { 1: '', 2: 'N', 3: 'S', 4: 'M', 5: 'R', 6: 'K' };

export class Game {
  private board: Board;
  private turnIndex: ColorIndex;
  private countingLimit: number;
  private countingPly: number;
  private countingSide: ColorIndex;
  private rule50: number;
  private fullmove: number;
  private readonly history: HistoryEntry[] = [];
  private readonly keys: string[] = [];

  constructor(fen: string = START_FEN) {
    const pos = parseFen(fen);
    this.board = pos.board;
    this.turnIndex = pos.turn;
    this.countingLimit = pos.countingLimit;
    this.countingPly = pos.countingPly;
    this.rule50 = pos.rule50;
    this.fullmove = pos.fullmove;
    this.countingSide = this.inferCountingSide();
    this.keys.push(this.key());
  }

  get turn(): Color {
    return toColor(this.turnIndex);
  }

  fen(): string {
    return serializeFen({
      board: this.board,
      turn: this.turnIndex,
      countingLimit: this.countingLimit,
      countingPly: this.countingPly,
      rule50: this.rule50,
      fullmove: this.fullmove,
    });
  }

  pieceAt(square: Square): Piece | null {
    const p = this.board[square];
    return p ? codeToPiece(p) : null;
  }

  pieces(): Array<{ square: Square; piece: Piece }> {
    const out: Array<{ square: Square; piece: Piece }> = [];
    this.board.forEach((p, square) => {
      if (p) out.push({ square, piece: codeToPiece(p) });
    });
    return out;
  }

  /** Makruk has no pieces in hand; part of the rules-core Variant contract. */
  hand(_color: Color): PieceType[] {
    return [];
  }

  legalMoves(): Move[] {
    return generateLegalMoves(this.board, this.turnIndex).map(toMove);
  }

  /** Legal moves in coordinate notation (`e3e4`, `a5a6m`). */
  legalUci(): string[] {
    return generateLegalMoves(this.board, this.turnIndex).map((m) => moveToUci(toMove(m)));
  }

  legalMovesFrom(square: Square): Move[] {
    return this.legalMoves().filter((m) => m.from === square);
  }

  inCheck(): boolean {
    return inCheck(this.board, this.turnIndex);
  }

  /** Square of the side-to-move's Khun if it is in check, otherwise null. */
  checkedKingSquare(): Square | null {
    if (!this.inCheck()) return null;
    const code = KING | (this.turnIndex ? BLACK : 0);
    return this.board.findIndex((p) => p === code);
  }

  attackedSquares(color: Color): Square[] {
    return collectAttacked(64, (sq) => isAttacked(this.board, sq, toColorIndex(color)));
  }

  moves(): MoveRecord[] {
    return this.history.map((h) => h.record);
  }

  lastMove(): MoveRecord | null {
    return this.history.at(-1)?.record ?? null;
  }

  /** Accepts a Move or coordinate notation (`e3e4`, `a5a6m`; the promotion suffix is optional). */
  move(input: Move | string): MoveRecord {
    const legal = generateLegalMoves(this.board, this.turnIndex);
    const encoded = this.resolve(input, legal);
    if (encoded === undefined) throw new IllegalMoveError(typeof input === 'string' ? input : moveToUci(input));

    const moved = this.board[moveFrom(encoded)]!;
    const sanBase = this.sanBase(encoded, legal);

    const entry: Omit<HistoryEntry, 'record' | 'captured'> = {
      move: encoded,
      moved,
      rule50: this.rule50,
      countingLimit: this.countingLimit,
      countingPly: this.countingPly,
      countingSide: this.countingSide,
      fullmove: this.fullmove,
    };

    this.rule50++;
    if (this.countingLimit) this.countingPly++;
    const captured = makeRaw(this.board, encoded);
    if (captured || (moved & TYPE_MASK) === PAWN) this.rule50 = 0;
    if (this.turnIndex === 1) this.fullmove++;
    this.turnIndex = this.turnIndex === 0 ? 1 : 0;
    this.applyCounting(captured, isPromotion(encoded));
    this.keys.push(this.key());

    const replies = generateLegalMoves(this.board, this.turnIndex);
    const check = inCheck(this.board, this.turnIndex);
    const san = sanBase + (check ? (replies.length === 0 ? '#' : '+') : '');

    const record: MoveRecord = {
      ...toMove(encoded),
      uci: moveToUci(toMove(encoded)),
      san,
      piece: codeToPiece(moved),
      captured: captured ? codeToPiece(captured) : null,
      color: toColor(moved & BLACK ? 1 : 0),
      fenAfter: this.fen(),
    };
    this.history.push({ ...entry, captured, record });
    return record;
  }

  undo(): MoveRecord | null {
    const entry = this.history.pop();
    if (!entry) return null;
    unmakeRaw(this.board, entry.move, entry.moved, entry.captured);
    this.turnIndex = entry.moved & BLACK ? 1 : 0;
    this.rule50 = entry.rule50;
    this.countingLimit = entry.countingLimit;
    this.countingPly = entry.countingPly;
    this.countingSide = entry.countingSide;
    this.fullmove = entry.fullmove;
    this.keys.pop();
    return entry.record;
  }

  status(): GameStatus {
    const legal = generateLegalMoves(this.board, this.turnIndex);
    if (legal.length === 0) {
      return this.inCheck() ? { kind: 'checkmate', winner: toColor(this.turnIndex === 0 ? 1 : 0) } : { kind: 'stalemate' };
    }
    if (this.isRepetition()) return { kind: 'repetition' };
    if (this.countingLimit && this.countingPly > this.countingLimit) return { kind: 'counting' };
    if (hasInsufficientMaterial(this.board, 0) && hasInsufficientMaterial(this.board, 1)) {
      return { kind: 'insufficient-material' };
    }
    return { kind: 'ongoing' };
  }

  isGameOver(): boolean {
    return this.status().kind !== 'ongoing';
  }

  counting(): CountingState | null {
    if (!this.countingLimit) return null;
    const t = tally(this.board);
    return {
      kind: t.pieces[this.countingSide] === 1 ? 'pieces' : 'board',
      side: toColor(this.countingSide),
      limitPlies: this.countingLimit,
      plies: this.countingPly,
    };
  }

  /** Position identity used for repetition: placement + side to move. */
  private key(): string {
    return `${placementOf(this.board)} ${this.turnIndex}`;
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

  private applyCounting(captured: number, promotion: boolean): void {
    const stm = this.turnIndex;
    const mover: ColorIndex = stm === 0 ? 1 : 0;
    const t = tally(this.board);
    const total = t.pieces[0] + t.pieces[1];

    if (captured && (captured & TYPE_MASK) === PAWN && t.pieces[mover] === 1 && t.pawns === 0) {
      const limit = countLimit(t, mover);
      if (limit) {
        this.countingLimit = 2 * limit;
        this.countingPly = 2 * total - 1;
        this.countingSide = mover;
      }
    }

    if (!this.countingLimit || ((captured || promotion) && t.pieces[stm] === 1)) {
      const limit = countLimit(t, stm);
      if (limit) {
        this.countingLimit = 2 * limit;
        this.countingPly = t.pieces[stm] > 1 ? 0 : 2 * total;
        this.countingSide = stm;
      }
    }
  }

  private inferCountingSide(): ColorIndex {
    const t = tally(this.board);
    if (t.pieces[0] === 1) return 0;
    if (t.pieces[1] === 1) return 1;
    return t.pieces[0] < t.pieces[1] ? 0 : t.pieces[1] < t.pieces[0] ? 1 : this.turnIndex;
  }

  private resolve(input: Move | string, legal: number[]): number | undefined {
    let from: Square;
    let to: Square;
    if (typeof input === 'string') {
      if (!/^[a-h][1-8][a-h][1-8]m?$/.test(input)) return undefined;
      from = parseSquare(input.slice(0, 2));
      to = parseSquare(input.slice(2, 4));
    } else {
      ({ from, to } = input);
    }
    return legal.find((m) => moveFrom(m) === from && moveTo(m) === to);
  }

  private sanBase(m: number, legal: number[]): string {
    const from = moveFrom(m);
    const to = moveTo(m);
    const moved = this.board[from]!;
    const type = moved & TYPE_MASK;
    const capture = this.board[to] !== 0;
    const target = squareName(to);
    const promo = isPromotion(m) ? '=M' : '';

    if (type === PAWN) return (capture ? `${'abcdefgh'[fileOf(from)]}x` : '') + target + promo;

    const rivals = legal.filter(
      (o) => o !== m && moveTo(o) === to && this.board[moveFrom(o)] === moved,
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

function toMove(m: number): Move {
  return { from: moveFrom(m), to: moveTo(m), promotion: isPromotion(m) };
}

export function moveToUci(m: Move): string {
  return squareName(m.from) + squareName(m.to) + (m.promotion ? 'm' : '');
}

export { encodeMove };
