import { MATE, search, type SearchAdapter } from '@chaturanga/ai-core';
import { FILES, RANKS, Game, PAWN_TARGET, isPawn, squareName, type PieceType } from '@chaturanga/tamerlane';

import { squareOf } from '@chaturanga/rules-core';

const mainValues: Partial<Record<PieceType, number>> = { k: 0, h: 400, t: 400, r: 525, n: 300, b: 265, g: 480, f: 165, v: 180, e: 150, c: 250, d: 175 };
export const valueOf = (type: PieceType): number => mainValues[type] ?? 100;
const promotionTypes = ['r', 'n', 'b', 'g', 'f', 'v', 'e', 'c', 'd', 'h', 't', 'y'];
const encode = (uci: string): number => {
  const [, from, to, promotion] = /^([a-m]\d+)([a-m]\d+)([a-z])?$/.exec(uci)!;
  const promotionIndex = promotion ? promotionTypes.indexOf(promotion) + 1 : 0;
  return squareOf(from!, FILES)! | (squareOf(to!, FILES)! << 8) | (promotionIndex << 16);
};
const fromOf = (move: number): number => move & 255;
const toOf = (move: number): number => (move >> 8) & 255;
const promotionOf = (move: number): string => promotionTypes[(move >> 16) - 1] ?? '';
const uciOf = (move: number): string =>
  squareName(fromOf(move)) + squareName(toOf(move)) + promotionOf(move);
const fenKey = (fen: string): string => fen.split(' ').slice(0, 3).join(' ');

class TamerlaneSearch implements SearchAdapter {
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
      const centrality = 10 - Math.abs(6 - file) - Math.abs(4.5 - rank);
      const future = PAWN_TARGET[piece.type];
      const activity = isPawn(piece.type) ? advance * (future ? Math.max(5, valueOf(future) / 70) : 2) : piece.type === 'k' ? 0 : centrality * 5;
      const value = valueOf(piece.type) + activity;
      return score + (piece.color === this.game.turn ? value : -value);
    }, 0);
  }

  isTactical(move: number): boolean {
    return !!promotionOf(move) || this.game.pieceAt(toOf(move))?.color === (this.game.turn === 'w' ? 'b' : 'w');
  }

  orderKey(move: number): number {
    const target = this.game.pieceAt(toOf(move));
    const attacker = this.game.pieceAt(fromOf(move))!;
    return (promotionOf(move) ? 400 : 0) + (target && target.color !== attacker.color ? 10 * valueOf(target.type) - valueOf(attacker.type) : 0);
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
  const result = search(new TamerlaneSearch(game), {
    maxDepth: 3,
    maxNodes: options.maxNodes ?? 650,
    deadline: options.deadline,
    exactRootScores: false,
    contempt: 0,
  });
  return result.move < 0 ? legal[0]! : uciOf(result.move);
}
