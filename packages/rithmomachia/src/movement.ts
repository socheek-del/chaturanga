import type { Color, Square } from '@chaturanga/rules-core';
import { BOARD_SIZE, FILES, RANKS, coordinateOf, squareName } from './layout';
import { PYRAMID_COMPONENTS, type Position, type RithPiece } from './position';

export type Action =
  | { readonly kind: 'move'; readonly uci: string; readonly from: Square; readonly to: Square }
  | { readonly kind: 'drop'; readonly uci: string; readonly type: string; readonly to: Square }
  | { readonly kind: 'capture'; readonly uci: string; readonly from: Square; readonly to: Square; readonly components: readonly number[]; readonly takesWholePiece: boolean };

interface UnitValue {
  readonly type: string;
  readonly shape: Exclude<RithPiece['shape'], 'pyramid'>;
  readonly value: number;
  readonly componentIndex: number | null;
}

const pieceUnits = (piece: RithPiece): UnitValue[] => {
  if (piece.shape !== 'pyramid') return [{ type: piece.type, shape: piece.shape, value: piece.value, componentIndex: null }];
  return PYRAMID_COMPONENTS
    .filter((component) => (piece.mask! & (1 << component.index)) !== 0)
    .map((component) => ({
      type: `${component.shape[0]}${component.value}`,
      shape: component.shape,
      value: component.value,
      componentIndex: component.index,
    }));
};

function vectors(shape: UnitValue['shape']): readonly (readonly [number, number])[] {
  if (shape === 'circle') return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  const distance = shape === 'triangle' ? 2 : 3;
  return [[-distance, 0], [distance, 0], [0, -distance], [0, distance]];
}

function squareAt(file: number, rank: number): Square | null {
  if (file < 0 || file >= FILES || rank < 1 || rank > RANKS) return null;
  return (rank - 1) * FILES + file;
}

function pathClear(board: Position['board'], from: Square, to: Square): boolean {
  const a = coordinateOf(from);
  const b = coordinateOf(to);
  const dx = Math.sign(b.file - a.file);
  const dy = Math.sign(b.rank - a.rank);
  const distance = Math.max(Math.abs(b.file - a.file), Math.abs(b.rank - a.rank));
  for (let step = 1; step < distance; step++) {
    const square = squareAt(a.file + dx * step, a.rank + dy * step);
    if (square === null || board[square]) return false;
  }
  return true;
}

/** Ordinary movement endpoints, including occupied endpoints for capture checks. */
export function ordinaryReach(position: Position, from: Square, piece = position.board[from]): Set<Square> {
  if (!piece) return new Set();
  const fromCoordinate = coordinateOf(from);
  const result = new Set<Square>();
  for (const unit of pieceUnits(piece)) {
    for (const [dx, dy] of vectors(unit.shape)) {
      const to = squareAt(fromCoordinate.file + dx, fromCoordinate.rank + dy);
      if (to !== null && pathClear(position.board, from, to)) result.add(to);
    }
  }
  return result;
}

function directAssault(position: Position, from: Square, to: Square, attackerValue: number, targetValue: number): boolean {
  const a = coordinateOf(from);
  const b = coordinateOf(to);
  const deltaFile = Math.abs(a.file - b.file);
  const deltaRank = Math.abs(a.rank - b.rank);
  const straight = deltaFile === 0 || deltaRank === 0 || deltaFile === deltaRank;
  const distance = Math.max(deltaFile, deltaRank);
  return straight && distance >= 2 && attackerValue * (distance - 1) === targetValue && pathClear(position.board, from, to);
}

function unitTargets(piece: RithPiece): UnitValue[] {
  return pieceUnits(piece);
}

function componentSuffix(componentIndex: number | null): string {
  return componentIndex === null ? '' : String.fromCharCode(97 + componentIndex);
}

function addCapture(
  actions: Map<string, Action>,
  from: Square,
  to: Square,
  target: RithPiece,
  units: readonly UnitValue[],
): void {
  if (target.shape === 'pyramid') {
    for (const unit of units) {
      const componentIndex = unit.componentIndex!;
      const uci = `${squareName(from)}${squareName(to)}${componentSuffix(componentIndex)}`;
      actions.set(uci, { kind: 'capture', uci, from, to, components: [componentIndex], takesWholePiece: false });
    }
    return;
  }
  const uci = `${squareName(from)}${squareName(to)}`;
  actions.set(uci, { kind: 'capture', uci, from, to, components: [], takesWholePiece: true });
}

function hasSiege(position: Position, target: Square, color: Color): boolean {
  const { file, rank } = coordinateOf(target);
  const neighbors = [squareAt(file - 1, rank), squareAt(file + 1, rank), squareAt(file, rank - 1), squareAt(file, rank + 1)];
  return neighbors.every((square) => square !== null && position.board[square]?.color === color);
}

function siegeSource(position: Position, target: Square, color: Color): Square | null {
  const { file, rank } = coordinateOf(target);
  const neighbors = [squareAt(file - 1, rank), squareAt(file + 1, rank), squareAt(file, rank - 1), squareAt(file, rank + 1)];
  return neighbors.filter((square): square is Square => square !== null && position.board[square]?.color === color).sort((a, b) => a - b)[0] ?? null;
}

function ambushSources(position: Position, targetSquare: Square, targetValue: number, color: Color, reachBySquare: ReadonlyMap<Square, Set<Square>>): Square[] {
  const attackers = position.board.flatMap((piece, square) => piece?.color === color && reachBySquare.get(square)?.has(targetSquare)
    ? [{ square, value: piece.value }]
    : []);
  const sources = new Set<Square>();
  for (let first = 0; first < attackers.length; first++) {
    for (let second = first + 1; second < attackers.length; second++) {
      if (attackers[first]!.value + attackers[second]!.value === targetValue) {
        sources.add(attackers[first]!.square);
        sources.add(attackers[second]!.square);
      }
    }
  }
  return [...sources].sort((a, b) => a - b);
}

