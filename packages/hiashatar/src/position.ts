import { FenError, squareNameOf, type Color, type Piece as RulesPiece, type Square } from '@chaturanga/rules-core';

export const FILES = 10;
export const RANKS = 10;
export const START_FEN = 'rnbhqkhbnr/pppppppppp/10/10/10/10/10/10/PPPPPPPPPP/RNBHKQHBNR w - - 0 1';
export const PIECE_TYPES = ['p', 'n', 'b', 'h', 'q', 'r', 'k'] as const;
export type PieceType = (typeof PIECE_TYPES)[number];
export type Piece = RulesPiece<PieceType>;
export type Board = Array<Piece | null>;
export interface Position {
  board: Board;
  turn: Color;
  epTargets: Square[];
  halfmove: number;
  fullmove: number;
}
export interface Move { from: Square; to: Square; promotion: PieceType | null; captureAt: Square | null }
type Offset = readonly [file: number, rank: number];

const orthogonal: readonly Offset[] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const diagonal: readonly Offset[] = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const queenDirs = [...orthogonal, ...diagonal];
const knightDirs: readonly Offset[] = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
export const fileOf = (square: Square): number => square % FILES;
export const rankOf = (square: Square): number => Math.floor(square / FILES);
export const squareName = (square: Square): string => squareNameOf(square, FILES);
export const opposite = (color: Color): Color => color === 'w' ? 'b' : 'w';
export const moveUci = ({ from, to, promotion }: Move): string => squareName(from) + squareName(to) + (promotion ?? '');

function shift(square: Square, [dx, dy]: Offset): Square | null {
  const x = fileOf(square) + dx;
  const y = rankOf(square) + dy;
  return x >= 0 && x < FILES && y >= 0 && y < RANKS ? y * FILES + x : null;
}

function enPassantVictim(turn: Color, targets: readonly Square[]): Square | null {
  if (!targets.length) return null;
  const ranks = targets.map(rankOf);
  const nearest = turn === 'w' ? Math.min(...ranks) : Math.max(...ranks);
  return (nearest - (turn === 'w' ? 1 : -1)) * FILES + fileOf(targets[0]!);
}

export function validEpTargets(board: Board, turn: Color, targets: readonly Square[]): boolean {
  if (!targets.length || targets.length > 2 || new Set(targets).size !== targets.length) return false;
  if (targets.some((target) => board[target] !== null)) return false;
  const dir = turn === 'w' ? 1 : -1;
  if (!targets.every((target) => fileOf(target) === fileOf(targets[0]!))) return false;
  const targetRanks = targets.map(rankOf).sort((a, b) => a - b);
  if (targetRanks.some((rank, i) => i > 0 && rank !== targetRanks[i - 1]! + 1)) return false;
  const victim = enPassantVictim(turn, targets);
  if (victim === null || rankOf(victim) < 0 || rankOf(victim) >= RANKS ||
      board[victim]?.type !== 'p' || board[victim]?.color !== opposite(turn)) return false;
  const previous = opposite(turn);
  const previousDir = previous === 'w' ? 1 : -1;
  const startRank = previous === 'w' ? 1 : RANKS - 2;
  const distance = (rankOf(victim) - startRank) * previousDir;
  if (distance !== 2 && distance !== 3) return false;
  const expectedRanks = Array.from({ length: distance - 1 }, (_, i) => startRank + previousDir * (i + 1)).sort((a, b) => a - b);
  if (expectedRanks.length !== targetRanks.length || expectedRanks.some((rank, i) => rank !== targetRanks[i])) return false;
  return targets.some((target) => {
    const fromRank = rankOf(target) - dir;
    const from = [fileOf(target) - 1, fileOf(target) + 1]
      .filter((file) => file >= 0 && file < FILES)
      .map((file) => fromRank * FILES + file);
    return from.some((square) => board[square]?.type === 'p' && board[square]?.color === turn);
  });
}

