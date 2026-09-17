import { MATE, type SearchAdapter } from '@chaturanga/ai-core';
import type { Game } from '@chaturanga/xiangqi';
import {
  type Board,
  type ColorIndex,
  encodedToUci,
  generateLegalMoves,
  inCheck,
  makeRaw,
  moveFrom,
  moveTo,
  serializeFen,
  TYPE_MASK,
  unmakeRaw,
} from '@chaturanga/xiangqi/core';
import { evaluate, PIECE_VALUE } from './evaluate';

/** Position identity for repetition: placement and side to move (the first two FEN fields). */
export function positionKey(fen: string): string {
  return fen.split(' ').slice(0, 2).join(' ');
}

/** A decisive repetition is scored like a mate found far from the root. */
export const PERPETUAL_SCORE = MATE - 100;

/**
 * Xiangqi position walked by the ai-core search. Takes ownership of `board` (pass a fresh parse).
 * With `game` (a Game standing on the same position, with its move history) a repeated position is judged
 * by the real rules: a perpetual check or chase loses instead of being scored as a draw.
 */
export class XiangqiSearch implements SearchAdapter {
  /** Flat undo stack of (move, moved piece, captured piece) triples. */
  private readonly undo: number[] = [];

  constructor(
    private readonly board: Board,
    private side: ColorIndex,
    private readonly game?: Game,
  ) {}

  turn() {
    return this.side;
  }

  legalMoves() {
    return generateLegalMoves(this.board, this.side);
  }

  make(move: number) {
    const moved = this.board[moveFrom(move)]!;
    const captured = makeRaw(this.board, move);
    this.undo.push(move, moved, captured);
    this.side = this.side === 0 ? 1 : 0;
  }

  unmake() {
    const captured = this.undo.pop()!;
    const moved = this.undo.pop()!;
    const move = this.undo.pop()!;
    this.side = this.side === 0 ? 1 : 0;
    unmakeRaw(this.board, move, moved, captured);
  }

  inCheck() {
    return inCheck(this.board, this.side);
  }

  evaluate() {
    return evaluate(this.board, this.side);
  }

  isTactical(move: number) {
    return this.board[moveTo(move)] !== 0;
  }

  orderKey(move: number) {
    const victim = this.board[moveTo(move)]!;
    if (!victim) return 0;
    return 10 * PIECE_VALUE[victim & TYPE_MASK]! - PIECE_VALUE[this.board[moveFrom(move)]! & TYPE_MASK]!;
  }

  key() {
    return positionKey(serializeFen({ board: this.board, turn: this.side, rule50: 0, fullmove: 1 }));
  }

  /** Replays the moves since the root on the game to ask the rules what this repetition means. */
  repetitionScore(): number | undefined {
    const game = this.game;
    if (!game) return undefined;
    const path: string[] = [];
    for (let i = 0; i < this.undo.length; i += 3) path.push(encodedToUci(this.undo[i]!));
    for (const uci of path) game.move(uci);
    const status = game.status();
    for (let i = 0; i < path.length; i++) game.undo();
    if (status.kind !== 'perpetual-check' && status.kind !== 'perpetual-chase') return undefined;
    return (status.winner === 'w' ? 0 : 1) === this.side ? PERPETUAL_SCORE : -PERPETUAL_SCORE;
  }
}
