import { MATE, type SearchAdapter } from '@chaturanga/ai-core';
import type { Game } from '@chaturanga/janggi';
import {
  type Board,
  type ColorIndex,
  encodedToUci,
  generalsFace,
  generateLegalMoves,
  inCheck,
  isPass,
  makeRaw,
  moveFrom,
  moveTo,
  pointsWinner,
  serializeFen,
  TYPE_MASK,
  unmakeRaw,
} from '@chaturanga/janggi/core';
import { evaluate, PIECE_VALUE } from './evaluate';

/** Position identity for repetition: placement and side to move (the first two FEN fields). */
export function positionKey(fen: string): string {
  return fen.split(' ').slice(0, 2).join(' ');
}

/** A game decided by the points or a perpetual check is scored like a mate found far from the root. */
export const DECIDED_SCORE = MATE - 100;

/**
 * Janggi position walked by the ai-core search. Takes ownership of `board` (pass a fresh parse). Bikjang and
 * double passes end a line on the points. With `game` (a Game standing on the same position, with its move
 * history) a repeated position is judged by the real rules too: points, or a losing perpetual check.
 */
export class JanggiSearch implements SearchAdapter {
  /** Flat undo stack of (move, moved piece, captured piece) triples. */
  private readonly undo: number[] = [];
  /** Per position on the line: the generals face each other. */
  private readonly facing: boolean[];
  private readonly rootAfterPass: boolean;

  constructor(
    private readonly board: Board,
    private side: ColorIndex,
    private readonly game?: Game,
  ) {
    this.facing = [generalsFace(board)];
    const last = game?.lastMove();
    this.rootAfterPass = !!last && last.from === last.to;
  }

  turn() {
    return this.side;
  }

  /** Passing is only worth searching when it ends the game, accepts bikjang or is all there is. */
  legalMoves() {
    const moves = generateLegalMoves(this.board, this.side);
    if (moves.length > 1 && !this.facing.at(-1) && !this.afterPass()) return moves.filter((m) => !isPass(m));
    return moves;
  }

  make(move: number) {
    const moved = this.board[moveFrom(move)]!;
    const captured = makeRaw(this.board, move);
    this.undo.push(move, moved, captured);
    this.facing.push(generalsFace(this.board));
    this.side = this.side === 0 ? 1 : 0;
  }

  unmake() {
    const captured = this.undo.pop()!;
    const moved = this.undo.pop()!;
    const move = this.undo.pop()!;
    this.facing.pop();
    this.side = this.side === 0 ? 1 : 0;
    unmakeRaw(this.board, move, moved, captured);
  }

  inCheck() {
    return inCheck(this.board, this.side);
  }

  evaluate() {
    return this.terminalScore() ?? evaluate(this.board, this.side);
  }

  isTactical(move: number) {
    return !isPass(move) && this.board[moveTo(move)] !== 0;
  }

  orderKey(move: number) {
    if (isPass(move)) return -1;
    const victim = this.board[moveTo(move)]!;
    if (!victim) return 0;
    return 10 * PIECE_VALUE[victim & TYPE_MASK]! - PIECE_VALUE[this.board[moveFrom(move)]! & TYPE_MASK]!;
  }

  key() {
    return positionKey(serializeFen({ board: this.board, turn: this.side, rule50: 0, fullmove: 1 }));
  }

  /** The points verdict once the generals have faced twice in a row, or both sides have passed. */
  terminalScore(): number | undefined {
    const n = this.facing.length;
    if (n < 2) return undefined;
    const bikjang = this.facing[n - 1] && this.facing[n - 2];
    const passed = this.afterPass() && (n > 2 ? isPass(this.undo[this.undo.length - 6]!) : this.rootAfterPass);
    return bikjang || passed ? this.scoreFor(pointsWinner(this.board)) : undefined;
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
    return 'winner' in status && status.winner ? this.scoreFor(status.winner) : undefined;
  }

  private afterPass(): boolean {
    return this.undo.length ? isPass(this.undo[this.undo.length - 3]!) : this.rootAfterPass;
  }

  private scoreFor(winner: 'w' | 'b'): number {
    return (winner === 'w' ? 0 : 1) === this.side ? DECIDED_SCORE : -DECIDED_SCORE;
  }
}
