import { MATE, search, type SearchAdapter } from '@chaturanga/ai-core';
import { FILES, RANKS, Game, squareName, type PieceType } from '@chaturanga/acedrex';

import { squareOf } from '@chaturanga/rules-core';

export const PIECE_VALUE: Record<PieceType, number> = { p: 100, r: 515, l: 300, u: 710, g: 250, c: 360, a: 835, k: 0 };
const promotionTypes = ['r', 'l', 'u', 'g', 'c', 'a'];
const encode = (uci: string): number => {
  const [, from, to, promotion] = /^([a-l]\d+)([a-l]\d+)([rlugca])?$/.exec(uci)!;
  const promotionIndex = promotion ? promotionTypes.indexOf(promotion) + 1 : 0;
  return squareOf(from!, FILES)! | (squareOf(to!, FILES)! << 8) | (promotionIndex << 16);
};
const fromOf = (move: number): number => move & 255;
const toOf = (move: number): number => (move >> 8) & 255;
const promotionOf = (move: number): string => promotionTypes[(move >> 16) - 1] ?? '';
const uciOf = (move: number): string =>
  squareName(fromOf(move)) + squareName(toOf(move)) + promotionOf(move);
const fenKey = (fen: string): string => fen.split(' ').slice(0, 3).join(' ');

class AcedrexSearch implements SearchAdapter {
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
      const centrality = 11 - Math.abs(5.5 - file) - Math.abs(5.5 - rank);
      const activity = piece.type === 'p' ? advance * 8 : piece.type === 'k' ? 0 : centrality * 5;
      const value = PIECE_VALUE[piece.type] + activity;
      return score + (piece.color === this.game.turn ? value : -value);
    }, 0);
  }

  isTactical(move: number): boolean {
    return !!promotionOf(move) || this.game.pieceAt(toOf(move)) !== null;
  }

  orderKey(move: number): number {
    const target = this.game.pieceAt(toOf(move));
    const attacker = this.game.pieceAt(fromOf(move))!;
    return (promotionOf(move) ? 400 : 0) + (target ? 10 * PIECE_VALUE[target.type] - PIECE_VALUE[attacker.type] : 0);
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
  const result = search(new AcedrexSearch(game), {
    maxDepth: 4,
    maxNodes: options.maxNodes ?? 1_200,
    deadline: options.deadline,
    history: game.moves().map(({ fenAfter }) => fenKey(fenAfter)),
    exactRootScores: false,
    contempt: 0,
  });
  return result.move < 0 ? legal[0]! : uciOf(result.move);
}
