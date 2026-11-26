import { createGameSession, storageKey } from '@chaturanga/game-shell';
import { infiniteChess } from '@chaturanga/infinite-chess';
import { PRODUCT } from '../../product.config';

export const useGameSession = createGameSession(infiniteChess, storageKey(PRODUCT, 'session.current'));
