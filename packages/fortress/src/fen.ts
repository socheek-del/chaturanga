import { FenError } from '@chaturanga/rules-core';
import { BOARD_SIZE, FILES, PLAYERS, isPlayable, parseSquare, squareAt } from './geometry';
import type { PieceType, Seat } from './types';

export interface FortressPiece {
  color: Seat;
  type: PieceType;
  promoted: boolean;
  moved: boolean;
}

export interface Position {
  board: Array<FortressPiece | null>;
  turn: Seat;
  enPassant: number | null;
  enPassantPawn: Seat | null;
  eliminated: Set<Seat>;
  result: 'draw' | 'win' | null;
  winner: Seat | null;
  hands: Record<Seat, PieceType[]>;
  castleRights: Set<string>;
}

const COLOR_LETTER: Record<Seat, string> = { r: 'R', b: 'B', w: 'W', k: 'K' };
const LETTER_COLOR = Object.fromEntries(Object.entries(COLOR_LETTER).map(([seat, letter]) => [letter, seat])) as Record<string, Seat>;
const TYPES: readonly PieceType[] = ['p', 'n', 'b', 'r', 'q', 'k'];

export function colorLetter(seat: Seat): string {
  return COLOR_LETTER[seat];
}

export function serializeBoard(board: readonly (FortressPiece | null)[]): string {
  const rows: string[] = [];
  for (let rank = 15; rank >= 0; rank--) {
    const cells: string[] = [];
    for (let file = 0; file < FILES; file++) {
      const square = squareAt(file, rank);
      if (!isPlayable(square)) {
        cells.push('.');
        continue;
      }
      const piece = board[square];
      cells.push(piece ? `${colorLetter(piece.color)}${piece.type}${piece.moved ? '!' : ''}` : '-');
    }
    rows.push(cells.join(','));
  }
  return rows.join('/');
}

export function serializeHands(hands: Record<Seat, readonly PieceType[]>): string {
  return PLAYERS.map((seat) => `${seat}:${hands[seat].join('') || '-'}`).join(';');
}

export function serializeCastleRights(rights: ReadonlySet<string>): string {
  const records = PLAYERS.map((seat) => `${seat}${['K', 'L', 'R'].filter((right) => rights.has(`${seat}${right}`)).join('')}`)
    .filter((record) => record.length > 1);
  return records.join(',') || '-';
}

export function serializeFen(position: Position): string {
  const eliminated = PLAYERS.filter((seat) => position.eliminated.has(seat)).join('') || '-';
  const outcome = position.result === 'draw' ? 'draw' : position.result === 'win' ? `win${position.winner}` : '-';
  return [
    serializeBoard(position.board),
    position.turn,
    position.enPassant === null || position.enPassantPawn === null ? '-' : `${squareNameForFen(position.enPassant)}${position.enPassantPawn}`,
    eliminated,
    outcome,
    serializeHands(position.hands),
    serializeCastleRights(position.castleRights),
  ].join(' ');
}

// Kept local to avoid making FEN serialization depend on display-oriented callers.
function squareNameForFen(square: number): string {
  return `${String.fromCharCode(97 + square % FILES)}${Math.floor(square / FILES) + 1}`;
}

export function parseFen(fen: string): Position {
  const fields = fen.trim().split(/\s+/);
  const fail = (): never => { throw new FenError('Invalid Russian Fortress Chess FEN', fen); };
  if (fields.length !== 7 || !PLAYERS.includes(fields[1] as Seat)) return fail();
  const [placement, turnField, epField, eliminatedField, outcomeField, handsField, castleField] = fields;
  const rows = placement!.split('/');
  if (rows.length !== 16) return fail();
  const board: Array<FortressPiece | null> = Array<FortressPiece | null>(BOARD_SIZE).fill(null);
  for (let row = 0; row < 16; row++) {
    const cells = rows[row]!.split(',');
    if (cells.length !== FILES) return fail();
    const rank = 15 - row;
    for (let file = 0; file < FILES; file++) {
      const square = squareAt(file, rank);
      const token = cells[file]!;
      if (!isPlayable(square)) {
        if (token !== '.') return fail();
        continue;
      }
      if (token === '-') continue;
      const match = /^([RBWK])([pnbrqk])(!?)$/.exec(token);
      if (!match || !TYPES.includes(match[2] as PieceType)) return fail();
      board[square] = {
        color: LETTER_COLOR[match[1]!]!,
        type: match[2] as PieceType,
        promoted: false,
        moved: match[3] === '!',
      };
    }
  }
  const epMatch = epField === '-' ? null : /^([a-p](?:1[0-6]|[1-9]))([rbwk])$/.exec(epField!);
  const enPassant = epField === '-' ? null : epMatch ? parseSquare(epMatch[1]!) : null;
  const enPassantPawn = epMatch ? epMatch[2] as Seat : null;
  if (epField !== '-' && (enPassant === null || enPassantPawn === null)) return fail();
  const eliminated = new Set<Seat>();
  if (eliminatedField !== '-') {
    for (const char of eliminatedField!) {
      if (!PLAYERS.includes(char as Seat) || eliminated.has(char as Seat)) return fail();
      eliminated.add(char as Seat);
    }
  }
  let result: Position['result'] = null;
  let winner: Seat | null = null;
  if (outcomeField === 'draw') result = 'draw';
  else if (/^win[rbwk]$/.test(outcomeField!)) {
    result = 'win';
    winner = outcomeField!.slice(3) as Seat;
    if (eliminated.has(winner)) return fail();
  } else if (outcomeField !== '-') return fail();

  const hands: Record<Seat, PieceType[]> = { r: [], b: [], w: [], k: [] };
  if (handsField !== '-') {
    const records = handsField!.split(';');
    if (records.length !== PLAYERS.length) return fail();
    for (const record of records) {
      const match = /^([rbwk]):(-|[bnr]*)$/.exec(record);
      if (!match) return fail();
      const seat = match[1] as Seat;
      const types = match[2] === '-' ? [] : [...match[2]!].map((type) => type as PieceType);
      if (!PLAYERS.includes(seat) || hands[seat].length > 0 || new Set(types).size !== types.length) return fail();
      hands[seat] = types;
    }
    if (new Set(records.map((record) => record[0])).size !== PLAYERS.length) return fail();
  }

  const castleRights = new Set<string>();
  if (castleField !== '-') {
    for (const record of castleField!.split(',')) {
      const match = /^([rbwk])([KLR]+)$/.exec(record);
      if (!match || !PLAYERS.includes(match[1] as Seat)) return fail();
      const seat = match[1] as Seat;
      for (const right of match[2]!) {
        const rightKey = `${seat}${right}`;
        if (castleRights.has(rightKey)) return fail();
        castleRights.add(rightKey);
      }
    }
  }

  const active = PLAYERS.filter((seat) => !eliminated.has(seat));
  for (const seat of active) {
    if (!hands[seat].length && !board.some((piece) => piece?.color === seat && piece.type === 'k')) return fail();
  }
  return {
    board,
    turn: turnField as Seat,
    enPassant,
    enPassantPawn,
    eliminated,
    result,
    winner,
    hands,
    castleRights,
  };
}
