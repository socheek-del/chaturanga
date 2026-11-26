import type { Color } from '@chaturanga/rules-core';
import {
  BLACK,
  FILES,
  RANKS,
  SIZE,
  STRENGTH,
  TRAPS,
  codeToPiece,
  opposite,
  pieceType,
  squareName,
  type Board,
} from './board';
import { positionKey, type PositionData } from './fen';

interface Step {
  from: number;
  to: number;
}

interface Action {
  steps: readonly Step[];
  board: Board;
}

export interface TurnMoves {
  /** Complete turns before the third-repetition prohibition is applied. */
  all: string[];
  /** Turns that do not create a prohibited third occurrence. */
  legal: string[];
}

export interface TurnEffects {
  captures: ReturnType<typeof codeToPiece>[];
  finalMovedPieceRemoved: boolean;
  firstOwnPiece: number;
}

export interface TurnAvailability {
  hasAny: boolean;
  hasLegal: boolean;
}

export interface TurnDraft {
  board: Board;
  stepsUsed: number;
  canEnd: boolean;
  nextActions: string[];
}

const colorOf = (piece: number): Color => (piece & BLACK ? 'b' : 'w');
const typeStrength = (piece: number): number => STRENGTH[pieceType(piece)];

export function neighbors(square: number): number[] {
  const file = square % FILES;
  const rank = Math.floor(square / FILES);
  const adjacent: number[] = [];
  if (rank + 1 < RANKS) adjacent.push(square + FILES);
  if (file + 1 < FILES) adjacent.push(square + 1);
  if (rank > 0) adjacent.push(square - FILES);
  if (file > 0) adjacent.push(square - 1);
  return adjacent;
}

export function isFrozen(board: Board, square: number): boolean {
  const piece = board[square]!;
  if (!piece) return false;
  const own = colorOf(piece);
  let strongerEnemy = false;
  let friendly = false;
  for (const target of neighbors(square)) {
    const adjacent = board[target]!;
    if (!adjacent) continue;
    if (colorOf(adjacent) === own) friendly = true;
    else if (typeStrength(adjacent) > typeStrength(piece)) strongerEnemy = true;
  }
  return strongerEnemy && !friendly;
}

function isRabbitBackward(piece: number, from: number, to: number): boolean {
  if (pieceType(piece) !== 'r') return false;
  const rankChange = Math.floor(to / FILES) - Math.floor(from / FILES);
  return colorOf(piece) === 'w' ? rankChange < 0 : rankChange > 0;
}

function applyStep(board: Board, from: number, to: number): { moved: number; captures: number[]; movedRemoved: boolean } {
  const moved = board[from]!;
  if (!moved || board[to]) throw new Error('Arimaa internal step must move a piece to an empty square');
  board[from] = 0;
  board[to] = moved;

  const captures: number[] = [];
  for (const trap of TRAPS) {
    const trapped = board[trap]!;
    if (!trapped) continue;
    const supported = neighbors(trap).some((neighbor) => {
      const piece = board[neighbor]!;
      return piece !== 0 && colorOf(piece) === colorOf(trapped);
    });
    if (!supported) {
      captures.push(trapped);
      board[trap] = 0;
    }
  }
  return { moved, captures, movedRemoved: board[to] === 0 };
}

function addIfLegal(board: Board, side: Color, from: number, to: number, actions: Action[]): void {
  const piece = board[from]!;
  if (!piece || colorOf(piece) !== side || board[to] || !neighbors(from).includes(to) || isFrozen(board, from)) return;
  if (isRabbitBackward(piece, from, to)) return;
  const next = board.slice();
  applyStep(next, from, to);
  actions.push({ steps: [{ from, to }], board: next });
}

function generateActions(board: Board, side: Color): Action[] {
  const actions: Action[] = [];
  const enemy = opposite(side);
  for (let actorFrom = 0; actorFrom < SIZE; actorFrom++) {
    const actor = board[actorFrom]!;
    if (!actor || colorOf(actor) !== side || isFrozen(board, actorFrom)) continue;

    for (const actorTo of neighbors(actorFrom)) addIfLegal(board, side, actorFrom, actorTo, actions);

    for (const targetFrom of neighbors(actorFrom)) {
      const target = board[targetFrom]!;
      if (!target || colorOf(target) !== enemy || typeStrength(actor) <= typeStrength(target)) continue;

      // Push: move the weaker enemy first, then occupy its vacated square. Each step resolves traps.
      for (const targetTo of neighbors(targetFrom)) {
        if (board[targetTo]) continue;
        const next = board.slice();
        applyStep(next, targetFrom, targetTo);
        applyStep(next, actorFrom, targetFrom);
        actions.push({ steps: [{ from: targetFrom, to: targetTo }, { from: actorFrom, to: targetFrom }], board: next });
      }

      // Pull: move the stronger piece first, then move the enemy into the vacated square.
      for (const actorTo of neighbors(actorFrom)) {
        if (board[actorTo]) continue;
        const next = board.slice();
        applyStep(next, actorFrom, actorTo);
        applyStep(next, targetFrom, actorFrom);
        actions.push({ steps: [{ from: actorFrom, to: actorTo }, { from: targetFrom, to: actorFrom }], board: next });
      }
    }
  }
  return actions;
}

