export interface ArimaaBot {
  id: number;
  key: 'rabbit' | 'cat' | 'dog' | 'horse' | 'camel' | 'elephant';
  /** Maximum distinct complete turns to score from a midgame position. */
  candidates: number;
  /** Random score variation in centipawns; uses only the caller's seeded RNG. */
  noise: number;
}

/** Six bounded opponent levels, named after Arimaa's animals from novice to master. */
export const BOTS: readonly ArimaaBot[] = [
  { id: 1, key: 'rabbit', candidates: 1, noise: 700 },
  { id: 2, key: 'cat', candidates: 8, noise: 300 },
  { id: 3, key: 'dog', candidates: 24, noise: 140 },
  { id: 4, key: 'horse', candidates: 64, noise: 70 },
  { id: 5, key: 'camel', candidates: 128, noise: 20 },
  { id: 6, key: 'elephant', candidates: 256, noise: 0 },
];

export function botById(id: number): ArimaaBot {
  return BOTS.find((bot) => bot.id === id) ?? BOTS[0]!;
}
