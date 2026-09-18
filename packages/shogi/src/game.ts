import { IllegalMoveError, squareNameOf, squareOf } from '@chaturanga/rules-core';
import {
  BLACK,
  codeToPiece,
  fileOf,
  FILES,
  HAND_ORDER,
  opposite,
  PROMOTED,
  rankOf,
  sanLetter,
  toColor,
  toColorIndex,
  typeFromChar,
} from './board';
import { findKing, inCheck } from './attacks';
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
  movedCode,
  moveTo,
  type Position,
  PROMO_FLAG,
  uchifuzumeDrops,
  unmakeRaw,
} from './movegen';
import { type GameState, nextState, repetitionEnd, rootState } from './gameEnd';
import type { Color, GameStatus, Move, MoveRecord, Piece, PieceType, Square } from './types';

export { IllegalMoveError };

interface HistoryEntry {
  move: number;
  moved: number;
  captured: number;
  rule50: number;
  fullmove: number;
  record: MoveRecord;
}

const UCI = /^(?:([PLNSGBRKplnsgbrk])@([a-i][1-9])|([a-i][1-9])([a-i][1-9])(\+?))$/;

const squareName = (sq: Square): string => squareNameOf(sq, FILES);

export class Game {
  private readonly pos: Position;
  private rule50: number;
  private fullmove: number;
  private readonly history: HistoryEntry[] = [];
  /** One entry per position of the game, for sennichite and perpetual check. */
  private readonly states: GameState[];

  constructor(fen: string = START_FEN) {
    const data = parseFen(fen);
    this.pos = { board: data.board, hands: data.hands, turn: data.turn };
    this.rule50 = data.rule50;
    this.fullmove = data.fullmove;
    this.states = [rootState(this.key(), this.pos.turn, inCheck(this.pos.board, this.pos.turn))];
  }

  get turn(): Color {
    return toColor(this.pos.turn);
  }

