import type { Color, Square } from '@chaturanga/rules-core';
import { BOARD_SIZE, FILES, PROMOTION_OF, RANKS, opposite, shift, squareName, squareOf, type Piece, type PieceType, type Position } from './position';
import { cloneBoard, rankOf } from './position';

type Direction = readonly [df: number, dr: number];
type Primitive =
  | { kind: 'step'; directions: readonly Direction[] }
  | { kind: 'jump'; offsets: readonly Direction[] }
  | { kind: 'range'; directions: readonly Direction[]; maxDistance?: number };
interface Mode {
  primitives: readonly Primitive[];
  maxLegs: number;
  minLegs?: number;
  shape?: 'flag-line' | 'thunderclap' | 'cavalry';
}
interface ShotProfile {
  maxDistance: number;
  maxShots: number;
  kind: 'blocked' | 'cannon' | 'adjacent';
}
interface PieceSpec {
  modes: readonly Mode[];
  shot?: ShotProfile;
  captureFamilyOnly?: 'priest';
}
interface Segment { to: Square; shots: Square[] }
interface WorkingPosition { board: Position['board']; priestLost: Position['priestLost'] }
export interface Candidate {
  readonly uci: string;
  readonly color: Color;
  readonly from: Square;
  readonly to: Square;
  readonly piece: Piece;
  readonly captures: readonly Piece[];
  readonly resulting: Position;
  readonly path: readonly Square[];
}

const ORTHOGONAL: readonly Direction[] = [[0, 1], [1, 0], [0, -1], [-1, 0]];
const DIAGONAL: readonly Direction[] = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const ALL: readonly Direction[] = [...ORTHOGONAL, ...DIAGONAL];
const KING = (_color: Color): readonly Direction[] => ALL;
const F = (color: Color): number => color === 'w' ? 1 : -1;
const fwd = (color: Color): Direction => [0, F(color)];
const back = (color: Color): Direction => [0, -F(color)];
const forwardDiagonal = (color: Color): readonly Direction[] => [[1, F(color)], [-1, F(color)]];
const backwardDiagonal = (color: Color): readonly Direction[] => [[1, -F(color)], [-1, -F(color)]];
const sideways: readonly Direction[] = [[1, 0], [-1, 0]];
const step = (directions: readonly Direction[]): Primitive => ({ kind: 'step', directions });
const range = (directions: readonly Direction[], maxDistance?: number): Primitive => ({ kind: 'range', directions, maxDistance });
const jump = (offsets: readonly Direction[]): Primitive => ({ kind: 'jump', offsets });
const single = (...primitives: Primitive[]): Mode => ({ primitives, maxLegs: 1 });
const repeated = (maxLegs: number, ...primitives: Primitive[]): Mode => ({ primitives, maxLegs });
const knightMoves: readonly Direction[] = [
  [2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2],
];

