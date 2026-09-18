import { type SearchAdapter } from '@chaturanga/ai-core';
import {
  castlingOf,
  type ColorIndex,
  generateLegalMoves,
  inCheck,
  isTactical,
  makeRaw,
  moveFrom,
  movePromotion,
  moveTo,
  placementOf,
  type Position,
  TYPE_MASK,
  unmakeRaw,
} from '@chaturanga/chess/core';
import { evaluate, PIECE_VALUE } from './evaluate';

/** Position identity for repetition: placement, side to move, castling rights and en passant square. */
export function positionKey(pos: Position): string {
  return `${placementOf(pos.board)} ${pos.turn} ${castlingOf(pos.castling)} ${pos.ep}`;
}

/** The first four fields of a FEN, which is the same identity written from a FEN string. */
export function fenKey(fen: string): string {
  const [placement, side, castling, ep] = fen.split(' ');
  return `${placement} ${side === 'b' ? 1 : 0} ${castling} ${ep === '-' ? -1 : ep}`;
}

/**
 * A chess position walked by the ai-core search. Takes ownership of `pos` (pass a fresh parse), and leaves
 * it exactly as it found it after every make/unmake pair.
 */
export class ChessSearch implements SearchAdapter {
  /** Flat undo stack of (move, undo token) pairs. */
  private readonly stack: number[] = [];

  constructor(private readonly pos: Position) {}

  turn(): ColorIndex {
    return this.pos.turn;
  }

  legalMoves(): number[] {
    return generateLegalMoves(this.pos);
  }

  make(move: number): void {
    this.stack.push(move, makeRaw(this.pos, move));
  }

  unmake(): void {
    const undo = this.stack.pop()!;
    const move = this.stack.pop()!;
    unmakeRaw(this.pos, move, undo);
  }

  inCheck(): boolean {
    return inCheck(this.pos.board, this.pos.turn);
  }

  evaluate(): number {
    return evaluate(this.pos.board, this.pos.turn);
  }

  isTactical(move: number): boolean {
    return isTactical(this.pos, move);
  }

  /** Most valuable victim, least valuable attacker, with promotions first. */
  orderKey(move: number): number {
    const promotion = movePromotion(move);
    const victim = this.pos.board[moveTo(move)]!;
    let key = promotion ? 100 * PIECE_VALUE[promotion]! : 0;
    if (victim) key += 10 * PIECE_VALUE[victim & TYPE_MASK]! - PIECE_VALUE[this.pos.board[moveFrom(move)]! & TYPE_MASK]!;
    return key;
  }

  key(): string {
    return positionKey(this.pos);
  }
}
