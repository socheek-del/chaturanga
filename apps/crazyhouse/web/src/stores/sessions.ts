import { createGameSession, createProgressStore, storageKey } from '@chaturanga/game-shell';
import { crazyhouse } from '@chaturanga/crazyhouse';
import { PRODUCT } from '../../product.config';

/** Local and bot games have independent replayable saves under the Crazyhouse storage prefix. */
export const useLocalSession = createGameSession(crazyhouse, storageKey(PRODUCT, 'session.local'));
export const useBotWhiteSession = createGameSession(crazyhouse, storageKey(PRODUCT, 'session.bot.white'));
export const useBotBlackSession = createGameSession(crazyhouse, storageKey(PRODUCT, 'session.bot.black'));
export const useProgress = createProgressStore(storageKey(PRODUCT, 'progress'));
