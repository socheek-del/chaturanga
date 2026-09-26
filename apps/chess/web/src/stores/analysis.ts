import { storageKey } from '@chaturanga/game-shell';
import { PRODUCT } from '../../product.config';
import type { PositionEval } from '../features/review/engine';
import { onGameRemoved, useGameHistory } from './history';

/**
 * The engine's view of each position of a saved game (ch-015), kept beside the game in localStorage so a
 * review opens instantly the second time. Labels are not stored: they are worked out from these on load,
 * so a change to the labelling needs no new analysis.
 */
interface StoredAnalysis {
  v: 1;
  engine: string;
  /** One per position, keyed by FEN so a game that went on (or was taken back) reuses what still fits. */
  evals: Record<string, PositionEval>;
}

export const ENGINE_ID = 'stockfish-19-lite';
const PREFIX = storageKey(PRODUCT, 'analysis.');

export const analysisKey = (gameId: string) => `${PREFIX}${gameId}`;

function read(gameId: string, storage: Storage): StoredAnalysis | null {
  try {
    const parsed = JSON.parse(storage.getItem(analysisKey(gameId)) ?? 'null') as StoredAnalysis | null;
    return parsed?.v === 1 && parsed.engine === ENGINE_ID && parsed.evals && typeof parsed.evals === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

/** Stored evaluations for these positions, in order; null where a position has not been analysed. */
export function loadEvals(gameId: string, fens: readonly string[], storage: Storage = localStorage): Array<PositionEval | null> {
  const stored = read(gameId, storage);
  return fens.map((fen) => stored?.evals[fen] ?? null);
}

/** Only what a review shows is kept: the best line in full, the runner-up's score and first move. */
function compact(evaluation: PositionEval): PositionEval {
  return { ...evaluation, lines: evaluation.lines.map((line, i) => (i === 0 ? line : { score: line.score, pv: line.pv.slice(0, 1) })) };
}

/**
 * Adds one position's evaluation. When the browser's storage is full, the analyses of the oldest games make
 * room (their games stay; they can be analysed again).
 */
export function saveEval(gameId: string, evaluation: PositionEval, storage: Storage = localStorage): void {
  const stored = read(gameId, storage) ?? { v: 1, engine: ENGINE_ID, evals: {} };
  stored.evals[evaluation.fen] = compact(evaluation);
  const json = JSON.stringify(stored);
  const oldest = useGameHistory
    .getState()
    .games.map((g) => g.id)
    .filter((id) => id !== gameId)
    .reverse();
  for (;;) {
    try {
      storage.setItem(analysisKey(gameId), json);
      return;
    } catch {
      const victim = oldest.find((id) => storage.getItem(analysisKey(id)) !== null);
      if (!victim) return;
      storage.removeItem(analysisKey(victim));
      oldest.splice(oldest.indexOf(victim), 1);
    }
  }
}

export function removeAnalysis(gameId: string, storage: Storage = localStorage): void {
  try {
    storage.removeItem(analysisKey(gameId));
  } catch {
    // Storage unavailable: nothing to remove.
  }
}

// A game leaving the list takes its analysis with it.
onGameRemoved((id) => removeAnalysis(id));
