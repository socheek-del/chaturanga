import { chess, type Game } from '@chaturanga/chess';
import { createGameSession } from '@chaturanga/game-shell';
import { beforeEach, describe, expect, it } from 'vitest';
import type { StateStorage } from 'zustand/middleware';
import type { ProductConfig } from '../product';
import { createHistoryStore, createRecorder, HISTORY_LIMIT, type HistoryStore, type SavedGame } from './history';

const PRODUCT: ProductConfig = {
  id: 'chess',
  locales: ['en'],
  defaultLocale: 'en',
  languageNames: { en: 'English' },
  ogLocales: { en: 'en_US' },
  fonts: [],
  storagePrefix: 'chess.',
};

function memoryStorage(): StateStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

const side = { players: { w: { kind: 'side' as const }, b: { kind: 'side' as const } }, you: null };

describe('game history (ch-014, plat-017)', () => {
  let storage: ReturnType<typeof memoryStorage>;
  let store: HistoryStore;

  beforeEach(() => {
    storage = memoryStorage();
    store = createHistoryStore(PRODUCT, () => storage);
  });

  function play(moves: string[]) {
    const session = createGameSession<Game>(chess);
    session.getState().start(null, undefined, 0);
    const record = createRecorder({ mode: 'local', store, describe: () => side });
    record(session.getState(), 1);
    session.subscribe((s) => record(s, 1000 + s.version));
    for (const m of moves) session.getState().move(m, 0);
    return { session, record };
  }

  it('saves a game on every move under one id', () => {
    play(['e2e4', 'e7e5', 'g1f3']);
    const { games } = store.getState();
    expect(games).toHaveLength(1);
    expect(games[0]!.moves).toEqual(['e2e4', 'e7e5', 'g1f3']);
    expect(games[0]!.mode).toBe('local');
    expect(games[0]!.result).toBeNull();
    expect(store.getState().current.local).toBe(games[0]!.id);
  });

  it('records the result, and a takeback rewrites the same record', () => {
    const { session } = play(['f2f3', 'e7e5', 'g2g4', 'd8h4']);
    expect(store.getState().games[0]!.result).toEqual({ winner: 'b', reason: 'checkmate' });
    session.getState().undo(0);
    expect(store.getState().games).toHaveLength(1);
    expect(store.getState().games[0]!.moves).toEqual(['f2f3', 'e7e5', 'g2g4']);
    expect(store.getState().games[0]!.result).toBeNull();
  });

  it('gives a new game a new id and keeps the finished one', () => {
    const { session } = play(['f2f3', 'e7e5', 'g2g4', 'd8h4']);
    session.getState().start(null, undefined, 0);
    session.getState().move('d2d4', 0);
    const { games } = store.getState();
    expect(games).toHaveLength(2);
    expect(new Set(games.map((g) => g.id)).size).toBe(2);
  });

  it('drops a game abandoned before both sides moved twice, and keeps a longer one', () => {
    const { session } = play(['e2e4', 'e7e5', 'g1f3']);
    session.getState().exitToSetup();
    session.getState().start(null, undefined, 0);
    expect(store.getState().games).toHaveLength(0);

    for (const m of ['d2d4', 'd7d5', 'c2c4', 'e7e6']) session.getState().move(m, 0);
    session.getState().start(null, undefined, 0);
    expect(store.getState().games).toHaveLength(1);
    expect(store.getState().games[0]!.moves).toHaveLength(4);
  });

  it('continues the same record after a reload restores the game', () => {
    play(['e2e4', 'e7e5']);
    const id = store.getState().games[0]!.id;
    // A reload: new stores read what the old ones saved, and the session is rebuilt from its moves.
    const reloaded = createHistoryStore(PRODUCT, () => storage);
    const session = createGameSession<Game>(chess);
    session.getState().start(null, undefined, 0);
    session.getState().move('e2e4', 0);
    session.getState().move('e7e5', 0);
    const record = createRecorder({ mode: 'local', store: reloaded, describe: () => side });
    record(session.getState());
    session.getState().move('g1f3', 0);
    record(session.getState());
    expect(reloaded.getState().games).toHaveLength(1);
    expect(reloaded.getState().games[0]!.id).toBe(id);
    expect(reloaded.getState().games[0]!.moves).toEqual(['e2e4', 'e7e5', 'g1f3']);
  });

  it('keeps an online game under its room code, whatever snapshot rebuilt it', () => {
    const record = createRecorder({ mode: 'online', store, idFor: () => 'online-ABCD', describe: () => side });
    for (const moves of [['e2e4'], ['e2e4', 'e7e5']]) {
      const game = chess.createGame();
      for (const m of moves) game.move(m);
      record({ phase: 'playing', game, startFen: chess.startFen, result: null, timeControl: null });
    }
    expect(store.getState().games.map((g) => g.id)).toEqual(['online-ABCD']);
    expect(store.getState().games[0]!.moves).toEqual(['e2e4', 'e7e5']);
  });

  it(`keeps the newest ${HISTORY_LIMIT} games and tells listeners which were dropped`, () => {
    const dropped: string[] = [];
    const off = store.onRemoved((id) => dropped.push(id));
    const base: Omit<SavedGame, 'id' | 'createdAt'> = {
      mode: 'local',
      updatedAt: 0,
      startFen: chess.startFen,
      moves: ['e2e4'],
      result: null,
      players: side.players,
      you: null,
      timeControl: null,
    };
    for (let i = 0; i < HISTORY_LIMIT + 3; i++) store.getState().upsert({ ...base, id: `g${i}`, createdAt: i });
    off();
    const { games } = store.getState();
    expect(games).toHaveLength(HISTORY_LIMIT);
    expect(games[0]!.id).toBe(`g${HISTORY_LIMIT + 2}`);
    expect(dropped).toEqual(['g0', 'g1', 'g2']);
  });

  it('ignores unreadable saved data', () => {
    storage.setItem('chess.games', JSON.stringify({ state: { games: [{ id: 1 }, null], current: 'x' }, version: 1 }));
    const bad = memoryStorage();
    for (const [k, v] of storage.data) bad.setItem(k, v);
    const reloaded = createHistoryStore(PRODUCT, () => bad);
    expect(reloaded.getState().games).toEqual([]);
  });
});
