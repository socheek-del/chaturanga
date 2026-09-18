/**
 * Low-level, allocation-light API for search code (packages/chess-ai).
 * UI code should use the `Game` class from the package root instead.
 */
export * from './board';
export { findKing, inCheck, isAttacked } from './attacks';
export { castlingOf, normalizeEp, parseFen, placementOf, type PositionData, serializeFen, START_FEN } from './fen';
export { deadPosition, FIFTY_MOVE_PLIES, insufficientMaterial, REPETITION_LIMIT, repetitionCount } from './gameEnd';
export { encodedToUci } from './game';
export {
  capturedOf,
  encodeMove,
  epCaptureExists,
  generateLegalMoves,
  generateMoves,
  generatePieceMoves,
  hasLegalMove,
  isCastling,
  isEnPassant,
  isLegal,
  isSlider,
  isTactical,
  makeRaw,
  moveFrom,
  movePromotion,
  moveTo,
  movedCode,
  type Position,
  unmakeRaw,
} from './movegen';
