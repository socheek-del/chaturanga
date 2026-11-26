import { attackersAt, inCheck, isAttackedAt, kingSquare, pieceAttacksSquare } from './attacks';
import { abs, canonicalSquare, gcd, keyOf, pointOf, sliderDirection } from './coordinates';
import type { Color, CoordinateMove, Piece, PieceType, Position, Square } from './types';

const PROMOTIONS: readonly Exclude<PieceType, 'k' | 'p'>[] = ['q', 'r', 'b', 'n'];
const KNIGHT_STEPS = [
  [1n, 2n], [2n, 1n], [2n, -1n], [1n, -2n], [-1n, -2n], [-2n, -1n], [-2n, 1n], [-1n, 2n],
] as const;
const KING_STEPS = [
  [1n, 0n], [1n, 1n], [0n, 1n], [-1n, 1n], [-1n, 0n], [-1n, -1n], [0n, -1n], [1n, -1n],
] as const;
const ROOK_DIRECTIONS = [[1n, 0n], [-1n, 0n], [0n, 1n], [0n, -1n]] as const;
const BISHOP_DIRECTIONS = [[1n, 1n], [1n, -1n], [-1n, 1n], [-1n, -1n]] as const;
const QUEEN_DIRECTIONS = [...ROOK_DIRECTIONS, ...BISHOP_DIRECTIONS] as const;

export function clonePosition(position: Position): Position {
  return {
    board: new Map(position.board),
    turn: position.turn,
    castling: new Set(position.castling),
    enPassant: position.enPassant,
    halfmoveClock: position.halfmoveClock,
    fullmoveNumber: position.fullmoveNumber,
  };
}

export function parseUci(uci: string): CoordinateMove | null {
  const match = /^(-?\d+,-?\d+)>(-?\d+,-?\d+)([qrbn]?)$/.exec(uci);
  if (!match) return null;
  const from = canonicalSquare(match[1]!);
  const to = canonicalSquare(match[2]!);
  if (!from || !to) return null;
  return { from, to, promotion: match[3] ? match[3] as CoordinateMove['promotion'] : null };
}

export function uciOf(move: CoordinateMove): string {
  return `${move.from}>${move.to}${move.promotion ?? ''}`;
}

function other(color: Color): Color {
  return color === 'w' ? 'b' : 'w';
}

function promotionLine(color: Color): bigint {
  return color === 'w' ? 8n : 1n;
}

function promotionOptions(piece: Piece, to: Square): readonly (CoordinateMove['promotion'])[] {
  if (piece.type !== 'p' || pointOf(to).y !== promotionLine(piece.color)) return [null];
  return PROMOTIONS;
}

function directionsFor(type: PieceType): readonly (readonly [bigint, bigint])[] {
  if (type === 'r') return ROOK_DIRECTIONS;
  if (type === 'b') return BISHOP_DIRECTIONS;
  return QUEEN_DIRECTIONS;
}

function isSliding(type: PieceType): boolean {
  return type === 'r' || type === 'b' || type === 'q';
}

function isOnOpenSegment(a: { x: bigint; y: bigint }, b: { x: bigint; y: bigint }, p: { x: bigint; y: bigint }): boolean {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (dx * (p.y - a.y) !== dy * (p.x - a.x)) return false;
  const dot = (p.x - a.x) * dx + (p.y - a.y) * dy;
  return dot > 0n && dot < dx * dx + dy * dy;
}

function rayClear(position: Position, from: Square, to: Square): boolean {
  const a = pointOf(from);
  const b = pointOf(to);
  for (const square of position.board.keys()) {
    if (square === from || square === to) continue;
    if (isOnOpenSegment(a, b, pointOf(square))) return false;
  }
  return true;
}

function homeRank(color: Color): bigint {
  return color === 'w' ? 1n : 8n;
}

function castleTarget(color: Color, side: 'K' | 'Q'): Square {
  return keyOf(side === 'K' ? 7n : 3n, homeRank(color));
}

function castleRight(color: Color, side: 'K' | 'Q'): 'K' | 'Q' | 'k' | 'q' {
  return color === 'w' ? side : side.toLowerCase() as 'k' | 'q';
}

