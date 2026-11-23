/**
 * Low-level, allocation-light API for search code (packages/janggi-ai).
 * UI code should use the `Game` class from the package root instead.
 */
export * from './board';
export { findGeneral, generalsFace, inCheck, isAttacked } from './attacks';
export { parseFen, type PositionData, serializeFen } from './fen';
export { pointsWinner } from './gameEnd';
export { encodedToUci } from './game';
export {
  encodeMove,
  generateLegalMoves,
  generatePieceMoves,
  isLegal,
  isPass,
  makeRaw,
  moveFrom,
  moveTo,
  unmakeRaw,
} from './movegen';
