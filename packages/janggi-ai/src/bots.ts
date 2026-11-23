import type { BotPersona } from '@chaturanga/ai-core';

export interface JanggiBot extends BotPersona {
  /** i18n key suffix and persona name, after the Janggi pieces. */
  key: 'soldier' | 'advisor' | 'elephant' | 'horse' | 'cannon' | 'chariot';
}

/**
 * Six bots named after the pieces, from 卒 Soldier (novice) to 車 Chariot (master). Budgets start from the
 * Xiangqi line-up, noise scaled to Janggi's larger piece values; the Janggi strength ladder (jg-003) decides the final values.
 */
export const BOTS: readonly JanggiBot[] = [
  { id: 1, key: 'soldier', maxDepth: 1, maxNodes: 3_000, timeMs: 400, noise: 350, blunderRate: 0.4 },
  { id: 2, key: 'advisor', maxDepth: 1, maxNodes: 6_000, timeMs: 500, noise: 90, blunderRate: 0.12 },
  { id: 3, key: 'elephant', maxDepth: 2, maxNodes: 30_000, timeMs: 700, noise: 60, blunderRate: 0.06 },
  { id: 4, key: 'horse', maxDepth: 3, maxNodes: 120_000, timeMs: 1_000, noise: 40, blunderRate: 0.02 },
  { id: 5, key: 'cannon', maxDepth: 4, maxNodes: 400_000, timeMs: 1_800, noise: 0, blunderRate: 0 },
  { id: 6, key: 'chariot', maxDepth: 8, maxNodes: 1_000_000, timeMs: 3_000, noise: 0, blunderRate: 0 },
];

export function botById(id: number): JanggiBot {
  return BOTS.find((b) => b.id === id) ?? BOTS[0]!;
}
