import { MATE, search, type SearchAdapter } from '@chaturanga/ai-core';
import { squareOf } from '@chaturanga/rules-core';
import { Game, FILES, squareName, type PieceType } from '@chaturanga/hiashatar';

const PROMOTION = 1 << 14;
export const PIECE_VALUE: Record<PieceType, number> = { p: 100, n: 310, b: 340, h: 290, q: 900, r: 520, k: 0 };

function encodeUci(uci: string): number {
  const parts = /^([a-j]\d{1,2})([a-j]\d{1,2})(q?)$/.exec(uci);
  if (!parts) return 0;
  const from = squareOf(parts[1]!, FILES);
  const to = squareOf(parts[2]!, FILES);
  if (from === null || to === null) return 0;
  return from | (to << 7) | (parts[3] ? PROMOTION : 0);
}

const fromOf = (move: number): number => move & 127;
const toOf = (move: number): number => (move >> 7) & 127;
const uciOf = (move: number): string => squareName(fromOf(move)) + squareName(toOf(move)) + ((move & PROMOTION) ? 'q' : '');
const fenKey = (fen: string): string => fen.split(' ').slice(0, 4).join(' ');

class HiashatarSearch implements SearchAdapter {
  constructor(private readonly game: Game) {}

  turn(): 0 | 1 { return this.game.turn === 'w' ? 0 : 1; }
  legalMoves(): number[] { return this.game.legalUci().map(encodeUci); }
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
    const material = this.game.pieces().reduce((score, { piece, square }) => {
      const file = square % FILES;
      const rank = Math.floor(square / FILES);
      const advance = piece.color === 'w' ? rank : 9 - rank;
      const centrality = 9 - Math.abs(4.5 - file) - Math.abs(4.5 - rank);
      const value = PIECE_VALUE[piece.type] + (piece.type === 'p' ? advance * 7 : centrality * 4);
      const aura = piece.type === 'h' ? 9 : 0;
      return score + (piece.color === this.game.turn ? value + aura : -value - aura);
    }, 0);
    const whiteActivity = this.game.attackedSquares('w').length;
    const blackActivity = this.game.attackedSquares('b').length;
    return material + (this.game.turn === 'w' ? whiteActivity - blackActivity : blackActivity - whiteActivity);
  }

  isTactical(move: number): boolean {
    const destination = squareName(toOf(move));
    const enPassant = this.game.fen().split(' ')[3]?.split(',').includes(destination) ?? false;
    return !!(move & PROMOTION) || this.game.pieceAt(toOf(move)) !== null || enPassant;
  }

  orderKey(move: number): number {
    const destination = squareName(toOf(move));
    const enPassant = this.game.fen().split(' ')[3]?.split(',').includes(destination) ?? false;
    const target = this.game.pieceAt(toOf(move)) ?? (enPassant ? { type: 'p' as const } : null);
    const attacker = this.game.pieceAt(fromOf(move))!;
    return ((move & PROMOTION) ? 400 : 0) + (target ? 10 * PIECE_VALUE[target.type] - PIECE_VALUE[attacker.type] : 0);
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
  const result = search(new HiashatarSearch(game), {
    maxDepth: 4,
    maxNodes: options.maxNodes ?? 3_000,
    deadline: options.deadline,
    history: game.moves().map(({ fenAfter }) => fenKey(fenAfter)),
    exactRootScores: false,
    contempt: 0,
  });
  return result.move < 0 ? legal[0]! : uciOf(result.move);
}
