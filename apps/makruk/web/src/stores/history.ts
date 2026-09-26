import { createAnalysisStore, createHistoryStore } from '@chaturanga/game-shell';
import { PRODUCT } from '../../product.config';

/** Every Makruk game saved in this browser (review-001), on the shared history store (plat-017). */
export const useGameHistory = createHistoryStore(PRODUCT);

/** Fairy-Stockfish's view of each position of a saved game (review-002); dropped with its game. */
export const gameAnalysis = createAnalysisStore(PRODUCT, useGameHistory, 'fairy-stockfish-wasm-1.1.12');
