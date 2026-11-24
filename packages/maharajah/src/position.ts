import {
  BISHOP_RAYS, FenError, KING_TARGETS, KNIGHT_TARGETS, PAWN_CAPTURES, parseSquare, rankOf,
  ROOK_RAYS, squareName, type Color, type Piece as RulesPiece, type Square,
} from '@chaturanga/rules-core';

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/8/4M3 w - - 0 1';
export const PIECE_TYPES = ['p', 'n', 'b', 'q', 'r', 'k', 'm'] as const;
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
}

export const opposite = (color: Color): Color => color === 'w' ? 'b' : 'w';
export const moveUci = (move: Move): string =>
  squareName(move.from) + squareName(move.to);

export function parseFen(fen: string): Position {
  const fields = fen.trim().split(/\s+/);
  const [placement, turn, castle, ep, halfmove, fullmove] = fields;
  const invalid = () => new FenError('Invalid Maharajah position', fen);
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
      if (file >= 8 || !PIECE_TYPES.includes(type)) throw invalid();
      const color = char === type ? 'b' : 'w';
      if ((color === 'w') !== (type === 'm')) throw invalid();
      if (type === 'k' || type === 'm') kings[color]++;
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
    case 'p': return PAWN_CAPTURES[1][from]!;
    case 'n': return KNIGHT_TARGETS[from]!;
    case 'k': return KING_TARGETS[from]!;
    case 'b': return slidingTargets(board, BISHOP_RAYS[from]!);
    case 'r': return slidingTargets(board, ROOK_RAYS[from]!);
    case 'q': return slidingTargets(board, [...ROOK_RAYS[from]!, ...BISHOP_RAYS[from]!]);
    case 'm': return [
      ...KNIGHT_TARGETS[from]!,
      ...slidingTargets(board, [...ROOK_RAYS[from]!, ...BISHOP_RAYS[from]!]),
    ];
  }
}

function slidingTargets(board: Board, rays: readonly (readonly Square[])[]): Square[] {
  const result: Square[] = [];
  for (const ray of rays) {
    for (const to of ray) {
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
  const king = board.findIndex((piece) => piece?.type === (color === 'w' ? 'm' : 'k'));
  return board.some((piece, from) => piece?.color === opposite(color) && targets(board, from, piece).includes(king))
    ? king : null;
}

export function legalMoves(board: Board, color: Color): Move[] {
  const moves: Move[] = [];
  board.forEach((piece, from) => {
    if (piece?.color !== color) return;
    const destinations = [];
    if (piece.type === 'p') {
      const step = from - 8;
      if (board[step] === null) {
        destinations.push(step);
        if (rankOf(from) === 6 && board[step - 8] === null) destinations.push(step - 8);
      }
      for (const to of targets(board, from, piece)) {
        if (board[to]?.color === opposite(color)) destinations.push(to);
      }
    } else {
      destinations.push(...targets(board, from, piece));
    }
    for (const to of destinations) {
      const captured = board[to]!;
      if (captured?.color === color || (captured?.type === 'k' || captured?.type === 'm')) continue;
      board[from] = null;
      board[to] = piece;
      if (checkedKing(board, color) === null) {
        moves.push({ from, to });
      }
      board[to] = captured;
      board[from] = piece;
    }
  });
  return moves;
}

export { parseSquare, squareName };
