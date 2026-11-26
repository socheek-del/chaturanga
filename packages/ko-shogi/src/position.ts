import { FenError, type Color, type Piece as RulesPiece, type Square } from '@chaturanga/rules-core';
import { BASE_PIECE_TYPES, BOARD_SIZE, FILES, PIECE_TYPES, PROMOTION_OF, RANKS, STARTING_PIECES, coordinateOf } from './layout';
import type { PieceType } from './layout';

export { BOARD_SIZE, FILES, RANKS };
export { BASE_PIECE_TYPES, PIECE_TYPES, PROMOTION_OF, STARTING_PIECES, opposite, squareName, squareOf } from './layout';
export type { PieceType } from './layout';

export type Piece = RulesPiece<PieceType>;
export type Board = Array<Piece | null>;

export interface Position {
  board: Board;
  turn: Color;
  /** A captured member of either priest type permanently disables Banner/Drum promotion for that side. */
  priestLost: { w: boolean; b: boolean };
}

const VALID_PIECE_TYPES = new Set<string>(PIECE_TYPES);

export function makePiece(color: Color, type: PieceType, promoted = false): Piece {
  return { color, type, promoted };
}

export function startingPosition(): Position {
  const board: Board = Array.from({ length: BOARD_SIZE }, () => null);
  for (const piece of STARTING_PIECES) {
    board[piece.square] = makePiece(piece.color, piece.type);
    const rotatedSquare = (RANKS - 1 - Math.floor(piece.square / FILES)) * FILES + (FILES - 1 - piece.square % FILES);
    board[rotatedSquare] = makePiece('b', piece.type);
  }
  return { board, turn: 'b', priestLost: { w: false, b: false } };
}

function token(piece: Piece | null): string {
  if (!piece) return '-';
  if (!VALID_PIECE_TYPES.has(piece.type)) throw new Error(`Unknown Ko Shogi piece type: ${piece.type}`);
  return `${piece.color}:${piece.type}${piece.promoted ? '+' : ''}`;
}

export function placementOf(board: Board): string {
  const rows: string[] = [];
  for (let rank = RANKS; rank >= 1; rank--) {
    const cells = Array.from({ length: FILES }, (_, file) => token(board[(rank - 1) * FILES + file] ?? null));
    rows.push(cells.join(','));
  }
  return rows.join('/');
}

export function positionKey(position: Position): string {
  const lost = `${position.priestLost.w ? 'w' : ''}${position.priestLost.b ? 'b' : ''}` || '-';
  return `${placementOf(position.board)} ${position.turn} ${lost}`;
}

export function fenOf(position: Position): string {
  const lost = `${position.priestLost.w ? 'w' : ''}${position.priestLost.b ? 'b' : ''}` || '-';
  return `ks1 ${position.turn} ${lost} ${placementOf(position.board)}`;
}

export function parseFen(fen: string): Position {
  const invalid = (): FenError => new FenError('Invalid Ko Shogi position', fen);
  const fields = fen.trim().split(/\s+/);
  const [version, turn, lost, placement] = fields;
  if (fields.length !== 4 || version !== 'ks1' || (turn !== 'w' && turn !== 'b') || !lost || !placement || !/^(?:-|w|b|wb)$/.test(lost))
    throw invalid();

  const rows = placement.split('/');
  if (rows.length !== RANKS) throw invalid();
  const board: Board = Array.from({ length: BOARD_SIZE }, () => null);
  for (const [rowIndex, row] of rows.entries()) {
    const tokens = row.split(',');
    if (tokens.length !== FILES) throw invalid();
    const rank = RANKS - rowIndex;
    for (const [file, cell] of tokens.entries()) {
      if (cell === '-') continue;
      const match = /^(w|b):([a-z]+(?:-[a-z]+)*)(\+)?$/.exec(cell);
      if (!match) throw invalid();
      const type = match[2] as PieceType;
      if (!VALID_PIECE_TYPES.has(type) || (match[3] && !PROMOTION_TARGET_TYPES.has(type)) || (!match[3] && !BASE_PIECE_TYPES.includes(type as (typeof BASE_PIECE_TYPES)[number]))) throw invalid();
      board[(rank - 1) * FILES + file] = makePiece(match[1] as Color, type, !!match[3]);
    }
  }

  return { board, turn, priestLost: { w: lost.includes('w'), b: lost.includes('b') } };
}

const PROMOTION_TARGET_TYPES = new Set<PieceType>(Object.values(PROMOTION_OF));

export function onBoard(square: Square): boolean {
  return Number.isInteger(square) && square >= 0 && square < BOARD_SIZE;
}

export function fileOf(square: Square): number { return square % FILES; }
export function rankOf(square: Square): number { return Math.floor(square / FILES) + 1; }
export function shift(square: Square, df: number, dr: number): Square | null {
  const file = fileOf(square) + df;
  const rank = rankOf(square) + dr;
  return file >= 0 && file < FILES && rank >= 1 && rank <= RANKS ? (rank - 1) * FILES + file : null;
}
export function colorPieces(board: Board, color: Color): Array<{ square: Square; piece: Piece }> {
  return board.flatMap((piece, square) => piece?.color === color ? [{ square, piece }] : []);
}
export function cloneBoard(board: Board): Board { return board.map((piece) => piece ? { ...piece } : null); }
export function coordinate(square: Square): { file: number; rank: number } { return coordinateOf(square); }
