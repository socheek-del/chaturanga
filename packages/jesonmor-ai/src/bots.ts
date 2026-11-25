import type { BotPersona } from '@chaturanga/ai-core';

export interface JesonMorBot extends BotPersona {
  key: 'foal' | 'canter' | 'gallop' | 'herder' | 'racer' | 'champion';
}

/** Increasing deterministic search budgets; noise and blunders keep the first levels approachable. */
export const BOTS: readonly JesonMorBot[] = [
  { id: 1, key: 'foal', maxDepth: 1, maxNodes: 1_200, timeMs: 250, noise: 220, blunderRate: 0.22 },
  { id: 2, key: 'canter', maxDepth: 1, maxNodes: 4_000, timeMs: 350, noise: 120, blunderRate: 0.12 },
  { id: 3, key: 'gallop', maxDepth: 2, maxNodes: 14_000, timeMs: 650, noise: 55, blunderRate: 0.05 },
  { id: 4, key: 'herder', maxDepth: 3, maxNodes: 40_000, timeMs: 1_000, noise: 25, blunderRate: 0.02 },
  { id: 5, key: 'racer', maxDepth: 4, maxNodes: 110_000, timeMs: 1_600, noise: 0, blunderRate: 0 },
  { id: 6, key: 'champion', maxDepth: 7, maxNodes: 250_000, timeMs: 2_600, noise: 0, blunderRate: 0 },
];

export function botById(id: number): JesonMorBot {
  return BOTS.find((bot) => bot.id === id) ?? BOTS[0]!;
}