export function parseFen(fen: string): Position {
  const fields = fen.trim().split(/\s+/);
  const [placement, turn, castling, ep, halfmove, fullmove] = fields;
  const invalid = () => new FenError('Invalid Hiashatar position', fen);
  if (fields.length !== 6 || (turn !== 'w' && turn !== 'b') || castling !== '-' ||
      !/^(?:-|[a-j](?:10|[1-9])(?:,[a-j](?:10|[1-9]))?)$/.test(ep!) || !/^\d+$/.test(halfmove!) || !/^[1-9]\d*$/.test(fullmove!) ||
      !Number.isSafeInteger(Number(halfmove)) || !Number.isSafeInteger(Number(fullmove))) throw invalid();
  const rows = placement!.split('/');
  if (rows.length !== RANKS) throw invalid();
  const board: Board = Array.from({ length: FILES * RANKS }, () => null);
  const kings = { w: 0, b: 0 };
  for (const [row, text] of rows.entries()) {
    let file = 0;
    for (const token of text.match(/\d+|\D/g) ?? []) {
      if (/^\d+$/.test(token)) {
        if (!/^(?:[1-9]|10)$/.test(token)) throw invalid();
        file += Number(token);
        continue;
      }
      const type = token.toLowerCase() as PieceType;
      if (file >= FILES || !PIECE_TYPES.includes(type) || (type === 'p' && (row === 0 || row === RANKS - 1))) throw invalid();
      const color = token === type ? 'b' : 'w';
      if (type === 'k') kings[color]++;
      board[(RANKS - 1 - row) * FILES + file++] = { type, color, promoted: false };
    }
    if (file !== FILES) throw invalid();
  }
  if (kings.w !== 1 || kings.b !== 1) throw invalid();
  const epTargets = ep === '-' ? [] : ep!.split(',').map((name) => {
    const file = name.charCodeAt(0) - 97;
    const row = Number(name.slice(1)) - 1;
    return row * FILES + file;
  });
  if (ep !== '-' && (!epTargets.every((sq) => Number.isInteger(sq) && sq >= 0 && sq < FILES * RANKS) || !validEpTargets(board, turn, epTargets))) throw invalid();
  return { board, turn, epTargets, halfmove: Number(halfmove), fullmove: Number(fullmove) };
}

export function placementOf(board: Board): string {
  const rows: string[] = [];
  for (let rank = RANKS - 1; rank >= 0; rank--) {
    let row = '';
    let empty = 0;
    for (let file = 0; file < FILES; file++) {
      const piece = board[rank * FILES + file];
      if (!piece) { empty++; continue; }
      if (empty) row += empty;
      empty = 0;
      row += piece.color === 'w' ? piece.type.toUpperCase() : piece.type;
    }
    rows.push(row + (empty || ''));
  }
  return rows.join('/');
}

function zoneOf(board: Board, color: Color): Set<Square> {
  const zone = new Set<Square>();
  board.forEach((piece, center) => {
    if (piece?.color !== opposite(color) || piece.type !== 'h') return;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const square = shift(center, [dx, dy]);
      if (square !== null) zone.add(square);
    }
  });
  return zone;
}

export function bodyguardZones(board: Board): Record<Color, Square[]> {
  const squares = (color: Color) => {
    const zone = new Set<Square>();
    board.forEach((piece, center) => {
      if (piece?.color !== color || piece.type !== 'h') return;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const square = shift(center, [dx, dy]);
        if (square !== null) zone.add(square);
      }
    });
    return [...zone].sort((a, b) => a - b);
  };
  return { w: squares('w'), b: squares('b') };
}

function steps(from: Square, directions: readonly Offset[]): Square[] {
  return directions.flatMap((direction) => {
    const square = shift(from, direction);
    return square === null ? [] : [square];
  });
}

function slides(board: Board, from: Square, piece: Piece, directions: readonly Offset[], zone: ReadonlySet<Square>, maxRange: number): Square[] {
  const startSlowed = piece.type !== 'n' && zone.has(from);
  const range = startSlowed ? 1 : maxRange;
  const result: Square[] = [];
  for (const direction of directions) {
    let square = from;
    for (let distance = 1; distance <= range; distance++) {
      const next = shift(square, direction);
      if (next === null) break;
      result.push(next);
      if (board[next] || (piece.type !== 'n' && zone.has(next))) break;
      square = next;
    }
  }
  return result;
}

