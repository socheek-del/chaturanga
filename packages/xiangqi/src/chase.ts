/**
 * Chase detection: the victim pieces a move newly "chases", ported line by line from Fairy-Stockfish's
 * `Position::chased()` (src/position.cpp at 705dd366, the source ffish 0.7.10 is built from; the
 * `xiangqi` variant sets `chasingRule = AXF_CHASING`). `gameEnd.ts` intersects these sets across a
 * repetition to decide a perpetual chase. Every branch below is a branch of the C++; see RULES.md.
 */
import { ADVISOR, CANNON, CHARIOT, colorIndexOf, type ColorIndex, ELEPHANT, fileOf, GENERAL, HORSE, SOLDIER, typeOf } from './board';
import {
  attackersTo,
  attacksBb,
  attacksFrom,
  bb,
  type Bitboard,
  FERS_BB,
  FILE_BB,
  LINES_BB,
  lineBb,
  moreThanOne,
  other,
  type Pieces,
  promotedSoldiers,
  squaresOf,
  WAZIR_BB,
} from './bitboard';
import type { Square } from './types';

/** The parts of a Fairy-Stockfish StateInfo that chased() reads. */
export interface ChaseState {
  pieces: Pieces;
  /** blockersForKing[colour] */
  blockers: readonly [Bitboard, Bitboard];
}

/**
 * Pieces of `victim` (the side to move in `after`) chased by the move `from`-`to` that led from
 * `before` to `after`. `captured` is whether that move captured.
 */
export function chased(before: ChaseState, after: ChaseState, from: Square, to: Square, captured: boolean): Bitboard {
  const p = after.pieces;
  const mover = colorIndexOf(p.board[to]!);
  const stm: ColorIndex = other(mover);
  let b = 0n;

  let pins = after.blockers[stm];
  // Flying general: the victim's lone piece on the mover's general's file (with its own general there).
  const kingFilePieces = FILE_BB[fileOf(p.general[mover])]! & p.color[stm];
  if (kingFilePieces & p.byColor[stm][GENERAL]! && !moreThanOne(kingFilePieces & ~p.byType[GENERAL]!)) {
    pins |= kingFilePieces & ~p.byType[GENERAL]!;
  }
  const unchaseable = (p.byColor[stm][GENERAL]! | p.byColor[stm][SOLDIER]!) ^ promotedSoldiers(p, stm);

  const addChased = (attackerSq: Square, attackerType: number, attacks: Bitboard): void => {
    if (!(attacks & ~b)) return;
    // Exclude attacks on unpromoted soldiers and checks.
    attacks &= ~unchaseable;
    // Attacks against stronger pieces.
    if (attackerType === HORSE || attackerType === CANNON) b |= attacks & p.byColor[stm][CHARIOT]!;
    if (attackerType === ELEPHANT || attackerType === ADVISOR) {
      b |= attacks & (p.byColor[stm][CHARIOT]! | p.byColor[stm][CANNON]! | p.byColor[stm][HORSE]!);
    }
    // Exclude mutual/symmetric attacks, except an impaired horse and pinned victims.
    if (attackerType === HORSE && FERS_BB[attackerSq]! & p.all) {
      for (const s of squaresOf(attacks & p.byColor[stm][HORSE]!)) {
        if (attacksBb(stm, HORSE, s, p.all) & bb(attackerSq)) attacks ^= bb(s);
      }
    } else {
      attacks &= ~p.byColor[stm][attackerType]! | pins;
    }
    // Attacks against potentially unprotected pieces.
    for (const s of squaresOf(attacks)) {
      const occupied = p.all ^ bb(attackerSq);
      const roots = attackersTo(p, s, occupied, stm) & ~pins;
      if (
        !roots ||
        (roots === p.byColor[stm][GENERAL] && attacksBb(stm, CHARIOT, p.general[mover], occupied) & bb(s))
      ) {
        b |= bb(s);
      }
    }
  };

  // Direct attacks.
  const movedPiece = typeOf(p.board[to]!);
  if (movedPiece !== GENERAL && movedPiece !== SOLDIER) {
    let directAttacks = attacksFrom(p, mover, movedPiece, to) & p.color[stm];
    // Only new attacks count.
    if (movedPiece === CHARIOT || movedPiece === CANNON) directAttacks &= ~lineBb(from, to);
    addChased(to, movedPiece, directAttacks);
  }

  // Discovered attacks.
  const discoveryCandidates =
    (WAZIR_BB[from]! & p.byColor[mover][HORSE]!) |
    (FERS_BB[from]! & p.byColor[mover][ELEPHANT]!) |
    (LINES_BB[from]! & (p.byColor[mover][CANNON]! | p.byColor[mover][CHARIOT]!)) |
    (LINES_BB[to]! & p.byColor[mover][CANNON]!);
  const occupiedBefore = (captured ? p.all : p.all ^ bb(to)) ^ bb(from);
  for (const s of squaresOf(discoveryCandidates)) {
    const discoveryPiece = typeOf(p.board[s]!);
    const discoveries =
      p.color[stm] & attacksBb(mover, discoveryPiece, s, p.all) & ~attacksBb(mover, discoveryPiece, s, occupiedBefore);
    addChased(s, discoveryPiece, discoveries);
  }

  // Changes in real roots and discovered checks (pliesFromNull > 0 always holds after a move).
  const newBlockers = after.blockers[stm] & ~before.blockers[stm];

  // Fake roots: a newly pinned victim piece no longer really defends what it attacks.
  for (const s of squaresOf(newBlockers & p.color[stm])) {
    const pinnedPiece = typeOf(p.board[s]!);
    const fakeRooted = p.color[stm] & ~unchaseable & attacksBb(stm, pinnedPiece, s, p.all);
    for (const s2 of squaresOf(fakeRooted)) {
      if (attackersTo(p, s2, p.all, mover) & ~after.blockers[mover]) b |= bb(s2);
    }
  }

  // Discovered checks: a mover piece that newly screens a mover attack on the victim general.
  const victimKing = p.general[stm];
  const kingReach = attacksFrom(p, stm, GENERAL, victimKing);
  for (const s of squaresOf(newBlockers & p.color[mover])) {
    const discoveryPiece = typeOf(p.board[s]!);
    let discoveryAttacks = attacksFrom(p, mover, discoveryPiece, s) & p.color[stm];
    // Include all captures except where the king can pseudo-legally recapture.
    b |= discoveryAttacks & ~kingReach;
    // Include captures where the king can not legally recapture.
    discoveryAttacks &= kingReach;
    for (const s2 of squaresOf(discoveryAttacks)) {
      if (attackersTo(p, s2, p.all ^ bb(s) ^ bb(victimKing), mover) & ~bb(s)) b |= bb(s2);
    }
  }

  return b;
}

/** undo_move_board(b, move): move the bit on `to` back to `from`. */
export function undoMoveBoard(b: Bitboard, move: { from: Square; to: Square } | null): Bitboard {
  return move && b & bb(move.to) ? (b ^ bb(move.to)) | bb(move.from) : b;
}
