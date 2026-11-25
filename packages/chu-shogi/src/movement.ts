import type { Color, Square } from '@chaturanga/rules-core';
import { BOARD_SIZE, FILES, RANKS } from './layout';
import { isLion, opposite, squareName, type Board, type Piece, type Position } from './position';

type Direction = readonly [df: number, dr: number];

const ORTHOGONAL: readonly Direction[] = [[0, 1], [1, 0], [0, -1], [-1, 0]];
const DIAGONAL: readonly Direction[] = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const ALL_DIRECTIONS: readonly Direction[] = [...ORTHOGONAL, ...DIAGONAL];
const EMPTY: readonly Direction[] = [];

export interface Capture {
  readonly atPathIndex: number;
  readonly square: Square;
  readonly piece: Piece;
}

export interface Move {
  readonly color: Color;
  readonly from: Square;
  readonly to: Square;
  /** Landings after the source, in movement order; an Igui/pass route ends at its source. */
  readonly path: readonly Square[];
  readonly captures: readonly Capture[];
  readonly promote: boolean;
  readonly uci: string;
}

interface Movement {
  readonly steps?: readonly Direction[];
  readonly slides?: readonly Direction[];
  readonly jumps?: readonly Direction[];
  /** A forward-only lion-power ray for the Horned Falcon or Soaring Eagle. */
  readonly lionPower?: readonly Direction[];
}

function forward(color: Color): number { return color === 'w' ? 1 : -1; }
function shift(square: Square, [df, dr]: Direction): Square | null {
  const file = square % FILES + df;
  const rank = Math.floor(square / FILES) + dr;
  return Number.isInteger(file) && Number.isInteger(rank) && file >= 0 && file < FILES && rank >= 0 && rank < RANKS
    ? rank * FILES + file
    : null;
}
function directionSet(predicate: (df: number, dr: number) => boolean): Direction[] {
  return ALL_DIRECTIONS.filter(([df, dr]) => predicate(df, dr));
}
function uniqueDirections(directions: readonly Direction[]): Direction[] {
  return [...new Map(directions.map((direction) => [`${direction[0]},${direction[1]}`, direction])).values()];
}

function effectiveType(piece: Piece): string {
  if (!piece.promoted) return piece.type;
  switch (piece.type) {
    case 'drunk-elephant': return 'prince';
    case 'kirin': return 'lion';
    case 'phoenix': return 'free-king';
    case 'rook': return 'dragon-king';
    case 'bishop': return 'dragon-horse';
    case 'dragon-king': return 'soaring-eagle';
    case 'dragon-horse': return 'horned-falcon';
    case 'vertical-mover': return 'flying-ox';
    case 'side-mover': return 'free-boar';
    case 'reverse-chariot': return 'whale';
    case 'lance': return 'white-horse';
    case 'blind-tiger': return 'flying-stag';
    case 'ferocious-leopard': return 'bishop';
    case 'gold-general': return 'rook';
    case 'silver-general': return 'vertical-mover';
    case 'copper-general': return 'side-mover';
    case 'go-between': return 'drunk-elephant';
    case 'pawn': return 'gold-general';
    default: return piece.type;
  }
}

