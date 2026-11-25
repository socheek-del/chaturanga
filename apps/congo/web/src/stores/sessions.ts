import { createGameSession, createProgressStore, storageKey } from '@chaturanga/game-shell';
import { congo } from '@chaturanga/congo';
import { PRODUCT } from '../../product.config';

/** Local and bot games have independent replayable saves under the Congo storage prefix. */
export const useLocalSession = createGameSession(congo, storageKey(PRODUCT, 'session.local'));
export const useBotWhiteSession = createGameSession(congo, storageKey(PRODUCT, 'session.bot.white'));
export const useBotBlackSession = createGameSession(congo, storageKey(PRODUCT, 'session.bot.black'));
export const useProgress = createProgressStore(storageKey(PRODUCT, 'progress'));