function pieceSpec(piece: Piece, position: Position | WorkingPosition): PieceSpec {
  const color = piece.color;
  const forward = fwd(color);
  const backward = back(color);
  const king = KING(color);
  switch (piece.type) {
    case 'general':
    case 'middle-troop':
    case 'governor': return { modes: [single(step(king))] };
    case 'clerk': return { modes: [single(step(DIAGONAL), jump([[0, 2], [0, -2], [2, 0], [-2, 0]]))] };
    case 'master-at-arms': return { modes: [repeated(2, step(DIAGONAL), jump([[0, 2], [0, -2], [2, 0], [-2, 0]]))] };
    case 'staff-officer': return { modes: [single(step(ORTHOGONAL), jump([[2, 2], [2, -2], [-2, 2], [-2, -2]]))] };
    case 'banner-and-drum': return { modes: [repeated(2, step(ORTHOGONAL), jump([[2, 2], [2, -2], [-2, 2], [-2, -2]]))] };
    case 'aide-de-camp': {
      const directions = king.filter(([df, dr]) => !(df === 0 && dr === -F(color)));
      return { modes: [single(step(directions))] };
    }
    case 'sumo': return { modes: [repeated(2, step(king))] };
    case 'aide': return { modes: [single(step([...ORTHOGONAL, ...forwardDiagonal(color)]))] };
    case 'town-brigade': return { modes: [single(range([forward, backward]), step(king))] };
    case 'staff': return { modes: [single(step([...DIAGONAL, forward]))] };
    case 'village-brigade': return { modes: [single(range(sideways), step(king))] };
    case 'chief-of-staff': return { modes: [single(step([...DIAGONAL, forward, backward]))] };
    case 'vice-commander': return { modes: [single(range([...DIAGONAL, forward]))] };
    case 'engineer':
    case 'poison-flame': return { modes: [single(step([forward, backward, ...forwardDiagonal(color)]))] };
    case 'taoist-priest':
    case 'spiritual-monk':
    case 'five-li-fog':
    case 'immaculate-light': return {
      modes: [piece.type === 'five-li-fog' || piece.type === 'immaculate-light' ? repeated(2, jump(
        [[0, 2], [0, -2], [2, 0], [-2, 0], [2, 2], [2, -2], [-2, 2], [-2, -2]],
      )) : single(jump([[0, 2], [0, -2], [2, 0], [-2, 0], [2, 2], [2, -2], [-2, 2], [-2, -2]]))],
      shot: { maxDistance: 1, maxShots: 1, kind: 'adjacent' },
      captureFamilyOnly: 'priest',
    };
    case 'advance-guard': return { modes: [single(range([forward]), step([backward]))] };
    case 'skyward-net': return { modes: [single(range([...sideways, ...forwardDiagonal(color)]), step([backward]))] };
    case 'drum':
    case 'banner': return { modes: [single(step([...DIAGONAL, ...sideways]))] };
    case 'sentry': return { modes: [single(step(king.filter(([, dr]) => dr !== F(color))))] };
    case 'centuria': return { modes: [single(range(DIAGONAL), step(ORTHOGONAL))] };
    case 'war-hawk': return { modes: [single(range(DIAGONAL)), repeated(2, step(ORTHOGONAL))] };
    case 'millenary': return { modes: [single(range(ALL))] };
    case 'dragon-ascending': return { modes: [single(range(ALL)), repeated(2, step(king))] };
    case 'quartermaster': return { modes: [single(range(ORTHOGONAL), step(DIAGONAL))] };
    case 'tiger-wing': return { modes: [single(range(ORTHOGONAL)), repeated(2, step(DIAGONAL))] };
    case 'rear-guard': return { modes: [single(range([backward]), step([forward]))] };
    case 'earthward-net': return { modes: [single(range([...sideways, ...backwardDiagonal(color)]), step([forward]))] };
    case 'frankish-cannon': return { modes: [single(step(DIAGONAL))], shot: { maxDistance: 7, maxShots: 2, kind: 'blocked' } };
    case 'chariot-of-the-gods': return { modes: [single(range(ORTHOGONAL, 5))], shot: { maxDistance: 7, maxShots: 2, kind: 'blocked' } };
    case 'elephant': return { modes: [single(range(DIAGONAL))] };
    case 'longbow': return { modes: [single(step(DIAGONAL))], shot: { maxDistance: 3, maxShots: 1, kind: 'blocked' } };
    case 'longbow-cavalryman': return { modes: [single(jump(knightMoves))], shot: { maxDistance: 3, maxShots: 1, kind: 'blocked' } };
    case 'crossbow': return { modes: [single(step(DIAGONAL))], shot: { maxDistance: 5, maxShots: 1, kind: 'blocked' } };
    case 'crossbow-cavalryman': return { modes: [single(jump(knightMoves))], shot: { maxDistance: 5, maxShots: 1, kind: 'blocked' } };
    case 'cannon': return { modes: [single(step(DIAGONAL))], shot: { maxDistance: 5, maxShots: 1, kind: 'cannon' } };
    case 'gun-carriage': return { modes: [single(range(ORTHOGONAL, 5))], shot: { maxDistance: 5, maxShots: 1, kind: 'cannon' } };
    case 'cavalryman': return { modes: [single(jump(knightMoves))] };
    case 'cavalry': return { modes: [{ primitives: [jump(knightMoves)], maxLegs: 2, shape: 'cavalry' }] };
    case 'winged-horse': return { modes: [repeated(2, jump(knightMoves))] };
    case 'pawn': return { modes: [single(step(hasRole(position.board, color, 'drum') ? ORTHOGONAL : [forward, ...sideways, backward]))] };
    case 'patrol-unit': return { modes: [single(range([forward, backward]), step(sideways))] };
    case 'commissar': return { modes: [single(range([...DIAGONAL, forward, backward]))] };
    case 'shield': return { modes: [single(step(DIAGONAL))] };
    case 'shield-unit': return { modes: [single(range(sideways), step(DIAGONAL))] };
    case 'heavenly-fortress': return { modes: [single(range([...DIAGONAL, ...sideways]))] };
    case 'chariot': return { modes: [single(range(ORTHOGONAL, 5))] };
    case 'chariot-unit': return { modes: [single(range(ORTHOGONAL))] };
    case 'vanguard': return { modes: [single(range([forward], 5))] };
    case 'thunderclap': return { modes: [{ primitives: [step(ORTHOGONAL)], maxLegs: 5, minLegs: 5, shape: 'thunderclap' }] };
    case 'flag-waver': return { modes: [{ primitives: [step(ORTHOGONAL)], maxLegs: 5, shape: 'flag-line' }] };
    default: {
      const exhaustive: never = piece.type;
      throw new Error(`Missing Ko Shogi movement for ${exhaustive}`);
    }
  }
}

