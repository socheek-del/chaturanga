import { MATE, search, type SearchResult } from '@chaturanga/ai-core';
import { Game, START_FEN } from '@chaturanga/xiangqi';
import { encodedToUci, parseFen } from '@chaturanga/xiangqi/core';
import { describe, expect, it } from 'vitest';
import {
  bestMove,
  BOTS,
  chooseMove,
  inConversion,
  mulberry32,
  PERPETUAL_SCORE,
  positionKey,
  XiangqiSearch,
} from './index';

function playLine(fen: string, moves: string[]): { game: Game; history: string[] } {
  const game = new Game(fen);
  const history = [positionKey(game.fen())];
  for (const uci of moves) history.push(positionKey(game.move(uci).fenAfter));
  return { game, history };
}

describe('search (xq-003)', () => {
  it('finds mate in one', () => {
    // The chariot on i9 covers d9 and e10 faces Red's general: a1a10 and a1d1 both mate.
    const move = bestMove('3k5/8R/9/9/9/9/9/9/9/R3K4 w - - 0 1', { maxDepth: 2 });
    expect(move!.score).toBeGreaterThan(MATE - 10);
    const game = new Game('3k5/8R/9/9/9/9/9/9/9/R3K4 w - - 0 1');
    game.move(move!.uci);
    expect(game.status()).toEqual({ kind: 'checkmate', winner: 'w' });
  });

  it('captures a hanging chariot', () => {
    expect(bestMove('3k5/9/9/9/9/3r5/9/2N6/9/4K4 w - - 0 1', { maxDepth: 3 })?.uci).toBe('c3d5');
  });

  it('avoids a flying-general blunder: the lone screen between the generals stays put', () => {
    // Red's cannon on e5 could take the chariot on a5, but it is the only piece between the generals.
    const fen = '4k4/9/9/9/8c/r1p1C4/9/9/9/4K3R w - - 0 1';
    expect(new Game(fen).legalUci()).not.toContain('e5a5');
    const move = bestMove(fen, { maxDepth: 3 });
    expect(new Game(fen).legalUci()).toContain(move!.uci);
    expect(move!.uci).toBe('i1i6');
  });

  it('scores a losing perpetual check as a loss, not a draw, when it knows the game history', () => {
    // Red has checked the Black general back and forth. Checking once more looks like a repetition draw,
    // but Black's reply would repeat the position a third time and Red would lose by perpetual check.
    const cycle = ['a9a10', 'd10d9', 'a10a9', 'd9d10', 'a9a10', 'd10d9'];
    const { game, history } = playLine('3k5/R8/9/9/9/9/9/8r/9/4K4 w - - 0 1', cycle);
    const fen = game.fen();
    const scoreOf = (result: SearchResult) => result.rootMoves.find((r) => encodedToUci(r.move) === 'a10a9')!.score;

    const blindPos = parseFen(fen);
    const blind = search(new XiangqiSearch(blindPos.board, blindPos.turn), { maxDepth: 2, history, contempt: 30 });
    expect(scoreOf(blind)).toBe(-30);

    const pos = parseFen(fen);
    const informed = search(new XiangqiSearch(pos.board, pos.turn, game), { maxDepth: 2, history, contempt: 30 });
    expect(scoreOf(informed)).toBe(-PERPETUAL_SCORE);
    expect(bestMove(fen, { maxDepth: 3, history, game })?.uci).not.toBe('a10a9');
    expect(game.fen()).toBe(fen);

    game.move('a10a9');
    game.move('d9d10');
    expect(game.status()).toEqual({ kind: 'perpetual-check', winner: 'b' });
  });

  it('scores a repetition that wins as a win', () => {
    // One ply later, Black to move: stepping back to d10 repeats the position a third time and completes
    // Red's perpetual check, so Black wins by repeating.
    const cycle = ['a9a10', 'd10d9', 'a10a9', 'd9d10', 'a9a10', 'd10d9', 'a10a9'];
    const { game, history } = playLine('3k5/R8/9/9/9/9/9/8r/9/4K4 w - - 0 1', cycle);
    const pos = parseFen(game.fen());
    const result = search(new XiangqiSearch(pos.board, pos.turn, game), { maxDepth: 2, history });
    expect(encodedToUci(result.move)).toBe('d9d10');
    expect(result.score).toBe(PERPETUAL_SCORE);
  });

  it('keeps the position intact while searching', () => {
    const fen = '2bakab2/9/1cn1c1n2/p1p1p1p1p/9/9/P1P1P1P1P/1CN1C1N2/9/R1BAKAB1R w - - 0 1';
    const pos = parseFen(fen);
    const adapter = new XiangqiSearch(pos.board, pos.turn);
    const before = adapter.key();
    search(adapter, { maxDepth: 3 });
    expect(adapter.key()).toBe(before);
    expect(before).toBe(positionKey(fen));
  });

  it('returns null when there is no legal move', () => {
    const stalemated = '3k5/8R/9/9/9/9/9/9/9/4K4 b - - 0 1';
    expect(new Game(stalemated).status()).toEqual({ kind: 'stalemate', winner: 'w' });
    expect(bestMove(stalemated)).toBeNull();
    expect(chooseMove(stalemated, 3)).toBeNull();
  });

  it('rejects a game that is not on the given position', () => {
    expect(() => bestMove(START_FEN, { game: new Game('3k5/8R/9/9/9/9/9/9/9/R3K4 w - - 0 1') })).toThrow();
  });
});

