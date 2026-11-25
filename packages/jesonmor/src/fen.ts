import { FenError, squareNameOf, squareOf, type Color } from '@chaturanga/rules-core';
import { BLACK, CENTER, codeFromChar, codeToChar, FILES, RANKS, SIZE, type Board } from './board';

export { FenError };

export type GoalState = Color | null;
export type GoalWinner = Color | null;

export interface PositionData {
  board: Board;
  turn: Color;
  halfmove: number;
  fullmove: number;
  pending: GoalState;
  goalWinner: GoalWinner;
}

const DIGITS = /^\d+$/;
const STATE = /^(?:-|w|b|gw|gb)$/;

export const START_FEN = 'nnnnnnnnn/9/9/9/9/9/9/9/NNNNNNNNN w - - 0 1 -';
export const BLACK_TO_MOVE_FEN = START_FEN.replace(' w ', ' b ');

export function parseFen(fen: string): PositionData {
  const fields = fen.trim().split(/\s+/);
  if (fields.length < 2 || fields.length > 7) throw new FenError('FEN must have between 2 and 7 fields', fen);
  const [placement = '', side = '', castling = '-', ep = '-', half = '0', full = '1', state = '-'] = fields;
  const rows = placement.split('/');
  if (rows.length !== RANKS) throw new FenError(`Placement must have ${RANKS} ranks`, fen);
  const board = new Uint8Array(SIZE);
  rows.forEach((row, rowIndex) => {
    let file = 0;
    const rank = RANKS - 1 - rowIndex;
    for (const char of row) {
      if (char >= '1' && char <= '9') {
        file += Number(char);
        continue;
      }
      const code = codeFromChar(char);
      if (!code) throw new FenError(`Invalid piece character '${char}'`, fen);
      if (file >= FILES) throw new FenError(`Rank ${rank + 1} has more than ${FILES} squares`, fen);
      board[rank * FILES + file] = code;
      file++;
    }
    if (file !== FILES) throw new FenError(`Rank ${rank + 1} does not have exactly ${FILES} squares`, fen);
  });

  if (side !== 'w' && side !== 'b') throw new FenError("Side to move must be 'w' or 'b'", fen);
  if (castling !== '-') throw new FenError('Jeson Mor has no castling; the 3rd field must be -', fen);
  if (ep !== '-') throw new FenError('Jeson Mor has no en passant; the 4th field must be -', fen);
  if (!DIGITS.test(half)) throw new FenError('Halfmove field must be a non-negative integer', fen);
  if (!DIGITS.test(full) || Number(full) < 1) throw new FenError('Fullmove field must be a positive integer', fen);
  if (!STATE.test(state)) throw new FenError('Goal state must be -, w, b, gw, or gb', fen);

  const turn: Color = side;
  const pending: GoalState = state === 'w' || state === 'b' ? state : null;
  const goalWinner: GoalWinner = state === 'gw' ? 'w' : state === 'gb' ? 'b' : null;
  if (pending) {
    const centerPiece = board[CENTER]!;
    const expected = pending === 'b' ? BLACK : 0;
    if (!centerPiece || (centerPiece & BLACK) !== expected)
      throw new FenError('A pending center claimant must have its horse on e5', fen);
  }
  if (goalWinner && board[CENTER] !== 0) throw new FenError('A completed center escape leaves e5 empty', fen);
  if (count(board, 'w') === 0 && count(board, 'b') === 0) throw new FenError('Both sides cannot have no horses', fen);

  return { board, turn, halfmove: Number(half), fullmove: Number(full), pending, goalWinner };
}

export function placementOf(board: Board): string {
  const rows: string[] = [];
  for (let rank = RANKS - 1; rank >= 0; rank--) {
    let row = '';
    let empty = 0;
    for (let file = 0; file < FILES; file++) {
      const code = board[rank * FILES + file]!;
      if (!code) {
        empty++;
        continue;
      }
      if (empty) row += String(empty);
      empty = 0;
      row += codeToChar(code);
    }
    if (empty) row += String(empty);
    rows.push(row);
  }
  return rows.join('/');
}

export function serializeFen(position: PositionData): string {
  const state = position.goalWinner ? `g${position.goalWinner}` : position.pending ?? '-';
  return `${placementOf(position.board)} ${position.turn} - - ${position.halfmove} ${position.fullmove} ${state}`;
}

export const count = (board: Board, color: Color): number => {
  const bit = color === 'b' ? BLACK : 0;
  let total = 0;
  for (const code of board) if (code && (code & BLACK) === bit) total++;
  return total;
};

export function squareName(square: number): string {
  return squareNameOf(square, FILES);
}

export function parseSquare(name: string): number | null {
  return squareOf(name, FILES);
}
