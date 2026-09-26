import { START_FEN } from '@chaturanga/chess';
import { describe, expect, it } from 'vitest';
import type { ProductConfig } from '../product';
import { createAnalysisStore } from './analysisStore';
import type { PositionEval } from './engine';
import { createHistoryStore } from './history';

const PRODUCT = { storagePrefix: 'chess.' } as ProductConfig;

class MemoryStorage implements Storage {
  data = new Map<string, string>();
  limit = Infinity;
  get length() {
    return this.data.size;
  }
  clear() {
    this.data.clear();
  }
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  key(i: number) {
    return [...this.data.keys()][i] ?? null;
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
  setItem(k: string, v: string) {
    const used = [...this.data.entries()].reduce((a, [key, value]) => a + (key === k ? 0 : value.length), 0);
    if (used + v.length > this.limit) throw new DOMException('full', 'QuotaExceededError');
    this.data.set(k, v);
  }
}

const AFTER_E4 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
const ev = (fen: string, cp = 20): PositionEval => ({
  fen,
  depth: 14,
  lines: [
    { score: { cp }, pv: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1b5', 'a7a6', 'b5a4', 'g8f6'] },
    { score: { cp: 10 }, pv: ['d2d4', 'd7d5', 'c2c4'] },
  ],
});

/** A product's history and analysis stores over one in-memory Storage. */
function stores(storage: MemoryStorage, engine = 'sf') {
  const history = createHistoryStore(PRODUCT, () => storage);
  return { history, analysis: createAnalysisStore(PRODUCT, history, engine, () => storage) };
}

describe('stored analysis (ch-015, plat-017)', () => {
  it('gives back what was saved, by position, and null for the rest', () => {
    const { analysis } = stores(new MemoryStorage());
    analysis.save('g1', ev(START_FEN));
    const [start, next] = analysis.load('g1', [START_FEN, AFTER_E4]);
    expect(start!.lines[0]!.pv).toHaveLength(8);
    // The runner-up keeps its score and first move only.
    expect(start!.lines[1]).toEqual({ score: { cp: 10 }, pv: ['d2d4'] });
    expect(next).toBeNull();
    expect(analysis.load('other', [START_FEN])).toEqual([null]);
    expect(analysis.key('g1')).toBe('chess.analysis.g1');
  });

  it('ignores unreadable data, and what another engine wrote', () => {
    const storage = new MemoryStorage();
    const { analysis } = stores(storage);
    storage.setItem(analysis.key('g1'), '{not json');
    expect(analysis.load('g1', [START_FEN])).toEqual([null]);
    storage.setItem(analysis.key('g1'), JSON.stringify({ v: 1, engine: 'another', evals: { [START_FEN]: ev(START_FEN) } }));
    expect(analysis.load('g1', [START_FEN])).toEqual([null]);
  });

  it('makes room by dropping the analysis of the oldest games when storage is full', () => {
    const storage = new MemoryStorage();
    const { history, analysis } = stores(storage);
    const base = { mode: 'local' as const, updatedAt: 0, startFen: START_FEN, moves: ['e2e4'], result: null, players: { w: { kind: 'side' as const }, b: { kind: 'side' as const } }, you: null, timeControl: null };
    history.setState({ games: [{ ...base, id: 'new', createdAt: 3 }, { ...base, id: 'mid', createdAt: 2 }, { ...base, id: 'old', createdAt: 1 }] });
    analysis.save('old', ev(START_FEN));
    analysis.save('mid', ev(START_FEN));
    storage.limit = [...storage.data.values()].reduce((a, v) => a + v.length, 0) + 100;
    analysis.save('new', ev(START_FEN));
    expect(storage.getItem(analysis.key('new'))).not.toBeNull();
    expect(storage.getItem(analysis.key('old'))).toBeNull();
    expect(storage.getItem(analysis.key('mid'))).not.toBeNull();
  });

  it('a game leaving the list takes its analysis with it', () => {
    const storage = new MemoryStorage();
    const { history, analysis } = stores(storage);
    const base = { mode: 'local' as const, updatedAt: 0, startFen: START_FEN, moves: ['e2e4'], result: null, players: { w: { kind: 'side' as const }, b: { kind: 'side' as const } }, you: null, timeControl: null };
    history.getState().upsert({ ...base, id: 'g1', createdAt: 1 });
    analysis.save('g1', ev(START_FEN));
    history.getState().remove('g1');
    expect(storage.getItem(analysis.key('g1'))).toBeNull();
  });
});
