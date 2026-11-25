/** Low-level board and FEN primitives for Dameo search and fixture construction. */
export { parseFen, placementOf, serializeFen, square, squareName, type Board, type DameoPiece, type PieceType, type Position } from './position';
export { Game } from './game';
export { allCaptureRoutes, legalMoves, type Move } from './movement';
