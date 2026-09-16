/**
 * Xiangqi FEN, compatible with Fairy-Stockfish:
 *   <placement> <side> - - <halfmove> <fullmove>
 * 10 ranks of 9 files each, rank 10 (Black's side) first. No hands, no promotion; the castling and en
 * passant fields are always `-`. The halfmove field counts plies since the last capture (Xiangqi has no
 * analogue of a pawn move resetting it).
 */
import { type ColorIndex, FenError, type Board } from '@chaturanga/rules-core';
import { codeToChar, FILES, GENERAL, RANKS, SIZE, typeFromChar } from './board';
import { inCheck } from './attacks';

export { FenError };

export const START_FEN = 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1';

export interface PositionData {
  board: Board;
  turn: ColorIndex;
  rule50: number;
  fullmove: number;
}

const DIGITS = /^\d+$/;

export function parseFen(fen: string): PositionData {
  const fields = fen.trim().split(/\s+/);
  if (fields.length < 2 || fields.length > 6) throw new FenError('FEN must have between 2 and 6 fields', fen);
  const [placement = '', side = '', castling = '-', ep = '-', half = '0', full = '1'] = fields;

  const rows = placement.split('/');
  if (rows.length !== RANKS) throw new FenError(`Placement must have ${RANKS} ranks`, fen);

  const board = new Uint8Array(SIZE);
  rows.forEach((row, i) => {
    const rank = RANKS - 1 - i;
    let file = 0;
    for (let j = 0; j < row.length; j++) {
      const ch = row[j]!;
      if (ch >= '1' && ch <= '9') {
        file += Number(ch);
        continue;
      }
      const type = typeFromChar(ch);
      if (!type) throw new FenError(`Invalid piece character '${ch}'`, fen);
      if (file >= FILES) throw new FenError(`Rank ${rank + 1} has more than ${FILES} squares`, fen);
      const code = type | (ch === ch.toLowerCase() ? 8 : 0);
      board[rank * FILES + file] = code;
      file++;
    }
    if (file !== FILES) throw new FenError(`Rank ${rank + 1} does not have exactly ${FILES} squares`, fen);
  });

  for (const c of [0, 1] as const) {
    let count = 0;
    for (const p of board) if ((p & 7) === GENERAL && (p & 8 ? 1 : 0) === c) count++;
    if (count !== 1) throw new FenError(`${c ? 'Black' : 'Red'} must have exactly one general`, fen);
  }

  if (side !== 'w' && side !== 'b') throw new FenError("Side to move must be 'w' or 'b'", fen);
  const turn: ColorIndex = side === 'b' ? 1 : 0;
  if (castling !== '-') throw new FenError('Xiangqi has no castling; the 3rd field must be -', fen);
  if (ep !== '-') throw new FenError('Xiangqi has no en passant; the 4th field must be -', fen);
  if (!DIGITS.test(half)) throw new FenError('Halfmove field must be a number', fen);
  if (!DIGITS.test(full)) throw new FenError('Fullmove field must be a number', fen);

  if (inCheck(board, turn === 0 ? 1 : 0)) throw new FenError('The side not to move is in check', fen);

  return { board, turn, rule50: Number(half), fullmove: Math.max(Number(full), 1) };
}

export function placementOf(board: Board): string {
  const rows: string[] = [];
  for (let rank = RANKS - 1; rank >= 0; rank--) {
    let row = '';
    let empty = 0;
    for (let file = 0; file < FILES; file++) {
      const p = board[rank * FILES + file]!;
      if (p === 0) {
        empty++;
        continue;
      }
      if (empty) row += String(empty);
      empty = 0;
      row += codeToChar(p);
    }
    if (empty) row += String(empty);
    rows.push(row);
  }
  return rows.join('/');
}

export function serializeFen(pos: PositionData): string {
  const side = pos.turn === 1 ? 'b' : 'w';
  return `${placementOf(pos.board)} ${side} - - ${pos.rule50} ${pos.fullmove}`;
}
