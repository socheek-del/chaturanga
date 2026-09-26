import { type ProductConfig, storageKey } from '../product';
import type { PositionEval } from './engine';
import type { HistoryStore } from './history';

/**
 * The engine's view of each position of a saved game (ch-015, plat-017), kept beside the game in
 * localStorage so a review opens instantly the second time. Labels are not stored: they are worked out from
 * these on load, so a change to the labelling needs no new analysis.
 */
interface StoredAnalysis {
  v: 1;
  engine: string;
  /** One per position, keyed by FEN so a game that went on (or was taken back) reuses what still fits. */
  evals: Record<string, PositionEval>;
}

export interface AnalysisStore {
  key(gameId: string): string;
  /** Stored evaluations for these positions, in order; null where a position has not been analysed. */
  load(gameId: string, fens: readonly string[]): Array<PositionEval | null>;
  /**
   * Adds one position's evaluation. When the browser's storage is full, the analyses of the oldest games
   * make room (their games stay; they can be analysed again).
   */
  save(gameId: string, evaluation: PositionEval): void;
  remove(gameId: string): void;
}

/** Only what a review shows is kept: the best line in full, the runner-up's score and first move. */
function compact(evaluation: PositionEval): PositionEval {
  return { ...evaluation, lines: evaluation.lines.map((line, i) => (i === 0 ? line : { score: line.score, pv: line.pv.slice(0, 1) })) };
}

/**
 * A product's stored analyses, under `<prefix>analysis.<game id>`, tied to one engine build: a different
 * `engineId` ignores what another engine wrote. A game leaving `history` takes its analysis with it.
 */
export function createAnalysisStore(
  product: ProductConfig,
  history: HistoryStore,
  engineId: string,
  storage: () => Storage = () => localStorage,
): AnalysisStore {
  const key = (gameId: string) => storageKey(product, `analysis.${gameId}`);

  const read = (gameId: string): StoredAnalysis | null => {
    try {
      const parsed = JSON.parse(storage().getItem(key(gameId)) ?? 'null') as StoredAnalysis | null;
      return parsed?.v === 1 && parsed.engine === engineId && parsed.evals && typeof parsed.evals === 'object' ? parsed : null;
    } catch {
      return null;
    }
  };

  const remove = (gameId: string) => {
    try {
      storage().removeItem(key(gameId));
    } catch {
      // Storage unavailable: nothing to remove.
    }
  };

  history.onRemoved(remove);

  return {
    key,
    load: (gameId, fens) => {
      const stored = read(gameId);
      return fens.map((fen) => stored?.evals[fen] ?? null);
    },
    save: (gameId, evaluation) => {
      const store = storage();
      const stored = read(gameId) ?? { v: 1, engine: engineId, evals: {} };
      stored.evals[evaluation.fen] = compact(evaluation);
      const json = JSON.stringify(stored);
      const oldest = history
        .getState()
        .games.map((g) => g.id)
        .filter((id) => id !== gameId)
        .reverse();
      for (;;) {
        try {
          store.setItem(key(gameId), json);
          return;
        } catch {
          const victim = oldest.find((id) => store.getItem(key(id)) !== null);
          if (!victim) return;
          store.removeItem(key(victim));
          oldest.splice(oldest.indexOf(victim), 1);
        }
      }
    },
    remove,
  };
}
