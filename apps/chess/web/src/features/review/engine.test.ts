import { spawn } from 'node:child_process';
import { copyFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chess, START_FEN } from '@chaturanga/chess';
import { afterAll, describe, expect, it } from 'vitest';
import { type PositionEval, reviewGame, terminalEval, UciEngine, type UciTransport } from '@chaturanga/game-shell';
import { chessReview } from './kit';
import { type BookData, OpeningBook } from './openings';
import raw from './openings/book.json';

/**
 * The same Stockfish file the site ships, run by Node: the script is CommonJS when run directly, so it is
 * copied next to its .wasm under a .cjs name.
 */
function nodeTransport(): UciTransport {
  const dir = mkdtempSync(join(tmpdir(), 'stockfish-'));
  const engineDir = join(__dirname, '..', '..', '..', 'public', 'engine');
  copyFileSync(join(engineDir, 'stockfish.js'), join(dir, 'stockfish.cjs'));
  copyFileSync(join(engineDir, 'stockfish.wasm'), join(dir, 'stockfish.wasm'));
  const child = spawn(process.execPath, [join(dir, 'stockfish.cjs')], { stdio: ['pipe', 'pipe', 'inherit'] });
  let buffer = '';
  const listeners: Array<(line: string) => void> = [];
  child.stdout.on('data', (chunk: Buffer) => {
    buffer += chunk.toString();
    let newline;
    while ((newline = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, newline);
      buffer = buffer.slice(newline + 1);
      for (const l of listeners) l(line);
    }
  });
  return {
    send: (command) => child.stdin.write(`${command}\n`),
    onLine: (listener) => void listeners.push(listener),
    terminate: () => child.kill(),
  };
}

describe('Stockfish analysis (ch-015)', () => {
  const engine = new UciEngine(nodeTransport());
  afterAll(() => engine.terminate());

  it('answers from White’s side, with a runner-up line', async () => {
    const black = await engine.analyse('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1', { depth: 8, movetime: 2000 });
    expect(black.lines).toHaveLength(2);
    expect(black.depth).toBeGreaterThanOrEqual(8);
    // White is a little better after 1. e4, whichever side is to move.
    expect('cp' in black.lines[0]!.score && black.lines[0]!.score.cp).toBeGreaterThan(-50);
    const mateIn1 = await engine.analyse('6k1/5ppp/8/8/8/8/8/3R2K1 w - - 0 1', { depth: 8, movetime: 2000 });
    expect(mateIn1.lines[0]!.pv[0]).toBe('d1d8');
    expect(mateIn1.lines[0]!.score).toEqual({ mate: 1 });
    const matedIn1 = await engine.analyse('3R2k1/5ppp/8/8/8/8/8/6K1 b - - 0 1', { depth: 4, movetime: 2000 });
    expect(matedIn1.lines).toEqual([]);
  }, 30_000);

  it('finds the blunder in the Blackburne Shilling trap', async () => {
    // 1. e4 e5 2. Nf3 Nc6 3. Bc4 Nd4 4. Nxe5 Qg5 5. Nxf7?? Qxg2 6. Rf1 Qxe4+ 7. Be2 Nf3#
    const moves = ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'c6d4', 'f3e5', 'd8g5', 'e5f7', 'g5g2', 'h1f1', 'g2e4', 'c4e2', 'd4f3'];
    const game = chess.createGame();
    const evals: PositionEval[] = [];
    await engine.newGame();
    for (let i = 0; i <= moves.length; i++) {
      evals.push(terminalEval(game) ?? (await engine.analyse(game.fen(), { depth: 10, movetime: 2000 })));
      if (i < moves.length) game.move(moves[i]!);
    }
    const review = reviewGame({ rules: chessReview.rules, startFen: START_FEN, moves, evals, book: new OpeningBook(raw as unknown as BookData) });
    const labels = review.moves.map((m) => `${m.san}:${m.label}`);
    expect(labels[0]).toBe('e4:book');
    // 4. Nxe5 is already dubious; 5. Nxf7 loses outright.
    expect(['mistake', 'blunder', 'miss']).toContain(review.moves[8]!.label);
    expect(review.moves[8]!.winAfter).toBeLessThan(25);
    expect(review.moves[8]!.winBefore - review.moves[8]!.winAfter).toBeGreaterThan(10);
    expect(review.moves.at(-1)!.san).toBe('Nf3#');
    expect(review.whiteWins.at(-1)).toBe(0);
    expect(review.accuracy.b!).toBeGreaterThan(review.accuracy.w!);
  }, 120_000);
});
