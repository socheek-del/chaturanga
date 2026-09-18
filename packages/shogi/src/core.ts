/**
 * Low-level, allocation-light API for search code (packages/shogi-ai).
 * UI code should use the `Game` class from the package root instead.
 */
export * from './board';
export { findKing, inCheck, isAttacked } from './attacks';
export { parseFen, type PositionData, serializeFen } from './fen';
export { encodedToUci } from './game';
export {
  dropType,
  DROP_FLAG,
  encodeDrop,
  encodeMove,
  generateDrops,
  generateLegalMoves,
  generatePieceMoves,
  isDrop,
  isLegal,
  isPromotion,
  makeRaw,
  moveFrom,
  movedCode,
  moveTo,
  type Position,
  PROMO_FLAG,
  uchifuzumeDrops,
  unmakeRaw,
} from './movegen';