function hasRole(board: Position['board'], color: Color, role: 'banner' | 'drum'): boolean {
  return board.some((piece) => piece?.color === color && (piece.type === role || piece.type === 'banner-and-drum'));
}

function isPriestFamily(type: PieceType): boolean {
  return ['taoist-priest', 'spiritual-monk', 'five-li-fog', 'immaculate-light'].includes(type);
}

function isEnemyNetRay(board: Position['board'], square: Square, color: Color): boolean {
  for (let origin = 0; origin < BOARD_SIZE; origin++) {
    const net = board[origin];
    if (!net || net.color === color || (net.type !== 'skyward-net' && net.type !== 'earthward-net')) continue;
    const f = F(net.color);
    const directions = net.type === 'skyward-net'
      ? [...sideways, [1, f] as const, [-1, f] as const]
      : [...sideways, [1, -f] as const, [-1, -f] as const];
    for (const [df, dr] of directions) {
      let target = shift(origin, df, dr);
      while (target !== null) {
        if (target === square) return true;
        if (board[target]) break;
        target = shift(target, df, dr);
      }
    }
  }
  return false;
}

function withinFive(left: Square, right: Square): boolean {
  return Math.max(Math.abs(left % FILES - right % FILES), Math.abs(Math.floor(left / FILES) - Math.floor(right / FILES))) <= 5;
}

function isSuppressed(board: Position['board'], shooter: Piece, square: Square): boolean {
  const shootingTypes: PieceType[] = [
    'frankish-cannon', 'chariot-of-the-gods', 'longbow', 'longbow-cavalryman', 'crossbow', 'crossbow-cavalryman',
    'cannon', 'gun-carriage',
  ];
  if (!shootingTypes.includes(shooter.type)) return false;
  return board.some((piece, target) => piece?.type === 'five-li-fog' && piece.color !== shooter.color && withinFive(square, target));
}

function isCaptureImmuneByShot(shooter: Piece, target: Piece, distance: number): boolean {
  if (shooter.type === 'longbow' || shooter.type === 'longbow-cavalryman')
    return ['shield', 'shield-unit', 'chariot', 'chariot-unit', 'heavenly-fortress', 'five-li-fog'].includes(target.type);
  if (shooter.type === 'cannon' || shooter.type === 'gun-carriage')
    return ['shield-unit', 'heavenly-fortress', 'five-li-fog'].includes(target.type);
  if (shooter.type === 'frankish-cannon' || shooter.type === 'chariot-of-the-gods') {
    if (['shield-unit', 'heavenly-fortress'].includes(target.type)) return true;
    return target.type === 'five-li-fog' && !(distance === 6 || distance === 7);
  }
  return false;
}

function isCaptureImmuneByMove(mover: Piece, target: Piece): boolean {
  if ((mover.type === 'taoist-priest' || mover.type === 'spiritual-monk' || mover.type === 'five-li-fog' || mover.type === 'immaculate-light') && !isPriestFamily(target.type))
    return true;
  if (target.type === 'heavenly-fortress' && ['chariot', 'chariot-unit', 'gun-carriage', 'chariot-of-the-gods'].includes(mover.type))
    return true;
  return false;
}

