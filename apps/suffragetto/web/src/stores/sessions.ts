import { createGameSession, createProgressStore, storageKey } from '@chaturanga/game-shell';
import { suffragetto } from '@chaturanga/suffragetto';
import { PRODUCT } from '../../product.config';

/** Local and bot games have independent replayable saves under the Suffragetto storage prefix. */
export const useLocalSession = createGameSession(suffragetto, storageKey(PRODUCT, 'session.local'));
export const useBotWhiteSession = createGameSession(suffragetto, storageKey(PRODUCT, 'session.bot.white'));
export const useBotBlackSession = createGameSession(suffragetto, storageKey(PRODUCT, 'session.bot.black'));
export const useProgress = createProgressStore(storageKey(PRODUCT, 'progress'));