function unchanged(left: Board, right: Board): boolean {
  for (let square = 0; square < SIZE; square++) if (left[square] !== right[square]) return false;
  return true;
}

const stepUci = ({ from, to }: Step): string => `${squareName(from)}${squareName(to)}`;

/** Builds a bounded UI draft from atomic single-step or push/pull actions without enumerating full turns. */
export function buildTurnDraft(
  position: PositionData,
  selectedActions: readonly string[],
  repetitions: ReadonlyMap<string, number>,
): TurnDraft | null {
  const mover = position.turn;
  const start = position.board;
  let board: Board = start.slice();
  let stepsUsed = 0;

  for (const selected of selectedActions) {
    const match = generateActions(board, mover).find((action) => action.steps.map(stepUci).join('') === selected);
    if (!match || stepsUsed + match.steps.length > 4) return null;
    board = match.board;
    stepsUsed += match.steps.length;
  }

  const moved = stepsUsed > 0 && !unchanged(board, start);
  const repetitionKey = positionKey({ board, turn: opposite(mover) });
  const canEnd = moved && (repetitions.get(repetitionKey) ?? 0) < 2;
  const nextActions =
    stepsUsed < 4
      ? [...new Set(
          generateActions(board, mover)
            .filter((action) => stepsUsed + action.steps.length <= 4)
            .map((action) => action.steps.map(stepUci).join('')),
        )]
      : [];

  return { board, stepsUsed, canEnd, nextActions };
}

export function generateTurnMoves(
  position: PositionData,
  repetitions: ReadonlyMap<string, number>,
): TurnMoves {
  const mover = position.turn;
  const start = position.board;
  const all: string[] = [];
  const legal: string[] = [];
  const seen = new Set<string>();

  const visit = (board: Board, path: string, stepsUsed: number): void => {
    if (stepsUsed > 0 && !unchanged(board, start)) {
      const key = positionKey({ board, turn: opposite(mover) });
      if (!seen.has(path)) {
        seen.add(path);
        all.push(path);
        if ((repetitions.get(key) ?? 0) < 2) legal.push(path);
      }
    }
    if (stepsUsed >= 4) return;
    for (const action of generateActions(board, mover)) {
      if (stepsUsed + action.steps.length > 4) continue;
      visit(action.board, path + action.steps.map(stepUci).join(''), stepsUsed + action.steps.length);
    }
  };

  visit(start.slice(), '', 0);
  return { all, legal };
}

/** Stops at the first non-repeating complete turn; terminal checks do not need to materialize every turn. */
export function probeTurnAvailability(
  position: PositionData,
  repetitions: ReadonlyMap<string, number>,
): TurnAvailability {
  const start = position.board;
  const mover = position.turn;
  let hasAny = false;
  const visit = (board: Board, stepsUsed: number): boolean => {
    if (stepsUsed > 0 && !unchanged(board, start)) {
      hasAny = true;
      if ((repetitions.get(positionKey({ board, turn: opposite(mover) })) ?? 0) < 2) return true;
    }
    if (stepsUsed >= 4) return false;
    for (const action of generateActions(board, mover)) {
      if (stepsUsed + action.steps.length <= 4 && visit(action.board, stepsUsed + action.steps.length)) return true;
    }
    return false;
  };
  const hasLegal = visit(start.slice(), 0);
  return { hasAny, hasLegal };
}

/** Picks a complete turn without first constructing the potentially large list of all four-step turns. */
export function sampleLegalTurn(
  position: PositionData,
  repetitions: ReadonlyMap<string, number>,
  rng: () => number,
): string | null {
  const mover = position.turn;
  for (let attempt = 0; attempt < 48; attempt++) {
    let board: Board = position.board.slice();
    let stepsUsed = 0;
    let path = '';
    while (stepsUsed < 4) {
      if (stepsUsed > 0 && !unchanged(board, position.board) && rng() < 0.3) break;
      const actions = generateActions(board, mover).filter((action) => stepsUsed + action.steps.length <= 4);
      if (!actions.length) break;
      const index = Math.min(actions.length - 1, Math.floor(Math.max(0, rng()) * actions.length));
      const action = actions[index]!;
      board = action.board;
      stepsUsed += action.steps.length;
      path += action.steps.map(stepUci).join('');
    }
    if (!path || unchanged(board, position.board)) continue;
    if ((repetitions.get(positionKey({ board, turn: opposite(mover) })) ?? 0) < 2) return path;
  }
  return null;
}

