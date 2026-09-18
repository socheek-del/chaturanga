/**
 * Game-independent board UI for the game sites: a grid board of any size, pieces-in-hand trays and tap/drag
 * move input driven by an engine's legal moves in coordinate notation. Piece art, colours and words come
 * from each app.
 */
export { Board, type BoardHandle, type BoardProps, pieceCode } from './Board';
export { type ParsedMove, parseUci, squareNameOf, squareOf } from './coords';
export { HandTray, type HandTrayProps } from './HandTray';
export type { BoardTheme } from './theme';
export {
  type MoveInput,
  type MoveInputOptions,
  type MoveSource,
  type PromotionChoice,
  useMoveInput,
} from './useMoveInput';
