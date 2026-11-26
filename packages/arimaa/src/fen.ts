import { FenError, squareOf, type Color } from '@chaturanga/rules-core';
import {
  BLACK,
  charToCode,
  codeToChar,
  FILES,
  HAND_ORDER,
  INVENTORY,
  PIECE_TYPES,
  RANKS,
  SIZE,
  type Board,
  type PieceType,
} from './board';

export { FenError };

export interface Hands {
  w: PieceType[];
  b: PieceType[];
}

export interface PositionData {
  board: Board;
  hands: Hands;
  turn: Color;
  halfmove: number;
  fullmove: number;
}

export const START_FEN = '8/8/8/8/8/8/8/8[EMHHDDCCRRRRRRRRemhhddccrrrrrrrr] w - - 0 1';

const DIGITS = /^\d+$/;

export function countPieces(board: Board, color: Color, type?: PieceType): number {
  let count = 0;
  for (const code of board) {
    if (code && (code & BLACK ? 'b' : 'w') === color && (!type || (code & 7) === PIECE_TYPES.indexOf(type) + 1))
      count++;
  }
  return count;
}

export function countRabbits(board: Board, color: Color): number {
  return countPieces(board, color, 'r');
}

function countHand(hand: readonly PieceType[], type?: PieceType): number {
  return type ? hand.filter((piece) => piece === type).length : hand.length;
}

function validateInventory(board: Board, hands: Hands, fen: string): void {
  for (const color of ['w', 'b'] as const) {
    for (const type of PIECE_TYPES) {
      if (countPieces(board, color, type) + countHand(hands[color], type) > INVENTORY[type])
        throw new FenError(`${color === 'w' ? 'Gold' : 'Silver'} has too many ${type.toUpperCase()} pieces`, fen);
    }
  }

  const goldInHand = hands.w.length;
  const silverInHand = hands.b.length;
  if (!goldInHand && !silverInHand) return;

  const inHomeRanks = (color: Color): boolean =>
    Array.from(board).every((code, square) => {
      if (!code || (code & BLACK ? 'b' : 'w') !== color) return true;
      const rank = Math.floor(square / FILES) + 1;
      return color === 'w' ? rank <= 2 : rank >= 7;
    });

  const hasFullInventory = (color: Color): boolean =>
    PIECE_TYPES.every(
      (type) => countPieces(board, color, type) + countHand(hands[color], type) === INVENTORY[type],
    );

  if (goldInHand > 0) {
    if (hands.b.length !== 16 || countPieces(board, 'b') !== 0 || !inHomeRanks('w') || !hasFullInventory('w'))
      throw new FenError('During Gold setup, only Gold may be placed and both armies must remain complete', fen);
  } else if (
    silverInHand > 0 &&
    (countPieces(board, 'w') !== 16 || !inHomeRanks('w') || !inHomeRanks('b') || !hasFullInventory('b'))
  ) {
    throw new FenError('During Silver setup, Gold must be fully placed before Silver', fen);
  }
}

