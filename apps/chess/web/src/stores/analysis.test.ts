import { START_FEN } from '@chaturanga/chess';
import { describe, expect, it } from 'vitest';
import type { PositionEval } from '../features/review/engine';
import { analysisKey, loadEvals, saveEval } from './analysis';
import { useGameHistory } from './history';

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

describe('stored analysis (ch-015)', () => {
  it('gives back what was saved, by position, and null for the rest', () => {
    const storage = new MemoryStorage();
    saveEval('g1', ev(START_FEN), storage);
    const [start, next] = loadEvals('g1', [START_FEN, AFTER_E4], storage);
    expect(start!.lines[0]!.pv).toHaveLength(8);
    // The runner-up keeps its score and first move only.
    expect(start!.lines[1]).toEqual({ score: { cp: 10 }, pv: ['d2d4'] });
    expect(next).toBeNull();
    expect(loadEvals('other', [START_FEN], storage)).toEqual([null]);
  });

  it('ignores unreadable or foreign data', () => {
    const storage = new MemoryStorage();
    storage.setItem(analysisKey('g1'), '{not json');
    expect(loadEvals('g1', [START_FEN], storage)).toEqual([null]);
    storage.setItem(analysisKey('g1'), JSON.stringify({ v: 1, engine: 'another', evals: { [START_FEN]: ev(START_FEN) } }));
    expect(loadEvals('g1', [START_FEN], storage)).toEqual([null]);
  });

  it('makes room by dropping the analysis of the oldest games when storage is full', () => {
    const storage = new MemoryStorage();
    const base = { mode: 'local' as const, updatedAt: 0, startFen: START_FEN, moves: ['e2e4'], result: null, players: { w: { kind: 'side' as const }, b: { kind: 'side' as const } }, you: null, timeControl: null };
    useGameHistory.setState({ games: [{ ...base, id: 'new', createdAt: 3 }, { ...base, id: 'mid', createdAt: 2 }, { ...base, id: 'old', createdAt: 1 }] });
    saveEval('old', ev(START_FEN), storage);
    saveEval('mid', ev(START_FEN), storage);
    storage.limit = [...storage.data.values()].reduce((a, v) => a + v.length, 0) + 100;
    saveEval('new', ev(START_FEN), storage);
    expect(storage.getItem(analysisKey('new'))).not.toBeNull();
    expect(storage.getItem(analysisKey('old'))).toBeNull();
    expect(storage.getItem(analysisKey('mid'))).not.toBeNull();
    useGameHistory.setState({ games: [] });
  });
});
