/**
 * Mulberry32 split into a pure step, so the generator's whole state is one number that lives inside the game
 * state and survives JSON.
 */
export function nextSeed(seed: number): { seed: number; value: number } {
  const next = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(next ^ (next >>> 15), 1 | next);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return { seed: next, value: ((t ^ (t >>> 14)) >>> 0) / 4294967296 };
}

/** A `() => number` view of the seeded generator, for callers that want an ordinary rng. */
export function randomOf(seed: number): () => number {
  let state = seed;
  return () => {
    const step = nextSeed(state);
    state = step.seed;
    return step.value;
  };
}

/** Fisher–Yates on a copy. Returns the shuffled list and the seed to carry forward. */
export function shuffle<T>(items: readonly T[], seed: number): { items: T[]; seed: number } {
  const out = items.slice();
  let state = seed;
  for (let i = out.length - 1; i > 0; i--) {
    const step = nextSeed(state);
    state = step.seed;
    const j = Math.floor(step.value * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return { items: out, seed: state };
}
