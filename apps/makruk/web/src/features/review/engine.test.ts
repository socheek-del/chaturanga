import { copyFileSync, mkdtempSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { type PositionEval, reviewGame, terminalEval, UciEngine, type UciTransport } from '@chaturanga/game-shell';
import { makruk } from '@chaturanga/makruk';
import { afterAll, describe, expect, it } from 'vitest';
import { makrukReview } from './kit';

interface EngineModule {
  postMessage(command: string): void;
  addMessageListener(listener: (line: string) => void): void;
  terminate(): void;
}

/**
 * The same Fairy-Stockfish files the site ships, run by Node. They are copied out of this ES-module package
 * so Node reads the script as CommonJS; `fetch` is hidden so Emscripten reads the .wasm from disk.
 */
function nodeTransport(): UciTransport {
  const dir = mkdtempSync(join(tmpdir(), 'fairy-'));
  const engineDir = join(__dirname, '..', '..', '..', 'public', 'engine');
  for (const file of ['stockfish.js', 'stockfish.wasm', 'stockfish.worker.js']) copyFileSync(join(engineDir, file), join(dir, file));
  const listeners: Array<(line: string) => void> = [];
  const queue: string[] = [];
  let engine: EngineModule | null = null;
  const savedFetch = globalThis.fetch;
  const ready = (async () => {
    // @ts-expect-error: hidden on purpose while the module loads.
    delete globalThis.fetch;
    try {
      const factory = createRequire(import.meta.url)(join(dir, 'stockfish.js')) as () => Promise<EngineModule>;
      engine = await factory();
    } finally {
      globalThis.fetch = savedFetch;
    }
    engine.addMessageListener((line) => listeners.forEach((l) => l(line)));
    for (const c of queue.splice(0)) engine.postMessage(c);
  })();
  return {
    ready,
    send: (c) => (engine ? engine.postMessage(c) : void queue.push(c)),
    onLine: (l) => void listeners.push(l),
    terminate: () => engine?.terminate(),
  };
}

describe('Fairy-Stockfish analysis of Makruk (review-002)', () => {
  const engine = new UciEngine(nodeTransport(), { UCI_Variant: 'makruk' });
  afterAll(() => engine.terminate());

  it('reads Makruk positions from our FEN, answering from White’s side with a runner-up', async () => {
    const start = await engine.analyse(makruk.startFen, { depth: 8, movetime: 3000 });
    expect(start.lines).toHaveLength(2);
    expect(start.depth).toBeGreaterThanOrEqual(8);
    // Every move the engine proposes is legal in our rules.
    expect(makruk.createGame().legalUci()).toContain(start.lines[0]!.pv[0]);
    const game = makruk.createGame();
    for (const m of start.lines[0]!.pv.slice(0, 4)) game.move(m);
  }, 60_000);

  it('flags a move that lets a rook go, and names the capture as best', async () => {
    // The black rook on d2 stands next to the white king: Kxd2 wins it, Kf1 lets it go.
    const fen = '4k3/8/8/8/8/8/3r4/R3K3 w - - 0 1';
    const moves = ['e1f1'];
    const game = makruk.createGame(fen);
    const evals: PositionEval[] = [];
    await engine.newGame();
    for (let i = 0; i <= moves.length; i++) {
      evals.push(terminalEval(game) ?? (await engine.analyse(game.fen(), { depth: 10, movetime: 3000 })));
      if (i < moves.length) game.move(moves[i]!);
    }
    const review = reviewGame({ rules: makrukReview.rules, startFen: fen, moves, evals, book: null });
    expect(review.moves[0]!.best).toBe('e1d2');
    expect(['mistake', 'blunder']).toContain(review.moves[0]!.label);
    expect(review.moves[0]!.bestSan).toBe('Kxd2');
  }, 60_000);
});
