import {
  type ClockState,
  type Color,
  createClock,
  flaggedSide,
  IllegalMoveError,
  pressClock,
  runFor,
  stopClock,
  usesSetupPhase,
  type Variant,
  type VariantGame,
} from '@chaturanga/rules-core';
import { create, type StateCreator, type StoreApi, type UseBoundStore } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { FINAL_REASONS, type GameResult, resultFromStatus } from './result';
import type { TimeControl } from './timeControls';

type MoveRecordOf<G extends VariantGame> = ReturnType<G['move']>;

export interface GameSessionState<G extends VariantGame = VariantGame> {
  phase: 'setup' | 'playing';
  game: G;
  startFen: string;
  /** Bumped on every change: the game instance is mutable. */
  version: number;
  timeControl: TimeControl | null;
  clock: ClockState | null;
  result: GameResult | null;
  /** Ply being reviewed (0 = start position); null while following the live game. */
  viewPly: number | null;
  flipped: boolean;

  start: (timeControl: TimeControl | null, fen?: string, now?: number) => void;
  /** Plays a move in coordinate notation; null when it is illegal or play is not possible. */
  move: (move: string, now?: number) => MoveRecordOf<G> | null;
  undo: (now?: number) => void;
  resign: (color: Color, now?: number) => void;
  tick: (now?: number) => void;
  setViewPly: (ply: number | null) => void;
  flip: () => void;
  exitToSetup: () => void;
}

export type GameSessionStore<G extends VariantGame = VariantGame> = UseBoundStore<StoreApi<GameSessionState<G>>>;

/** True while pieces are still being placed from hand (Sittuyin setup phase). */
export function inSetupPhase(game: VariantGame): boolean {
  return game.hand('w').length + game.hand('b').length > 0;
}

/**
 * The same question for a variant whose hands fill from captures: Shogi has hands all game long but no
 * setup phase, so its clocks run and its banner names the side to move from the first ply.
 */
export function inSetupPhaseOf(variant: Pick<Variant, 'hasHands' | 'hasSetupPhase'>, game: VariantGame): boolean {
  return usesSetupPhase(variant) && inSetupPhase(game);
}

/** What survives a page reload: the game is rebuilt by replaying the moves. */
interface SavedSession {
  phase: GameSessionState['phase'];
  startFen: string;
  moves: string[];
  timeControl: TimeControl | null;
  clock: ClockState | null;
  result: GameResult | null;
  flipped: boolean;
}

/**
 * Clocks do not run while pieces are being placed: a clock created during setup starts stopped and runs
 * for the side to move once the last piece is placed. Games without a setup phase behave like a normal clock.
 */
