import { MATE, type SearchAdapter } from '@chaturanga/ai-core';
import type { Game } from '@chaturanga/shogi';
import {
  cloneHands,
  type ColorIndex,
  dropType,
  encodedToUci,
  generateLegalMoves,
  handsOf,
  inCheck,
  isDrop,
  isPromotion,
  makeRaw,
  movedCode,
  moveTo,
  placementOf,
  type Position,
  TYPE_MASK,
  unmakeRaw,
} from '@chaturanga/shogi/core';
import { evaluate, PIECE_VALUE } from './evaluate';

/** Position identity for repetition: placement, both hands and the side to move. */
export function positionKey(fen: string): string {
  const [placement = '', side = ''] = fen.split(' ');
  return `${placement} ${side}`;
}

/** A decisive repetition (perpetual check) is scored like a mate found far from the root. */
export const PERPETUAL_SCORE = MATE - 100;

/**
 * A Shogi position walked by the ai-core search. Takes ownership of `position` (pass a fresh parse).
 * With `game` (a Game standing on the same position, with its move history) a repeated position is judged
 * by the real rules: a perpetual check loses instead of counting as a draw.
 */
export class ShogiSearch implements SearchAdapter {
  /** Flat undo stack of (move, moved piece, captured piece) triples. */
  private readonly undo: number[] = [];

  constructor(
    private readonly position: Position,
    private readonly game?: Game,
  ) {}

  turn(): ColorIndex {
    return this.position.turn;
  }

  legalMoves() {
    return generateLegalMoves(this.position);
  }

  make(move: number) {
    const moved = movedCode(this.position, move);
    const captured = makeRaw(this.position, move);
    this.undo.push(move, moved, captured);
  }

  unmake() {
    const captured = this.undo.pop()!;
    const moved = this.undo.pop()!;
    const move = this.undo.pop()!;
    unmakeRaw(this.position, move, moved, captured);
  }

  inCheck() {
    return inCheck(this.position.board, this.position.turn);
  }

  evaluate() {
    return evaluate(this.position.board, this.position.hands, this.position.turn);
  }

  /**
   * Quiescence follows captures and promotions only. Drops are quiet by this measure even though they
   * change the material on the board, because searching every drop would explode the tree.
   */
  isTactical(move: number) {
    if (isDrop(move)) return false;
    return this.position.board[moveTo(move)] !== 0 || isPromotion(move);
  }

  orderKey(move: number) {
    if (isDrop(move)) return -PIECE_VALUE[dropType(move)]!;
    const victim = this.position.board[moveTo(move)]!;
    const promotion = isPromotion(move) ? 300 : 0;
    if (!victim) return promotion;
    const attacker = movedCode(this.position, move);
    return promotion + 10 * PIECE_VALUE[victim & TYPE_MASK]! - PIECE_VALUE[attacker & TYPE_MASK]!;
  }

  key() {
    // Same shape as positionKey(fen), so the search can compare it with the game history it is given.
    const side = this.position.turn === 1 ? 'b' : 'w';
    return `${placementOf(this.position.board)}[${handsOf(this.position.hands)}] ${side}`;
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
    if (status.kind !== 'perpetual-check') return undefined;
    return (status.winner === 'w' ? 0 : 1) === this.position.turn ? PERPETUAL_SCORE : -PERPETUAL_SCORE;
  }
}

/** A fresh search position from parsed FEN data, so the search never mutates the caller's board. */
export function searchPosition(data: Position): Position {
  return { board: Uint8Array.from(data.board), hands: cloneHands(data.hands), turn: data.turn };
}
