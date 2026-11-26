import { MATE, type SearchAdapter } from '@chaturanga/ai-core';
import type { Game } from '@chaturanga/chu-shogi';
import {
  applyMove,
  generateMoves,
  keyOf,
  parseFen,
  royalSquares,
  type Move,
  type Position,
} from '@chaturanga/chu-shogi';
import { evaluate, PIECE_VALUE } from './evaluate';

const ONE_LEG = 0xff;
const PROMOTION_BIT = 1 << 24;

/** Encodes an entire Chu turn, including both legs and an optional promotion, in one search move. */
export function encodeMove(move: Move): number {
  const first = move.path[0];
  if (first === undefined || move.path.length > 2) throw new RangeError(`Unsupported Chu route: ${move.uci}`);
  const second = move.path[1] ?? ONE_LEG;
  return move.from | (first << 8) | (second << 16) | (move.promote ? PROMOTION_BIT : 0);
}

/** Position identity includes promotion eligibility and the one-reply Lion counterstrike. */
export function positionKey(fen: string): string {
  return keyOf(parseFen(fen));
}

interface UndoEntry {
  readonly position: Position;
  readonly moves: Map<number, Move> | null;
  readonly move: Move;
}

/** SearchAdapter for complete Chu turns. The engine's immutable applyMove keeps undo exact and compact. */
export class ChuSearch implements SearchAdapter {
  private readonly undo: UndoEntry[] = [];
  private currentMoves: Map<number, Move> | null = null;

  constructor(private position: Position, private readonly game?: Game) {}

  turn(): 0 | 1 {
    return this.position.turn === 'w' ? 0 : 1;
  }

  legalMoves(): number[] {
    if (!this.currentMoves) {
      this.currentMoves = new Map();
      for (const move of generateMoves(this.position)) this.currentMoves.set(encodeMove(move), move);
    }
    return [...this.currentMoves.keys()];
  }

  make(code: number): void {
    const move = this.currentMoves?.get(code);
    if (!move) throw new Error(`Search requested an unknown Chu move: ${code}`);
    this.undo.push({ position: this.position, moves: this.currentMoves, move });
    this.position = applyMove(this.position, move);
    this.currentMoves = null;
  }

  unmake(): void {
    const entry = this.undo.pop();
    if (!entry) throw new Error('Chu search undo stack is empty');
    this.position = entry.position;
    this.currentMoves = entry.moves;
  }

  /** Chu has no check restriction; an exposed King or Prince remains a legal position. */
  inCheck(): boolean {
    return false;
  }

  evaluate(): number {
    if (this.legalMoves().length === 0) return -MATE;
    return evaluate(this.position, this.position.turn);
  }

  isTactical(code: number): boolean {
    const move = this.currentMoves?.get(code);
    return !!move && (move.captures.length > 0 || move.promote);
  }

  orderKey(code: number): number {
    const move = this.currentMoves?.get(code);
    if (!move) return 0;
    const attacker = this.position.board[move.from]!;
    const captureValue = move.captures.reduce((sum, capture) => {
      const victim = capture.piece;
      const royal = victim.type === 'king' ? 8_000 : victim.type === 'drunk-elephant' && victim.promoted ? 5_500 : 0;
      return sum + (royal || PIECE_VALUE[victim.type]!);
    }, 0);
    return captureValue * 10 - PIECE_VALUE[attacker.type]! + (move.promote ? 350 : 0);
  }

  key(): string {
    return keyOf(this.position);
  }

  /** An actual capture of the last opposing King/Prince ends the game immediately. */
  terminalScore(): number | undefined {
    const ownRoyals = royalSquares(this.position.board, this.position.turn);
    const enemyColor = this.position.turn === 'w' ? 'b' : 'w';
    const enemyRoyals = royalSquares(this.position.board, enemyColor);
    if (ownRoyals.length === 0 && enemyRoyals.length === 0) return 0;
    if (ownRoyals.length === 0) return -MATE;
    if (enemyRoyals.length === 0) return MATE;

    const material = this.position.board.flatMap((piece, square) => {
      if (!piece) return [];
      const rank = Math.floor(square / 12) + 1;
      const deadPawnOrLance = !piece.promoted && (piece.type === 'pawn' || piece.type === 'lance') &&
        ((piece.color === 'w' && rank === 12) || (piece.color === 'b' && rank === 1));
      return deadPawnOrLance ? [] : [{ piece, square }];
    });
    if (material.length === 3) {
      const kings = material.filter(({ piece }) => piece.type === 'king' && !piece.promoted);
      const others = material.filter(({ piece }) => !(piece.type === 'king' && !piece.promoted));
      const extra = others[0]?.piece;
      if (kings.length === 2 && others.length === 1 && extra &&
        (extra.promoted || (extra.type !== 'pawn' && extra.type !== 'go-between'))) {
        return extra.color === this.position.turn ? MATE : -MATE;
      }
    }

    // Stalemate is a loss in this product. Cache the legal list for the following search step.
    if (this.legalMoves().length === 0) return -MATE;
    return undefined;
  }

  /** Replays the line on the root game to apply Chu's duty-to-vary repetition rule. */
  repetitionScore(): number | undefined {
    if (!this.game) return undefined;
    const path = this.undo.map(({ move }) => move.uci);
    for (const uci of path) this.game.move(uci);
    const status = this.game.status();
    for (let i = 0; i < path.length; i++) this.game.undo();
    if (status.kind !== 'repetition') return undefined;
    return (status.winner === 'w' ? 0 : 1) === this.turn()
      ? MATE - 100
      : -(MATE - 100);
  }

  moveUci(code: number): string {
    const move = this.currentMoves?.get(code);
    if (!move) throw new Error(`Search returned an unknown Chu move: ${code}`);
    return move.uci;
  }
}

export function searchPosition(position: Position): Position {
  return {
    board: position.board.map((piece) => piece ? { ...piece } : null),
    turn: position.turn,
    counterstrike: position.counterstrike ? { ...position.counterstrike } : null,
    ply: position.ply,
  };
}
