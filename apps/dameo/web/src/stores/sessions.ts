import { createGameSession, storageKey } from '@chaturanga/game-shell';
import { dameo } from '@chaturanga/dameo';
import { PRODUCT } from '../../product.config';

/** Separate replayable saves keep pass-and-play and each bot seat independent. */
export const useLocalSession = createGameSession(dameo, storageKey(PRODUCT, 'session.local'));
export const useBotWhiteSession = createGameSession(dameo, storageKey(PRODUCT, 'session.bot.white'));
export const useBotBlackSession = createGameSession(dameo, storageKey(PRODUCT, 'session.bot.black'));
