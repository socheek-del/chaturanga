import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chess, START_FEN } from '@chaturanga/chess';
import { describe, expect, it } from 'vitest';
import { type BookData, buildBookData, OpeningBook } from './openings';
import raw from './openings/book.json';

const tsvs = ['a', 'b', 'c', 'd', 'e'].map((n) => readFileSync(join(__dirname, 'openings', `${n}.tsv`), 'utf8'));
const data = raw as unknown as BookData;
const book = new OpeningBook(data);

function after(moves: string[]): string {
  const game = chess.createGame();
  for (const m of moves) game.move(m);
  return game.fen();
}

describe('opening book (ch-015)', () => {
  it('book.json is what the TSVs give (every 20th line rebuilt)', () => {
    const sample = tsvs.map((tsv) => {
      const [header, ...lines] = tsv.split('\n');
      return [header, ...lines.filter((_, i) => i % 20 === 0)].join('\n');
    });
    const rebuilt = buildBookData(sample);
    expect(Object.keys(rebuilt.named).length).toBeGreaterThan(150);
    for (const [hash, entry] of Object.entries(rebuilt.named)) expect(data.named[hash]).toEqual(entry);
    const all = new Set([...data.passing, ...Object.keys(data.named)]);
    for (const hash of rebuilt.passing) expect(all.has(hash)).toBe(true);
    expect(book.size).toBeGreaterThan(7000);
  });

  it('names known openings and knows the positions on the way to them', () => {
    expect(book.name(after(['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1b5']))).toEqual({ eco: 'C60', name: 'Ruy Lopez' });
    expect(book.name(after(['e2e4', 'c7c5']))?.name).toBe('Sicilian Defense');
    expect(book.has(after(['e2e4', 'e7e5', 'g1f3']))).toBe(true);
    expect(book.has(START_FEN)).toBe(false);
  });

  it('finds a transposition, since positions are keyed rather than move orders', () => {
    const viaNf3 = after(['g1f3', 'd7d5', 'd2d4']);
    const viaD4 = after(['d2d4', 'd7d5', 'g1f3']);
    expect(book.name(viaNf3)).toEqual(book.name(viaD4));
    expect(book.has(viaNf3)).toBe(true);
  });

  it('leaves unknown positions out', () => {
    expect(book.has(after(['e2e4', 'e7e5', 'e1e2', 'e8e7', 'e2e1', 'e7e8', 'e1e2']))).toBe(false);
    expect(book.has(after(['a2a4', 'h7h5', 'h2h4', 'a7a5', 'a1a3', 'h8h6']))).toBe(false);
  });
});
