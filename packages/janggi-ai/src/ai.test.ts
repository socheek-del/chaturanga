import { MATE, search } from '@chaturanga/ai-core';
import { Game, START_FEN } from '@chaturanga/janggi';
import { encodedToUci, parseFen } from '@chaturanga/janggi/core';
import { describe, expect, it } from 'vitest';
import { bestMove, BOTS, chooseMove, DECIDED_SCORE, inConversion, JanggiSearch, mulberry32, positionKey } from './index';

function playLine(fen: string, moves: string[]): { game: Game; history: string[] } {
  const game = new Game(fen);
  const history = [positionKey(game.fen())];
  for (const uci of moves) history.push(positionKey(game.move(uci).fenAfter));
  return { game, history };
}

const MIDGAME = 'r1ba1abnr/4k4/1cn1c4/p1p1p1p1p/9/9/P1P1P1P1P/1C2C1N2/4K4/RNBA1AB1R w - - 0 1';

describe('search (jg-003)', () => {
  it('finds mate in one', () => {
    const fen = '3k5/R8/9/9/9/9/9/9/4K4/7R1 w - - 0 1';
    const move = bestMove(fen, { maxDepth: 2 });
    expect(move!.score).toBeGreaterThan(MATE - 10);
    const game = new Game(fen);
    game.move(move!.uci);
    expect(game.status()).toEqual({ kind: 'checkmate', winner: 'w' });
  });

  it('captures a hanging chariot', () => {
    expect(bestMove('3k5/9/9/9/9/3r5/9/2N6/9/5K3 w - - 0 1', { maxDepth: 3 })?.uci).toBe('c3d5');
  });

  it('a side ahead on points accepts bikjang; a side behind breaks it', () => {
    const ahead = '4k4/9/9/9/9/9/9/9/4K4/r8 b - - 0 1';
    expect(bestMove(ahead, { maxDepth: 3 })).toMatchObject({ uci: 'e10e10', score: DECIDED_SCORE });
    const behind = '4k4/9/9/9/9/9/9/9/4K4/R8 b - - 0 1';
    expect(bestMove(behind, { maxDepth: 3 })!.uci).not.toBe('e10e10');
  });

  it('answers a pass with a pass only when it wins on points', () => {
    const won = playLine('3k5/9/9/9/9/9/9/9/5K3/r8 w - - 0 1', ['f2f2']);
    expect(bestMove(won.game.fen(), { maxDepth: 2, history: won.history, game: won.game })).toMatchObject({ uci: 'd10d10', score: DECIDED_SCORE });
    const lost = playLine('3k5/9/9/9/9/9/9/9/5K3/R8 w - - 0 1', ['f2f2']);
    expect(bestMove(lost.game.fen(), { maxDepth: 2, history: lost.history, game: lost.game })!.uci).not.toBe('d10d10');
  });

  it('never passes on its own accord while it has a move', () => {
    const pos = parseFen(START_FEN);
    expect(new JanggiSearch(pos.board, pos.turn).legalMoves().map(encodedToUci)).not.toContain('e2e2');
  });

  it('scores a losing perpetual check as a loss when it knows the game history', () => {
    const cycle = ['a9a10', 'd10d9', 'a10a9', 'd9d10', 'a9a10', 'd10d9'];
    const { game, history } = playLine('3k5/R8/9/9/9/9/9/8r/9/4K4 w - - 0 1', cycle);
    const pos = parseFen(game.fen());
    const result = search(new JanggiSearch(pos.board, pos.turn, game), { maxDepth: 2, history, contempt: 30 });
    expect(result.rootMoves.find((r) => encodedToUci(r.move) === 'a10a9')!.score).toBe(-DECIDED_SCORE);
  });

  it('keeps the position and the game intact while searching', () => {
    const { game, history } = playLine(MIDGAME, ['e2e2', 'a7a6']);
    const fen = game.fen();
    const pos = parseFen(fen);
    const adapter = new JanggiSearch(pos.board, pos.turn, game);
    const before = adapter.key();
    search(adapter, { maxDepth: 2, history });
    expect(adapter.key()).toBe(before);
    expect(game.fen()).toBe(fen);
  });

  it('returns null when there is no legal move', () => {
    const mated = playLine('3k5/R8/9/9/9/9/9/9/4K4/7R1 w - - 0 1', ['h1h10']).game.fen();
    expect(bestMove(mated)).toBeNull();
    expect(chooseMove(mated, 3)).toBeNull();
  });

  it('rejects a game that is not on the given position', () => {
    expect(() => bestMove(START_FEN, { game: new Game(MIDGAME) })).toThrow();
  });
});

describe('bots (jg-003)', () => {
  it('has six levels named after the pieces with increasing budgets', () => {
    expect(BOTS.map((b) => b.key)).toEqual(['soldier', 'advisor', 'elephant', 'horse', 'cannon', 'chariot']);
    for (let i = 1; i < BOTS.length; i++) expect(BOTS[i]!.maxNodes).toBeGreaterThan(BOTS[i - 1]!.maxNodes);
  });

  it.each([1, 2, 3, 4])('level %i plays legal moves from the start and does not pass', { timeout: 60_000 }, (id) => {
    const game = new Game();
    const rng = mulberry32(id);
    const history = [positionKey(game.fen())];
    while (!game.isGameOver() && game.moves().length < 16) {
      const move = chooseMove(game.fen(), id, { rng, ignoreTime: true, history, game });
      expect(game.legalUci()).toContain(move!.uci);
      expect(move!.uci).not.toBe(game.passMove());
      history.push(positionKey(game.move(move!.uci).fenAfter));
    }
  });

  it('switches to conversion mode only when clearly winning', () => {
    expect(inConversion(START_FEN)).toBe(false);
    expect(inConversion('3k5/9/9/9/9/9/9/9/5K3/R8 w - - 0 1')).toBe(true);
    expect(inConversion('3k5/9/9/9/9/9/9/9/5K3/R8 b - - 0 1')).toBe(false);
  });

  it('level 3 wins with two chariots against a lone general', { timeout: 60_000 }, () => {
    const game = new Game('4k4/9/9/9/9/9/9/9/3K5/R7R w - - 0 1');
    const rng = mulberry32(3);
    const history = [positionKey(game.fen())];
    while (!game.isGameOver() && game.moves().length < 120) {
      const move = game.turn === 'w' ? chooseMove(game.fen(), 3, { rng, ignoreTime: true, history, game }) : bestMove(game.fen(), { maxDepth: 2, history, game });
      history.push(positionKey(game.move(move!.uci).fenAfter));
    }
    expect(game.status()).toMatchObject({ winner: 'w' });
  });

  it('is reproducible with the same seed', () => {
    expect(chooseMove(MIDGAME, 2, { rng: mulberry32(7), ignoreTime: true })).toEqual(chooseMove(MIDGAME, 2, { rng: mulberry32(7), ignoreTime: true }));
  });
});
