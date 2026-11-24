import { MATE, search, type SearchAdapter } from '@chaturanga/ai-core';
import { Game, parseSquare, squareName, type PieceType } from '@chaturanga/chaturanga';

const PROMOTION = 1 << 12;
export const PIECE_VALUE: Record<PieceType, number> = { p: 100, n: 300, b: 145, q: 175, r: 525, k: 0 };
const encode = (uci: string): number =>
  parseSquare(uci.slice(0, 2)) | (parseSquare(uci.slice(2, 4)) << 6) | (uci.endsWith('q') ? PROMOTION : 0);
const fromOf = (move: number): number => move & 63;
const toOf = (move: number): number => (move >> 6) & 63;
const uciOf = (move: number): string =>
  squareName(fromOf(move)) + squareName(toOf(move)) + ((move & PROMOTION) ? 'q' : '');
const fenKey = (fen: string): string => fen.split(' ').slice(0, 2).join(' ');

class ChaturangaSearch implements SearchAdapter {
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
      const rank = square >> 3;
      const file = square & 7;
      const advance = piece.color === 'w' ? rank : 7 - rank;
      const centrality = 7 - Math.abs(3.5 - file) - Math.abs(3.5 - rank);
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
    return (move & PROMOTION ? 500 : 0) + (target ? 10 * PIECE_VALUE[target.type] - PIECE_VALUE[attacker.type] : 0);
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
  const result = search(new ChaturangaSearch(game), {
    maxDepth: 4,
    maxNodes: options.maxNodes ?? 4_000,
    deadline: options.deadline,
    history: game.moves().map(({ fenAfter }) => fenKey(fenAfter)),
    exactRootScores: false,
    contempt: 20,
  });
  return result.move < 0 ? legal[0]! : uciOf(result.move);
}
