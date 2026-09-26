import { moduleTransport, type ReviewKit, UciEngine } from '@chaturanga/game-shell';
import { type Game, makruk } from '@chaturanga/makruk';
import { botById } from '@chaturanga/makruk-ai';
import { gameAnalysis, useGameHistory } from '../../stores/history';
import { PIECE_VALUE } from '../game/result';

/** Fairy-Stockfish WASM, stored verbatim in public/engine (review-002). */
export const ENGINE_URL = '/engine/stockfish.js';

/**
 * What the shared Games and Review screens need to know about Makruk (review-001, review-002). There is no
 * public Makruk opening list, so there is no opening book and no Book label.
 */
export const makrukReview: ReviewKit<Game> = {
  rules: { variant: makruk, pieceValues: PIECE_VALUE },
  history: useGameHistory,
  analysis: gameAnalysis,
  createEngine: () => new UciEngine(moduleTransport(ENGINE_URL), { UCI_Variant: 'makruk' }),
  pgn: {
    botName: (t, level) => t(`bots.${botById(level).key}.name`),
    // PGN from pychess.org and other sites names the game this way.
    tags: { Variant: 'makruk' },
  },
};
