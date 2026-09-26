import {
  createGameSession as createVariantSession,
  type GameSessionState as VariantSessionState,
  storageKey,
} from '@chaturanga/game-shell';
import { type Color, type Game, makruk } from '@chaturanga/makruk';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { PRODUCT } from '../../product.config';

/** A Makruk game session (shared session logic in @chaturanga/game-shell). */
export type GameSessionState = VariantSessionState<Game>;
export type GameSessionStore = ReturnType<typeof createGameSession>;

/**
 * A local Makruk game session. With `storageKey` the game is saved in localStorage on every change and
 * restored when the page loads, so an accidental refresh (or pull-to-refresh) does not lose the game.
 */
export function createGameSession(key?: string) {
  return createVariantSession(makruk, key);
}

/** Pass-and-play game on this device. */
export const useLocalSession = createGameSession(storageKey(PRODUCT, 'session.local'));

/** Game against the computer. */
export const useComputerSession = createGameSession(storageKey(PRODUCT, 'session.computer'));

/** Guided first game (lesson) against the easiest bot. */
export const useGuidedSession = createGameSession(storageKey(PRODUCT, 'session.guided'));

/** Bot and colour of the current game; saved with the game so a reload continues against the same bot. */
export const useComputerMatch = create<{ level: number; humanColor: Color }>()(
  persist(() => ({ level: 2, humanColor: 'w' as Color }), {
    name: storageKey(PRODUCT, 'session.computerMatch'),
    storage: createJSONStorage(() => localStorage),
  }),
);
