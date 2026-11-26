import { createGameSession, storageKey } from '@chaturanga/game-shell';
import { senterej } from '@chaturanga/senterej';
import { PRODUCT } from '../../product.config';

/** Local sessions persist their actor-tagged Werera histories across reloads. */
export const useGameSession = createGameSession(senterej, storageKey(PRODUCT, 'session.current'));
