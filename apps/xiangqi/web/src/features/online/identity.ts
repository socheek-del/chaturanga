import { createIdentity, storageKey } from '@chaturanga/game-shell';
import { PRODUCT } from '../../../product.config';

/**
 * Anonymous seat token for online play, kept under `xiangqi.identity`. There are no accounts: the token only
 * lets this site's Worker recognise the browser, so a reload returns the player to their seat.
 */
export const identity = createIdentity(storageKey(PRODUCT, 'identity'));