function movementOf(piece: Piece): Movement {
  const f = forward(piece.color);
  const fwd = (df: number, dr: number): boolean => dr === f;
  const back = (df: number, dr: number): boolean => dr === -f;
  const kind = effectiveType(piece);

  switch (kind) {
    case 'king':
    case 'prince': return { steps: ALL_DIRECTIONS };
    case 'lion': return {};
    case 'free-king': return { slides: ALL_DIRECTIONS };
    case 'drunk-elephant': return { steps: directionSet((df, dr) => !(df === 0 && back(df, dr))) };
    case 'kirin': return { steps: DIAGONAL, jumps: ORTHOGONAL.map(([df, dr]) => [df * 2, dr * 2] as const) };
    case 'phoenix': return { steps: ORTHOGONAL, jumps: DIAGONAL.map(([df, dr]) => [df * 2, dr * 2] as const) };
    case 'rook': return { slides: ORTHOGONAL };
    case 'bishop': return { slides: DIAGONAL };
    case 'dragon-king': return { slides: ORTHOGONAL, steps: DIAGONAL };
    case 'dragon-horse': return { slides: DIAGONAL, steps: ORTHOGONAL };
    case 'vertical-mover': return { slides: ORTHOGONAL.filter(([df]) => df === 0), steps: ORTHOGONAL.filter(([df]) => df !== 0) };
    case 'side-mover': return { slides: ORTHOGONAL.filter(([, dr]) => dr === 0), steps: ORTHOGONAL.filter(([, dr]) => dr !== 0) };
    case 'reverse-chariot': return { slides: ORTHOGONAL.filter(([df]) => df === 0) };
    case 'lance': return { slides: [[0, f]] };
    case 'blind-tiger': return { steps: directionSet((df, dr) => !(df === 0 && fwd(df, dr))) };
    case 'ferocious-leopard': return { steps: uniqueDirections([...DIAGONAL, [0, f], [0, -f]]) };
    case 'gold-general': return { steps: uniqueDirections([...ORTHOGONAL, ...DIAGONAL.filter(([, dr]) => fwd(0, dr))]) };
    case 'silver-general': return { steps: uniqueDirections([[0, f], ...DIAGONAL]) };
    case 'copper-general': return { steps: uniqueDirections([...DIAGONAL.filter(([, dr]) => fwd(0, dr)), [0, -f]]) };
    case 'go-between': return { steps: [[0, f], [0, -f]] };
    case 'pawn': return { steps: [[0, f]] };
    case 'flying-ox': return { slides: uniqueDirections([...ORTHOGONAL.filter(([df]) => df === 0), ...DIAGONAL]) };
    case 'free-boar': return { slides: uniqueDirections([...ORTHOGONAL.filter(([, dr]) => dr === 0), ...DIAGONAL]) };
    case 'whale': return { slides: [[0, f], [0, -f], ...DIAGONAL.filter(([, dr]) => back(0, dr))] };
    case 'white-horse': return { slides: [[0, f], [0, -f], ...DIAGONAL.filter(([, dr]) => fwd(0, dr))] };
    case 'flying-stag': return { slides: [[0, f], [0, -f]], steps: ALL_DIRECTIONS };
    case 'soaring-eagle': return {
      slides: uniqueDirections([...ORTHOGONAL, ...DIAGONAL.filter(([, dr]) => back(0, dr))]),
      lionPower: DIAGONAL.filter(([, dr]) => fwd(0, dr)),
    };
    case 'horned-falcon': return {
      slides: uniqueDirections([...DIAGONAL, ...ORTHOGONAL.filter(([, dr]) => dr !== f)]),
      lionPower: [[0, f]],
    };
    default: return { steps: EMPTY };
  }
}

function isPromotionZone(square: Square, color: Color): boolean {
  const rank = Math.floor(square / FILES) + 1;
  return color === 'w' ? rank >= RANKS - 3 : rank <= 4;
}
function isLastRank(square: Square, color: Color): boolean {
  const rank = Math.floor(square / FILES) + 1;
  return color === 'w' ? rank === RANKS : rank === 1;
}
const promotable = (piece: Piece): boolean => !piece.promoted && !['king', 'lion', 'free-king'].includes(piece.type);

function promotionAvailable(piece: Piece, from: Square, to: Square, captures: readonly Capture[]): boolean {
  if (!promotable(piece)) return false;
  const fromZone = isPromotionZone(from, piece.color);
  const toZone = isPromotionZone(to, piece.color);
  const entered = piece.promotionEligible && !fromZone && toZone;
  const capturedInOrFromZone = captures.length > 0 && (fromZone || toZone);
  const rescue = (piece.type === 'pawn' || piece.type === 'lance') && isLastRank(to, piece.color);
  return entered || capturedInOrFromZone || rescue;
}

function makeMove(
  position: Position,
  from: Square,
  path: readonly Square[],
  captures: readonly Capture[],
  promote: boolean,
): Move {
  const piece = position.board[from]!;
  const to = path.at(-1)!;
  const uci = squareName(from) + path.map(squareName).join('') + (promote ? '+' : '');
  return { color: piece.color, from, to, path, captures, promote, uci };
}

function appendPromotions(position: Position, from: Square, path: readonly Square[], captures: readonly Capture[], result: Move[]): void {
  const to = path.at(-1)!;
  const piece = position.board[from]!;
  result.push(makeMove(position, from, path, captures, false));
  if (promotionAvailable(piece, from, to, captures)) result.push(makeMove(position, from, path, captures, true));
}

function simpleMoves(position: Position, from: Square, result: Move[], includeFriendly = false): void {
  const board = position.board;
  const piece = board[from]!;
  const movement = movementOf(piece);
  const destinations = new Map<Square, Capture | null>();

  for (const direction of movement.steps ?? EMPTY) {
    const to = shift(from, direction);
    if (to === null) continue;
    const target = board[to];
    if (target?.color === piece.color) {
      if (includeFriendly) destinations.set(to, null);
      continue;
    }
    destinations.set(to, target ? { atPathIndex: 0, square: to, piece: { ...target } } : null);
  }

  for (const [df, dr] of movement.jumps ?? EMPTY) {
    const to = shift(from, [df, dr]);
    if (to === null) continue;
    const target = board[to];
    if (target?.color === piece.color) {
      if (includeFriendly) destinations.set(to, null);
      continue;
    }
    destinations.set(to, target ? { atPathIndex: 0, square: to, piece: { ...target } } : null);
  }

  for (const direction of movement.slides ?? EMPTY) {
    let to = shift(from, direction);
    while (to !== null) {
      const target = board[to];
      if (target?.color === piece.color) {
        if (includeFriendly) destinations.set(to, null);
        break;
      }
      destinations.set(to, target ? { atPathIndex: 0, square: to, piece: { ...target } } : null);
      if (target) break;
      to = shift(to, direction);
    }
  }

  for (const [to, capture] of destinations) appendPromotions(position, from, [to], capture ? [capture] : [], result);
}

