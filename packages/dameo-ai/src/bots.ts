import type { BotPersona } from '@chaturanga/ai-core';

export interface DameoBot extends BotPersona {
  key: 'learner' | 'wanderer' | 'tactician' | 'captain' | 'master' | 'champion';
}

/** Search limits are fixed by nodes for consistent play across browsers and devices. */
export const BOTS: readonly DameoBot[] = [
  { id: 1, key: 'learner', maxDepth: 1, maxNodes: 500, timeMs: 350, noise: 240, blunderRate: 0.2 },
  { id: 2, key: 'wanderer', maxDepth: 1, maxNodes: 1_500, timeMs: 500, noise: 150, blunderRate: 0.12 },
  { id: 3, key: 'tactician', maxDepth: 2, maxNodes: 5_000, timeMs: 800, noise: 75, blunderRate: 0.05 },
  { id: 4, key: 'captain', maxDepth: 3, maxNodes: 16_000, timeMs: 1_200, noise: 30, blunderRate: 0.02 },
  { id: 5, key: 'master', maxDepth: 4, maxNodes: 45_000, timeMs: 1_800, noise: 0, blunderRate: 0 },
  { id: 6, key: 'champion', maxDepth: 5, maxNodes: 90_000, timeMs: 2_600, noise: 0, blunderRate: 0 },
];

export function botById(id: number): DameoBot {
  return BOTS.find((bot) => bot.id === id) ?? BOTS[0]!;
}