function primitiveDestinations(
  board: Position['board'], from: Square, mover: Piece, primitive: Primitive, position: Position | WorkingPosition,
  includeFriendly = false,
): Array<{ to: Square; delta: Direction; target: Piece | null }> {
  if (isEnemyNetRay(board, from, mover.color)) return [];
  const result: Array<{ to: Square; delta: Direction; target: Piece | null }> = [];
  const append = (to: Square, delta: Direction): void => {
    const target = board[to] ?? null;
    if (target?.color === mover.color) {
      if (includeFriendly) result.push({ to, delta, target });
      return;
    }
    if (target && isCaptureImmuneByMove(mover, target)) return;
    if (mover.type === 'pawn' && delta[0] === 0 && delta[1] === F(mover.color) && !hasRole(board, mover.color, 'drum')) return;
    if ((mover.type === 'taoist-priest' || mover.type === 'five-li-fog') && hasAdjacentSameFamily(board, to, mover)) return;
    if ((mover.type === 'spiritual-monk' || mover.type === 'immaculate-light') && hasAdjacentSameFamily(board, to, mover)) return;
    result.push({ to, delta, target });
  };

  if (primitive.kind === 'step') {
    for (const delta of primitive.directions) {
      const to = shift(from, delta[0], delta[1]);
      if (to !== null) append(to, delta);
    }
  } else if (primitive.kind === 'jump') {
    for (const delta of primitive.offsets) {
      const to = shift(from, delta[0], delta[1]);
      if (to !== null) append(to, delta);
    }
  } else {
    for (const direction of primitive.directions) {
      let distance = 1;
      let to = shift(from, direction[0], direction[1]);
      while (to !== null && distance <= (primitive.maxDistance ?? 18)) {
        const target = board[to] ?? null;
        if (target?.color === mover.color) {
          if (includeFriendly) result.push({ to, delta: [direction[0] * distance, direction[1] * distance], target });
          break;
        }
        if (target && isCaptureImmuneByMove(mover, target)) break;
        if (!(mover.type === 'pawn' && direction[0] === 0 && direction[1] === F(mover.color) && !hasRole(board, mover.color, 'drum')) &&
            !(target === null && (mover.type === 'taoist-priest' || mover.type === 'five-li-fog' || mover.type === 'spiritual-monk' || mover.type === 'immaculate-light') && hasAdjacentSameFamily(board, to, mover))) {
          result.push({ to, delta: [direction[0] * distance, direction[1] * distance], target });
        }
        if (target) break;
        distance++;
        to = shift(to, direction[0], direction[1]);
      }
    }
  }
  return result;
}

function hasAdjacentSameFamily(board: Position['board'], square: Square, mover: Piece): boolean {
  const family = mover.type === 'taoist-priest' || mover.type === 'five-li-fog' ? 'taoist-priest' : 'spiritual-monk';
  return ALL.some(([df, dr]) => {
    const target = shift(square, df, dr);
    const piece = target === null ? null : board[target];
    return piece?.color === mover.color && (family === 'taoist-priest'
      ? ['taoist-priest', 'five-li-fog'].includes(piece.type)
      : ['spiritual-monk', 'immaculate-light'].includes(piece.type));
  });
}

function removeAt(position: WorkingPosition, square: Square, removed: Piece[]): Piece | null {
  const victim = position.board[square];
  if (!victim) return null;
  position.board[square] = null;
  removed.push({ ...victim });
  if (victim.type === 'taoist-priest' || victim.type === 'spiritual-monk') {
    position.priestLost[victim.color] = true;
    for (let target = 0; target < BOARD_SIZE; target++) {
      const piece = position.board[target];
      if (!piece || piece.color !== victim.color) continue;
      if (piece.type === 'flag-waver') position.board[target] = { ...piece, type: 'banner', promoted: false };
      if (piece.type === 'thunderclap') position.board[target] = { ...piece, type: 'drum', promoted: false };
    }
  }
  return victim;
}

