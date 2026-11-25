import type { BotPersona } from '@chaturanga/ai-core';

export interface RithmomachiaBot extends BotPersona {
  key: 'novice' | 'apprentice' | 'arithmetician' | 'strategist' | 'scholar' | 'master';
}

/** Fixed node budgets keep bot strength deterministic across devices. */
export const BOTS: readonly RithmomachiaBot[] = [
  { id: 1, key: 'novice', maxDepth: 1, maxNodes: 500, timeMs: 350, noise: 320, blunderRate: 0.2 },
  { id: 2, key: 'apprentice', maxDepth: 1, maxNodes: 1_400, timeMs: 500, noise: 190, blunderRate: 0.12 },
  { id: 3, key: 'arithmetician', maxDepth: 2, maxNodes: 4_000, timeMs: 800, noise: 95, blunderRate: 0.05 },
  { id: 4, key: 'strategist', maxDepth: 3, maxNodes: 9_000, timeMs: 1_200, noise: 35, blunderRate: 0.02 },
  { id: 5, key: 'scholar', maxDepth: 4, maxNodes: 18_000, timeMs: 1_800, noise: 0, blunderRate: 0 },
  { id: 6, key: 'master', maxDepth: 5, maxNodes: 32_000, timeMs: 2_600, noise: 0, blunderRate: 0 },
];

export function botById(id: number): RithmomachiaBot {
  return BOTS.find((bot) => bot.id === id) ?? BOTS[0]!;
}