export function parseFen(fen: string): PositionData {
  const fields = fen.trim().split(/\s+/);
  if (fields.length < 2 || fields.length > 6) throw new FenError('Arimaa FEN must have between 2 and 6 fields', fen);
  const [placementField = '', side = '', castling = '-', ep = '-', half = '0', full = '1'] = fields;
  const handStart = placementField.indexOf('[');
  const handEnd = placementField.indexOf(']');
  if (
    !placementField ||
    (handStart >= 0 && (handEnd !== placementField.length - 1 || handEnd < handStart || placementField.indexOf('[', handStart + 1) >= 0)) ||
    (handStart >= 0 && handEnd === handStart + 1) ||
    (handStart < 0 && handEnd >= 0)
  )
    throw new FenError('Pieces in hand must follow the board in one [...] group', fen);
  const boardPlacement = handStart < 0 ? placementField : placementField.slice(0, handStart);
  const handPlacement = handStart < 0 ? '' : placementField.slice(handStart + 1, handEnd);

  const rows = boardPlacement.split('/');
  if (rows.length !== RANKS) throw new FenError('Arimaa placement must have eight ranks', fen);
  const board = new Uint8Array(SIZE);
  rows.forEach((row, rowIndex) => {
    let file = 0;
    let previousWasNumber = false;
    const rank = RANKS - rowIndex;
    for (const char of row) {
      if (/^[1-8]$/.test(char)) {
        if (previousWasNumber) throw new FenError('Adjacent empty-square counts are not canonical', fen);
        file += Number(char);
        previousWasNumber = true;
        continue;
      }
      const code = charToCode(char);
      if (code === null) throw new FenError(`Invalid Arimaa piece '${char}'`, fen);
      if (file >= FILES) throw new FenError(`Rank ${rank} has more than eight squares`, fen);
      board[(rank - 1) * FILES + file] = code;
      file++;
      previousWasNumber = false;
    }
    if (file !== FILES) throw new FenError(`Rank ${rank} does not have exactly eight squares`, fen);
  });

  const hands: Hands = { w: [], b: [] };
  for (const char of handPlacement) {
    const code = charToCode(char);
    if (code === null) throw new FenError(`Invalid piece '${char}' in hand`, fen);
    hands[code & BLACK ? 'b' : 'w'].push(char.toLowerCase() as PieceType);
  }

  if (side !== 'w' && side !== 'b') throw new FenError("Side to move must be 'w' or 'b'", fen);
  if (castling !== '-') throw new FenError('Arimaa has no castling; the third field must be -', fen);
  if (ep !== '-') throw new FenError('Arimaa has no en passant; the fourth field must be -', fen);
  if (!DIGITS.test(half)) throw new FenError('Halfmove field must be a non-negative integer', fen);
  if (!DIGITS.test(full) || Number(full) < 1) throw new FenError('Fullmove field must be a positive integer', fen);

  const position: PositionData = { board, hands, turn: side, halfmove: Number(half), fullmove: Number(full) };
  validateInventory(board, hands, fen);
  for (const trap of [18, 21, 42, 45]) {
    const trapped = board[trap]!;
    if (!trapped) continue;
    const file = trap % FILES;
    const rank = Math.floor(trap / FILES);
    const adjacent = [
      ...(rank > 0 ? [trap - FILES] : []),
      ...(file + 1 < FILES ? [trap + 1] : []),
      ...(rank + 1 < RANKS ? [trap + FILES] : []),
      ...(file > 0 ? [trap - 1] : []),
    ];
    if (!adjacent.some((square) => board[square] && (board[square]! & BLACK) === (trapped & BLACK)))
      throw new FenError('A piece on a trap must have adjacent friendly support', fen);
  }
  if (hands.w.length && position.turn !== 'w') throw new FenError('Gold must finish setup first', fen);
  if (!hands.w.length && hands.b.length && position.turn !== 'b') throw new FenError('Silver must place its army second', fen);
  return position;
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

export function handsOf(hands: Hands): string {
  return (['w', 'b'] as const)
    .map((color) => HAND_ORDER.map((type) => (color === 'w' ? type.toUpperCase() : type).repeat(countHand(hands[color], type))).join(''))
    .join('');
}

export function serializeFen(position: PositionData): string {
  const hand = handsOf(position.hands);
  const placement = `${placementOf(position.board)}${hand ? `[${hand}]` : ''}`;
  return `${placement} ${position.turn} - - ${position.halfmove} ${position.fullmove}`;
}

export function positionKey(position: Pick<PositionData, 'board' | 'turn'>): string {
  let board = '';
  for (const code of position.board) board += code ? code.toString(16) : '.';
  return `${board} ${position.turn}`;
}

export function parseSquare(name: string): number | null {
  return squareOf(name, FILES);
}