/** Validates a supplied complete turn directly, without enumerating every alternative turn. */
export function validateTurn(
  position: PositionData,
  uci: string,
  repetitions: ReadonlyMap<string, number>,
): boolean {
  const names = uci.match(/[a-h][1-8]/g);
  if (!names || names.join('') !== uci || names.length < 2 || names.length > 8 || names.length % 2) return false;
  const squares = names.map((name) => (Number(name[1]) - 1) * FILES + name.charCodeAt(0) - 97);
  const board = position.board.slice();
  const mover = position.turn;
  const original = board.slice();
  let index = 0;
  while (index < squares.length) {
    const from = squares[index]!;
    const to = squares[index + 1]!;
    const piece = board[from]!;
    if (!piece) return false;
    if (colorOf(piece) === mover) {
      const secondFrom = squares[index + 2];
      const secondTo = squares[index + 3];
      const possiblePull =
        secondFrom !== undefined &&
        secondTo !== undefined &&
        board[secondFrom] !== 0 &&
        colorOf(board[secondFrom]!) !== mover &&
        secondTo === from;
      if (possiblePull) {
        const target = board[secondFrom]!;
        if (
          isFrozen(board, from) ||
          typeStrength(piece) <= typeStrength(target) ||
          board[to] ||
          !neighbors(from).includes(to) ||
          isRabbitBackward(piece, from, to) ||
          !neighbors(secondFrom).includes(from)
        )
          return false;
        applyStep(board, from, to);
        if (board[secondFrom] !== target || board[from] !== 0) return false;
        applyStep(board, secondFrom, from);
        index += 4;
      } else {
        if (
          board[to] ||
          !neighbors(from).includes(to) ||
          isFrozen(board, from) ||
          isRabbitBackward(piece, from, to)
        )
          return false;
        applyStep(board, from, to);
        index += 2;
      }
    } else {
      const actorFrom = squares[index + 2];
      const actorTo = squares[index + 3];
      if (actorFrom === undefined || actorTo !== from) return false;
      const actor = board[actorFrom]!;
      if (
        !actor ||
        colorOf(actor) !== mover ||
        typeStrength(actor) <= typeStrength(piece) ||
        isFrozen(board, actorFrom) ||
        board[to] ||
        !neighbors(from).includes(to) ||
        !neighbors(actorFrom).includes(from)
      )
        return false;
      applyStep(board, from, to);
      if (board[actorFrom] !== actor || board[from] !== 0) return false;
      applyStep(board, actorFrom, from);
      index += 4;
    }
  }
  if (unchanged(board, original)) return false;
  return (repetitions.get(positionKey({ board, turn: opposite(mover) })) ?? 0) < 2;
}

/** Applies a validated complete turn to a private board copy and reports every trap capture. */
export function applyTurn(board: Board, uci: string, mover: Color): { board: Board; effects: TurnEffects } {
  const squareNames = uci.match(/[a-h][1-8]/g);
  if (!squareNames || squareNames.join('') !== uci || squareNames.length < 2 || squareNames.length > 8 || squareNames.length % 2)
    throw new Error('Invalid Arimaa complete-turn notation');
  const squares = squareNames.map((name) => (Number(name[1]) - 1) * FILES + name.charCodeAt(0) - 97);
  const next = board.slice();
  const captures: ReturnType<typeof codeToPiece>[] = [];
  let firstOwnPiece = -1;
  let finalMovedPieceRemoved = false;
  for (let i = 0; i < squares.length; i += 2) {
    const from = squares[i]!;
    const to = squares[i + 1]!;
    const moving = next[from]!;
    if (firstOwnPiece < 0 && moving && colorOf(moving) === mover) firstOwnPiece = from;
    const effect = applyStep(next, from, to);
    captures.push(...effect.captures.map(codeToPiece));
    finalMovedPieceRemoved = i + 2 === squares.length && effect.movedRemoved;
  }
  if (firstOwnPiece < 0) firstOwnPiece = squares[0]!;
  return { board: next, effects: { captures, finalMovedPieceRemoved, firstOwnPiece } };
}