function promoteAt(position: WorkingPosition, square: Square, removed: Piece[] = []): Piece | null {
  const piece = position.board[square];
  if (!piece || piece.promoted) return null;
  const promotedType = PROMOTION_OF[piece.type];
  if (!promotedType) return null;
  if ((piece.type === 'banner' || piece.type === 'drum') && position.priestLost[piece.color]) return null;
  position.board[square] = { ...piece, type: promotedType, promoted: true };
  if (promotedType === 'master-at-arms') {
    for (let target = 0; target < BOARD_SIZE; target++) {
      const other = position.board[target];
      if (!other) continue;
      if (other.color === piece.color && other.type === 'advance-guard')
        position.board[target] = { ...other, type: 'skyward-net', promoted: true };
      else if (other.color === piece.color && other.type === 'rear-guard')
        position.board[target] = { ...other, type: 'earthward-net', promoted: true };
      else if (other.color !== piece.color && other.type === 'poison-flame') removeAt(position, target, removed);
    }
  }
  return position.board[square] ?? null;
}

const COMMAND_TYPES = new Set<PieceType>(['general', 'governor', 'middle-troop', 'banner', 'banner-and-drum']);
const MERIT_TARGETS = new Set<PieceType>([
  'general', 'governor', 'middle-troop', 'banner', 'drum', 'banner-and-drum',
]);
const ONE_STEP_MOVERS = new Set<PieceType>([
  'aide-de-camp', 'aide', 'staff', 'chief-of-staff', 'engineer', 'banner', 'drum', 'sentry', 'shield', 'middle-troop',
]);
const ONE_STEP_MERIT_TARGETS = new Set<PieceType>(['sumo', 'dragon-ascending', 'flag-waver', 'thunderclap']);

function autoPromoteAfterCapture(position: WorkingPosition, from: Square, capture: Piece, removed: Piece[]): void {
  const mover = position.board[from];
  if (!mover || mover.promoted || !PROMOTION_OF[mover.type]) return;
  const commanderCapture = MERIT_TARGETS.has(capture.type);
  const oneStepCapture = ONE_STEP_MOVERS.has(mover.type) && ONE_STEP_MERIT_TARGETS.has(capture.type);
  const cavalryCannonCapture = mover.type === 'cavalryman' && capture.type === 'frankish-cannon';
  if (!commanderCapture && !oneStepCapture && !cavalryCannonCapture) return;
  promoteAt(position, from, removed);
}

function applyFogReversion(position: WorkingPosition): void {
  const lights = position.board.flatMap((piece, square) => piece?.type === 'immaculate-light' ? [{ piece, square }] : []);
  if (!lights.length) return;
  for (let square = 0; square < BOARD_SIZE; square++) {
    const piece = position.board[square];
    if (piece?.type !== 'five-li-fog') continue;
    if (lights.some(({ square: light }) => withinFive(square, light)))
      position.board[square] = { ...piece, type: 'taoist-priest', promoted: false };
  }
}

function burnAdjacent(position: WorkingPosition, square: Square, removed: Piece[]): void {
  const deltas = ALL.map(([df, dr]) => shift(square, df, dr)).filter((target): target is Square => target !== null);
  for (const target of deltas) if (position.board[target]) removeAt(position, target, removed);
}

function applyLanding(position: WorkingPosition, from: Square, to: Square, _color: Color): Piece[] {
  const moving = position.board[from];
  if (!moving) return [];
  const removed: Piece[] = [];
  const captured = removeAt(position, to, removed);
  position.board[from] = null;
  position.board[to] = moving;
  if (captured) autoPromoteAfterCapture(position, to, captured, removed);
  if (position.board[to]?.type === 'poison-flame') burnAdjacent(position, to, removed);
  applyFogReversion(position);
  return removed;
}

function applyShot(position: WorkingPosition, shooterSquare: Square, targetSquare: Square): Piece[] {
  const removed: Piece[] = [];
  const captured = removeAt(position, targetSquare, removed);
  if (captured) autoPromoteAfterCapture(position, shooterSquare, captured, removed);
  applyFogReversion(position);
  return removed;
}

