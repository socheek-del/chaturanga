import {
  FenError,
  squareNameOf,
  squareOf,
  type Color,
  type Piece as RulesPiece,
  type Square,
} from '@chaturanga/rules-core';

export const FILES = 7;
export const RANKS = 7;
export const BOARD_SIZE = FILES * RANKS;
export const RIVER_RANK = 3;
export const PIECE_TYPES = ['l', 'z', 'e', 'g', 'c', 'm', 'p', 's'] as const;
export type PieceType = (typeof PIECE_TYPES)[number];
export type Piece = RulesPiece<PieceType> & { riverDeadline: boolean };
export type Board = Array<Piece | null>;

export interface Position {
  board: Board;
  turn: Color;
  halfmove: number;
  fullmove: number;
}

export const opposite = (color: Color): Color => color === 'w' ? 'b' : 'w';
export const fileOf = (square: Square): number => square % FILES;
export const rankOf = (square: Square): number => Math.floor(square / FILES);
export const onBoard = (file: number, rank: number): boolean =>
  file >= 0 && file < FILES && rank >= 0 && rank < RANKS;
export const squareName = (square: Square): string => squareNameOf(square, FILES);
export const square = (name: string): Square => {
  const value = squareOf(name, FILES);
  if (value === null || value >= BOARD_SIZE) throw new Error(`Not a Congo square: ${name}`);
  return value;
};

export const START_FEN = 'gmelecz/ppppppp/7/7/7/PPPPPPP/GMELECZ w - 0 1';

export function placementOf(board: Board): string {
  const rows: string[] = [];
  for (let rank = RANKS - 1; rank >= 0; rank--) {
    let row = '';
    let empty = 0;
    for (let file = 0; file < FILES; file++) {
      const piece = board[rank * FILES + file];
      if (!piece) {
        empty++;
        continue;
      }
      if (empty) row += String(empty);
      empty = 0;
      row += piece.color === 'w' ? piece.type.toUpperCase() : piece.type;
      if (piece.riverDeadline) row += '!';
    }
    rows.push(row + (empty || ''));
  }
  return rows.join('/');
}

export function parseFen(fen: string): Position {
  const fields = fen.trim().split(/\s+/);
  const [placement, turn, reserved, halfmoveText, fullmoveText] = fields;
  const invalid = () => new FenError('Invalid Congo position', fen);
  if (fields.length !== 5 || (turn !== 'w' && turn !== 'b') || reserved !== '-' ||
      !/^\d+$/.test(halfmoveText ?? '') || !/^[1-9]\d*$/.test(fullmoveText ?? '') ||
      !Number.isSafeInteger(Number(halfmoveText)) || !Number.isSafeInteger(Number(fullmoveText))) throw invalid();

  const rows = placement!.split('/');
  if (rows.length !== RANKS) throw invalid();
  const board: Board = Array.from({ length: BOARD_SIZE }, () => null);
  const lions: Record<Color, number> = { w: 0, b: 0 };
  for (const [rowIndex, text] of rows.entries()) {
    let file = 0;
    const tokens = text.match(/\d+|[A-Za-z]!?/g) ?? [];
    if (tokens.join('') !== text) throw invalid();
    for (const token of tokens) {
      if (/^\d+$/.test(token)) {
        if (!/^[1-7]$/.test(token)) throw invalid();
        file += Number(token);
        continue;
      }
      const letter = token[0]!;
      const type = letter.toLowerCase() as PieceType;
      const marked = token.endsWith('!');
      const color: Color = letter === type ? 'b' : 'w';
      const rank = RANKS - 1 - rowIndex;
      const target = rank * FILES + file++;
      if (file > FILES || !PIECE_TYPES.includes(type)) throw invalid();
      if (type === 'l') lions[color]++;
      if (marked && (rank !== RIVER_RANK || type === 'c')) throw invalid();
      if (rank === RIVER_RANK && type !== 'c' && !marked) throw invalid();
      if (rank === RIVER_RANK && type === 'l') throw invalid();
      board[target] = { color, type, promoted: type === 's', riverDeadline: marked };
    }
    if (file !== FILES) throw invalid();
  }
  if (lions.w > 1 || lions.b > 1 || (lions.w === 0 && lions.b === 0)) throw invalid();
  return { board, turn, halfmove: Number(halfmoveText), fullmove: Number(fullmoveText) };
}

export function keyOf(position: Position): string {
  return `${placementOf(position.board)} ${position.turn}`;
}
