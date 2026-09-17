/**
 * Xiangqi game end as Fairy-Stockfish decides it for the `xiangqi` variant with a draw claimed, i.e.
 * ffish's `Board.isGameOver(true)` / `Board.result(true)`: insufficient material, then no legal moves
 * (checkmate, or stalemate, which loses), then `Position::is_optional_game_end()` (the 50-move rule with
 * its AXF check offset, then threefold repetition judged by perpetual check and perpetual chase).
 * Ported from src/position.cpp and src/apiutil.h at 705dd366; see RULES.md for each ruling.
 */
import { ADVISOR, type Board, type ColorIndex, ELEPHANT, GENERAL, SIZE, toColor, typeOf, colorIndexOf } from './board';
import { attackersTo, type Bitboard, blockersForKing, other, piecesOf } from './bitboard';
import { type ChaseState, chased, undoMoveBoard } from './chase';
import type { GameStatus, Square } from './types';

/** The parts of a Fairy-Stockfish StateInfo the game-end rules read, one per position of a game. */
export interface GameState extends ChaseState {
  /** Board plus side to move; equal keys are the same position. */
  key: string;
  sideToMove: ColorIndex;
  /** checkersBB != 0: the side to move is in check (flying general excluded, as in attackers_to). */
  checkers: boolean;
  /** Pieces of the side to move chased by the move that led here (0 for the first position). */
  chased: Bitboard;
  /** The move that led here; null for the first position. */
  move: { from: Square; to: Square } | null;
  rule50: number;
  /** Plies since the first position (no null moves are ever played). */
  pliesFromNull: number;
}

function stateOf(board: Board, sideToMove: ColorIndex, rule50: number, pliesFromNull: number): Omit<GameState, 'chased' | 'move'> {
  const pieces = piecesOf(board.slice());
  const king = pieces.general[sideToMove];
  return {
    pieces,
    blockers: [blockersForKing(pieces, 0), blockersForKing(pieces, 1)],
    key: String.fromCharCode(...board) + sideToMove,
    sideToMove,
    checkers: king >= 0 && attackersTo(pieces, king, pieces.all, other(sideToMove)) !== 0n,
    rule50,
    pliesFromNull,
  };
}

/** Position::set_state for a position set up from FEN. */
export function rootState(board: Board, sideToMove: ColorIndex, rule50: number): GameState {
  return { ...stateOf(board, sideToMove, rule50, 0), chased: 0n, move: null };
}

/** The StateInfo do_move produces for the position `board` reached by `from`-`to` from `previous`. */
export function nextState(previous: GameState, board: Board, from: Square, to: Square, captured: boolean, rule50: number): GameState {
  const base = stateOf(board, other(previous.sideToMove), rule50, previous.pliesFromNull + 1);
  return { ...base, move: { from, to }, chased: chased(previous, base, from, to, captured) };
}

/**
 * has_insufficient_material(c) for Xiangqi. Advisors and elephants can never reach the enemy palace
 * and a lone general can't either; any chariot, horse, cannon or soldier is mating material, because
 * stalemate is not a draw in this variant.
 */
function hasInsufficientMaterial(board: Board, c: ColorIndex): boolean {
  for (let s = 0; s < SIZE; s++) {
    const code = board[s]!;
    if (!code || colorIndexOf(code) !== c) continue;
    const t = typeOf(code);
    if (t !== GENERAL && t !== ADVISOR && t !== ELEPHANT) return false;
  }
  return true;
}

export function isInsufficientMaterial(board: Board): boolean {
  return hasInsufficientMaterial(board, 0) && hasInsufficientMaterial(board, 1);
}

const N_MOVE_RULE = 50;
const N_FOLD_RULE = 3;

/** Position::is_optional_game_end(result, ply = 0) on the last of `states`, or null when none applies. */
export function optionalGameEnd(states: readonly GameState[], hasLegalMoves: boolean): GameStatus | null {
  const n = states.length - 1;
  const at = (i: number): GameState => states[i]!;
  const st = at(n);
  const us = st.sideToMove;

  // n-move rule, with the AXF offset for long check sequences.
  if (st.rule50 > 2 * N_MOVE_RULE - 1 && (!st.checkers || hasLegalMoves)) {
    let offset = 0;
    if (st.pliesFromNull >= 20) {
      const end = Math.min(st.rule50, st.pliesFromNull);
      let checkThem = +at(n).checkers;
      let checkUs = +at(n - 1).checkers;
      for (let i = 2; i < end; i += 2) {
        checkThem += +at(n - i).checkers;
        checkUs += +at(n - i - 1).checkers;
      }
      offset = 2 * Math.max(Math.max(checkThem, checkUs) - 10, 0);
    }
    if (st.rule50 - offset > 2 * N_MOVE_RULE - 1) return { kind: 'fifty-move' };
  }

  // n-fold repetition.
  const end = Math.min(st.rule50, st.pliesFromNull);
  if (end < 4) return null;

  let stp = n - 2;
  let cnt = 0;
  let perpetualThem = at(n).checkers && at(stp).checkers;
  let perpetualUs = at(n - 1).checkers && at(stp - 1).checkers;
  let chaseThem = undoMoveBoard(at(n).chased, at(n - 1).move) & at(stp).chased;
  let chaseUs = undoMoveBoard(at(n - 1).chased, at(stp).move) & at(stp - 1).chased;

  for (let i = 4; i <= end; i += 2) {
    // Chased pieces are empty when there is no previous move.
    if (i !== st.pliesFromNull) chaseThem = undoMoveBoard(chaseThem, at(stp - 1).move) & at(stp - 2).chased;
    stp -= 2;
    perpetualThem &&= at(stp).checkers;

    if (at(stp).key === st.key && ++cnt + 1 >= N_FOLD_RULE) {
      // +1: the side to move wins, -1: it loses, 0: draw.
      const value =
        perpetualThem || perpetualUs
          ? !perpetualUs ? 1 : !perpetualThem ? -1 : 0
          : chaseThem || chaseUs
            ? !chaseUs ? 1 : !chaseThem ? -1 : 0
            : 0;
      if (value === 0) return { kind: 'repetition' };
      const winner = toColor(value > 0 ? us : other(us));
      return perpetualThem || perpetualUs ? { kind: 'perpetual-check', winner } : { kind: 'perpetual-chase', winner };
    }

    if (i + 1 <= end) {
      perpetualUs &&= at(stp - 1).checkers;
      chaseUs = undoMoveBoard(chaseUs, at(stp).move) & at(stp - 1).chased;
    }
  }
  return null;
}