function shotTargets(board: Position['board'], from: Square, shooter: Piece, profile: ShotProfile): Square[] {
  if (isSuppressed(board, shooter, from)) return [];
  const targets = new Set<Square>();
  if (profile.kind === 'adjacent') {
    for (const [df, dr] of ALL) {
      const to = shift(from, df, dr);
      const target = to === null ? null : board[to];
      if (target && target.color !== shooter.color) targets.add(to!);
    }
  } else {
    for (const [df, dr] of ALL) {
      let to = shift(from, df, dr);
      for (let distance = 1; to !== null && distance <= profile.maxDistance; distance++) {
        const target = board[to];
        if (profile.kind === 'cannon') {
          if (target && ['shield-unit', 'heavenly-fortress'].includes(target.type)) break;
          if (target && target.color !== shooter.color && !isCaptureImmuneByShot(shooter, target, distance)) targets.add(to);
        } else if (target) {
          if (target.color !== shooter.color && !isCaptureImmuneByShot(shooter, target, distance)) targets.add(to);
          break;
        }
        to = shift(to, df, dr);
      }
    }
  }
  return [...targets].sort((a, b) => a - b);
}

function shotVariants(
  position: WorkingPosition, square: Square, capturesBefore: readonly Piece[], profile: ShotProfile,
): Array<{ position: WorkingPosition; captures: Piece[]; shots: Square[] }> {
  const result = [{ position: cloneWorking(position), captures: [...capturesBefore], shots: [] as Square[] }];
  const expand = (current: WorkingPosition, captures: Piece[], shots: Square[], remaining: number): void => {
    if (remaining <= 0 || !current.board[square] || hasWinner(current.board)) return;
    const shooter = current.board[square]!;
    for (const target of shotTargets(current.board, square, shooter, profile)) {
      const next = cloneWorking(current);
      const taken = applyShot(next, square, target);
      if (!taken.length) continue;
      const nextCaptures = [...captures, ...taken];
      const nextShots = [...shots, target];
      result.push({ position: cloneWorking(next), captures: nextCaptures, shots: nextShots });
      expand(next, nextCaptures, nextShots, remaining - 1);
    }
  };
  expand(position, [...capturesBefore], [], profile.maxShots);
  return result;
}

function cloneWorking(position: WorkingPosition): WorkingPosition {
  return { board: cloneBoard(position.board), priestLost: { ...position.priestLost } };
}

function hasObjective(board: Position['board'], color: Color): boolean {
  let general = false;
  let governor = false;
  let middle = false;
  let banner = false;
  for (const piece of board) {
    if (piece?.color !== color) continue;
    if (piece.type === 'general') general = true;
    if (piece.type === 'governor') governor = true;
    if (piece.type === 'middle-troop') middle = true;
    if (piece.type === 'banner' || piece.type === 'banner-and-drum') banner = true;
  }
  return general || governor || (middle && banner);
}

export function commandOutcome(board: Position['board']): Color | 'draw' | null {
  const white = hasObjective(board, 'w');
  const black = hasObjective(board, 'b');
  if (!white && !black) return 'draw';
  if (!white) return 'b';
  if (!black) return 'w';
  return null;
}

export function winnerForCommand(board: Position['board']): Color | null {
  const outcome = commandOutcome(board);
  return outcome === 'draw' ? null : outcome;
}

function hasWinner(board: Position['board']): boolean { return commandOutcome(board) !== null; }

function inEnemyCamp(square: Square, color: Color): boolean {
  const rank = rankOf(square);
  return color === 'w' ? rank >= RANKS - 5 : rank <= 6;
}

function isPromotionAvailable(position: WorkingPosition, square: Square, color: Color, route: readonly Square[], origin: Square): boolean {
  const piece = position.board[square];
  if (!piece || piece.promoted || !PROMOTION_OF[piece.type]) return false;
  if ((piece.type === 'banner' || piece.type === 'drum') && position.priestLost[color]) return false;
  return inEnemyCamp(origin, color) || route.some((target) => inEnemyCamp(target, color));
}

function serializeMove(from: Square, segments: readonly Segment[], promotion?: PieceType): string {
  let text = squareName(from);
  for (const segment of segments) {
    text += `-${squareName(segment.to)}`;
    for (const shot of segment.shots) text += `@${squareName(shot)}`;
  }
  return promotion ? `${text}=${promotion}` : text;
}

function modeDestinations(
  position: WorkingPosition, square: Square, mode: Mode, includeFriendly = false,
): Array<{ to: Square; delta: Direction }> {
  const piece = position.board[square];
  if (!piece) return [];
  const asPosition = position as WorkingPosition;
  return mode.primitives.flatMap((primitive) => primitiveDestinations(position.board, square, piece, primitive, asPosition, includeFriendly)
    .filter(({ target }) => !target || target.color !== piece.color)
    .map(({ to, delta }) => ({ to, delta })));
}