export function legalActions(position: Position): Action[] {
  const color = position.turn;
  const actions = new Map<string, Action>();
  const reachBySquare = new Map<Square, Set<Square>>();
  for (let square = 0; square < BOARD_SIZE; square++) {
    const piece = position.board[square];
    if (piece?.color !== color) continue;
    reachBySquare.set(square, ordinaryReach(position, square, piece));
  }

  for (const [from, reach] of reachBySquare) {
    for (const to of reach) {
      if (position.board[to] === null) {
        const uci = `${squareName(from)}${squareName(to)}`;
        actions.set(uci, { kind: 'move', uci, from, to });
      }
    }
  }

  for (let targetSquare = 0; targetSquare < BOARD_SIZE; targetSquare++) {
    const target = position.board[targetSquare];
    if (!target || target.color === color) continue;
    const targetUnits = unitTargets(target);

    for (const [from, reach] of reachBySquare) {
      const attacker = position.board[from]!;
      const canReach = reach.has(targetSquare);
      const captureUnits = target.shape === 'pyramid'
        ? targetUnits.filter((unit) => (canReach && attacker.value === unit.value)
          || directAssault(position, from, targetSquare, attacker.value, unit.value))
        : targetUnits.filter((unit) => (canReach && attacker.value === unit.value)
          || directAssault(position, from, targetSquare, attacker.value, unit.value));
      if (captureUnits.length) addCapture(actions, from, targetSquare, target, captureUnits);
    }

    for (const unit of targetUnits) {
      const sources = ambushSources(position, targetSquare, unit.value, color, reachBySquare);
      if (sources.length >= 2) {
        // Every member of a qualifying pair may be selected as the visible source; the action itself removes
        // the target component and leaves its helper on its square.
        for (const from of sources) addCapture(actions, from, targetSquare, target, [unit]);
      }
    }

    if (hasSiege(position, targetSquare, color)) {
      const from = siegeSource(position, targetSquare, color)!;
      if (target.shape === 'pyramid') {
        const uci = `${squareName(from)}${squareName(targetSquare)}z`;
        actions.set(uci, {
          kind: 'capture', uci, from, to: targetSquare,
          components: targetUnits.map((unit) => unit.componentIndex!), takesWholePiece: false,
        });
      } else addCapture(actions, from, targetSquare, target, targetUnits);
    }
  }

  const homeRank = color === 'w' ? 0 : RANKS - 1;
  for (const type of new Set(position.hands[color])) {
    for (let file = 0; file < FILES; file++) {
      const to = homeRank * FILES + file;
      if (position.board[to] !== null) continue;
      const uci = `${type.toUpperCase()}@${squareName(to)}`;
      actions.set(uci, { kind: 'drop', uci, type, to });
    }
  }
  return [...actions.values()].sort((a, b) => a.uci.localeCompare(b.uci));
}

export function attackedSquares(position: Position, color: Color): Square[] {
  const result = new Set<Square>();
  const reachBySquare = new Map<Square, Set<Square>>();
  for (let square = 0; square < BOARD_SIZE; square++) {
    const piece = position.board[square];
    if (piece?.color !== color) continue;
    const reach = ordinaryReach(position, square, piece);
    reachBySquare.set(square, reach);
    for (const target of reach) result.add(target);
  }

  for (let targetSquare = 0; targetSquare < BOARD_SIZE; targetSquare++) {
    const target = position.board[targetSquare];
    if (!target || target.color === color) continue;
    if ([...reachBySquare.values()].some((reach) => reach.has(targetSquare))) {
      result.add(targetSquare);
      continue;
    }
    const direct = [...reachBySquare.keys()].some((from) => {
      const attacker = position.board[from]!;
      return unitTargets(target).some((unit) => directAssault(position, from, targetSquare, attacker.value, unit.value));
    });
    if (direct || unitTargets(target).some((unit) => ambushSources(position, targetSquare, unit.value, color, reachBySquare).length >= 2)
      || hasSiege(position, targetSquare, color)) result.add(targetSquare);
  }
  return [...result].sort((a, b) => a - b);
}

export function captureResult(position: Position, action: Extract<Action, { kind: 'capture' }>): { captured: RithPiece; captures: RithPiece[] } {
  const target = position.board[action.to]!;
  const captured: RithPiece[] = [];
  if (action.takesWholePiece) {
    captured.push({ ...target });
  } else {
    const components = PYRAMID_COMPONENTS.filter((component) => action.components.includes(component.index));
    for (const component of components) captured.push({
      color: target.color,
      type: `${component.shape[0]}${component.value}`,
      shape: component.shape,
      value: component.value,
      promoted: false,
    });
  }
  return { captured: captured[0]!, captures: captured.slice(1) };
}

export function updatedTargetAfterCapture(target: RithPiece, action: Extract<Action, { kind: 'capture' }>): RithPiece | null {
  if (action.takesWholePiece) return null;
  const mask = target.mask! & ~action.components.reduce((result, index) => result | (1 << index), 0);
  if (mask === 0) return null;
  const remaining = PYRAMID_COMPONENTS.filter((component) => (mask & (1 << component.index)) !== 0);
  return { ...target, type: `p${mask.toString(36)}`, mask, value: remaining.reduce((sum, component) => sum + component.value, 0) };
}
