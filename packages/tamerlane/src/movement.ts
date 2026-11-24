import type { Color, Square } from '@chaturanga/rules-core';
import {
  BOARD_SIZE, FILES, PAWN_TARGET, castleSwapRight, fileOf, finalRank, goalReached, isCitadel, isImmune,
  isPawn, isPlayable, isRoyal, kingSwapRight, opposite, ownCitadel, rankOf, royalSquares, squareName,
  type Board, type Piece, type PieceType, type Position,
} from './position';

type Offset = readonly [file: number, rank: number];
type Edit = readonly [square: Square, piece: Piece | null];

export interface Move {
  from: Square;
  to: Square;
  promotion?: PieceType;
  edits: readonly Edit[];
  spendRight?: string;
  draw?: boolean;
}

const orthogonal: readonly Offset[] = [[0, 1], [1, 0], [0, -1], [-1, 0]];
const diagonal: readonly Offset[] = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const adjacent = [...orthogonal, ...diagonal];

function scaled(offsets: readonly Offset[], distance: number): Offset[] {
  return offsets.map(([x, y]) => [x * distance, y * distance]);
}
function longOffsets(distance: number): Offset[] {
  return diagonal.flatMap(([x, y]) => [[x, y * distance], [x * distance, y]]);
}

const knight = longOffsets(2);
const camel = longOffsets(3);
const elephant = scaled(diagonal, 2);
const warEngine = scaled(orthogonal, 2);

function shift(from: Square, [dx, dy]: Offset): Square | null {
  const file = fileOf(from) + dx;
  const rank = rankOf(from) + dy;
  if (file < 0 || file >= FILES) return null;
  const to = rank * FILES + file;
  return isPlayable(to) ? to : null;
}

function steps(from: Square, offsets: readonly Offset[], allowCitadel = false): Square[] {
  return offsets.flatMap((offset) => {
    const to = shift(from, offset);
    return to === null || (!allowCitadel && isCitadel(to)) ? [] : [to];
  });
}

function slides(board: Board, from: Square, offsets: readonly Offset[], minimum = 1): Square[] {
  const result: Square[] = [];
  for (const offset of offsets) {
    let distance = 1;
    for (let to = shift(from, offset); to !== null && !isCitadel(to); to = shift(to, offset)) {
      if (distance++ >= minimum) result.push(to);
      if (board[to]) break;
    }
  }
  return result;
}

function giraffeTargets(board: Board, from: Square): Square[] {
  const result: Square[] = [];
  for (const offset of diagonal) {
    const bend = shift(from, offset);
    if (bend === null || isCitadel(bend) || board[bend]) continue;
    result.push(...slides(board, bend, [[offset[0], 0], [0, offset[1]]], 3));
  }
  return result;
}

function pawnAttacks(from: Square, color: Color): Square[] {
  const forward = color === 'w' ? 1 : -1;
  return steps(from, [[-1, forward], [1, forward]]);
}

function targets(board: Board, from: Square, piece: Piece): Square[] {
  if (isPawn(piece.type)) return isImmune(from, piece) ? [] : pawnAttacks(from, piece.color);
  switch (piece.type) {
    case 'k':
    case 'h':
    case 't': return steps(from, adjacent);
    case 'r': return slides(board, from, orthogonal);
    case 'b': return slides(board, from, diagonal, 2);
    case 'f': return steps(from, diagonal);
    case 'v': return steps(from, orthogonal);
    case 'n': return steps(from, knight);
    case 'c': return steps(from, camel);
    case 'e': return steps(from, elephant);
    case 'd': return steps(from, warEngine);
    case 'g': return giraffeTargets(board, from);
    default: return [];
  }
}

export function attackedSquares(board: Board, color: Color): Square[] {
  const attacked = new Set<Square>();
  board.forEach((piece, square) => {
    if (piece?.color === color) targets(board, square, piece).forEach((to) => attacked.add(to));
  });
  return [...attacked].sort((a, b) => a - b);
}

export function checkedKing(board: Board, color: Color): Square | null {
  const royals = royalSquares(board, color);
  if (royals.length !== 1) return null;
  const king = royals[0]!;
  return isAttacked(board, king, opposite(color)) ? king : null;
}

function isAttacked(board: Board, square: Square, by: Color): boolean {
  return !isCitadel(square) && board.some((piece, from) =>
    piece?.color === by && targets(board, from, piece).includes(square));
}

export function boardAfter(board: Board, { edits }: Move): Board {
  const updated = board.slice();
  for (const [square, piece] of edits) updated[square] = piece;
  return updated;
}

export const moveUci = ({ from, to, promotion }: Move): string =>
  squareName(from) + squareName(to) + (promotion ?? '');

function returnSquare(board: Board, color: Color): Square | null {
  const homeRank = color === 'w' ? 2 : 7;
  const centre = homeRank * FILES + 6;
  if (!board[centre]) return centre;
  const step = color === 'w' ? -1 : 1;
  for (let offset = 1; offset <= 5; offset++) {
    const before = centre + offset * step;
    const after = centre - offset * step;
    if (!board[before]) return before;
    if (!board[after]) return after;
  }
  return null;
}

