import { collectAttacked, IllegalMoveError } from '@chaturanga/rules-core';
import { findKing, inCheck, isAttacked } from './attacks';
import {
  BLACK,
  codeToPiece,
  colorIndexOf,
  fileOf,
  KING,
  opposite,
  PAWN,
  parseSquare,
  rankOf,
  sanLetter,
  squareName,
  toColor,
  toColorIndex,
  TYPE_MASK,
  typeFromChar,
} from './board';
import { castlingOf, normalizeEp, parseFen, placementOf, serializeFen, START_FEN } from './fen';
import { deadPosition, FIFTY_MOVE_PLIES, REPETITION_LIMIT, repetitionCount } from './gameEnd';
import {
  capturedOf,
  encodeMove,
  generateLegalMoves,
  isCastling,
  isEnPassant,
  makeRaw,
  moveFrom,
  movePromotion,
  moveTo,
  movedCode,
  type Position,
  unmakeRaw,
} from './movegen';
import type { Color, GameStatus, Move, MoveRecord, Piece, PieceType, Square } from './types';

export { IllegalMoveError };

interface HistoryEntry {
  move: number;
  undo: number;
  rule50: number;
  fullmove: number;
  record: MoveRecord;
}

const UCI = /^([a-h][1-8])([a-h][1-8])([qrbn]?)$/;

const PROMOTION_LETTERS: Record<number, PieceType> = { 2: 'n', 3: 'b', 4: 'r', 5: 'q' };

export class Game {
  private readonly pos: Position;
  private rule50: number;
  private fullmove: number;
  private readonly history: HistoryEntry[] = [];
  /** One key per position of the game, including the starting one, for the repetition rule. */
  private readonly keys: string[];

  constructor(fen: string = START_FEN) {
    const data = parseFen(fen);
    this.pos = { board: data.board, turn: data.turn, castling: data.castling, ep: data.ep };
    normalizeEp(this.pos);
    this.rule50 = data.rule50;
    this.fullmove = data.fullmove;
    this.keys = [this.key()];
  }

  get turn(): Color {
    return toColor(this.pos.turn);
  }

  fen(): string {
    return serializeFen({
      board: this.pos.board,
      turn: this.pos.turn,
      castling: this.pos.castling,
      ep: this.pos.ep,
      rule50: this.rule50,
      fullmove: this.fullmove,
    });
  }

  pieceAt(square: Square): Piece | null {
    const code = this.pos.board[square];
    return code ? codeToPiece(code) : null;
  }

  pieces(): Array<{ square: Square; piece: Piece }> {
    const out: Array<{ square: Square; piece: Piece }> = [];
    this.pos.board.forEach((code, square) => {
      if (code) out.push({ square, piece: codeToPiece(code) });
    });
    return out;
  }

  /** Chess has no pieces in hand; always empty. */
  hand(): PieceType[] {
    return [];
  }

  legalMoves(): Move[] {
    return generateLegalMoves(this.pos).map((m) => this.toMove(m));
  }

  /** Legal moves in coordinate notation (`e2e4`, `e1g1`, `e7e8q`). */
  legalUci(): string[] {
    return generateLegalMoves(this.pos).map((m) => encodedToUci(m));
  }

  inCheck(): boolean {
    return inCheck(this.pos.board, this.pos.turn);
  }

