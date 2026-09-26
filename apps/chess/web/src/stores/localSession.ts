import { createGameSession as createVariantSession, type GameSessionState as VariantSessionState, storageKey } from '@chaturanga/game-shell';
import { type Color, type Game, chess } from '@chaturanga/chess';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { PRODUCT } from '../../product.config';

/** A Chess game session (shared session logic in @chaturanga/game-shell). */
export type GameSessionState = VariantSessionState<Game>;
export type GameSessionStore = ReturnType<typeof createGameSession>;

/** A local Chess game session; with `key` it is saved in localStorage and restored after a refresh. */
export function createGameSession(key?: string) {
  return createVariantSession(chess, key);
}

/** Pass-and-play game on this device. */
export const useLocalSession = createGameSession(storageKey(PRODUCT, 'session.local'));

/** Game against the computer. */
export const useComputerSession = createGameSession(storageKey(PRODUCT, 'session.computer'));

/** Bot and colour of the current game; saved with the game so a reload continues against the same bot. */
export const useComputerMatch = create<{ level: number; humanColor: Color }>()(
  persist(() => ({ level: 2, humanColor: 'w' as Color }), {
    name: storageKey(PRODUCT, 'session.computerMatch'),
    storage: createJSONStorage(() => localStorage),
  }),
);
