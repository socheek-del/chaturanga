import { FenError } from '@chaturanga/rules-core';
import { isAttackedAt } from './attacks';
import { canonicalSquare, compareSquares, keyOf, pointOf } from './coordinates';
import type { CastleRight, Color, Piece, PieceType, Position, Square } from './types';

const FEN_PIECE: Record<string, PieceType> = { p: 'p', n: 'n', b: 'b', r: 'r', q: 'q', k: 'k' };
const PROMOTION_LINE = { w: 8n, b: 1n } as const;

function fenLetter(piece: Piece): string {
  return piece.color === 'w' ? piece.type.toUpperCase() : piece.type;
}

function homeSquare(color: Color, file: bigint): Square {
  return keyOf(file, color === 'w' ? 1n : 8n);
}

export function serializePosition(position: Position): string {
  const placement = [...position.board]
    .sort(([a], [b]) => compareSquares(a, b))
    .map(([square, piece]) => `${fenLetter(piece)}${square}`)
    .join('|') || '-';
  const rights = ['K', 'Q', 'k', 'q'].filter((right) => position.castling.has(right as CastleRight)).join('') || '-';
  return `${placement} ${position.turn} ${rights} ${position.enPassant ?? '-'} ${position.halfmoveClock} ${position.fullmoveNumber}`;
}

function parsePlacement(field: string, fen: string): Map<Square, Piece> {
  const board = new Map<Square, Piece>();
  if (field === '-') return board;
  for (const token of field.split('|')) {
    const match = /^([prnbqkPRNBQK])(-?\d+),(-?\d+)$/.exec(token);
    if (!match) throw new FenError(`invalid piece token '${token}'`, fen);
    const square = keyOf(BigInt(match[2]!), BigInt(match[3]!));
    if (board.has(square)) throw new FenError(`more than one piece occupies ${square}`, fen);
    const letter = match[1]!;
    const type = FEN_PIECE[letter.toLowerCase()]!;
    board.set(square, { color: letter === letter.toUpperCase() ? 'w' : 'b', type, promoted: false });
  }
  return board;
}

function sanitizeCastling(board: Map<Square, Piece>, rights: Set<CastleRight>): Set<CastleRight> {
  const result = new Set(rights);
  for (const [right, color, rookFile] of [
    ['K', 'w', 8n], ['Q', 'w', 1n], ['k', 'b', 8n], ['q', 'b', 1n],
  ] as const) {
    const king = board.get(homeSquare(color, 5n));
    const rook = board.get(homeSquare(color, rookFile));
    if (king?.color !== color || king.type !== 'k' || rook?.color !== color || rook.type !== 'r') result.delete(right);
  }
  return result;
}

function parseCounter(value: string, name: string, min: number, fen: string): number {
  if (!/^\d+$/.test(value)) throw new FenError(`${name} must be a non-negative integer`, fen);
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min) throw new FenError(`${name} is outside the safe integer range`, fen);
  return number;
}

