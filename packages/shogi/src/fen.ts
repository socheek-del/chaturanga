/**
 * Shogi FEN, compatible with Fairy-Stockfish:
 *   <placement>[<pieces in hand>] <side> - - <halfmove> <fullmove>
 * 9 ranks of 9 files each, rank 9 (Gote's back rank) first. A promoted piece is written with a `+`
 * prefix, so a square can be two characters. Pieces in hand are listed Sente (upper case) then Gote, each
 * in the order Fairy-Stockfish prints them (G N L P S R B). Shogi has no castling or en passant, so the
 * third and fourth fields are always `-`.
 */
import { FenError } from '@chaturanga/rules-core';
import {
  BLACK,
  type Board,
  type ColorIndex,
  codeToChar,
  emptyHands,
  FILES,
  HAND_ORDER,
  type Hands,
  KING,
  PROMOTED,
  RANKS,
  SIZE,
  typeFromChar,
  TYPE_MASK,
} from './board';
import { inCheck } from './attacks';

export { FenError };

export const START_FEN = 'lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL[] w - - 0 1';

export interface PositionData {
  board: Board;
  hands: Hands;
  turn: ColorIndex;
  rule50: number;
  fullmove: number;
}

const DIGITS = /^\d+$/;
const PLACEMENT = /^([^[\]]+)(?:\[([^[\]]*)\])?$/;

export function parseFen(fen: string): PositionData {
  const fields = fen.trim().split(/\s+/);
  if (fields.length < 2 || fields.length > 6) throw new FenError('FEN must have between 2 and 6 fields', fen);
  const [first = '', side = '', castling = '-', ep = '-', half = '0', full = '1'] = fields;

  const match = PLACEMENT.exec(first);
  if (!match) throw new FenError('Pieces in hand must be a single [...] group after the placement', fen);
  const rows = match[1]!.split('/');
  if (rows.length !== RANKS) throw new FenError(`Placement must have ${RANKS} ranks`, fen);

  const board = new Uint8Array(SIZE);
  rows.forEach((row, i) => {
    const rank = RANKS - 1 - i;
    let file = 0;
    let promoted = false;
    for (let j = 0; j < row.length; j++) {
      const ch = row[j]!;
      if (ch === '+') {
        if (promoted) throw new FenError("Two '+' markers in a row", fen);
        promoted = true;
        continue;
      }
      if (ch >= '1' && ch <= '9') {
        if (promoted) throw new FenError("'+' must be followed by a piece", fen);
        file += Number(ch);
        continue;
      }
      const type = typeFromChar(ch);
      if (!type) throw new FenError(`Invalid piece character '${ch}'`, fen);
      if (file >= FILES) throw new FenError(`Rank ${rank + 1} has more than ${FILES} squares`, fen);
      if (promoted && (type === KING || type === typeFromChar('g'))) {
        throw new FenError(`A ${ch.toLowerCase() === 'k' ? 'king' : 'gold'} cannot be promoted`, fen);
      }
      board[rank * FILES + file] = type | (promoted ? PROMOTED : 0) | (ch === ch.toLowerCase() ? BLACK : 0);
      promoted = false;
      file++;
    }
    if (promoted) throw new FenError("'+' must be followed by a piece", fen);
    if (file !== FILES) throw new FenError(`Rank ${rank + 1} does not have exactly ${FILES} squares`, fen);
  });

  const hands = emptyHands();
  for (const ch of match[2] ?? '') {
    const type = typeFromChar(ch);
    if (!type) throw new FenError(`Invalid piece character '${ch}' in hand`, fen);
    if (type === KING) throw new FenError('A king cannot be in hand', fen);
    const hand = hands[ch === ch.toLowerCase() ? 1 : 0];
    hand[type] = hand[type]! + 1;
  }

  for (const c of [0, 1] as const) {
    const code = KING | (c ? BLACK : 0);
    let kings = 0;
    for (const p of board) if (p === code) kings++;
    if (kings !== 1) throw new FenError(`${c ? 'Gote' : 'Sente'} must have exactly one king`, fen);
  }

  if (side !== 'w' && side !== 'b') throw new FenError("Side to move must be 'w' or 'b'", fen);
  const turn: ColorIndex = side === 'b' ? 1 : 0;
  if (castling !== '-') throw new FenError('Shogi has no castling; the 3rd field must be -', fen);
  if (ep !== '-') throw new FenError('Shogi has no en passant; the 4th field must be -', fen);
  if (!DIGITS.test(half)) throw new FenError('Halfmove field must be a number', fen);
  if (!DIGITS.test(full)) throw new FenError('Fullmove field must be a number', fen);

  if (inCheck(board, turn === 0 ? 1 : 0)) throw new FenError('The side not to move is in check', fen);

  return { board, hands, turn, rule50: Number(half), fullmove: Math.max(Number(full), 1) };
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

export function handsOf(hands: Hands): string {
  let out = '';
  for (const c of [0, 1] as const) {
    for (const type of HAND_ORDER)
      out += codeToChar((type & TYPE_MASK) | (c ? BLACK : 0)).repeat(hands[c][type]!);
  }
  return out;
}

export function serializeFen(pos: PositionData): string {
  const side = pos.turn === 1 ? 'b' : 'w';
  return `${placementOf(pos.board)}[${handsOf(pos.hands)}] ${side} - - ${pos.rule50} ${pos.fullmove}`;
}