function applyPromotionChoice(position: WorkingPosition, square: Square): { position: WorkingPosition; removed: Piece[] } {
  const next = cloneWorking(position);
  const removed: Piece[] = [];
  promoteAt(next, square, removed);
  applyFogReversion(next);
  return { position: next, removed };
}

function legalCaptureTarget(mover: Piece, target: Piece | null): boolean {
  if (!target || target.color === mover.color) return false;
  return !isCaptureImmuneByMove(mover, target);
}

function modeAllowsLeg(mode: Mode, deltas: readonly Direction[], delta: Direction): boolean {
  if (mode.shape === 'flag-line' && deltas.length && (delta[0] !== deltas[0]![0] || delta[1] !== deltas[0]![1])) return false;
  if (mode.shape === 'cavalry' && deltas.length) {
    const first = deltas[0]!;
    if (!((delta[0] === first[0] && delta[1] === first[1]) || (delta[0] === -first[0] && delta[1] === -first[1]))) return false;
  }
  if (mode.shape === 'thunderclap') {
    const allDeltas = [...deltas, delta];
    let turns = 0;
    for (let index = 1; index < allDeltas.length; index++) {
      if (allDeltas[index]![0] !== allDeltas[index - 1]![0] || allDeltas[index]![1] !== allDeltas[index - 1]![1]) turns++;
    }
    if (turns > 3 || turns + (5 - allDeltas.length) < 3) return false;
    if (allDeltas.length === 5 && turns !== 3) return false;
  }
  return true;
}

function finalizeCandidate(
  candidates: Map<string, Candidate>,
  initial: Position,
  origin: Square,
  route: readonly Square[],
  segments: readonly Segment[],
  captures: readonly Piece[],
  position: WorkingPosition,
  color: Color,
  mover: Piece,
): void {
  const to = route.at(-1)!;
  const terminal = hasWinner(position.board);
  const add = (resulting: WorkingPosition, promotion?: PieceType): void => {
    const uci = serializeMove(origin, segments, promotion);
    const nextPosition: Position = { board: cloneBoard(resulting.board), priestLost: { ...resulting.priestLost }, turn: opposite(color) };
    candidates.set(uci, { uci, color, from: origin, to, piece: { ...mover }, captures: [...captures], resulting: nextPosition, path: [...route] });
  };
  add(position);
  if (!terminal && isPromotionAvailable(position, to, color, route, origin)) {
    const promotedType = PROMOTION_OF[position.board[to]!.type];
    if (promotedType) {
      const promoted = applyPromotionChoice(position, to);
      const uci = serializeMove(origin, segments, promotedType);
      const nextPosition: Position = { board: cloneBoard(promoted.position.board), priestLost: { ...promoted.position.priestLost }, turn: opposite(color) };
      candidates.set(uci, {
        uci, color, from: origin, to, piece: { ...mover }, captures: [...captures, ...promoted.removed],
        resulting: nextPosition, path: [...route],
      });
    }
  }
  void initial;
}

export function generateActions(position: Position): Candidate[] {
  const candidates = new Map<string, Candidate>();
  const color = position.turn;
  for (let origin = 0; origin < BOARD_SIZE; origin++) {
    const originalPiece = position.board[origin];
    if (!originalPiece || originalPiece.color !== color || isEnemyNetRay(position.board, origin, color)) continue;
    const initialWorking: WorkingPosition = { board: cloneBoard(position.board), priestLost: { ...position.priestLost } };
    const initialSpec = pieceSpec(originalPiece, position);

    for (const mode of initialSpec.modes) {
      const visit = (
        current: WorkingPosition,
        square: Square,
        route: Square[],
        segments: Segment[],
        captures: Piece[],
        deltas: Direction[],
      ): void => {
        const mover = current.board[square];
        if (!mover) return;
        const nextLeg = route.length + 1;
        for (const { to, delta } of modeDestinations(current, square, mode)) {
          if (!modeAllowsLeg(mode, deltas, delta)) continue;
          const target = current.board[to];
          if (target && !legalCaptureTarget(mover, target)) continue;
          const moved = cloneWorking(current);
          const legCaptures = applyLanding(moved, square, to, color);
          const updatedRoute = [...route, to];
          const shotSpec = pieceSpec(moved.board[to]!, moved).shot;
          const shotChoices = shotSpec ? shotVariants(moved, to, [...captures, ...legCaptures], shotSpec) : [{ position: moved, captures: [...captures, ...legCaptures], shots: [] as Square[] }];

          for (const choice of shotChoices) {
            const updatedSegments = [...segments, { to, shots: choice.shots }];
            const ended = hasWinner(choice.position.board);
            const canFinish = nextLeg >= (mode.minLegs ?? 1);
            if (canFinish) finalizeCandidate(candidates, position, origin, updatedRoute, updatedSegments, choice.captures, choice.position, color, originalPiece);
            if (!ended && nextLeg < mode.maxLegs && nextLeg < 5) {
              visit(choice.position, to, updatedRoute, updatedSegments, choice.captures, [...deltas, delta]);
            }
          }
        }
      };
      visit(initialWorking, origin, [], [], [], []);
    }
  }
  return [...candidates.values()];
}