describe('bots (xq-003)', () => {
  it('has six levels named after the pieces with increasing budgets', () => {
    expect(BOTS.map((b) => b.key)).toEqual(['soldier', 'advisor', 'elephant', 'horse', 'cannon', 'chariot']);
    for (let i = 1; i < BOTS.length; i++) expect(BOTS[i]!.maxNodes).toBeGreaterThan(BOTS[i - 1]!.maxNodes);
  });

  it.each([1, 2, 3, 4])('level %i plays legal moves from the start', { timeout: 60_000 }, (id) => {
    const game = new Game();
    const rng = mulberry32(id);
    const history = [positionKey(game.fen())];
    while (!game.isGameOver() && game.moves().length < 16) {
      const move = chooseMove(game.fen(), id, { rng, ignoreTime: true, history, game });
      expect(game.legalUci()).toContain(move!.uci);
      history.push(positionKey(game.move(move!.uci).fenAfter));
    }
  });

  it('switches to conversion mode only when clearly winning', () => {
    expect(inConversion(START_FEN)).toBe(false);
    expect(inConversion('3k5/9/9/9/9/9/9/9/9/R3K4 w - - 0 1')).toBe(true);
    expect(inConversion('3k5/9/9/9/9/9/9/9/9/R3K4 b - - 0 1')).toBe(false);
  });

  it('level 2 mates a lone general with a chariot', { timeout: 60_000 }, () => {
    const game = new Game('4k4/9/9/9/9/9/9/9/9/R2K5 w - - 0 1');
    const rng = mulberry32(3);
    const history = [positionKey(game.fen())];
    while (!game.isGameOver() && game.moves().length < 120) {
      const move =
        game.turn === 'w'
          ? chooseMove(game.fen(), 2, { rng, ignoreTime: true, history, game })
          : bestMove(game.fen(), { maxDepth: 2, history, game });
      history.push(positionKey(game.move(move!.uci).fenAfter));
    }
    expect(game.status()).toMatchObject({ winner: 'w' });
  });

  it('is reproducible with the same seed', () => {
    const fen = '2bakab2/9/1cn1c1n2/p1p1p1p1p/9/9/P1P1P1P1P/1CN1C1N2/9/R1BAKAB1R w - - 0 1';
    expect(chooseMove(fen, 2, { rng: mulberry32(7), ignoreTime: true })).toEqual(
      chooseMove(fen, 2, { rng: mulberry32(7), ignoreTime: true }),
    );
    expect(chooseMove(START_FEN, 1, { rng: mulberry32(9) })).toEqual(chooseMove(START_FEN, 1, { rng: mulberry32(9) }));
  });
});
