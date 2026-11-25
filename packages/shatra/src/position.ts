import {
  FenError,
  squareNameOf,
  squareOf,
  type Color,
  type Piece as RulesPiece,
  type Square,
} from '@chaturanga/rules-core';

export const FILES = 7;
export const RANKS = 14;
export const BOARD_SIZE = FILES * RANKS;
export const PIECE_TYPES = ['k', 's', 'b'] as const;
export type PieceType = (typeof PIECE_TYPES)[number];
export type Piece = RulesPiece<PieceType>;
export type Board = Array<Piece | null>;
export interface HorizontalLock { square: Square; direction: -1 | 1 }
export type Locks = Record<Color, HorizontalLock | null>;
export interface Position {
  board: Board;
  turn: Color;
  locks: Locks;
  halfmove: number;
  fullmove: number;
}

export const START_FEN = (() => {
  const board: Board = Array.from({ length: BOARD_SIZE }, () => null);
  for (let field = 1; field <= 9; field++) board[squareForField(field)] = { color: 'b', type: 's', promoted: false };
  board[squareForField(10)] = { color: 'b', type: 'k', promoted: false };
  for (let field = 11; field <= 24; field++) board[squareForField(field)] = { color: 'b', type: 's', promoted: false };
  for (let field = 39; field <= 52; field++) board[squareForField(field)] = { color: 'w', type: 's', promoted: false };
  board[squareForField(53)] = { color: 'w', type: 'k', promoted: false };
  for (let field = 54; field <= 62; field++) board[squareForField(field)] = { color: 'w', type: 's', promoted: false };
  return `${placementOf(board)} w - 0 1`;
})();

export const opposite = (color: Color): Color => color === 'w' ? 'b' : 'w';
export const fileOf = (square: Square): number => square % FILES;
export const rankOf = (square: Square): number => Math.floor(square / FILES);
export const squareName = (square: Square): string => squareNameOf(square, FILES);
export const square = (name: string): Square => {
  const value = squareOf(name, FILES);
  if (value === null || !isPlayable(value)) throw new Error(`Not a Shatra field: ${name}`);
  return value;
};

/** Maps the rules' 1–62 field numbering to the 7×14 coordinate grid. */
export function squareForField(field: number): Square {
  if (!Number.isInteger(field) || field < 1 || field > 62) throw new RangeError(`Invalid Shatra field ${field}`);
  let row: number;
  let file: number;
  if (field <= 9) {
    row = Math.floor((field - 1) / 3);
    file = 2 + ((field - 1) % 3);
  } else if (field === 10) {
    row = 3;
    file = 3;
  } else if (field <= 52) {
    const index = field - 11;
    row = 4 + Math.floor(index / 7);
    file = index % 7;
  } else if (field === 53) {
    row = 10;
    file = 3;
  } else {
    const index = field - 54;
    row = 11 + Math.floor(index / 3);
    file = 2 + (index % 3);
  }
  return (RANKS - 1 - row) * FILES + file;
}

const fieldBySquare = new Map(Array.from({ length: 62 }, (_, index) => {
  const field = index + 1;
  return [squareForField(field), field] as const;
}));

export const fieldOf = (square: Square): number | null => fieldBySquare.get(square) ?? null;
export const isPlayable = (square: Square): boolean => fieldBySquare.has(square);
export const isFortress = (square: Square): boolean => {
  const field = fieldOf(square);
  return field !== null && (field <= 9 || field >= 54);
};
export const isGate = (square: Square): boolean => square === squareForField(10) || square === squareForField(53);
export const isGateOrFortress = (square: Square): boolean => isGate(square) || isFortress(square);
export const fortressOwner = (square: Square): Color | null => {
  const field = fieldOf(square);
  if (field === null) return null;
  if (field <= 9 || field === 10) return 'b';
  if (field >= 54 || field === 53) return 'w';
  return null;
};

export function deploymentSide(square: Square): Color | null {
  return isGateOrFortress(square) ? fortressOwner(square) : null;
}

export function deploymentFields(color: Color): Square[] {
  const start = color === 'w' ? 32 : 11;
  const end = color === 'w' ? 52 : 31;
  return Array.from({ length: end - start + 1 }, (_, index) => squareForField(start + index));
}

export function reserveShatras(board: Board, color: Color): number {
  return board.reduce((count, piece, from) =>
    count + (piece?.color === color && piece.type === 's' && fortressOwner(from) === color ? 1 : 0), 0);
}

export function promotionTarget(square: Square, color: Color): boolean {
  const field = fieldOf(square);
  return color === 'w' ? field !== null && field >= 1 && field <= 3 : field !== null && field >= 60 && field <= 62;
}

export const emptyLocks = (): Locks => ({ w: null, b: null });

export function keyOf(position: Position): string {
  const { board, turn, locks } = position;
  return `${placementOf(board)} ${turn} ${lockField(locks)}`;
}

export function lockField(locks: Locks): string {
  const fields = (['w', 'b'] as const).flatMap((color) => {
    const lock = locks[color];
    return lock ? `${color}${squareName(lock.square)}${lock.direction < 0 ? '-' : '+'}` : [];
  });
  return fields.length ? fields.join(',') : '-';
}

export function parseFen(fen: string): Position {
  const fields = fen.trim().split(/\s+/);
  const [placement, turn, lockState, halfmoveText, fullmoveText] = fields;
  const invalid = () => new FenError('Invalid Altai Shatra position', fen);
  if (fields.length !== 5 || (turn !== 'w' && turn !== 'b') || !lockState ||
      !/^\d+$/.test(halfmoveText!) || !/^[1-9]\d*$/.test(fullmoveText!) ||
      !Number.isSafeInteger(Number(halfmoveText)) || !Number.isSafeInteger(Number(fullmoveText))) throw invalid();

  const rows = placement!.split('/');
  if (rows.length !== RANKS) throw invalid();
  const board: Board = Array.from({ length: BOARD_SIZE }, () => null);
  for (const [row, text] of rows.entries()) {
    let file = 0;
    for (const token of text.match(/\d+|\D/g) ?? []) {
      if (/^\d+$/.test(token)) {
        if (!/^[1-7]$/.test(token)) throw invalid();
        file += Number(token);
        continue;
      }
      const type = token.toLowerCase() as PieceType;
      const rank = RANKS - 1 - row;
      const target = rank * FILES + file++;
      if (file > FILES || !isPlayable(target) || !PIECE_TYPES.includes(type)) throw invalid();
      board[target] = { color: token === type ? 'b' : 'w', type, promoted: type === 'b' };
    }
    if (file !== FILES) throw invalid();
  }

  const biyCount = { w: 0, b: 0 };
  board.forEach((piece) => { if (piece?.type === 'k') biyCount[piece.color]++; });
  if (biyCount.w > 1 || biyCount.b > 1 || (biyCount.w === 0 && biyCount.b === 0)) throw invalid();

  const locks = emptyLocks();
  if (lockState !== '-') {
    for (const token of lockState.split(',')) {
      const match = /^([wb])([a-g](?:[1-9]|1[0-4]))([+-])$/.exec(token);
      if (!match) throw invalid();
      const color = match[1] as Color;
      const target = squareOf(match[2]!, FILES);
      const piece = target === null ? null : board[target];
      if (target === null || !piece || piece.color !== color || piece.type !== 's' || locks[color]) throw invalid();
      locks[color] = { square: target, direction: match[3] === '-' ? -1 : 1 };
    }
  }
  return { board, turn, locks, halfmove: Number(halfmoveText), fullmove: Number(fullmoveText) };
}

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
    }
    rows.push(row + (empty || ''));
  }
  return rows.join('/');
}