function sessionCreator<G extends VariantGame>(variant: Variant<G>): StateCreator<GameSessionState<G>> {
  return (set, get) => ({
    phase: 'setup',
    game: variant.createGame(),
    startFen: variant.startFen,
    version: 0,
    timeControl: null,
    clock: null,
    result: null,
    viewPly: null,
    flipped: false,

    start: (timeControl, fen = variant.startFen, now = Date.now()) => {
      const game = variant.createGame(fen); // throws FenError for invalid positions
      let clock = timeControl ? createClock(timeControl.initialMs, now, game.turn) : null;
      if (clock && inSetupPhaseOf(variant, game)) clock = stopClock(clock, now);
      set((s) => ({
        phase: 'playing',
        game,
        startFen: fen,
        timeControl,
        clock,
        result: resultFromStatus(game.status()),
        viewPly: null,
        version: s.version + 1,
      }));
    },

    move: (move, now = Date.now()) => {
      get().tick(now);
      const { game, result, viewPly, clock, timeControl } = get();
      if (result || viewPly !== null) return null;
      const mover = game.turn;
      const placing = inSetupPhaseOf(variant, game);
      let record: MoveRecordOf<G>;
      try {
        record = game.move(move) as MoveRecordOf<G>;
      } catch (err) {
        if (err instanceof IllegalMoveError) return null;
        throw err;
      }
      const nextResult = resultFromStatus(game.status());
      let nextClock = clock;
      if (clock && timeControl) {
        if (!placing) nextClock = pressClock(clock, mover, now, timeControl.incrementMs);
        else if (!inSetupPhaseOf(variant, game)) nextClock = runFor(clock, game.turn, now);
      }
      if (nextClock && nextResult) nextClock = stopClock(nextClock, now);
      set((s) => ({ result: nextResult, clock: nextClock, version: s.version + 1 }));
      return record;
    },

    undo: (now = Date.now()) => {
      const { game, result, clock } = get();
      if (game.moves().length === 0 || (result && FINAL_REASONS.includes(result.reason))) return;
      game.undo();
      set((s) => ({
        result: resultFromStatus(game.status()),
        clock: clock ? (inSetupPhaseOf(variant, game) ? stopClock(clock, now) : runFor(clock, game.turn, now)) : null,
        viewPly: null,
        version: s.version + 1,
      }));
    },

    resign: (color, now = Date.now()) => {
      const { result, clock } = get();
      if (result) return;
      set((s) => ({
        result: { winner: color === 'w' ? 'b' : 'w', reason: 'resign' },
        clock: clock ? stopClock(clock, now) : null,
        version: s.version + 1,
      }));
    },

    tick: (now = Date.now()) => {
      const { clock, result } = get();
      if (!clock || result) return;
      const flagged = flaggedSide(clock, now);
      if (!flagged) return;
      set((s) => ({
        result: { winner: flagged === 'w' ? 'b' : 'w', reason: 'timeout' },
        clock: stopClock(clock, now),
        version: s.version + 1,
      }));
    },

    setViewPly: (ply) => {
      const total = get().game.moves().length;
      set({ viewPly: ply === null || ply >= total ? null : Math.max(0, ply) });
    },

    flip: () => set((s) => ({ flipped: !s.flipped })),

    exitToSetup: () => set((s) => ({ phase: 'setup', result: null, clock: null, viewPly: null, version: s.version + 1 })),
  });
}

/** Rebuilds a saved game; anything unreadable (old format, bad FEN, illegal move) starts fresh. */
function restore<G extends VariantGame>(
  variant: Variant<G>,
  saved: Partial<SavedSession> | undefined,
  current: GameSessionState<G>,
): GameSessionState<G> {
  if (!saved || saved.phase !== 'playing' || typeof saved.startFen !== 'string' || !Array.isArray(saved.moves)) return current;
  try {
    const game = variant.createGame(saved.startFen);
    for (const uci of saved.moves) game.move(uci);
    return {
      ...current,
      phase: 'playing',
      game,
      startFen: saved.startFen,
      timeControl: saved.timeControl ?? null,
      // Clocks keep running on wall time across a reload, like a real clock.
      clock: saved.clock ?? null,
      result: saved.result ?? null,
      flipped: saved.flipped ?? false,
      viewPly: null,
    };
  } catch {
    return current;
  }
}

/**
 * A local game session for a rules Variant. With `storageKey` the game is saved in localStorage on every
 * change and restored when the page loads, so an accidental refresh does not lose the game.
 */
export function createGameSession<G extends VariantGame>(variant: Variant<G>, storageKey?: string): GameSessionStore<G> {
  if (!storageKey) return create<GameSessionState<G>>()(sessionCreator(variant));
  return create<GameSessionState<G>>()(
    persist(sessionCreator(variant), {
      name: storageKey,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s): SavedSession => ({
        phase: s.phase,
        startFen: s.startFen,
        moves: s.game.moves().map((r) => r.uci),
        timeControl: s.timeControl,
        clock: s.clock,
        result: s.result,
        flipped: s.flipped,
      }),
      merge: (saved, current) => restore(variant, saved as Partial<SavedSession> | undefined, current),
    }),
  ) as GameSessionStore<G>;
}
