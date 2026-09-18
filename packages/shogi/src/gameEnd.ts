/**
 * Shogi game end as Fairy-Stockfish decides it for the `shogi` variant with a draw claimed, i.e. ffish's
 * `Board.isGameOver(true)` / `Board.result(true)`:
 *
 * - no legal moves: checkmate, or stalemate, which loses for the side to move;
 * - sennichite (千日手): the fourth occurrence of the same position — same board, same hands, same side to
 *   move — is a draw, unless one side gave check throughout, in which case that side loses (perpetual check).
 *
 * Fairy-Stockfish applies no n-move rule to Shogi, and does not adjudicate impasse (jishogi); see RULES.md.
 */
import { type ColorIndex, opposite, toColor } from './board';
import type { GameStatus } from './types';

/** One position of a game: what the repetition rules read. */
export interface GameState {
  /** Placement, hands and side to move; equal keys are the same position. */
  key: string;
  sideToMove: ColorIndex;
  /** True when the side to move is in check, i.e. the previous move gave check. */
  checkers: boolean;
  /** Plies since the first position of this game. */
  ply: number;
}

export const N_FOLD_RULE = 4;

export function rootState(key: string, sideToMove: ColorIndex, checkers: boolean): GameState {
  return { key, sideToMove, checkers, ply: 0 };
}

export function nextState(previous: GameState, key: string, checkers: boolean): GameState {
  return { key, sideToMove: opposite(previous.sideToMove), checkers, ply: previous.ply + 1 };
}

/**
 * The repetition ruling on the last of `states`, or null when the position has not repeated often enough.
 * "Them" is the side that just moved, "us" the side to move.
 */
export function repetitionEnd(states: readonly GameState[]): GameStatus | null {
  const n = states.length - 1;
  const at = (i: number): GameState => states[i]!;
  const st = at(n);
  if (st.ply < 4) return null;

  let perpetualThem = at(n).checkers;
  let perpetualUs = at(n - 1).checkers;
  let count = 0;

  for (let i = 4; i <= st.ply; i += 2) {
    const stp = n - i;
    perpetualThem &&= at(stp + 2).checkers;
    perpetualUs &&= at(stp + 1).checkers;
    if (at(stp).key !== st.key) continue;
    if (++count + 1 < N_FOLD_RULE) continue;
    // +1: the side to move wins, -1: it loses, 0: draw.
    const value = perpetualThem === perpetualUs ? 0 : perpetualThem ? 1 : -1;
    if (value === 0) return { kind: 'repetition' };
    const winner = toColor(value > 0 ? st.sideToMove : opposite(st.sideToMove));
    return { kind: 'perpetual-check', winner };
  }
  return null;
}
