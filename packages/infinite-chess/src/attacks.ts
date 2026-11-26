import { abs, pointOf, sliderDirection } from './coordinates';
import type { Color, Piece, Position, Square } from './types';

function isBetween(fromX: bigint, fromY: bigint, toX: bigint, toY: bigint, x: bigint, y: bigint): boolean {
  const dx = toX - fromX;
  const dy = toY - fromY;
  if (dx * (y - fromY) !== dy * (x - fromX)) return false;
  const dot = (x - fromX) * dx + (y - fromY) * dy;
  const lengthSquared = dx * dx + dy * dy;
  return dot > 0n && dot < lengthSquared;
}

function rayIsClear(position: Position, from: Square, to: Square): boolean {
  const a = pointOf(from);
  const b = pointOf(to);
  for (const square of position.board.keys()) {
    if (square === from || square === to) continue;
    const p = pointOf(square);
    if (isBetween(a.x, a.y, b.x, b.y, p.x, p.y)) return false;
  }
  return true;
}

export function pieceAttacksSquare(position: Position, from: Square, piece: Piece, target: Square): boolean {
  if (from === target) return false;
  const a = pointOf(from);
  const b = pointOf(target);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  switch (piece.type) {
    case 'p': return abs(dx) === 1n && dy === (piece.color === 'w' ? 1n : -1n);
    case 'n': return (abs(dx) === 1n && abs(dy) === 2n) || (abs(dx) === 2n && abs(dy) === 1n);
    case 'k': return abs(dx) <= 1n && abs(dy) <= 1n;
    case 'r':
      if (dx !== 0n && dy !== 0n) return false;
      break;
    case 'b':
      if (abs(dx) !== abs(dy)) return false;
      break;
    case 'q':
      if (sliderDirection(dx, dy) === null) return false;
      break;
  }
  return rayIsClear(position, from, target);
}

export function attackersAt(position: Position, color: Color, target: Square): Square[] {
  const attackers: Square[] = [];
  for (const [square, piece] of position.board) {
    if (piece.color === color && pieceAttacksSquare(position, square, piece, target)) attackers.push(square);
  }
  return attackers;
}

export function isAttackedAt(position: Position, color: Color, target: Square): boolean {
  return attackersAt(position, color, target).length > 0;
}

export function kingSquare(position: Position, color: Color): Square {
  for (const [square, piece] of position.board) if (piece.color === color && piece.type === 'k') return square;
  throw new Error(`Missing ${color === 'w' ? 'White' : 'Black'} king`);
}

export function inCheck(position: Position, color: Color = position.turn): boolean {
  return isAttackedAt(position, color === 'w' ? 'b' : 'w', kingSquare(position, color));
}
