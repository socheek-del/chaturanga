import { FenError, squareNameOf, squareOf, type Color, type Square } from '@chaturanga/rules-core';
import { BLACK_SETUP, WHITE_SETUP } from './layout';

export type PieceType = 'm' | 'k';

export interface DameoPiece {
  readonly color: Color;
  readonly type: PieceType;
  readonly promoted: boolean;
}

export type Board = (DameoPiece | null)[];

export interface Position {
  readonly board: Board;
  readonly turn: Color;
}

export const opposite = (color: Color): Color => color === 'w' ? 'b' : 'w';
export const squareName = (square: Square): string => squareNameOf(square, 8);
export const square = (name: string): Square => {
  const result = squareOf(name, 8);
  if (result === null) throw new RangeError(`Invalid Dameo square: ${name}`);
  return result;
};

function fenToken(piece: DameoPiece): string {
  const letter = piece.type;
  return piece.color === 'w' ? letter.toUpperCase() : letter;
}

export function placementOf(board: readonly (DameoPiece | null)[]): string {
  const rows: string[] = [];
  for (let rank = 7; rank >= 0; rank--) {
    let row = '';
    let empty = 0;
    for (let file = 0; file < 8; file++) {
      const piece = board[rank * 8 + file]!;
      if (!piece) {
        empty++;
        continue;
      }
      if (empty) row += String(empty);
      empty = 0;
      row += fenToken(piece);
    }
    if (empty) row += String(empty);
    rows.push(row);
  }
  return rows.join('/');
}

export function serializeFen(position: Position): string {
  return `${placementOf(position.board)} ${position.turn}`;
}

function tokenPiece(token: string): DameoPiece | null {
  if (!['M', 'm', 'K', 'k'].includes(token)) return null;
  const type = token.toLowerCase() as PieceType;
  return {
    color: token === token.toUpperCase() ? 'w' : 'b',
    type,
    promoted: type === 'k',
  };
}

export function parseFen(fen: string): Position {
  const fields = fen.trim().split(/\s+/);
  if (fields.length !== 2 || (fields[1] !== 'w' && fields[1] !== 'b'))
    throw new FenError('Expected an 8×8 placement and side to move', fen);
  const rows = fields[0]!.split('/');
  if (rows.length !== 8) throw new FenError('Dameo FEN must contain eight ranks', fen);

  const board: Board = Array(64).fill(null);
  for (const [rowIndex, row] of rows.entries()) {
    let file = 0;
    let previousWasNumber = false;
    const rank = 7 - rowIndex;
    for (const token of row) {
      if (/^[1-8]$/.test(token)) {
        if (previousWasNumber) throw new FenError('Adjacent empty-square counts are not canonical', fen);
        file += Number(token);
        previousWasNumber = true;
        continue;
      }
      const piece = tokenPiece(token);
      if (!piece) throw new FenError(`Unknown Dameo piece: ${token}`, fen);
      if (file >= 8) throw new FenError('A rank exceeds eight files', fen);
      board[rank * 8 + file] = piece;
      file++;
      previousWasNumber = false;
    }
    if (file !== 8) throw new FenError('Each Dameo rank must contain eight files', fen);
  }

  return { board, turn: fields[1] };
}

function startingBoard(): Board {
  const board: Board = Array(64).fill(null);
  for (const target of WHITE_SETUP) board[target] = { color: 'w', type: 'm', promoted: false };
  for (const target of BLACK_SETUP) board[target] = { color: 'b', type: 'm', promoted: false };
  return board;
}

export const START_FEN = serializeFen({ board: startingBoard(), turn: 'w' });

export function countPieces(board: readonly (DameoPiece | null)[], color: Color): number {
  return board.reduce((count, piece) => count + Number(piece?.color === color), 0);
}

export function positionKey(position: Position): string {
  return `${placementOf(position.board)} ${position.turn}`;
}