function powerMoves(
  position: Position,
  from: Square,
  directions: readonly Direction[],
  canTurn: boolean,
  result: Move[],
  includeFriendly = false,
): void {
  const board = position.board;
  const piece = board[from]!;
  for (const direction of directions) {
    const first = shift(from, direction);
    if (first === null) continue;

    // The jump is independent of whether the intermediate square can be landed on.
    const jump = shift(first, direction);
    if (jump !== null && board[jump]?.color !== piece.color) {
      const target = board[jump];
      appendPromotions(position, from, [jump], target ? [{ atPathIndex: 0, square: jump, piece: { ...target } }] : [], result);
    } else if (jump !== null && includeFriendly) {
      appendPromotions(position, from, [jump], [], result);
    }

    if (board[first]?.color === piece.color) {
      if (includeFriendly) appendPromotions(position, from, [first], [], result);
      continue;
    }
    const firstPiece = board[first];
    const firstCapture: Capture[] = firstPiece ? [{ atPathIndex: 0, square: first, piece: { ...firstPiece } }] : [];
    appendPromotions(position, from, [first], firstCapture, result);

    const secondDirections = canTurn ? ALL_DIRECTIONS : [direction, [-direction[0], -direction[1]] as const];
    for (const secondDirection of secondDirections) {
      const second = shift(first, secondDirection);
      if (second === null) continue;
      if (second === from) {
        // Return-to-source is the legal Igui capture or Jitto pass.
        appendPromotions(position, from, [first, from], firstCapture, result);
        continue;
      }
      if (board[second]?.color === piece.color) {
        if (includeFriendly) appendPromotions(position, from, [first, second], firstCapture, result);
        continue;
      }
      const secondPiece = board[second];
      const captures = secondPiece
        ? [...firstCapture, { atPathIndex: 1, square: second, piece: { ...secondPiece } }]
        : firstCapture;
      appendPromotions(position, from, [first, second], captures, result);
    }

  }
}

function rawMovesFrom(position: Position, from: Square, includeFriendly = false): Move[] {
  const result: Move[] = [];
  const piece = position.board[from];
  if (!piece) return result;
  if (isLion(piece)) powerMoves(position, from, ALL_DIRECTIONS, true, result, includeFriendly);
  else {
    simpleMoves(position, from, result, includeFriendly);
    const lionPower = movementOf(piece).lionPower;
    if (lionPower) powerMoves(position, from, lionPower, false, result, includeFriendly);
  }
  return result;
}

function hasPseudoAttackTo(board: Board, color: Color, target: Square): boolean {
  const openBoard = board.map((piece) => piece ? { ...piece } : null);
  openBoard[target] = null;
  const probe: Position = { board: openBoard, turn: color, counterstrike: null, ply: 0 };
  for (let from = 0; from < BOARD_SIZE; from++) {
    if (openBoard[from]?.color !== color) continue;
    if (rawMovesFrom(probe, from).some((move) => move.to === target)) return true;
  }
  return false;
}

function boardAfterRoute(position: Position, move: Move): Board {
  const board = position.board.map((piece) => piece ? { ...piece } : null);
  const moving = board[move.from]!;
  let current = move.from;
  for (const to of move.path) {
    if (to === current) continue;
    board[to] = null;
    board[current] = null;
    board[to] = moving;
    current = to;
  }
  return board;
}

function isAdjacent(a: Square, b: Square): boolean {
  return a !== b && Math.max(Math.abs((a % FILES) - (b % FILES)), Math.abs(Math.floor(a / FILES) - Math.floor(b / FILES))) === 1;
}

function lionCaptureIsProtected(position: Position, move: Move, capture: Capture): boolean {
  const defender = capture.piece.color;
  const after = boardAfterRoute(position, move);
  if (hasPseudoAttackTo(after, defender, move.to)) return true;

  // The 2004 clarification treats the whole Lion route as one action when its
  // only foot is a Pawn/Go-Between captured earlier on that same route.
  const priorCaptures = move.captures.filter((candidate) => candidate.atPathIndex < capture.atPathIndex);
  if (!priorCaptures.length) return false;
  const initial = position.board.map((piece) => piece ? { ...piece } : null);
  initial[capture.square] = null;
  const feet: number[] = [];
  const probe: Position = { board: initial, turn: defender, counterstrike: null, ply: 0 };
  for (let from = 0; from < BOARD_SIZE; from++) {
    if (initial[from]?.color !== defender) continue;
    if (rawMovesFrom(probe, from).some((candidate) => candidate.to === capture.square)) feet.push(from);
  }
  return feet.length === 1 && priorCaptures.some(({ square, piece }) =>
    square === feet[0] && (piece.type === 'pawn' || piece.type === 'go-between'));
}

