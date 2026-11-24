import {
  FenError, squareNameOf, type Color, type Piece as RulesPiece, type Square,
} from '@chaturanga/rules-core';

export const FILES = 12;
export const RANKS = 8;
export const START_FEN = 'rnacmk1scanr/1ppppp1pppp1/6f5/p5p4p/P5P4P/6F5/1PPPPP1PPPP1/RNACMK1SCANR w - - 0 1';
export const PIECE_TYPES = ['p', 'r', 'n', 'a', 'c', 'm', 'k', 'f', 's'] as const;
export type PieceType = (typeof PIECE_TYPES)[number];
export type Piece = RulesPiece<PieceType>;
export type Board = Array<Piece | null>;
type Offset = readonly [file: number, rank: number];

export interface Position {
  board: Board;
  turn: Color;
  halfmove: number;
  fullmove: number;
}

export interface Move {
  from: Square;
  to: Square;
  promotion: boolean;
}

export const fileOf = (square: Square): number => square % FILES;
export const rankOf = (square: Square): number => Math.floor(square / FILES);
export const squareName = (square: Square): string => squareNameOf(square, FILES);
export const opposite = (color: Color): Color => color === 'w' ? 'b' : 'w';
export const moveUci = ({ from, to, promotion }: Move): string =>
  squareName(from) + squareName(to) + (promotion ? 'f' : '');

const orthogonal: readonly Offset[] = [[0, 1], [1, 0], [0, -1], [-1, 0]];
const diagonal: readonly Offset[] = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const knight: readonly Offset[] = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
const adjacent = [...orthogonal, ...diagonal];
const alfil = diagonal.map(([file, rank]): Offset => [file * 2, rank * 2]);

function shift(square: Square, [file, rank]: Offset): Square | null {
  const x = fileOf(square) + file;
  const y = rankOf(square) + rank;
  return x >= 0 && x < FILES && y >= 0 && y < RANKS ? y * FILES + x : null;
}

export function parseFen(fen: string): Position {
  const fields = fen.trim().split(/\s+/);
  const [placement, turn, castle, ep, halfmove, fullmove] = fields;
  const invalid = () => new FenError('Invalid Courier Chess position', fen);
  if (fields.length !== 6 || (turn !== 'w' && turn !== 'b') || castle !== '-' || ep !== '-' ||
      !/^\d+$/.test(halfmove!) || !/^[1-9]\d*$/.test(fullmove!) ||
      !Number.isSafeInteger(Number(halfmove)) || !Number.isSafeInteger(Number(fullmove))) throw invalid();

  const ranks = placement!.split('/');
  if (ranks.length !== RANKS) throw invalid();
  const board: Board = Array.from({ length: FILES * RANKS }, () => null);
  const kings = { w: 0, b: 0 };
  for (const [row, rank] of ranks.entries()) {
    let file = 0;
    for (const token of rank.match(/\d+|\D/g) ?? []) {
      if (/^\d/.test(token)) {
        if (!/^(?:[1-9]|1[0-2])$/.test(token)) throw invalid();
        file += Number(token);
        continue;
      }
      const type = token.toLowerCase() as PieceType;
      if (file >= FILES || !PIECE_TYPES.includes(type) ||
          (type === 'p' && (row === 0 || row === RANKS - 1))) throw invalid();
      const color = token === type ? 'b' : 'w';
      if (type === 'k') kings[color]++;
      board[(RANKS - 1 - row) * FILES + file++] = { type, color, promoted: false };
    }
    if (file !== FILES) throw invalid();
  }
  if (kings.w !== 1 || kings.b !== 1) throw invalid();
  return { board, turn, halfmove: Number(halfmove), fullmove: Number(fullmove) };
}

export function placementOf(board: Board): string {
  const ranks: string[] = [];
  for (let rank = RANKS - 1; rank >= 0; rank--) {
    let row = '';
    let empty = 0;
    for (let file = 0; file < FILES; file++) {
      const piece = board[rank * FILES + file];
      if (!piece) {
        empty++;
        continue;
      }
      if (empty) row += empty;
      empty = 0;
      row += piece.color === 'w' ? piece.type.toUpperCase() : piece.type;
    }
    ranks.push(row + (empty || ''));
  }
  return ranks.join('/');
}

function targets(board: Board, from: Square, piece: Piece): Square[] {
  const forward = piece.color === 'w' ? 1 : -1;
  switch (piece.type) {
    case 'p': return steps(from, [[-1, forward], [1, forward]]);
    case 'a': return steps(from, alfil);
    case 'n': return steps(from, knight);
    case 'f': return steps(from, diagonal);
    case 's': return steps(from, orthogonal);
    case 'm':
    case 'k': return steps(from, adjacent);
    case 'c': return slides(board, from, diagonal);
    case 'r': return slides(board, from, orthogonal);
  }
}

function steps(from: Square, offsets: readonly Offset[]): Square[] {
  return offsets.flatMap((offset) => {
    const to = shift(from, offset);
    return to === null ? [] : [to];
  });
}

function slides(board: Board, from: Square, directions: readonly Offset[]): Square[] {
  const result: Square[] = [];
  for (const direction of directions) {
    for (let to = shift(from, direction); to !== null; to = shift(to, direction)) {
      result.push(to);
      if (board[to]) break;
    }
  }
  return result;
}

export function attackedSquares(board: Board, color: Color): Square[] {
  const attacked = new Set<Square>();
  board.forEach((piece, from) => {
    if (piece?.color === color) targets(board, from, piece).forEach((to) => attacked.add(to));
  });
  return [...attacked].sort((a, b) => a - b);
}

export function checkedKing(board: Board, color: Color): Square | null {
  const king = board.findIndex((piece) => piece?.type === 'k' && piece.color === color);
  return board.some((piece, from) => piece?.color === opposite(color) && targets(board, from, piece).includes(king))
    ? king : null;
}

export function legalMoves(board: Board, color: Color): Move[] {
  const moves: Move[] = [];
  board.forEach((piece, from) => {
    if (piece?.color !== color) return;
    const attacks = targets(board, from, piece);
    const destinations = piece.type === 'p' ? attacks.filter((to) => board[to]?.color === opposite(color)) : attacks;
    if (piece.type === 'p') {
      const forward = shift(from, [0, color === 'w' ? 1 : -1]);
      if (forward !== null && board[forward] === null) destinations.push(forward);
    }
    for (const to of destinations) {
      const captured = board[to]!;
      if (captured?.color === color || captured?.type === 'k') continue;
      board[from] = null;
      board[to] = piece;
      if (checkedKing(board, color) === null) {
        moves.push({ from, to, promotion: piece.type === 'p' && rankOf(to) === (color === 'w' ? RANKS - 1 : 0) });
      }
      board[to] = captured;
      board[from] = piece;
    }
  });
  return moves;
}