  fen(): string {
    return serializeFen({
      board: this.pos.board,
      hands: this.pos.hands,
      turn: this.pos.turn,
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

  /** Piece types this side holds in hand, repeated once per piece. */
  hand(color: Color): PieceType[] {
    const hand = this.pos.hands[toColorIndex(color)];
    return HAND_ORDER.flatMap((type) => Array<PieceType>(hand[type]!).fill(codeToPiece(type).type));
  }

  legalMoves(): Move[] {
    return generateLegalMoves(this.pos).map((m) => this.toMove(m));
  }

  /** Legal moves in coordinate notation (`g8g9`, `g8g9+`, `S@a2`). */
  legalUci(): string[] {
    return generateLegalMoves(this.pos).map((m) => this.encodedToUci(m));
  }

  /**
   * Pawn drops the uchifuzume rule forbids here: they would be legal if they did not mate. Lessons show
   * them, and the tests use them to pin the one place this engine and Fairy-Stockfish disagree (RULES.md).
   */
  uchifuzumeUci(): string[] {
    return uchifuzumeDrops(this.pos).map((m) => this.encodedToUci(m));
  }

  inCheck(): boolean {
    return inCheck(this.pos.board, this.pos.turn);
  }

  checkedKingSquare(): Square | null {
    if (!this.inCheck()) return null;
    const square = findKing(this.pos.board, this.pos.turn);
    return square >= 0 ? square : null;
  }

  moves(): MoveRecord[] {
    return this.history.map((h) => h.record);
  }

  lastMove(): MoveRecord | null {
    return this.history.at(-1)?.record ?? null;
  }

  /** Accepts a Move or coordinate notation (`g8g9`, `g8g9+`, `S@a2`). */
  move(input: Move | string): MoveRecord {
    const legal = generateLegalMoves(this.pos);
    const encoded = this.resolve(input, legal);
    if (encoded === undefined) {
      throw new IllegalMoveError(typeof input === 'string' ? input : this.moveToUci(input));
    }

    const mover = this.pos.turn;
    const moved = movedCode(this.pos, encoded);
    const sanBase = this.sanBase(encoded, legal, moved);
    const entry: Omit<HistoryEntry, 'record' | 'captured'> = {
      move: encoded,
      moved,
      rule50: this.rule50,
      fullmove: this.fullmove,
    };

    const captured = makeRaw(this.pos, encoded);
    // Fairy-Stockfish resets the halfmove counter on a capture, a drop and a promotion, but not on a
    // plain pawn move (probed against ffish 0.7.10).
    this.rule50 = captured || isDrop(encoded) || isPromotion(encoded) ? 0 : this.rule50 + 1;
    if (mover === 1) this.fullmove++;

    const check = inCheck(this.pos.board, this.pos.turn);
    this.states.push(nextState(this.states.at(-1)!, this.key(), check));
    const replies = generateLegalMoves(this.pos);

    const record: MoveRecord = {
      uci: this.encodedToUci(encoded),
      san: sanBase + (check ? (replies.length === 0 ? '#' : '+') : ''),
      color: toColor(mover),
      piece: codeToPiece(moved),
      captured: captured ? codeToPiece(captured) : null,
      to: moveTo(encoded),
      from: isDrop(encoded) ? null : moveFrom(encoded),
      promotion: isPromotion(encoded),
      fenAfter: this.fen(),
    };
    this.history.push({ ...entry, captured, record });
    return record;
  }

  undo(): MoveRecord | null {
    const entry = this.history.pop();
    if (!entry) return null;
    unmakeRaw(this.pos, entry.move, entry.moved, entry.captured);
    this.states.pop();
    this.rule50 = entry.rule50;
    this.fullmove = entry.fullmove;
    return entry.record;
  }

  /**
   * Checkmate, stalemate (a loss for the side to move), then sennichite: a fourfold repetition is a draw,
   * or a loss for a side that kept checking through it.
   */
  status(): GameStatus {
    if (generateLegalMoves(this.pos).length === 0) {
      const winner = toColor(opposite(this.pos.turn));
      return this.states.at(-1)!.checkers ? { kind: 'checkmate', winner } : { kind: 'stalemate', winner };
    }
    return repetitionEnd(this.states) ?? { kind: 'ongoing' };
  }

  isGameOver(): boolean {
    return this.status().kind !== 'ongoing';
  }

  /** Shogi has no counting rule; always null. */
  counting(): null {
    return null;
  }

  /** Position identity used for repetition: placement, pieces in hand and side to move. */
  private key(): string {
    return `${placementOf(this.pos.board)}[${handsOf(this.pos.hands)}] ${this.pos.turn}`;
  }

  private sanBase(m: number, legal: number[], moved: number): string {
    const to = moveTo(m);
    const target = squareName(to);
    if (isDrop(m)) return `${sanLetter(dropType(m))}@${target}`;

    const from = moveFrom(m);
    const capture = this.pos.board[to] !== 0;
    // Two different pieces can share a SAN letter (a gold, a promoted silver and a promoted pawn all
    // print `G`), and Fairy-Stockfish disambiguates by the letter, not by the piece.
    const rivals = legal.filter((o) => {
      if (isDrop(o) || moveTo(o) !== to || moveFrom(o) === from) return false;
      const other = this.pos.board[moveFrom(o)]!;
      return (other & BLACK) === (moved & BLACK) && sanLetter(other) === sanLetter(moved);
    });
    let disambiguation = '';
    if (rivals.length) {
      const sameFile = rivals.some((o) => fileOf(moveFrom(o)) === fileOf(from));
      const sameRank = rivals.some((o) => rankOf(moveFrom(o)) === rankOf(from));
      if (!sameFile) disambiguation = squareName(from)[0]!;
      else if (!sameRank) disambiguation = String(rankOf(from) + 1);
      else disambiguation = squareName(from);
    }
    const promotion = isPromotion(m) ? `=${sanLetter(moved | PROMOTED)}` : '';
    return `${sanLetter(moved)}${disambiguation}${capture ? 'x' : ''}${target}${promotion}`;
  }

  private resolve(input: Move | string, legal: number[]): number | undefined {
    let target: number;
    if (typeof input === 'string') {
      const m = UCI.exec(input);
      if (!m) return undefined;
      if (m[1]) {
        const type = typeFromChar(m[1]);
        const to = squareOf(m[2]!, FILES);
        if (!type || to === null) return undefined;
        target = encodeDrop(type, to);
      } else {
        const from = squareOf(m[3]!, FILES);
        const to = squareOf(m[4]!, FILES);
        if (from === null || to === null) return undefined;
        target = encodeMove(from, to, m[5] ? PROMO_FLAG : 0);
      }
    } else if (input.kind === 'drop') {
      const type = typeFromChar(input.type);
      if (!type) return undefined;
      target = encodeDrop(type, input.to);
    } else {
      target = encodeMove(input.from, input.to, input.promotion ? PROMO_FLAG : 0);
    }
    return legal.includes(target) ? target : undefined;
  }

  private toMove(m: number): Move {
    if (isDrop(m)) return { kind: 'drop', type: codeToPiece(dropType(m)).type, to: moveTo(m) };
    return { kind: 'move', from: moveFrom(m), to: moveTo(m), promotion: isPromotion(m) };
  }

  private encodedToUci(m: number): string {
    return this.moveToUci(this.toMove(m));
  }

  private moveToUci(m: Move): string {
    if (m.kind === 'drop') return `${m.type.toUpperCase()}@${squareName(m.to)}`;
    return squareName(m.from) + squareName(m.to) + (m.promotion ? '+' : '');
  }
}

/** Coordinate notation of a move, for code that has a Move but no Game. */
export function moveToUci(m: Move): string {
  if (m.kind === 'drop') return `${m.type.toUpperCase()}@${squareName(m.to)}`;
  return squareName(m.from) + squareName(m.to) + (m.promotion ? '+' : '');
}

/** Coordinate notation of an encoded move, for search code holding raw integers. */
export function encodedToUci(m: number): string {
  if (isDrop(m)) {
    const piece = codeToPiece(dropType(m));
    return `${piece.type.toUpperCase()}@${squareName(moveTo(m))}`;
  }
  return squareName(moveFrom(m)) + squareName(moveTo(m)) + (isPromotion(m) ? '+' : '');
}
