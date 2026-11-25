import type { BotPersona } from '@chaturanga/ai-core';

export interface SuffragettoBot extends BotPersona {
  key: 'guide' | 'scout' | 'organizer' | 'strategist' | 'commander' | 'champion';
}

/** Deterministic search budgets with modest noise and blunders on the first levels. */
export const BOTS: readonly SuffragettoBot[] = [
  { id: 1, key: 'guide', maxDepth: 1, maxNodes: 500, timeMs: 300, noise: 220, blunderRate: 0.22 },
  { id: 2, key: 'scout', maxDepth: 1, maxNodes: 1_500, timeMs: 450, noise: 140, blunderRate: 0.12 },
  { id: 3, key: 'organizer', maxDepth: 2, maxNodes: 5_000, timeMs: 750, noise: 70, blunderRate: 0.05 },
  { id: 4, key: 'strategist', maxDepth: 3, maxNodes: 16_000, timeMs: 1_100, noise: 30, blunderRate: 0.02 },
  { id: 5, key: 'commander', maxDepth: 4, maxNodes: 45_000, timeMs: 1_700, noise: 0, blunderRate: 0 },
  { id: 6, key: 'champion', maxDepth: 5, maxNodes: 90_000, timeMs: 2_500, noise: 0, blunderRate: 0 },
];

export function botById(id: number): SuffragettoBot {
  return BOTS.find((bot) => bot.id === id) ?? BOTS[0]!;
}
