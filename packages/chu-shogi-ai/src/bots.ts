import type { BotPersona } from '@chaturanga/ai-core';

export interface ChuBot extends BotPersona {
  key: 'pawn' | 'go-between' | 'copper' | 'silver' | 'dragon-horse' | 'free-king';
}

/** Six deterministic, bounded levels. Budgets are deliberately modest for the 12×12 branching factor. */
export const BOTS: readonly ChuBot[] = [
  { id: 1, key: 'pawn', maxDepth: 1, maxNodes: 3_000, timeMs: 400, noise: 220, blunderRate: 0.35 },
  { id: 2, key: 'go-between', maxDepth: 1, maxNodes: 8_000, timeMs: 600, noise: 100, blunderRate: 0.18 },
  { id: 3, key: 'copper', maxDepth: 2, maxNodes: 20_000, timeMs: 900, noise: 55, blunderRate: 0.08 },
  { id: 4, key: 'silver', maxDepth: 3, maxNodes: 55_000, timeMs: 1_300, noise: 25, blunderRate: 0.03 },
  { id: 5, key: 'dragon-horse', maxDepth: 4, maxNodes: 120_000, timeMs: 1_800, noise: 0, blunderRate: 0 },
  { id: 6, key: 'free-king', maxDepth: 6, maxNodes: 250_000, timeMs: 2_500, noise: 0, blunderRate: 0 },
];

export function botById(id: number): ChuBot {
  return BOTS.find((bot) => bot.id === id) ?? BOTS[0]!;
}
