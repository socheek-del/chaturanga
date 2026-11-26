import { describe, expect, it } from 'vitest';
import { fenOf, Game, makePiece, parseFen, squareAt, START_FEN, type Move } from '@chaturanga/chu-shogi';
import { BOTS, ChuSearch, chooseMove, encodeMove, positionKey, searchPosition } from './index';

describe('Chu Shogi search adapter', () => {
  it('encodes a two-leg Lion route as one complete turn', () => {
    const position = parseFen(START_FEN);
    position.board.fill(null);
    position.board[squareAt(5, 5)] = makePiece('w', 'lion');
    position.board[squareAt(6, 5)] = makePiece('b', 'pawn');
    const adapter = new ChuSearch(position);
    const codes = adapter.legalMoves();
    const lionRoute = codes.map((code) => adapter.moveUci(code)).find((uci) => uci.length >= 6);
    expect(lionRoute).toBeDefined();
    expect(new Set(codes).size).toBe(codes.length);

    const promotedRoute: Move = {
      color: 'w', from: 1, to: 25, path: [13, 25], captures: [], promote: true, uci: 'b1b2b3+',
    };
    expect(encodeMove(promotedRoute) & (1 << 24)).not.toBe(0);
    expect(positionKey(START_FEN)).toBe(positionKey(new Game().fen()));
  });

  it('returns a legal move deterministically for each side and exposes six bounded bots', () => {
    const game = new Game();
    const result = chooseMove(game.fen(), 1, { game, ignoreTime: true, rng: () => 0.9 });
    expect(result).not.toBeNull();
    expect(game.legalUci()).toContain(result!.uci);
    expect(chooseMove(game.fen(), 1, { game, ignoreTime: true, rng: () => 0.9 })).toEqual(result);
    expect(BOTS).toHaveLength(6);
    expect(BOTS.map(({ maxNodes }) => maxNodes)).toEqual([...BOTS.map(({ maxNodes }) => maxNodes)].sort((a, b) => a - b));
    expect(BOTS.every(({ maxNodes, timeMs }) => maxNodes > 0 && timeMs > 0)).toBe(true);
    expect(game.fen()).toBe(START_FEN);

    game.move(result!.uci);
    const reply = chooseMove(game.fen(), 2, { game, ignoreTime: true, rng: () => 0.9 });
    expect(reply).not.toBeNull();
    expect(game.legalUci()).toContain(reply!.uci);
  });

  it('finds a complete Lion turn that captures the opposing King and Prince', () => {
    const position = parseFen(START_FEN);
    position.board.fill(null);
    position.board[squareAt(0, 1)] = makePiece('w', 'king');
    position.board[squareAt(5, 6)] = makePiece('w', 'lion');
    position.board[squareAt(6, 6)] = makePiece('b', 'king');
    position.board[squareAt(6, 7)] = makePiece('b', 'drunk-elephant', true);
    const game = new Game(fenOf(position));
    const move = chooseMove(game.fen(), 6, { game, ignoreTime: true, rng: () => 0.9 });
    expect(move?.uci).toBe('f6g6g7');
    expect(game.status().kind).toBe('ongoing');
    game.move(move!.uci);
    expect(game.status()).toEqual({ kind: 'checkmate', winner: 'w' });
  });

  it('uses one integer for a legal engine move and restores the root after search', () => {
    const game = new Game();
    const adapter = new ChuSearch(searchPosition(parseFen(game.fen())), game);
    const before = adapter.key();
    const code = adapter.legalMoves()[0]!;
    adapter.make(code);
    expect(adapter.key()).not.toBe(before);
    adapter.unmake();
    expect(adapter.key()).toBe(before);
    expect(adapter.moveUci(code)).toBe(game.legalUci()[0]);
    expect(encodeMove).toBeTypeOf('function');
  });

  it('provides a bounded legal choice for every level as White and Black', () => {
    const white = new Game();
    const black = new Game();
    black.move(black.legalUci()[0]!);
    for (const gameState of [white, black]) {
      for (const persona of BOTS) {
        const game = new Game(gameState.fen());
        const bounded = { ...persona, maxDepth: 1, maxNodes: 512, timeMs: 25, noise: 0, blunderRate: 0 };
        const result = chooseMove(game.fen(), bounded, { game, ignoreTime: true, rng: () => 0.9 });
        expect(result).not.toBeNull();
        expect(game.legalUci()).toContain(result!.uci);
        expect(game.fen()).toBe(gameState.fen());
      }
    }
  });
});