export function attackedSquares(board: Position['board'], color: Color): Square[] {
  const attacked = new Set<Square>();
  for (let from = 0; from < BOARD_SIZE; from++) {
    const piece = board[from];
    if (!piece || piece.color !== color) continue;
    const position: Position = { board, turn: color, priestLost: { w: false, b: false } };
    for (const mode of pieceSpec(piece, position).modes) {
      const walk = (current: WorkingPosition, square: Square, routeDeltas: Direction[]): void => {
        const mover = current.board[square];
        if (!mover) return;
        for (const primitive of mode.primitives) {
          for (const { to, delta, target } of primitiveDestinations(current.board, square, mover, primitive, current, true)) {
            if (target && target.color !== color && !legalCaptureTarget(mover, target)) continue;
            if (!modeAllowsLeg(mode, routeDeltas, delta)) continue;
            attacked.add(to);
            if (target?.color === color) continue;
            const next = cloneWorking(current);
            applyLanding(next, square, to, color);
            if (routeDeltas.length + 1 < mode.maxLegs && !hasWinner(next.board))
              walk(next, to, [...routeDeltas, delta]);
          }
        }
      };
      walk({ board: cloneBoard(board), priestLost: { w: false, b: false } }, from, []);
    }
  }
  return [...attacked].sort((a, b) => a - b);
}

export function attacksSoleObjective(board: Position['board'], attacker: Color): boolean {
  const defender = opposite(attacker);
  const objectives: Square[] = [];
  for (let square = 0; square < BOARD_SIZE; square++) {
    const target = board[square];
    if (target?.color !== defender || !COMMAND_TYPES.has(target.type)) continue;
    const trial = cloneBoard(board);
    trial[square] = null;
    if (!hasObjective(trial, defender)) objectives.push(square);
  }
  if (!objectives.length) return false;
  const targets = new Set(objectives);
  for (let from = 0; from < BOARD_SIZE; from++) {
    const piece = board[from];
    if (!piece || piece.color !== attacker) continue;
    const position: Position = { board, turn: attacker, priestLost: { w: false, b: false } };
    for (const mode of pieceSpec(piece, position).modes) {
      for (const primitive of mode.primitives) {
        for (const { to, target } of primitiveDestinations(board, from, piece, primitive, position)) {
          if (targets.has(to) && legalCaptureTarget(piece, target)) return true;
        }
      }
    }
  }
  return false;
}

export function routeSan(candidate: Candidate): string {
  const route = candidate.path.map(squareName).join('–');
  const captures = candidate.captures.length ? `×${candidate.captures.length}` : '';
  const promotion = candidate.uci.includes('=') ? '+' : '';
  return `${squareName(candidate.from)}–${route}${captures}${promotion}`;
}

export function destinationOfMove(uci: string): Square {
  const route = uci.split('=')[0]!.split('-');
  const landing = route.at(-1)!.split('@')[0]!;
  const square = squareOf(landing);
  if (square === null) throw new Error(`Invalid Ko Shogi move destination: ${uci}`);
  return square;
}

export function keyOf(position: Position): string { return `${position.turn}:${position.priestLost.w ? 1 : 0}${position.priestLost.b ? 1 : 0}:${position.board.map((piece) => piece ? `${piece.color}${piece.type}${piece.promoted ? '+' : ''}` : '-').join(',')}`; }

export { FILES, RANKS };