function castlePseudoLegal(position: Position, from: Square, to: Square, color: Color): boolean {
  const start = pointOf(from);
  const target = pointOf(to);
  if (start.x !== 5n || start.y !== homeRank(color) || target.y !== start.y) return false;
  const side = target.x === 7n ? 'K' : target.x === 3n ? 'Q' : null;
  if (!side || !position.castling.has(castleRight(color, side))) return false;
  const rookFile = side === 'K' ? 8n : 1n;
  const rookSquare = keyOf(rookFile, start.y);
  const rook = position.board.get(rookSquare);
  if (rook?.color !== color || rook.type !== 'r') return false;

  const step = side === 'K' ? 1n : -1n;
  for (let x = start.x + step; x !== rookFile; x += step) {
    if (position.board.has(keyOf(x, start.y))) return false;
  }
  if (inCheck(position, color)) return false;

  const transit = keyOf(start.x + step, start.y);
  const transitPosition = clonePosition(position);
  const king = transitPosition.board.get(from)!;
  transitPosition.board.delete(from);
  transitPosition.board.set(transit, king);
  return !isAttackedAt(transitPosition, other(color), transit);
}

function isPseudoLegal(position: Position, move: CoordinateMove): boolean {
  if (move.from === move.to) return false;
  const piece = position.board.get(move.from);
  if (!piece || piece.color !== position.turn) return false;
  const targetPiece = position.board.get(move.to);
  if (targetPiece?.color === piece.color || targetPiece?.type === 'k') return false;

  const from = pointOf(move.from);
  const to = pointOf(move.to);
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  if (piece.type === 'p') {
    const forward = piece.color === 'w' ? 1n : -1n;
    const promotes = to.y === promotionLine(piece.color);
    if ((promotes && !move.promotion) || (!promotes && move.promotion)) return false;
    if (move.promotion && !PROMOTIONS.includes(move.promotion)) return false;

    if (dx === 0n && !targetPiece) {
      if (dy === forward) return true;
      const startRank = piece.color === 'w' ? 2n : 7n;
      const middle = keyOf(from.x, from.y + forward);
      return from.y === startRank && dy === 2n * forward && !position.board.has(middle);
    }
    if (abs(dx) !== 1n || dy !== forward) return false;
    if (targetPiece) return true;
    if (position.enPassant !== move.to) return false;
    const captured = position.board.get(keyOf(to.x, to.y - forward));
    return captured?.color === other(piece.color) && captured.type === 'p';
  }

  if (move.promotion) return false;
  if (piece.type === 'n') return (abs(dx) === 1n && abs(dy) === 2n) || (abs(dx) === 2n && abs(dy) === 1n);
  if (piece.type === 'k') {
    if (abs(dx) <= 1n && abs(dy) <= 1n) return true;
    if (abs(dx) === 2n && dy === 0n) return castlePseudoLegal(position, move.from, move.to, piece.color);
    return false;
  }
  if (!pieceAttacksSquare(position, move.from, piece, move.to)) return false;
  return rayClear(position, move.from, move.to);
}

function rightsLostAt(square: Square, color: Color): readonly ('K' | 'Q' | 'k' | 'q')[] {
  const y = homeRank(color);
  if (square === keyOf(5n, y)) return color === 'w' ? ['K', 'Q'] : ['k', 'q'];
  if (square === keyOf(1n, y)) return [color === 'w' ? 'Q' : 'q'];
  if (square === keyOf(8n, y)) return [color === 'w' ? 'K' : 'k'];
  return [];
}

export function applyMove(position: Position, move: CoordinateMove): Piece | null {
  const piece = position.board.get(move.from)!;
  const from = pointOf(move.from);
  const to = pointOf(move.to);
  const isCastle = piece.type === 'k' && abs(to.x - from.x) === 2n && to.y === from.y;
  const isEnPassant = piece.type === 'p' && move.to === position.enPassant && !position.board.has(move.to) && from.x !== to.x;
  const capturedSquare = isEnPassant ? keyOf(to.x, to.y - (piece.color === 'w' ? 1n : -1n)) : move.to;
  const captured = position.board.get(capturedSquare) ?? null;

  position.board.delete(move.from);
  position.board.delete(capturedSquare);
  position.board.set(move.to, { ...piece, type: move.promotion ?? piece.type, promoted: false });

  if (isCastle) {
    const side = to.x === 7n ? 'K' : 'Q';
    const rookFrom = keyOf(side === 'K' ? 8n : 1n, from.y);
    const rookTo = keyOf(side === 'K' ? 6n : 4n, from.y);
    const rook = position.board.get(rookFrom)!;
    position.board.delete(rookFrom);
    position.board.set(rookTo, rook);
  }

  for (const right of rightsLostAt(move.from, piece.color)) position.castling.delete(right);
  if (captured?.type === 'r') {
    for (const right of rightsLostAt(capturedSquare, captured.color)) position.castling.delete(right);
  }

  position.enPassant = null;
  if (piece.type === 'p' && abs(to.y - from.y) === 2n) {
    position.enPassant = keyOf(from.x, from.y + (piece.color === 'w' ? 1n : -1n));
  }
  position.halfmoveClock = piece.type === 'p' || captured ? 0 : position.halfmoveClock + 1;
  if (piece.color === 'b') position.fullmoveNumber++;
  position.turn = other(piece.color);
  return captured;
}

