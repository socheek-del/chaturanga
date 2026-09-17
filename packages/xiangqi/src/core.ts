/**
 * Low-level, allocation-light API for search code (packages/xiangqi-ai).
 * UI code should use the `Game` class from the package root instead.
 */
export * from './board';
export { findGeneral, inCheck, isAttacked } from './attacks';
export { parseFen, type PositionData, serializeFen } from './fen';
export { encodedToUci } from './game';
export {
  encodeMove,
  generateLegalMoves,
  generatePieceMoves,
  isLegal,
  makeRaw,
  moveFrom,
  moveTo,
  unmakeRaw,
} from './movegen';
