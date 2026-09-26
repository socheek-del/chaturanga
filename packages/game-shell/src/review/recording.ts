import type { Color } from '@chaturanga/rules-core';
import type { StoreApi } from 'zustand';
import { createRecorder, type GameMode, type HistoryStore, type ObservedSession, type PlayerTag } from './history';

/** Both seats, from the side of the player who sat on `mine`. */
export function seats(mine: Color, you: PlayerTag, them: PlayerTag): Record<Color, PlayerTag> {
  return mine === 'w' ? { w: you, b: them } : { w: them, b: you };
}

/**
 * Saves every game a local session plays (pass-and-play, the computer) into the product's history as it is
 * played (ch-014, plat-017). Returns the unsubscribe function.
 */
export function recordSession(
  history: HistoryStore,
  session: StoreApi<ObservedSession>,
  mode: GameMode,
  describe: () => { players: Record<Color, PlayerTag>; you: Color | null },
): () => void {
  const record = createRecorder({ mode, store: history, describe });
  record(session.getState());
  return session.subscribe((s) => record(s));
}
