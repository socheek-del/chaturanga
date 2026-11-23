import { createGameSession as createVariantSession, type GameSessionState as VariantSessionState, storageKey } from '@chaturanga/game-shell';
import { type Game, janggi } from '@chaturanga/janggi';
import { PRODUCT } from '../../product.config';

/** A Janggi game session (shared session logic in @chaturanga/game-shell). */
export type GameSessionState = VariantSessionState<Game>;
export type GameSessionStore = ReturnType<typeof createGameSession>;

/** A local Janggi game session; with `key` it is saved in localStorage and restored after a refresh. */
export function createGameSession(key?: string) {
  return createVariantSession(janggi, key);
}

/** Pass-and-play game on this device. */
export const useLocalSession = createGameSession(storageKey(PRODUCT, 'session.local'));

/** Game against the computer. */
export const useComputerSession = createGameSession(storageKey(PRODUCT, 'session.computer'));
