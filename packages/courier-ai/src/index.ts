import { MATE, search, type SearchAdapter } from '@chaturanga/ai-core';
import { FILES, RANKS, Game, squareName, type PieceType } from '@chaturanga/courier';

import { squareOf } from '@chaturanga/rules-core';

const PROMOTION = 1 << 14;
export const PIECE_VALUE: Record<PieceType, number> = { p: 100, r: 515, n: 315, a: 155, c: 335, m: 400, k: 0, f: 170, s: 210 };
const encode = (uci: string): number =>
  squareOf(uci.slice(0, 2), FILES)! | (squareOf(uci.slice(2, 4), FILES)! << 7) | (uci.endsWith('f') ? PROMOTION : 0);
const fromOf = (move: number): number => move & 127;
const toOf = (move: number): number => (move >> 7) & 127;
const uciOf = (move: number): string =>
  squareName(fromOf(move)) + squareName(toOf(move)) + ((move & PROMOTION) ? 'f' : '');
const fenKey = (fen: string): string => fen.split(' ').slice(0, 2).join(' ');

class CourierSearch implements SearchAdapter {
  constructor(private readonly game: Game) {}

  turn(): 0 | 1 { return this.game.turn === 'w' ? 0 : 1; }
  legalMoves(): number[] { return this.game.legalUci().map(encode); }
  make(move: number): void { this.game.move(uciOf(move)); }
  unmake(): void { this.game.undo(); }
  inCheck(): boolean { return this.game.inCheck(); }
  key(): string { return fenKey(this.game.fen()); }

  terminalScore(): number | undefined {
    const status = this.game.status();
    if (status.kind === 'ongoing') return undefined;
    if (!('winner' in status) || !status.winner) return 0;
    return status.winner === this.game.turn ? MATE : -MATE;
  }

  evaluate(): number {
    return this.game.pieces().reduce((score, { piece, square }) => {
      const rank = Math.floor(square / FILES);
      const file = square % FILES;
      const advance = piece.color === 'w' ? rank : RANKS - 1 - rank;
      const centrality = 9 - Math.abs(5.5 - file) - Math.abs(3.5 - rank);
      const activity = piece.type === 'p' ? advance * 8 : piece.type === 'k' ? 0 : centrality * 5;
      const value = PIECE_VALUE[piece.type] + activity;
      return score + (piece.color === this.game.turn ? value : -value);
    }, 0);
  }

  isTactical(move: number): boolean {
    return !!(move & PROMOTION) || this.game.pieceAt(toOf(move)) !== null;
  }

  orderKey(move: number): number {
    const target = this.game.pieceAt(toOf(move));
    const attacker = this.game.pieceAt(fromOf(move))!;
    return (move & PROMOTION ? 75 : 0) + (target ? 10 * PIECE_VALUE[target.type] - PIECE_VALUE[attacker.type] : 0);
  }

  repetitionScore(): number | undefined {
    return this.game.status().kind === 'repetition' ? 0 : undefined;
  }
}

export function chooseMove(
  startFen: string,
  moves: readonly string[],
  options: { maxNodes?: number; deadline?: number } = {},
): string | null {
  const game = new Game(startFen);
  for (const move of moves) game.move(move);
  const legal = game.legalUci();
  if (!legal.length) return null;
  const result = search(new CourierSearch(game), {
    maxDepth: 4,
    maxNodes: options.maxNodes ?? 2_000,
    deadline: options.deadline,
    history: game.moves().map(({ fenAfter }) => fenKey(fenAfter)),
    exactRootScores: false,
    contempt: 0,
  });
  return result.move < 0 ? legal[0]! : uciOf(result.move);
}
