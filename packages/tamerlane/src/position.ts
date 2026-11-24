import {
  FenError, squareNameOf, squareOf, type Color, type Piece as RulesPiece, type Square,
} from '@chaturanga/rules-core';

export const FILES = 13;
export const RANKS = 10;
export const BOARD_SIZE = FILES * RANKS;
const PAWN_RANK = 'pamijswlouq';
const BLACK_PAWN_RANK = [...PAWN_RANK].reverse().join('');
export const START_FEN = [
  '1e1c1d1d1c1e1', '1rnbgvkfgbnr1', `1${BLACK_PAWN_RANK}1`, '13', '13', '13', '13',
  `1${PAWN_RANK.toUpperCase()}1`, '1RNBGFKVGBNR1', '1E1C1D1D1C1E1',
].join('/') + ' w KQkq - 0 1';

export const PIECE_TYPES = [
  'k', 'h', 't', 'r', 'n', 'b', 'g', 'f', 'v', 'e', 'c', 'd',
  'p', 'a', 'm', 'i', 'j', 's', 'w', 'l', 'o', 'u', 'q', 'x', 'y',
] as const;
export type PieceType = (typeof PIECE_TYPES)[number];
export type Piece = RulesPiece<PieceType>;
export type Board = Array<Piece | null>;
export const PAWN_TARGET: Partial<Record<PieceType, PieceType>> = {
  a: 'd', m: 'c', i: 'e', j: 'f', s: 'h', w: 'v', l: 'g', o: 'b', u: 'n', q: 'r', y: 't',
};

export type Position = {
  board: Board;
  turn: Color;
  rights: string;
  halfmove: number;
  fullmove: number;
};

export const fileOf = (square: Square): number => square % FILES;
export const rankOf = (square: Square): number => Math.floor(square / FILES);
export const squareName = (square: Square): string => squareNameOf(square, FILES);
export const opposite = (color: Color): Color => color === 'w' ? 'b' : 'w';
export const castleSwapRight = (color: Color): string => color === 'w' ? 'Q' : 'q';
export const kingSwapRight = (color: Color): string => color === 'w' ? 'K' : 'k';
export const goalReached = 'D';
export const ownCitadel = (color: Color): Square => color === 'w' ? squareOf('m2', FILES)! : squareOf('a9', FILES)!;
export const isCitadel = (square: Square): boolean => square === ownCitadel('w') || square === ownCitadel('b');
export const isPlayable = (square: Square): boolean => square >= 0 && square < BOARD_SIZE &&
  (isCitadel(square) || (fileOf(square) > 0 && fileOf(square) < FILES - 1));
export const isPawn = (type: PieceType): boolean =>
  type === 'p' || type === 'x' || Object.hasOwn(PAWN_TARGET, type);
export const isRoyal = (type: PieceType): boolean => type === 'k' || type === 'h' || type === 't';
export const finalRank = (color: Color): number => color === 'w' ? RANKS - 1 : 0;
export function isImmune(square: Square, piece: Piece): boolean {
  return (piece.type === 'p' && rankOf(square) === finalRank(piece.color)) ||
    (piece.type === 't' && square === ownCitadel(piece.color));
}

export function royalSquares(board: Board, color: Color): Square[] {
  const ordered = ['k', 'h', 't'] as const;
  return ordered.flatMap((type) => board.flatMap((piece, square) => piece?.color === color && piece.type === type ? [square] : []));
}

export function parseFen(fen: string): Position {
  const fields = fen.trim().split(/\s+/);
  const [placement, turn, rights, ep, halfmove, fullmove] = fields;
  const invalid = () => new FenError('Invalid Tamerlane Chess position', fen);
  if (fields.length !== 6 || (turn !== 'w' && turn !== 'b') ||
      !/^(?:-|K?Q?k?q?D?)$/.test(rights!) || ep !== '-' ||
      !/^\d+$/.test(halfmove!) || !/^[1-9]\d*$/.test(fullmove!) ||
      !Number.isSafeInteger(Number(halfmove)) || !Number.isSafeInteger(Number(fullmove))) throw invalid();

  const ranks = placement!.split('/');
  if (ranks.length !== RANKS) throw invalid();
  const board: Board = Array.from({ length: BOARD_SIZE }, () => null);
  for (const [row, rank] of ranks.entries()) {
    let file = 0;
    for (const token of rank.match(/\d+|\D/g) ?? []) {
      if (/^\d/.test(token)) {
        if (!/^(?:[1-9]|1[0-3])$/.test(token)) throw invalid();
        file += Number(token);
        continue;
      }
      const type = token.toLowerCase() as PieceType;
      const square = (RANKS - 1 - row) * FILES + file++;
      if (file > FILES || !isPlayable(square) || !PIECE_TYPES.includes(type)) throw invalid();
      const color = token === type ? 'b' : 'w';
      if (isCitadel(square) && (!isRoyal(type) || (square === ownCitadel(color) && type !== 't'))) throw invalid();
      if (isPawn(type) && rankOf(square) === finalRank(color) && type !== 'p') throw invalid();
      board[square] = { type, color, promoted: false };
    }
    if (file !== FILES) throw invalid();
  }
  if (!royalSquares(board, 'w').length || !royalSquares(board, 'b').length) throw invalid();
  if (rights!.includes(goalReached)) {
    const lastPlayer = opposite(turn);
    if (royalSquares(board, lastPlayer)[0] !== ownCitadel(turn)) throw invalid();
  }
  return { board, turn, rights: rights === '-' ? '' : rights!, halfmove: Number(halfmove), fullmove: Number(fullmove) };
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
