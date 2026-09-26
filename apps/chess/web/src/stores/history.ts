import { createAnalysisStore, createHistoryStore } from '@chaturanga/game-shell';
import { PRODUCT } from '../../product.config';

/** Every chess game saved in this browser (ch-014), on the shared history store (plat-017). */
export const useGameHistory = createHistoryStore(PRODUCT);

/** Stockfish's view of each position of a saved game (ch-015); dropped with its game. */
export const gameAnalysis = createAnalysisStore(PRODUCT, useGameHistory, 'stockfish-19-lite');
