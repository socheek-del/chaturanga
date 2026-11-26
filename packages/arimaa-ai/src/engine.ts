import type { Color } from '@chaturanga/rules-core';
import type { Game } from '@chaturanga/arimaa';
import { botById, type ArimaaBot } from './bots';
import { evaluatePosition } from './evaluate';

export interface ArimaaEngineMove {
  uci: string;
  score: number;
  candidatesEvaluated: number;
}

function collectCandidates(game: Game, limit: number, rng: () => number): string[] {
  if (game.hand('w').length + game.hand('b').length > 0) return game.legalUci();

  const candidates = new Set<string>();
  const maxAttempts = Math.max(24, limit * 8);
  for (let attempt = 0; candidates.size < limit && attempt < maxAttempts; attempt++) {
    const uci = game.sampleLegalUci(rng);
    if (uci) candidates.add(uci);
  }
  return [...candidates];
}

/** Selects one legal move using a seeded candidate sampler and the authoritative Arimaa Game. */
export function chooseMove(game: Game, bot: ArimaaBot, rng: () => number): ArimaaEngineMove | null {
  if (game.status().kind !== 'ongoing') return null;
  const perspective: Color = game.turn;
  const candidates = collectCandidates(game, bot.candidates, rng);
  if (!candidates.length) return null;

  let best: ArimaaEngineMove | null = null;
  let bestNoisyScore = -Infinity;
  for (const uci of candidates) {
    game.move(uci);
    let score: number;
    try {
      score = evaluatePosition(game, perspective);
    } finally {
      game.undo();
    }

    const noise = (rng() * 2 - 1) * bot.noise;
    const noisyScore = score + noise;
    if (noisyScore > bestNoisyScore) {
      bestNoisyScore = noisyScore;
      best = { uci, score, candidatesEvaluated: candidates.length };
    }
  }
  return best;
}

/** Convenience entry point for UI callers that persist only the selected bot ID. */
export function chooseMoveById(game: Game, id: number, rng: () => number): ArimaaEngineMove | null {
  return chooseMove(game, botById(id), rng);
}
