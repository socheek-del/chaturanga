import { type GameResult, storageKey, type TimeControl } from '@chaturanga/game-shell';
import type { Color } from '@chaturanga/chess';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { PRODUCT } from '../../product.config';

/** Where a saved game came from (ch-014). */
export type GameMode = 'computer' | 'local' | 'online' | 'imported';

/** Who sat on one side, kept as a role so the name follows the site language. */
export type PlayerTag =
  | { kind: 'you' }
  | { kind: 'opponent' }
  | { kind: 'bot'; level: number }
  /** Pass-and-play: the side is named by its colour. */
  | { kind: 'side' }
  /** An imported game: the name from its PGN. */
  | { kind: 'name'; name: string };

export interface SavedGame {
  id: string;
  mode: GameMode;
  createdAt: number;
  updatedAt: number;
  startFen: string;
  /** Coordinate notation, as played. */
  moves: string[];
  result: GameResult | null;
  players: Record<Color, PlayerTag>;
  /** The side the viewer played; null for pass-and-play and imports. */
  you: Color | null;
  timeControl: TimeControl | null;
  /** Tags of an imported PGN, kept so an export gives them back. */
  tags?: Record<string, string>;
}

/** The newest games are kept; older ones are dropped when a new game is saved. */
export const HISTORY_LIMIT = 100;
/** A game left before both sides moved twice is not worth keeping. */
export const MIN_ABANDONED_PLIES = 4;

export interface HistoryState {
  /** Newest first. */
  games: SavedGame[];
  /** The record each live session writes to, so a reload keeps adding to the same game. */
  current: Partial<Record<GameMode, string>>;
  upsert: (game: SavedGame) => void;
  remove: (id: string) => void;
  setCurrent: (mode: GameMode, id: string | null) => void;
}

/** Called with the id of every game that leaves the list, so data kept beside it (analysis) goes too. */
const removalListeners = new Set<(id: string) => void>();
export function onGameRemoved(listener: (id: string) => void): () => void {
  removalListeners.add(listener);
  return () => removalListeners.delete(listener);
}

export const HISTORY_STORAGE_KEY = storageKey(PRODUCT, 'games');

export function createHistoryStore(storage: () => StateStorage = () => localStorage) {
  return create<HistoryState>()(
    persist(
      (set, get) => ({
        games: [],
        current: {},
        upsert: (game) => {
          const rest = get().games.filter((g) => g.id !== game.id);
          const games = [game, ...rest].sort((a, b) => b.createdAt - a.createdAt);
          const dropped = games.slice(HISTORY_LIMIT);
          set({ games: games.slice(0, HISTORY_LIMIT) });
          for (const g of dropped) removalListeners.forEach((fn) => fn(g.id));
        },
        remove: (id) => {
          if (!get().games.some((g) => g.id === id)) return;
          set((s) => ({ games: s.games.filter((g) => g.id !== id) }));
          removalListeners.forEach((fn) => fn(id));
        },
        setCurrent: (mode, id) =>
          set((s) => {
            const current = { ...s.current };
            if (id) current[mode] = id;
            else delete current[mode];
            return { current };
          }),
      }),
      {
        name: HISTORY_STORAGE_KEY,
        version: 1,
        storage: createJSONStorage(storage),
        partialize: (s) => ({ games: s.games, current: s.current }),
        merge: (saved, current) => {
          const s = saved as Partial<HistoryState> | undefined;
          return {
            ...current,
            games: Array.isArray(s?.games) ? s.games.filter(isSavedGame) : [],
            current: s?.current && typeof s.current === 'object' ? s.current : {},
          };
        },
      },
    ),
  );
}

function isSavedGame(value: unknown): value is SavedGame {
  const g = value as SavedGame;
  return !!g && typeof g.id === 'string' && typeof g.startFen === 'string' && Array.isArray(g.moves) && !!g.players;
}

export type HistoryStore = ReturnType<typeof createHistoryStore>;

export const useGameHistory = createHistoryStore();

export function findGame(id: string, store: HistoryStore = useGameHistory): SavedGame | undefined {
  return store.getState().games.find((g) => g.id === id);
}

/** What the recorder reads from a game session on every change. */
export interface ObservedSession {
  phase: 'setup' | 'playing';
  game: { moves(): ReadonlyArray<{ uci: string }> };
  startFen: string;
  result: GameResult | null;
  timeControl: TimeControl | null;
}

export interface RecorderOptions {
  mode: GameMode;
  store: HistoryStore;
  /** Who plays which side; read when a game's record is first created. */
  describe: () => { players: Record<Color, PlayerTag>; you: Color | null };
  /** A stable id for this game, when the session has one (an online room code). */
  idFor?: (session: ObservedSession) => string | null;
}

/**
 * Keeps one history record per game of a session: created on the first move, rewritten on every change
 * (a takeback included), and dropped if the game is left unfinished before both sides moved twice.
 * Returns the function to call with each new session state.
 */
export function createRecorder({ mode, store, describe, idFor }: RecorderOptions) {
  let lastGame: unknown = null;
  let id: string | null = store.getState().current[mode] ?? null;

  const finishPrevious = () => {
    if (!id) return;
    const previous = findGame(id, store);
    if (previous && !previous.result && previous.moves.length < MIN_ABANDONED_PLIES) store.getState().remove(id);
    id = null;
    store.getState().setCurrent(mode, null);
  };

  return (session: ObservedSession, now = Date.now()) => {
    const moves = session.game.moves().map((r) => r.uci);
    const fixedId = idFor?.(session) ?? null;

    if (session.game !== lastGame) {
      lastGame = session.game;
      const existing = id ? findGame(id, store) : undefined;
      const continues =
        fixedId !== null
          ? fixedId === id
          : !!existing && moves.length > 0 && existing.startFen === session.startFen && samePrefix(existing.moves, moves);
      if (!continues) finishPrevious();
    }
    if (moves.length === 0) return;

    if (!id) {
      id = fixedId ?? uniqueId(`${mode}-${now.toString(36)}`, store);
      store.getState().setCurrent(mode, id);
    }
    const existing = findGame(id, store);
    const who = existing ? { players: existing.players, you: existing.you } : describe();
    store.getState().upsert({
      id,
      mode,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      startFen: session.startFen,
      moves,
      result: session.result,
      players: who.players,
      you: who.you,
      timeControl: session.timeControl,
    });
  };
}

function samePrefix(a: readonly string[], b: readonly string[]): boolean {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) return false;
  return true;
}

function uniqueId(base: string, store: HistoryStore): string {
  let candidate = base;
  for (let i = 2; findGame(candidate, store); i++) candidate = `${base}-${i}`;
  return candidate;
}