function targets(board: Board, from: Square, piece: Piece, epTargets: readonly Square[] = []): Square[] {
  const zone = zoneOf(board, piece.color);
  switch (piece.type) {
    case 'p': {
      const dir = piece.color === 'w' ? 1 : -1;
      const diagonalSteps = steps(from, [[-1, dir], [1, dir]]);
      const ep = epTargets.filter((to) => diagonalSteps.includes(to) && !board[to]).map((to) => to);
      return [...diagonalSteps, ...ep];
    }
    case 'n': return steps(from, knightDirs);
    case 'k': return steps(from, queenDirs);
    case 'b': return slides(board, from, piece, diagonal, zone, FILES);
    case 'r': return slides(board, from, piece, orthogonal, zone, FILES);
    case 'q': return slides(board, from, piece, queenDirs, zone, FILES);
    case 'h': return slides(board, from, piece, queenDirs, zone, 2);
  }
}

function attackTargets(board: Board, from: Square, piece: Piece): Square[] {
  if (piece.type !== 'p') return targets(board, from, piece);
  return steps(from, [[-1, piece.color === 'w' ? 1 : -1], [1, piece.color === 'w' ? 1 : -1]]);
}

export function attackedSquares(board: Board, color: Color): Square[] {
  const attacked = new Set<Square>();
  board.forEach((piece, from) => {
    if (piece?.color !== color) return;
    for (const to of attackTargets(board, from, piece)) {
      if (piece.type === 'h' && board[to]?.type === 'k' && board[to]?.color !== color) continue;
      attacked.add(to);
    }
  });
  return [...attacked].sort((a, b) => a - b);
}

function kingSquare(board: Board, color: Color): Square {
  return board.findIndex((piece) => piece?.type === 'k' && piece.color === color);
}

export function checkedKing(board: Board, color: Color): Square | null {
  const king = kingSquare(board, color);
  for (let from = 0; from < board.length; from++) {
    const piece = board[from];
    if (piece?.color === opposite(color) && piece.type !== 'h' && attackTargets(board, from, piece).includes(king)) return king;
  }
  return null;
}

function pawnSteps(board: Board, from: Square, piece: Piece): Square[] {
  const dir = piece.color === 'w' ? 1 : -1;
  const startRank = piece.color === 'w' ? 1 : RANKS - 2;
  const max = rankOf(from) === startRank ? 3 : 1;
  const zone = zoneOf(board, piece.color);
  const result: Square[] = [];
  let square = from;
  for (let step = 1; step <= max; step++) {
    const next = shift(square, [0, dir]);
    if (next === null || board[next]) break;
    result.push(next);
    if (zone.has(from) || zone.has(next)) break;
    square = next;
  }
  return result;
}

export function legalMoves(board: Board, color: Color, epTargets: readonly Square[] = []): Move[] {
  const moves: Move[] = [];
  board.forEach((piece, from) => {
    if (piece?.color !== color) return;
    const destinations = piece.type === 'p'
      ? [...pawnSteps(board, from, piece), ...targets(board, from, piece, epTargets).filter((to) => board[to]?.color === opposite(color) || epTargets.includes(to))]
      : targets(board, from, piece);
    for (const to of new Set(destinations)) {
      const occupant = board[to];
      if (occupant?.color === color || occupant?.type === 'k') continue;
      const epCapture = piece.type === 'p' && epTargets.includes(to) && !occupant ? enPassantVictim(color, epTargets) : null;
      const captured = epCapture === null ? occupant : board[epCapture];
      if (epCapture !== null && (captured?.type !== 'p' || captured.color !== opposite(color))) continue;
      board[from] = null;
      board[to] = piece;
      if (epCapture !== null) board[epCapture] = null;
      if (checkedKing(board, color) === null) {
        const promotion = piece.type === 'p' && rankOf(to) === (color === 'w' ? RANKS - 1 : 0) ? 'q' : null;
        moves.push({ from, to, promotion, captureAt: epCapture ?? (occupant ? to : null) });
      }
      board[to] = occupant ?? null;
      if (epCapture !== null) board[epCapture] = captured ?? null;
      board[from] = piece;
    }
  });
  return moves;
}
