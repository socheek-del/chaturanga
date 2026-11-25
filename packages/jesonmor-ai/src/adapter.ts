import { MATE, type SearchAdapter } from '@chaturanga/ai-core';
import { Game } from '@chaturanga/jesonmor';
import { CENTER, FILES, parseSquare, rankOf, squareName } from '@chaturanga/jesonmor/core';

const ENCODE_RADIX = 81;

export function encodeUci(uci: string): number {
  const from = parseSquare(uci.slice(0, 2));
  const to = parseSquare(uci.slice(2, 4));
  if (from === null || to === null) throw new Error(`Invalid Jeson Mor move: ${uci}`);
  return from * ENCODE_RADIX + to;
}

export function decodeMove(move: number): string {
  const from = Math.floor(move / ENCODE_RADIX);
  const to = move % ENCODE_RADIX;
  return `${squareName(from)}${squareName(to)}`;
}

export function positionKey(fen: string): string {
  const fields = fen.split(/\s+/);
  return `${fields[0] ?? ''} ${fields[1] ?? ''} ${fields[6] ?? '-'}`;
}

export class JesonMorSearch implements SearchAdapter {
  constructor(private readonly game: Game) {}

  turn(): 0 | 1 {
    return this.game.turn === 'b' ? 1 : 0;
  }

  legalMoves(): number[] {
    return this.game.legalUci().map(encodeUci);
  }

  make(move: number): void {
    this.game.move(decodeMove(move));
  }

  unmake(): void {
    this.game.undo();
  }

  inCheck(): boolean {
    return false;
  }

  evaluate(): number {
    const pending = this.game.pendingCenterGoal();
    let whiteScore = 0;
    for (const { square, piece } of this.game.pieces()) {
      const file = square % FILES;
      const rank = rankOf(square);
      const distance = Math.abs(file - 4) + Math.abs(rank - 4);
      const value = 100 + (8 - distance) * 5;
      whiteScore += piece.color === 'w' ? value : -value;
    }
    if (pending) whiteScore += pending === 'w' ? 750 : -750;
    // A center escape is forced and terminal, so make it stand out even at shallow static frontiers.
    if (pending && pending === this.game.turn) whiteScore += pending === 'w' ? 600 : -600;
    const sideToMoveScore = this.game.turn === 'w' ? whiteScore : -whiteScore;
    return sideToMoveScore;
  }

  isTactical(move: number): boolean {
    const from = Math.floor(move / ENCODE_RADIX);
    const to = move % ENCODE_RADIX;
    return Boolean(this.game.pieceAt(to)) || (from === CENTER && this.game.pendingCenterGoal() === this.game.turn);
  }

  orderKey(move: number): number {
    const from = Math.floor(move / ENCODE_RADIX);
    const to = move % ENCODE_RADIX;
    if (from === CENTER && this.game.pendingCenterGoal() === this.game.turn) return MATE;
    if (to === CENTER) return 800;
    return this.game.pieceAt(to) ? 1_000 : 0;
  }

  key(): string {
    return positionKey(this.game.fen());
  }

  terminalScore(): number | undefined {
    const status = this.game.status();
    if (status.kind === 'ongoing') return undefined;
    if (status.kind === 'repetition') return 0;
    if ('winner' in status && status.winner) return status.winner === this.game.turn ? MATE : -MATE;
    return 0;
  }
}
