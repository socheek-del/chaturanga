import { createGameSession, storageKey } from '@chaturanga/game-shell';
import { chuShogiVariant } from '@chaturanga/chu-shogi';
import { PRODUCT } from '../../product.config';

export const useLocalSession = createGameSession(chuShogiVariant, storageKey(PRODUCT, 'session.local'));
export const useBotWhiteSession = createGameSession(chuShogiVariant, storageKey(PRODUCT, 'session.bot.white'));
export const useBotBlackSession = createGameSession(chuShogiVariant, storageKey(PRODUCT, 'session.bot.black'));
