import { createProgressStore } from '@chaturanga/game-shell';
import { PRODUCT } from '../../product.config';

/** Lesson progress for this product, under its own storage prefix so the sites never share a key. */
export const useProgress = createProgressStore(`${PRODUCT.storagePrefix}progress`);
