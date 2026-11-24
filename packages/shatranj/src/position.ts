import {
  FERZ_TARGETS, FenError, fileOf, KING_TARGETS, KNIGHT_TARGETS, PAWN_CAPTURES, parseSquare, rankOf,
  ROOK_RAYS, squareName, type Color, type Piece as RulesPiece, type Square,
} from '@chaturanga/rules-core';

export const START_FEN = 'rnbkqbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBKQBNR w - - 0 1';
export const PIECE_TYPES = ['p', 'n', 'b', 'q', 'r', 'k'] as const;
export type PieceType = (typeof PIECE_TYPES)[number];
export type Piece = RulesPiece<PieceType>;
export type Board = Array<Piece | null>;

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

export const opposite = (color: Color): Color => color === 'w' ? 'b' : 'w';
export const moveUci = (move: Move): string =>
  squareName(move.from) + squareName(move.to) + (move.promotion ? 'q' : '');

const ALFIL_TARGETS = FERZ_TARGETS.map((targets, from) => targets.flatMap((middle) => {
  const file = 2 * fileOf(middle) - fileOf(from);
  const rank = 2 * rankOf(middle) - rankOf(from);
  return file >= 0 && file < 8 && rank >= 0 && rank < 8 ? [rank * 8 + file] : [];
}));

export function parseFen(fen: string): Position {
  const fields = fen.trim().split(/\s+/);
  const [placement, turn, castle, ep, halfmove, fullmove] = fields;
  const invalid = () => new FenError('Invalid Shatranj position', fen);
  if (fields.length !== 6 || (turn !== 'w' && turn !== 'b') || castle !== '-' || ep !== '-' ||
      !/^\d+$/.test(halfmove!) || !/^[1-9]\d*$/.test(fullmove!) ||
      !Number.isSafeInteger(Number(halfmove)) || !Number.isSafeInteger(Number(fullmove))) throw invalid();

  const ranks = placement!.split('/');
  if (ranks.length !== 8) throw invalid();
  const board: Board = Array.from({ length: 64 }, () => null);
  const kings = { w: 0, b: 0 };
  for (const [row, rank] of ranks.entries()) {
    let file = 0;
    for (const char of rank) {
      if (/^[1-8]$/.test(char)) {
        file += Number(char);
        continue;
      }
      const type = char.toLowerCase() as PieceType;
      if (file >= 8 || !PIECE_TYPES.includes(type) || (type === 'p' && (row === 0 || row === 7))) throw invalid();
      const color = char === type ? 'b' : 'w';
      if (type === 'k') kings[color]++;
      board[(7 - row) * 8 + file++] = { type, color, promoted: false };
    }
    if (file !== 8) throw invalid();
  }
  if (kings.w !== 1 || kings.b !== 1) throw invalid();
  return { board, turn, halfmove: Number(halfmove), fullmove: Number(fullmove) };
}

export function placementOf(board: Board): string {
  const ranks: string[] = [];
  for (let rank = 7; rank >= 0; rank--) {
    let row = '';
    let empty = 0;
    for (let file = 0; file < 8; file++) {
      const piece = board[rank * 8 + file];
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

function targets(board: Board, from: Square, piece: Piece): readonly Square[] {
  switch (piece.type) {
    case 'p': return PAWN_CAPTURES[piece.color === 'w' ? 0 : 1][from]!;
    case 'b': return ALFIL_TARGETS[from]!;
    case 'n': return KNIGHT_TARGETS[from]!;
    case 'q': return FERZ_TARGETS[from]!;
    case 'k': return KING_TARGETS[from]!;
    case 'r': {
      const result: Square[] = [];
      for (const ray of ROOK_RAYS[from]!) {
        for (const to of ray) {
          result.push(to);
          if (board[to]) break;
        }
      }
      return result;
    }
  }
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
    const destinations = [];
    if (piece.type === 'p') {
      const step = from + (color === 'w' ? 8 : -8);
      if (board[step] === null) destinations.push(step);
      for (const to of targets(board, from, piece)) {
        if (board[to]?.color === opposite(color)) destinations.push(to);
      }
    } else {
      destinations.push(...targets(board, from, piece));
    }
    for (const to of destinations) {
      const captured = board[to]!;
      if (captured?.color === color || captured?.type === 'k') continue;
      board[from] = null;
      board[to] = piece;
      if (checkedKing(board, color) === null) {
        moves.push({ from, to, promotion: piece.type === 'p' && rankOf(to) === (color === 'w' ? 7 : 0) });
      }
      board[to] = captured;
      board[from] = piece;
    }
  });
  return moves;
}

export { parseSquare, squareName };