function ordinaryMove(board: Board, from: Square, to: Square, piece: Piece): Move | null {
  if (!isPawn(piece.type) || rankOf(to) !== finalRank(piece.color)) {
    return { from, to, edits: [[from, null], [to, piece]] };
  }

  if (piece.type === 'x') {
    const rebirth = returnSquare(board, piece.color);
    if (rebirth === null) return null;
    return {
      from, to, promotion: 'y',
      edits: [[from, null], [to, null], [rebirth, { type: 'y', color: piece.color, promoted: false }]],
    };
  }

  const promotion = PAWN_TARGET[piece.type];
  return {
    from, to, promotion,
    edits: [[from, null], [to, promotion ? { type: promotion, color: piece.color, promoted: true } : piece]],
  };
}

function addCitadelMoves(moves: Move[], position: Position, royals: readonly Square[]): void {
  const { board, turn, rights } = position;
  const own = ownCitadel(turn);
  const enemy = ownCitadel(opposite(turn));
  const highest = royals[0]!;
  const occupant = board[highest]!;
  if (!board[enemy] && steps(highest, adjacent, true).includes(enemy)) {
    moves.push({ from: highest, to: enemy, edits: [[highest, null], [enemy, occupant]], draw: true });
    const privilege = castleSwapRight(turn);
    if (occupant.type === 'k' && rights.includes(privilege)) {
      for (const lower of royals.slice(1)) {
        moves.push({
          from: lower, to: enemy, spendRight: privilege,
          edits: [[highest, null], [lower, occupant], [enemy, board[lower]!]],
        });
      }
    }
  }
  if (!board[own]) {
    const minor = royals.find((square) => board[square]?.type === 't');
    if (minor !== undefined && steps(minor, adjacent, true).includes(own)) {
      moves.push({ from: minor, to: own, edits: [[minor, null], [own, board[minor]!]] });
    }
  }
}

function normalMoves(position: Position): Move[] {
  const { board, turn, rights } = position;
  const moves: Move[] = [];
  const enemy = opposite(turn);
  const royals = royalSquares(board, turn);
  const enemyRoyals = royalSquares(board, enemy);
  const lastEnemyRoyal = enemyRoyals.length === 1 ? enemyRoyals[0] : undefined;

  board.forEach((piece, from) => {
    if (piece?.color !== turn || (isPawn(piece.type) && isImmune(from, piece))) return;
    const attacks = targets(board, from, piece);
    const destinations = isPawn(piece.type) ? attacks.filter((to) => board[to]?.color === enemy) : attacks;
    if (isPawn(piece.type)) {
      const advance = shift(from, [0, turn === 'w' ? 1 : -1]);
      if (advance !== null && !isCitadel(advance) && board[advance] === null) destinations.push(advance);
    }
    for (const to of destinations) {
      const captured = board[to];
      if (to === lastEnemyRoyal || (captured && (captured.color === turn || isImmune(to, captured)))) continue;
      const move = ordinaryMove(board, from, to, piece);
      if (move) moves.push(move);
    }
  });

  addCitadelMoves(moves, position, royals);
  const checked = checkedKing(board, turn);
  const privilege = kingSwapRight(turn);
  if (checked !== null && board[checked]?.type === 'k' && rights.includes(privilege)) {
    board.forEach((piece, to) => {
      if (piece?.color !== turn || isRoyal(piece.type) || isImmune(to, piece)) return;
      moves.push({ from: checked, to, spendRight: privilege, edits: [[checked, piece], [to, board[checked]!]] });
    });
  }
  if (royals.length !== 1) return moves;
  const king = royals[0]!;
  return moves.filter((move) => {
    const destination = move.from === king ? move.to : king;
    return !isAttacked(boardAfter(board, move), destination, enemy);
  });
}

function redeployments(position: Position, from: Square): Move[] {
  const { board, turn } = position;
  const moves: Move[] = [];
  const relocated = { type: 'x', color: turn, promoted: false } satisfies Piece;
  const enemy = opposite(turn);

  for (let to = 0; to < BOARD_SIZE; to++) {
    if (!isPlayable(to) || isCitadel(to) || rankOf(to) === finalRank(turn)) continue;
    const occupant = board[to];
    if (occupant && (isRoyal(occupant.type) || isImmune(to, occupant))) continue;
    const threats = pawnAttacks(to, turn).filter((target) => {
      const piece = board[target];
      return piece?.color === enemy && !isImmune(target, piece);
    });
    if (!threats.length) continue;
    const candidate = { from, to, edits: [[from, null], [to, relocated]] } satisfies Move;
    const updated = boardAfter(board, candidate);
    if (checkedKing(updated, turn) !== null) continue;
    const replies = threats.length === 1 ? normalMoves({ ...position, board: updated, turn: enemy }) : [];
    if (threats.length >= 2 || !replies.some((reply) => reply.from === threats[0] || reply.to === to)) {
      moves.push(candidate);
    }
  }
  return moves;
}

export function legalMoves(position: Position): Move[] {
  const { board, turn, rights } = position;
  if (rights.includes(goalReached)) return [];
  const waiting = board.findIndex((piece, square) => piece?.color === turn && piece.type === 'p' && isImmune(square, piece));
  if (waiting >= 0) {
    const choices = redeployments(position, waiting);
    if (choices.length) return choices;
  }
  return normalMoves(position);
}