export function isLegalMove(position: Position, move: CoordinateMove): boolean {
  if (!isPseudoLegal(position, move)) return false;
  const next = clonePosition(position);
  applyMove(next, move);
  return !isAttackedAt(next, other(position.turn), kingSquare(next, position.turn));
}

function offset(from: Square, dx: bigint, dy: bigint): Square {
  const point = pointOf(from);
  return keyOf(point.x + dx, point.y + dy);
}

/** A finite set of candidate destinations sufficient to prove whether any legal move exists. */
function finiteCandidateTargets(position: Position, from: Square, piece: Piece): Square[] {
  const targets: Square[] = [];
  const add = (target: Square): void => {
    if (position.board.get(target)?.color !== piece.color) targets.push(target);
  };
  if (piece.type === 'p') {
    const p = pointOf(from);
    const forward = piece.color === 'w' ? 1n : -1n;
    const one = keyOf(p.x, p.y + forward);
    if (!position.board.has(one)) {
      add(one);
      const startRank = piece.color === 'w' ? 2n : 7n;
      const two = keyOf(p.x, p.y + 2n * forward);
      if (p.y === startRank && !position.board.has(two)) add(two);
    }
    for (const dx of [-1n, 1n]) {
      const target = keyOf(p.x + dx, p.y + forward);
      const victim = position.board.get(target);
      if (victim && victim.color !== piece.color && victim.type !== 'k') add(target);
      else if (target === position.enPassant) add(target);
    }
    return targets;
  }
  if (piece.type === 'n' || piece.type === 'k') {
    const offsets = piece.type === 'n' ? KNIGHT_STEPS : KING_STEPS;
    for (const [dx, dy] of offsets) add(offset(from, dx, dy));
    if (piece.type === 'k' && pointOf(from).x === 5n && pointOf(from).y === homeRank(piece.color)) {
      add(castleTarget(piece.color, 'K'));
      add(castleTarget(piece.color, 'Q'));
    }
    return targets;
  }

  for (const [dx, dy] of directionsFor(piece.type)) {
    const target = offset(from, dx, dy);
    const occupant = position.board.get(target);
    if (!occupant || (occupant.color !== piece.color && occupant.type !== 'k')) add(target);
  }
  return targets;
}

function hasLegalMoveTo(position: Position, from: Square, piece: Piece, target: Square): boolean {
  for (const promotion of promotionOptions(piece, target)) {
    if (isLegalMove(position, { from, to: target, promotion })) return true;
  }
  return false;
}

function cross(ax: bigint, ay: bigint, bx: bigint, by: bigint): bigint {
  return ax * by - ay * bx;
}

function sliderIntersections(
  from: Square,
  piece: Piece,
  king: Square,
  checker: Square,
): Square[] {
  const origin = pointOf(from);
  const royal = pointOf(king);
  const danger = pointOf(checker);
  const dx = danger.x - royal.x;
  const dy = danger.y - royal.y;
  const distance = gcd(dx, dy);
  if (distance <= 1n) return [];
  const sx = dx / distance;
  const sy = dy / distance;
  const qx = royal.x - origin.x;
  const qy = royal.y - origin.y;
  const targets: Square[] = [];

  for (const [rx, ry] of directionsFor(piece.type)) {
    const denominator = cross(rx, ry, sx, sy);
    if (denominator === 0n) continue;
    const tNumerator = cross(qx, qy, sx, sy);
    const uNumerator = cross(qx, qy, rx, ry);
    if (tNumerator % denominator !== 0n || uNumerator % denominator !== 0n) continue;
    const t = tNumerator / denominator;
    const u = uNumerator / denominator;
    if (t < 1n || u < 1n || u >= distance) continue;
    targets.push(keyOf(royal.x + u * sx, royal.y + u * sy));
  }
  return targets;
}