export function parseFen(fen: string): Position {
  const fields = fen.trim().split(/\s+/);
  if (fields.length !== 6) throw new FenError(`expected 6 fields, got ${fields.length}`, fen);
  const [placement, side, castlingField, epField, halfmoveField, fullmoveField] = fields as [string, string, string, string, string, string];
  if (side !== 'w' && side !== 'b') throw new FenError(`side to move must be 'w' or 'b', got '${side}'`, fen);

  const board = parsePlacement(placement!, fen);
  const kings = { w: 0, b: 0 };
  const kingSquares: Partial<Record<Color, Square>> = {};
  for (const [square, piece] of board) {
    if (piece.type === 'k') {
      kings[piece.color]++;
      kingSquares[piece.color] = square;
    }
    if (piece.type === 'p') {
      const y = pointOf(square).y;
      if ((piece.color === 'w' && y >= PROMOTION_LINE.w) || (piece.color === 'b' && y <= PROMOTION_LINE.b))
        throw new FenError(`unpromoted pawn is on or beyond its promotion rank at ${square}`, fen);
    }
  }
  if (kings.w !== 1 || kings.b !== 1) throw new FenError('each side must have exactly one king', fen);
  const whiteKing = pointOf(kingSquares.w!);
  const blackKing = pointOf(kingSquares.b!);
  if (whiteKing.x === blackKing.x && whiteKing.y === blackKing.y) throw new FenError('kings cannot share a square', fen);
  if (whiteKing.x - blackKing.x <= 1n && whiteKing.x - blackKing.x >= -1n &&
      whiteKing.y - blackKing.y <= 1n && whiteKing.y - blackKing.y >= -1n)
    throw new FenError('kings cannot occupy adjacent squares', fen);

  const rights = new Set<CastleRight>();
  if (castlingField !== '-') {
    for (const letter of castlingField!) {
      if (!['K', 'Q', 'k', 'q'].includes(letter)) throw new FenError(`invalid castling right '${letter}'`, fen);
      if (rights.has(letter as CastleRight)) throw new FenError(`repeated castling right '${letter}'`, fen);
      rights.add(letter as CastleRight);
    }
  }

  let enPassant: Square | null = null;
  if (epField !== '-') {
    enPassant = canonicalSquare(epField!);
    if (!enPassant) throw new FenError(`invalid en-passant square '${epField}'`, fen);
    const ep = pointOf(enPassant);
    const expectedY = side === 'w' ? 6n : 3n;
    const pushedPawnY = ep.y + (side === 'w' ? -1n : 1n);
    const originY = ep.y + (side === 'w' ? 1n : -1n);
    const pushedPawn = board.get(keyOf(ep.x, pushedPawnY));
    if (ep.y !== expectedY || board.has(enPassant) || board.has(keyOf(ep.x, originY)) ||
        pushedPawn?.type !== 'p' || pushedPawn.color === side)
      throw new FenError(`en-passant target '${enPassant}' does not match the last double pawn push`, fen);
  }

  const position: Position = {
    board,
    turn: side,
    castling: sanitizeCastling(board, rights),
    enPassant,
    halfmoveClock: parseCounter(halfmoveField!, 'halfmove clock', 0, fen),
    fullmoveNumber: parseCounter(fullmoveField!, 'fullmove number', 1, fen),
  };
  if (isAttackedAt(position, side, findKingSquare(board, side === 'w' ? 'b' : 'w')))
    throw new FenError('the side that is not to move is in check', fen);
  return position;
}

function findKingSquare(board: Map<Square, Piece>, color: Color): Square {
  for (const [square, piece] of board) if (piece.color === color && piece.type === 'k') return square;
  throw new FenError(`missing ${color} king`, '');
}

function buildStartPosition(): string {
  const board = new Map<Square, Piece>();
  const backRank: PieceType[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  for (let file = 1; file <= 8; file++) {
    board.set(keyOf(BigInt(file), 2n), { color: 'w', type: 'p', promoted: false });
    board.set(keyOf(BigInt(file), 7n), { color: 'b', type: 'p', promoted: false });
    board.set(keyOf(BigInt(file), 1n), { color: 'w', type: backRank[file - 1]!, promoted: false });
    board.set(keyOf(BigInt(file), 8n), { color: 'b', type: backRank[file - 1]!, promoted: false });
  }
  return serializePosition({
    board,
    turn: 'w',
    castling: new Set(['K', 'Q', 'k', 'q']),
    enPassant: null,
    halfmoveClock: 0,
    fullmoveNumber: 1,
  });
}

export const START_FEN = buildStartPosition();
export const PROMOTION_RANK: Readonly<Record<Color, bigint>> = PROMOTION_LINE;

export function pieceTypeFromLetter(letter: string): PieceType | null {
  return FEN_PIECE[letter.toLowerCase()] ?? null;
}

export function squareFromFen(value: string): Square | null {
  return canonicalSquare(value);
}
