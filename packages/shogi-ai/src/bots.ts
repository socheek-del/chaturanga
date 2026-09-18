import type { BotPersona } from '@chaturanga/ai-core';

export interface ShogiBot extends BotPersona {
  /** i18n key suffix and persona name, after the Shogi pieces (owner decision D10). */
  key: 'fu' | 'keima' | 'gin' | 'kin' | 'kaku' | 'hisha';
}

/**
 * Six bots named after the pieces, from 歩 Fu (novice) to 飛 Hisha (master). Shogi's branching factor is
 * several times Xiangqi's, so the node budgets are what a browser can afford at each depth; the strength
 * ladder (sg-003) is what fixes the values.
 */
export const BOTS: readonly ShogiBot[] = [
  { id: 1, key: 'fu', maxDepth: 1, maxNodes: 4_000, timeMs: 400, noise: 250, blunderRate: 0.4 },
  { id: 2, key: 'keima', maxDepth: 1, maxNodes: 10_000, timeMs: 500, noise: 60, blunderRate: 0.12 },
  { id: 3, key: 'gin', maxDepth: 2, maxNodes: 40_000, timeMs: 800, noise: 40, blunderRate: 0.06 },
  { id: 4, key: 'kin', maxDepth: 3, maxNodes: 150_000, timeMs: 1_200, noise: 30, blunderRate: 0.02 },
  { id: 5, key: 'kaku', maxDepth: 4, maxNodes: 500_000, timeMs: 2_000, noise: 0, blunderRate: 0 },
  { id: 6, key: 'hisha', maxDepth: 8, maxNodes: 900_000, timeMs: 3_500, noise: 0, blunderRate: 0 },
];

export function botById(id: number): ShogiBot {
  return BOTS.find((b) => b.id === id) ?? BOTS[0]!;
}
