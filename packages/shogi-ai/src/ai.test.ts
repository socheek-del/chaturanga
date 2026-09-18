import { MATE, search, type SearchResult } from '@chaturanga/ai-core';
import { Game, START_FEN } from '@chaturanga/shogi';
import { encodedToUci, parseFen } from '@chaturanga/shogi/core';
import { describe, expect, it } from 'vitest';
import {
  bestMove,
  evaluate,
  BOTS,
  chooseMove,
  inConversion,
  mulberry32,
  PERPETUAL_SCORE,
  positionKey,
  searchPosition,
  ShogiSearch,
} from './index';

function playLine(fen: string, moves: string[]): { game: Game; history: string[] } {
  const game = new Game(fen);
  const history = [positionKey(game.fen())];
  for (const uci of moves) history.push(positionKey(game.move(uci).fenAfter));
  return { game, history };
}

describe('search (sg-003)', () => {
  it('finds a mate in one', () => {
    const fen = '4k4/9/4G4/9/9/9/9/9/R3K4[] w - - 0 1';
    const move = bestMove(fen, { maxDepth: 2 });
    expect(move!.score).toBeGreaterThan(MATE - 100);
    const game = new Game(fen);
    game.move(move!.uci);
    expect(game.status()).toEqual({ kind: 'checkmate', winner: 'w' });
  });

  it('mates by dropping a piece from hand', () => {
    const fen = '8b/lrssgkg1P/1pnp2psN/p1N1P2pl/1b1P1SP1L/P8/1PP4P1/2G3+p2/LNg1K4[ppppr] b - - 1 54';
    const move = bestMove(fen, { maxDepth: 2 });
    const game = new Game(fen);
    game.move(move!.uci);
    expect(game.status()).toEqual({ kind: 'checkmate', winner: 'b' });
  });

  it('takes a hanging rook', () => {
    expect(bestMove('4k4/9/9/9/4r4/4S4/9/9/4K4[] w - - 0 1', { maxDepth: 3 })?.uci).toBe('e4e5');
  });

  it('values a promoted piece above its unpromoted form', () => {
    const plain = parseFen('4k4/9/4S4/9/9/9/9/9/4K4[] b - - 0 1');
    const promoted = parseFen('4k4/9/4+S4/9/9/9/9/9/4K4[] b - - 0 1');
    expect(evaluate(promoted.board, promoted.hands, 0)).toBeGreaterThan(evaluate(plain.board, plain.hands, 0));
  });

  it('values a piece in hand above the same piece on the board', () => {
    const onBoard = parseFen('4k4/9/9/9/2R6/9/9/9/4K4[] w - - 0 1');
    const inHand = parseFen('4k4/9/9/9/9/9/9/9/4K4[R] w - - 0 1');
    expect(evaluate(inHand.board, inHand.hands, 0)).toBeGreaterThan(evaluate(onBoard.board, onBoard.hands, 0));
  });

  it('scores a losing perpetual check as a loss, not a draw, when it knows the game history', () => {
    // Sente has checked the Gote king back and forth. One more check looks like a repetition draw, but
    // Gote's reply repeats the position a fourth time and Sente loses by perpetual check.
    // Sennichite needs a fourth occurrence, so the cycle runs three times before the deciding move.
    const cycle = ['a1a9', 'e9f8', 'a9a8', 'f8e9', 'a8a9', 'e9f8', 'a9a8', 'f8e9', 'a8a9', 'e9f8', 'a9a8', 'f8e9'];
    const { game, history } = playLine('4k4/9/9/9/9/9/9/9/R3K4[] w - - 0 1', cycle);
    const fen = game.fen();
    const scoreOf = (result: SearchResult) => result.rootMoves.find((r) => encodedToUci(r.move) === 'a8a9')!.score;

    const blind = search(new ShogiSearch(searchPosition(parseFen(fen))), { maxDepth: 2, history, contempt: 30 });
    expect(scoreOf(blind)).toBe(-30);

    const informed = search(new ShogiSearch(searchPosition(parseFen(fen)), game), {
      maxDepth: 2,
      history,
      contempt: 30,
    });
    expect(scoreOf(informed)).toBe(-PERPETUAL_SCORE);
    // The search leaves the game exactly as it found it.
    expect(game.fen()).toBe(fen);
  });
});

describe('bots (sg-003)', () => {
  // The strongest bots are given their real time budget rather than their node budget: a full node budget
  // under vitest's transform takes far longer than the browser ever would.
  it.each(BOTS.map((bot) => [bot.key, bot.id] as const))('%s plays a legal opening move', (_key, id) => {
    const move = chooseMove(START_FEN, id, { rng: mulberry32(7) });
    expect(new Game().legalUci()).toContain(move!.uci);
  });

  it('is deterministic for a seed', () => {
    const once = chooseMove(START_FEN, 3, { rng: mulberry32(11), ignoreTime: true });
    const twice = chooseMove(START_FEN, 3, { rng: mulberry32(11), ignoreTime: true });
    expect(once!.uci).toBe(twice!.uci);
  });

  it('drops a piece from hand when that is the move it wants', () => {
    const fen = '4k4/9/9/9/9/9/9/9/4K4[R] w - - 0 1';
    const move = chooseMove(fen, 4, { rng: mulberry32(3), ignoreTime: true });
    expect(new Game(fen).legalUci()).toContain(move!.uci);
    expect(move!.uci.startsWith('R@')).toBe(true);
  });

  it('returns null when there is no legal move', () => {
    expect(chooseMove('k8/9/NG7/9/9/9/9/9/8K[] b - - 0 1', 2, { ignoreTime: true })).toBeNull();
  });

  it('switches into conversion mode with a clear material lead', () => {
    expect(inConversion(START_FEN)).toBe(false);
    expect(inConversion('4k4/9/9/9/9/9/9/9/R3K3R[] w - - 0 1')).toBe(true);
  });

  it('refuses a game that is not standing on the position it was given', () => {
    const game = new Game();
    game.move('e3e4');
    expect(() => chooseMove(START_FEN, 2, { game, ignoreTime: true })).toThrow();
  });
});
