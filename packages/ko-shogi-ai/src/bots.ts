import type { BotPersona } from '@chaturanga/ai-core';

export interface KoShogiBot extends BotPersona {
  key: 'beginner' | 'apprentice' | 'student' | 'tactician' | 'commander' | 'master';
  maxRootMoves: number;
  maxMovesPerPiece: number;
}

/** Deterministic one-ply bots sample legal actions across pieces to bound Ko Shogi's very wide opening. */
export const BOTS: readonly KoShogiBot[] = [
  { id: 1, key: 'beginner', maxDepth: 1, maxNodes: 96, maxRootMoves: 96, maxMovesPerPiece: 8, timeMs: 250, noise: 360, blunderRate: 0.34 },
  { id: 2, key: 'apprentice', maxDepth: 1, maxNodes: 192, maxRootMoves: 192, maxMovesPerPiece: 12, timeMs: 400, noise: 220, blunderRate: 0.2 },
  { id: 3, key: 'student', maxDepth: 1, maxNodes: 320, maxRootMoves: 320, maxMovesPerPiece: 16, timeMs: 650, noise: 120, blunderRate: 0.1 },
  { id: 4, key: 'tactician', maxDepth: 1, maxNodes: 512, maxRootMoves: 512, maxMovesPerPiece: 20, timeMs: 900, noise: 55, blunderRate: 0.04 },
  { id: 5, key: 'commander', maxDepth: 1, maxNodes: 768, maxRootMoves: 768, maxMovesPerPiece: 24, timeMs: 1_400, noise: 15, blunderRate: 0 },
  { id: 6, key: 'master', maxDepth: 1, maxNodes: 1_024, maxRootMoves: 1_024, maxMovesPerPiece: 32, timeMs: 2_000, noise: 0, blunderRate: 0 },
];

export function botById(id: number): KoShogiBot {
  return BOTS.find((bot) => bot.id === id) ?? BOTS[0]!;
}