function routeIsAllowed(position: Position, move: Move): boolean {
  for (const capture of move.captures) {
    if (position.counterstrike?.forbiddenColor === move.color &&
      position.counterstrike.protectedLion === capture.square && !isLion(position.board[move.from]!)) return false;
    if (!isLion(position.board[move.from]!) || !isLion(capture.piece)) continue;

    const adjacent = isAdjacent(move.from, capture.square);
    const priorEligibleCapture = move.captures.some((prior) => prior.atPathIndex < capture.atPathIndex &&
      prior.piece.type !== 'pawn' && prior.piece.type !== 'go-between');
    if (!adjacent && !priorEligibleCapture && lionCaptureIsProtected(position, move, capture)) return false;
  }
  return true;
}

export function generateMoves(position: Position, color: Color = position.turn): Move[] {
  const state = color === position.turn ? position : { ...position, turn: color };
  const result: Move[] = [];
  for (let from = 0; from < BOARD_SIZE; from++) {
    if (state.board[from]?.color !== color) continue;
    result.push(...rawMovesFrom(state, from).filter((move) => routeIsAllowed(state, move)));
  }
  return result;
}

export function applyMove(position: Position, move: Move): Position {
  const board: Board = position.board.map((piece) => piece ? { ...piece } : null);
  const moving = board[move.from];
  if (!moving) throw new Error(`No piece at ${squareName(move.from)}`);
  let current = move.from;
  const captures: Capture[] = [];

  for (const [atPathIndex, to] of move.path.entries()) {
    if (to === current) continue;
    const target = board[to];
    if (target) {
      if (target.color === moving.color) throw new Error(`Route lands on a friendly piece at ${squareName(to)}`);
      captures.push({ atPathIndex, square: to, piece: { ...target } });
      board[to] = null;
    }
    board[current] = null;
    board[to] = moving;
    current = to;
  }

  const finalSquare = current;
  if (move.promote) moving.promoted = true;
  if (move.promote) moving.promotionEligible = false;
  else if (!isPromotionZone(finalSquare, moving.color)) moving.promotionEligible = true;
  else if (promotionAvailable(position.board[move.from]!, move.from, finalSquare, captures)) moving.promotionEligible = false;

  let counterstrike = null;
  const capturedLion = captures.some((capture) => isLion(capture.piece));
  const isFirstLionCapture = capturedLion && (!isLion(position.board[move.from]!) ||
    (position.board[move.from]!.type === 'kirin' && move.promote));
  if (isFirstLionCapture) {
    const lionSquare = board.findIndex((piece, square) => piece?.color === moving.color && isLion(piece) &&
      hasPseudoAttackTo(board, moving.color, square));
    if (lionSquare >= 0) {
      counterstrike = { forbiddenColor: opposite(moving.color), protectedLion: lionSquare };
    }
  }

  return {
    board,
    turn: opposite(position.turn),
    counterstrike,
    ply: position.ply + 1,
  };
}

export function legalMoves(position: Position): Move[] {
  return generateMoves(position);
}

export function attackedSquares(board: Board, color: Color): Square[] {
  const position: Position = { board, turn: color, counterstrike: null, ply: 0 };
  const attacked = new Set<Square>();
  for (const move of generateMoves(position, color)) {
    if (move.to !== move.from) attacked.add(move.to);
    for (const capture of move.captures) attacked.add(capture.square);
  }
  for (let from = 0; from < BOARD_SIZE; from++) {
    if (board[from]?.color !== color) continue;
    for (const move of rawMovesFrom(position, from, true)) {
      if (move.to !== move.from && board[move.to]?.color === color) attacked.add(move.to);
    }
  }
  return [...attacked].sort((a, b) => a - b);
}

export function isRoyalPiece(piece: Piece): boolean {
  return piece.type === 'king' || (piece.type === 'drunk-elephant' && piece.promoted);
}

export function royalSquares(board: Board, color: Color): Square[] {
  return board.flatMap((piece, square) => piece?.color === color && isRoyalPiece(piece) ? [square] : []);
}

export function squareAttackedBy(board: Board, square: Square, color: Color): boolean {
  const position: Position = { board, turn: color, counterstrike: null, ply: 0 };
  return generateMoves(position).some((move) => move.to === square && move.captures.length > 0);
}

export { movementOf, isPromotionZone, isLastRank, promotionAvailable };
