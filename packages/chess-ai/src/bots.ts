import type { BotPersona } from '@chaturanga/ai-core';

export interface ChessBot extends BotPersona {
  /** i18n key suffix and persona name, after the chess pieces (owner decision D10). */
  key: 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';
}

/**
 * Six bots named after the pieces, from Pawn (a first game) to King (as strong as the phone budget allows).
 * Budgets start from the ladder-verified Xiangqi line-up; the chess ladder (ch-003) decides the final
 * values. Chess positions branch wider than Xiangqi's, so the node budgets do more of the work than depth.
 */
export const BOTS: readonly ChessBot[] = [
  { id: 1, key: 'pawn', maxDepth: 1, maxNodes: 3_000, timeMs: 400, noise: 250, blunderRate: 0.4 },
  { id: 2, key: 'knight', maxDepth: 2, maxNodes: 10_000, timeMs: 600, noise: 70, blunderRate: 0.12 },
  { id: 3, key: 'bishop', maxDepth: 3, maxNodes: 40_000, timeMs: 800, noise: 40, blunderRate: 0.05 },
  { id: 4, key: 'rook', maxDepth: 4, maxNodes: 150_000, timeMs: 1_200, noise: 25, blunderRate: 0.015 },
  { id: 5, key: 'queen', maxDepth: 6, maxNodes: 500_000, timeMs: 2_000, noise: 0, blunderRate: 0 },
  { id: 6, key: 'king', maxDepth: 10, maxNodes: 1_200_000, timeMs: 3_000, noise: 0, blunderRate: 0 },
];

export function botById(id: number): ChessBot {
  return BOTS.find((bot) => bot.id === id) ?? BOTS[0]!;
}
