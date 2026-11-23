/**
 * Janggi game end as Fairy-Stockfish decides it for the `janggi` variant with a draw claimed, i.e. ffish's
 * `Board.isGameOver(true)` / `Board.result(true)`. Ported from src/position.cpp at 705dd366: bikjang and
 * double passing (is_immediate_game_end), the 50-move rule and threefold repetition with perpetual check
 * (is_optional_game_end). Whatever is not decided otherwise is settled by points. See RULES.md.
 */
import { ADVISOR, type Board, CANNON, CHARIOT, type ColorIndex, colorIndexOf, ELEPHANT, HORSE, SIZE, SOLDIER, toColor, typeOf } from './board';
import { generalsFace, inCheck } from './attacks';
import type { Color, GameStatus } from './types';

/** The parts of a Fairy-Stockfish StateInfo the game-end rules read, one per position of a game. */
export interface GameState {
  /** Board plus side to move; equal keys are the same position. */
  key: string;
  sideToMove: ColorIndex;
  /** The side to move is in check. */
  checkers: boolean;
  /** The generals face each other. */
  bikjang: boolean;
  /** The move that led here was a pass. */
  pass: boolean;
  rule50: number;
  /** Plies since the first position. */
  plies: number;
}

function stateOf(board: Board, sideToMove: ColorIndex, pass: boolean, rule50: number, plies: number): GameState {
  return {
    key: String.fromCharCode(...board) + sideToMove,
    sideToMove,
    checkers: inCheck(board, sideToMove),
    bikjang: generalsFace(board),
    pass,
    rule50,
    plies,
  };
}

export function rootState(board: Board, sideToMove: ColorIndex, rule50: number): GameState {
  return stateOf(board, sideToMove, false, rule50, 0);
}

export function nextState(previous: GameState, board: Board, pass: boolean, rule50: number): GameState {
  return stateOf(board, previous.sideToMove === 0 ? 1 : 0, pass, rule50, previous.plies + 1);
}

/** Janggi points per piece type: -, Soldier, Horse, Elephant, Advisor, Cannon, Chariot, General. */
const POINTS: readonly number[] = [0, 2, 5, 3, 3, 7, 13, 0];
/** Han moves second and gets a point and a half (덤), so points never tie. */
const HAN_BONUS = 1.5;

export function points(board: Board): Record<Color, number> {
  const total = { w: 0, b: HAN_BONUS };
  for (const code of board) if (code) total[toColor(colorIndexOf(code))] += POINTS[typeOf(code)]!;
  return total;
}

export function pointsWinner(board: Board): Color {
  const { w, b } = points(board);
  return w > b ? 'w' : 'b';
}

/** Two consecutive positions with facing generals, or two consecutive passes: the points decide. */
export function immediateGameEnd(states: readonly GameState[], board: Board): GameStatus | null {
  const st = states.at(-1)!;
  if (st.plies === 0) return null;
  const previous = states.at(-2)!;
  if (st.bikjang && previous.bikjang) return { kind: 'bikjang', winner: pointsWinner(board) };
  if (st.pass && previous.pass) return { kind: 'double-pass', winner: pointsWinner(board) };
  return null;
}

/** Only generals and advisors are left: nothing can ever attack either general. */
export function isInsufficientMaterial(board: Board): boolean {
  const attackers = new Set([SOLDIER, HORSE, ELEPHANT, CANNON, CHARIOT]);
  for (let s = 0; s < SIZE; s++) {
    const type = typeOf(board[s]!);
    if (type !== ADVISOR && attackers.has(type)) return false;
  }
  return true;
}

const N_MOVE_RULE = 50;
const N_FOLD_RULE = 3;

/** Position::is_optional_game_end(result, ply = 0) on the last of `states`, or null when none applies. */
export function optionalGameEnd(states: readonly GameState[], board: Board): GameStatus | null {
  const n = states.length - 1;
  const at = (i: number): GameState => states[i]!;
  const st = at(n);
  const us = st.sideToMove;

  if (st.rule50 > 2 * N_MOVE_RULE - 1) return { kind: 'fifty-move', winner: pointsWinner(board) };

  const end = Math.min(st.rule50, st.plies);
  if (end < 4) return null;

  let stp = n - 2;
  let cnt = 0;
  let perpetualThem = st.checkers && at(stp).checkers;
  let perpetualUs = at(n - 1).checkers && at(stp - 1).checkers;

  for (let i = 4; i <= end; i += 2) {
    stp -= 2;
    perpetualThem &&= at(stp).checkers;

    if (at(stp).key === st.key && ++cnt + 1 >= N_FOLD_RULE) {
      // Only one side checked all along: it loses. Otherwise (neither or both) the points decide.
      if (perpetualThem !== perpetualUs) {
        return { kind: 'perpetual-check', winner: toColor(perpetualThem ? us : us === 0 ? 1 : 0) };
      }
      return { kind: 'repetition', winner: pointsWinner(board) };
    }

    if (i + 1 <= end) perpetualUs &&= at(stp - 1).checkers;
  }
  return null;
}
