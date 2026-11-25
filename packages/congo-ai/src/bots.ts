import type { BotPersona } from '@chaturanga/ai-core';

export interface CongoBot extends BotPersona {
  key: 'starter' | 'casual' | 'club' | 'challenger' | 'expert' | 'master';
}

/** Six bounded levels; route-heavy Congo positions use lower budgets than standard chess. */
export const BOTS: readonly CongoBot[] = [
  { id: 1, key: 'starter', maxDepth: 1, maxNodes: 700, timeMs: 250, noise: 240, blunderRate: 0.2 },
  { id: 2, key: 'casual', maxDepth: 2, maxNodes: 2_500, timeMs: 400, noise: 115, blunderRate: 0.08 },
  { id: 3, key: 'club', maxDepth: 3, maxNodes: 8_000, timeMs: 700, noise: 55, blunderRate: 0.03 },
  { id: 4, key: 'challenger', maxDepth: 4, maxNodes: 24_000, timeMs: 1_000, noise: 25, blunderRate: 0.01 },
  { id: 5, key: 'expert', maxDepth: 5, maxNodes: 60_000, timeMs: 1_500, noise: 0, blunderRate: 0 },
  { id: 6, key: 'master', maxDepth: 6, maxNodes: 120_000, timeMs: 2_000, noise: 0, blunderRate: 0 },
];

export function botById(id: number): CongoBot {
  return BOTS.find((bot) => bot.id === id) ?? BOTS[0]!;
}