  checkedKingSquare(): Square | null {
    if (!this.inCheck()) return null;
    const square = findKing(this.pos.board, this.pos.turn);
    return square >= 0 ? square : null;
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

  /** Accepts a Move or coordinate notation (`e2e4`, `e1g1`, `e7e8q`). */
  move(input: Move | string): MoveRecord {
    const legal = generateLegalMoves(this.pos);
    const encoded = this.resolve(input, legal);
    if (encoded === undefined) {
      throw new IllegalMoveError(typeof input === 'string' ? input : moveToUci(input));
    }

    const mover = this.pos.turn;
    const moved = movedCode(this.pos, encoded);
    const sanBase = this.sanBase(encoded, legal, moved);
    const pawnMove = (moved & TYPE_MASK) === PAWN;
    const prevRule50 = this.rule50;
    const prevFullmove = this.fullmove;

    const undo = makeRaw(this.pos, encoded);
    const captured = capturedOf(undo);
    this.rule50 = captured || pawnMove ? 0 : this.rule50 + 1;
    if (mover === 1) this.fullmove++;
    this.keys.push(this.key());

    const check = inCheck(this.pos.board, this.pos.turn);
    const replies = generateLegalMoves(this.pos);
    const promotion = movePromotion(encoded);

    const record: MoveRecord = {
      uci: encodedToUci(encoded),
      san: sanBase + (check ? (replies.length === 0 ? '#' : '+') : ''),
      color: toColor(mover),
      piece: codeToPiece(moved),
      captured: captured ? codeToPiece(captured) : null,
      to: moveTo(encoded),
      from: moveFrom(encoded),
      promotion: promotion ? PROMOTION_LETTERS[promotion]! : null,
      fenAfter: this.fen(),
    };
    this.history.push({ move: encoded, undo, rule50: prevRule50, fullmove: prevFullmove, record });
    return record;
  }

  undo(): MoveRecord | null {
    const entry = this.history.pop();
    if (!entry) return null;
    unmakeRaw(this.pos, entry.move, entry.undo);
    this.keys.pop();
    this.rule50 = entry.rule50;
    this.fullmove = entry.fullmove;
    return entry.record;
  }

  /**
   * Checkmate, stalemate (a draw), then the drawn endings: insufficient material, a third repetition and
   * the fifty-move rule.
   */
  status(): GameStatus {
    if (generateLegalMoves(this.pos).length === 0) {
      return this.inCheck() ? { kind: 'checkmate', winner: toColor(opposite(this.pos.turn)) } : { kind: 'stalemate' };
    }
    if (deadPosition(this.pos.board)) return { kind: 'insufficient-material' };
    if (repetitionCount(this.keys, this.keys.at(-1)!) >= REPETITION_LIMIT) return { kind: 'repetition' };
    if (this.rule50 >= FIFTY_MOVE_PLIES) return { kind: 'fifty-move' };
    return { kind: 'ongoing' };
  }

  isGameOver(): boolean {
    return this.status().kind !== 'ongoing';
  }

  /** Chess has no counting rule; the fifty-move rule ends the game rather than counting down a card. */
  counting(): null {
    return null;
  }

  /** How many plies the fifty-move rule has counted, for a UI that wants to show it. */
  halfmoveClock(): number {
    return this.rule50;
  }

  /** Position identity for the repetition rule: placement, side to move, castling rights and en passant. */
  private key(): string {
    return `${placementOf(this.pos.board)} ${this.pos.turn} ${castlingOf(this.pos.castling)} ${this.pos.ep}`;
  }

  private sanBase(m: number, legal: number[], moved: number): string {
    const from = moveFrom(m);
    const to = moveTo(m);
    const target = squareName(to);
    const type = moved & TYPE_MASK;

    if (type === KING && Math.abs(fileOf(to) - fileOf(from)) === 2) {
      return fileOf(to) > fileOf(from) ? 'O-O' : 'O-O-O';
    }

    const capture = this.pos.board[to] !== 0 || isEnPassant(this.pos, m);
    const promotion = movePromotion(m);
    const promotionSuffix = promotion ? `=${PROMOTION_LETTERS[promotion]!.toUpperCase()}` : '';

    if (type === PAWN) {
      const prefix = capture ? `${squareName(from)[0]!}x` : '';
      return `${prefix}${target}${promotionSuffix}`;
    }

    const rivals = legal.filter((other) => {
      if (moveTo(other) !== to || moveFrom(other) === from) return false;
      const code = this.pos.board[moveFrom(other)]!;
      return code === moved;
    });
    let disambiguation = '';
    if (rivals.length) {
      const sameFile = rivals.some((other) => fileOf(moveFrom(other)) === fileOf(from));
      const sameRank = rivals.some((other) => rankOf(moveFrom(other)) === rankOf(from));
      if (!sameFile) disambiguation = squareName(from)[0]!;
      else if (!sameRank) disambiguation = String(rankOf(from) + 1);
      else disambiguation = squareName(from);
    }
    return `${sanLetter(moved)}${disambiguation}${capture ? 'x' : ''}${target}`;
  }

  private resolve(input: Move | string, legal: number[]): number | undefined {
    let target: number;
    if (typeof input === 'string') {
      const m = UCI.exec(input);
      if (!m) return undefined;
      const from = parseSquare(m[1]!);
      const to = parseSquare(m[2]!);
      if (from < 0 || to < 0) return undefined;
      target = encodeMove(from, to, m[3] ? typeFromChar(m[3]) : 0);
    } else {
      target = encodeMove(input.from, input.to, input.promotion ? typeFromChar(input.promotion) : 0);
    }
    return legal.includes(target) ? target : undefined;
  }

  private toMove(m: number): Move {
    const promotion = movePromotion(m);
    return { from: moveFrom(m), to: moveTo(m), promotion: promotion ? PROMOTION_LETTERS[promotion]! : null };
  }

  /** True when this legal move castles, for code that draws the rook's journey. */
  castles(m: number): boolean {
    return isCastling(this.pos, m);
  }
}

/** Coordinate notation of a move, for code that has a Move but no Game. */
export function moveToUci(m: Move): string {
  return squareName(m.from) + squareName(m.to) + (m.promotion ?? '');
}

/** Coordinate notation of an encoded move, for search code holding raw integers. */
export function encodedToUci(m: number): string {
  const promotion = movePromotion(m);
  return squareName(moveFrom(m)) + squareName(moveTo(m)) + (promotion ? PROMOTION_LETTERS[promotion]! : '');
}

export { BLACK, colorIndexOf };
