import { createGameSession, createProgressStore, storageKey } from '@chaturanga/game-shell';
import { jesonMor } from '@chaturanga/jesonmor';
import { PRODUCT } from '../../product.config';

/** Local and bot games have independent replayable saves under the Jeson Mor storage prefix. */
export const useLocalSession = createGameSession(jesonMor, storageKey(PRODUCT, 'session.local'));
export const useBotWhiteSession = createGameSession(jesonMor, storageKey(PRODUCT, 'session.bot.white'));
export const useBotBlackSession = createGameSession(jesonMor, storageKey(PRODUCT, 'session.bot.black'));
export const useProgress = createProgressStore(storageKey(PRODUCT, 'progress'));
