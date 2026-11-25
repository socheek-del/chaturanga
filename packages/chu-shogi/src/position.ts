import { FenError, squareOf, type Color, type Piece as RulesPiece, type Square } from '@chaturanga/rules-core';
import { BASE_PIECE_TYPES, BOARD_SIZE, FILES, FILE_NAMES, RANKS, STARTING_PIECES, coordinateOf } from './layout';

export { FILES, RANKS, BOARD_SIZE };
export const PIECE_TYPES = BASE_PIECE_TYPES;
export type PieceType = (typeof PIECE_TYPES)[number];

/** `promotionEligible` is false only after a piece declined its current in-zone promotion chance. */
export interface Piece extends RulesPiece<PieceType> {
  promotionEligible: boolean;
}

export type Board = Array<Piece | null>;

export interface Counterstrike {
  /** Side forbidden from capturing the protected Lion with a non-Lion on its next move. */
  readonly forbiddenColor: Color;
  readonly protectedLion: Square;
}

export interface Position {
  board: Board;
  turn: Color;
  counterstrike: Counterstrike | null;
  ply: number;
}

const CODES: Readonly<Record<PieceType, string>> = {
  king: 'ki', lion: 'li', 'free-king': 'fk', 'drunk-elephant': 'de', kirin: 'kr', phoenix: 'ph',
  rook: 'ro', bishop: 'bi', 'dragon-king': 'dk', 'dragon-horse': 'dh', 'vertical-mover': 'vm',
  'side-mover': 'sm', 'reverse-chariot': 'rc', lance: 'la', 'blind-tiger': 'bt',
  'ferocious-leopard': 'fl', 'gold-general': 'gg', 'silver-general': 'sg', 'copper-general': 'cg',
  'go-between': 'gb', pawn: 'pa',
};
const TYPES_BY_CODE = new Map(Object.entries(CODES).map(([type, code]) => [code, type as PieceType]));
const PROMOTABLE = new Set<PieceType>(PIECE_TYPES.filter((type) => !['king', 'lion', 'free-king'].includes(type)));

export const opposite = (color: Color): Color => color === 'w' ? 'b' : 'w';

export function square(name: string): Square {
  const target = squareOf(name, FILES);
  if (target === null || target >= BOARD_SIZE) throw new RangeError(`Not a Chu Shogi square: ${name}`);
  return target;
}

export function squareName(target: Square): string {
  const { file, rank } = coordinateOf(target);
  return `${FILE_NAMES[file]}${rank}`;
}

export function makePiece(color: Color, type: PieceType, promoted = false, promotionEligible = true): Piece {
  return { color, type, promoted, promotionEligible: !promoted && promotionEligible };
}

export function startingPosition(turn: Color = 'w'): Position {
  const board: Board = Array.from({ length: BOARD_SIZE }, () => null);
  for (const piece of STARTING_PIECES) board[piece.square] = makePiece(piece.color, piece.type);
  return { board, turn, counterstrike: null, ply: 0 };
}

function pieceToken(piece: Piece | null): string {
  if (!piece) return '-';
  return `${piece.color}${CODES[piece.type]}${piece.promoted ? '+' : ''}${!piece.promoted && !piece.promotionEligible ? '!' : ''}`;
}

export function placementOf(board: Board): string {
  const rows: string[] = [];
  for (let rank = RANKS; rank >= 1; rank--) {
    const cells = Array.from({ length: FILES }, (_, file) => pieceToken(board[(rank - 1) * FILES + file] ?? null));
    rows.push(cells.join(','));
  }
  return rows.join('/');
}

export function fenOf(position: Position): string {
  const counterstrike = position.counterstrike
    ? `${position.counterstrike.forbiddenColor}@${squareName(position.counterstrike.protectedLion)}`
    : '-';
  return `${placementOf(position.board)} ${position.turn} ${counterstrike} ${position.ply}`;
}

export function parseFen(fen: string): Position {
  const invalid = () => new FenError('Invalid Chu Shogi position', fen);
  const fields = fen.trim().split(/\s+/);
  const [placement, turn, counterstrikeField, plyField] = fields;
  if (fields.length !== 4 || !placement || (turn !== 'w' && turn !== 'b') || !plyField || !/^\d+$/.test(plyField))
    throw invalid();

  const rows = placement.split('/');
  if (rows.length !== RANKS) throw invalid();
  const board: Board = Array.from({ length: BOARD_SIZE }, () => null);

  for (const [rowIndex, row] of rows.entries()) {
    const tokens = row.split(',');
    if (tokens.length !== FILES) throw invalid();
    const rank = RANKS - rowIndex;
    for (const [file, token] of tokens.entries()) {
      if (token === '-') continue;
      const match = /^(w|b)([a-z]{2})(\+)?(!)?$/.exec(token);
      if (!match) throw invalid();
      const [, color, code, promotedMark, unavailableMark] = match;
      const type = TYPES_BY_CODE.get(code!);
      if (!type || (promotedMark && !PROMOTABLE.has(type)) || (promotedMark && unavailableMark)) throw invalid();
      board[(rank - 1) * FILES + file] = makePiece(color as Color, type, !!promotedMark, !unavailableMark);
    }
  }

  let counterstrike: Counterstrike | null = null;
  if (counterstrikeField !== '-') {
    const match = /^(w|b)@([a-l](?:[1-9]|1[0-2]))$/.exec(counterstrikeField ?? '');
    if (!match) throw invalid();
    const protectedLion = squareOf(match[2]!, FILES);
    if (protectedLion === null) throw invalid();
    const piece = board[protectedLion];
    if (!piece || piece.color === match[1] || !isLion(piece)) throw invalid();
    counterstrike = { forbiddenColor: match[1] as Color, protectedLion };
  }

  const position: Position = { board, turn, counterstrike, ply: Number(plyField) };
  return position;
}

/** Position identity includes promotion rights and the temporary first-Lion rule. */
export function keyOf(position: Position): string {
  const counterstrike = position.counterstrike
    ? `${position.counterstrike.forbiddenColor}@${squareName(position.counterstrike.protectedLion)}`
    : '-';
  return `${placementOf(position.board)} ${position.turn} ${counterstrike}`;
}

export function isLion(piece: Piece): boolean {
  return (piece.type === 'lion' && !piece.promoted) || (piece.type === 'kirin' && piece.promoted);
}

export const START_POSITION = startingPosition();
export const START_FEN = fenOf(START_POSITION);
