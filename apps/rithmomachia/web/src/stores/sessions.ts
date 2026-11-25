import { createGameSession, storageKey } from '@chaturanga/game-shell';
import { rithmomachia } from '@chaturanga/rithmomachia';
import { PRODUCT } from '../../product.config';

/** Separate replayable saves keep pass-and-play and each bot seat independent. */
export const useLocalSession = createGameSession(rithmomachia, storageKey(PRODUCT, 'session.local'));
export const useBotWhiteSession = createGameSession(rithmomachia, storageKey(PRODUCT, 'session.bot.white'));
export const useBotBlackSession = createGameSession(rithmomachia, storageKey(PRODUCT, 'session.bot.black'));
