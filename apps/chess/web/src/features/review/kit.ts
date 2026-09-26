import { chess, type Game, resolveSan } from '@chaturanga/chess';
import { botById } from '@chaturanga/chess-ai';
import { type ReviewKit, UciEngine, workerTransport } from '@chaturanga/game-shell';
import { gameAnalysis, useGameHistory } from '../../stores/history';
import { PIECE_VALUE } from '../game/GameScreen';
import { loadOpeningBook } from './openings';

/** Stockfish 19 lite, stored verbatim in public/engine (ch-015). */
export const ENGINE_URL = '/engine/stockfish.js';

/** What the shared Games and Review screens need to know about chess (plat-017). */
export const chessReview: ReviewKit<Game> = {
  rules: {
    variant: chess,
    pieceValues: PIECE_VALUE,
    // A passed turn has no en passant capture: the square only belongs to the side that just moved.
    passTurn: (fen) => {
      const fields = fen.split(' ');
      fields[1] = fields[1] === 'w' ? 'b' : 'w';
      fields[3] = '-';
      return fields.join(' ');
    },
  },
  history: useGameHistory,
  analysis: gameAnalysis,
  createEngine: () => new UciEngine(workerTransport(ENGINE_URL)),
  loadBook: loadOpeningBook,
  pgn: {
    botName: (t, level) => t(`bots.${botById(level).key}.name`),
    resolve: resolveSan,
  },
};
