import type { BotPersona } from '@chaturanga/ai-core';

export interface CrazyhouseBot extends BotPersona {
  key: 'starter' | 'casual' | 'club' | 'challenger' | 'expert' | 'master';
}

/** Bounded levels tuned for Crazyhouse's wider branching, with a hard node and wall-clock cap. */
export const BOTS: readonly CrazyhouseBot[] = [
  { id: 1, key: 'starter', maxDepth: 1, maxNodes: 1_000, timeMs: 250, noise: 220, blunderRate: 0.2 },
  { id: 2, key: 'casual', maxDepth: 2, maxNodes: 3_500, timeMs: 450, noise: 100, blunderRate: 0.08 },
  { id: 3, key: 'club', maxDepth: 3, maxNodes: 12_000, timeMs: 800, noise: 55, blunderRate: 0.03 },
  { id: 4, key: 'challenger', maxDepth: 4, maxNodes: 35_000, timeMs: 1_200, noise: 25, blunderRate: 0.01 },
  { id: 5, key: 'expert', maxDepth: 5, maxNodes: 80_000, timeMs: 1_700, noise: 0, blunderRate: 0 },
  { id: 6, key: 'master', maxDepth: 6, maxNodes: 150_000, timeMs: 2_200, noise: 0, blunderRate: 0 },
];

export function botById(id: number): CrazyhouseBot {
  return BOTS.find((bot) => bot.id === id) ?? BOTS[0]!;
}