function checkEvasionTargets(position: Position): Square[] {
  const king = kingSquare(position, position.turn);
  const kingPiece = position.board.get(king)!;
  const targets = new Set<Square>(finiteCandidateTargets(position, king, kingPiece));
  const checkers = attackersAt(position, other(position.turn), king);
  for (const checker of checkers) targets.add(checker);

  // En passant can remove a checking pawn from a square other than the move's destination.
  if (position.enPassant) targets.add(position.enPassant);

  for (const checker of checkers) {
    const checkerPiece = position.board.get(checker)!;
    if (!isSliding(checkerPiece.type)) continue;
    const kingPoint = pointOf(king);
    const checkerPoint = pointOf(checker);
    const deltaX = checkerPoint.x - kingPoint.x;
    const deltaY = checkerPoint.y - kingPoint.y;
    const distance = gcd(deltaX, deltaY);
    if (distance <= 1n || !sliderDirection(deltaX, deltaY)) continue;
    for (const [from, piece] of position.board) {
      if (piece.color !== position.turn || piece.type === 'k') continue;
      const blockTargets = isSliding(piece.type)
        ? sliderIntersections(from, piece, king, checker)
        : finiteCandidateTargets(position, from, piece).filter((target) => isOnOpenSegment(kingPoint, checkerPoint, pointOf(target)));
      for (const target of blockTargets) targets.add(target);
    }
  }
  return [...targets];
}

function hasLegalCheckEvasion(position: Position): boolean {
  const candidates = legalMovesTo(position, checkEvasionTargets(position));
  return candidates.length > 0;
}

export function hasAnyLegalMove(position: Position): boolean {
  if (inCheck(position)) return hasLegalCheckEvasion(position);
  for (const [from, piece] of position.board) {
    if (piece.color !== position.turn) continue;
    for (const target of finiteCandidateTargets(position, from, piece)) {
      if (hasLegalMoveTo(position, from, piece, target)) return true;
    }
  }
  return false;
}

export function legalMovesTo(position: Position, destinations: readonly string[]): string[] {
  const targets = [...new Set(destinations.map(canonicalSquare).filter((target): target is Square => target !== null))];
  const moves: string[] = [];
  for (const [from, piece] of position.board) {
    if (piece.color !== position.turn) continue;
    for (const to of targets) {
      for (const promotion of promotionOptions(piece, to)) {
        const move = { from, to, promotion };
        if (isLegalMove(position, move)) moves.push(uciOf(move));
      }
    }
  }
  return moves;
}

/**
 * A finite move set for agents that cannot enumerate an unbounded sliding ray. It includes the nearest
 * legal moves needed to prove play can continue, tactical destinations up to `rayDistance`, and every
 * mathematically finite king-safety evasion when the side to move is checked.
 */
export function boundedLegalMoves(position: Position, rayDistance = 6): string[] {
  if (!Number.isInteger(rayDistance) || rayDistance < 1 || rayDistance > 64) {
    throw new RangeError('rayDistance must be an integer from 1 through 64');
  }
  const targets = new Set<Square>();
  for (const [from, piece] of position.board) {
    if (piece.color !== position.turn) continue;
    for (const target of finiteCandidateTargets(position, from, piece)) targets.add(target);
    if (!isSliding(piece.type)) continue;
    const origin = pointOf(from);
    for (const [dx, dy] of directionsFor(piece.type)) {
      for (let distance = 2; distance <= rayDistance; distance++) {
        const target = keyOf(origin.x + BigInt(distance) * dx, origin.y + BigInt(distance) * dy);
        targets.add(target);
        if (position.board.has(target)) break;
      }
    }
  }

  // Occupied enemy squares provide useful captures even when the opponent is far away.
  for (const [square, piece] of position.board) {
    if (piece.color !== position.turn && piece.type !== 'k') targets.add(square);
  }

  if (inCheck(position)) for (const target of checkEvasionTargets(position)) targets.add(target);
  return legalMovesTo(position, [...targets]);
}

export function findKing(position: Position, color: Color): Square {
  return kingSquare(position, color);
}
