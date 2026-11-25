// @vitest-environment happy-dom
import { makruk } from '@chaturanga/makruk';
import { timesAt } from '@chaturanga/rules-core';
import { sittuyin } from '@chaturanga/sittuyin';
import { beforeEach, describe, expect, it } from 'vitest';
import { capturedBy, isUndoableResult, materialBalance, resultFromStatus } from './result';
import { createGameSession, inSetupPhase } from './session';

beforeEach(() => localStorage.clear());

describe('game session on a Variant (plat-005b)', () => {
  it('starts in setup and plays with a clock that presses with increment and flags', () => {
    const store = createGameSession(makruk);
    expect(store.getState().phase).toBe('setup');
    store.getState().start({ initialMs: 60_000, incrementMs: 2_000 }, undefined, 0);
    expect(store.getState().clock?.running).toBe('w');
    expect(store.getState().move('e3e4', 5_000)).not.toBeNull();
    expect(timesAt(store.getState().clock!, 5_000)).toEqual({ w: 57_000, b: 60_000 });
    store.getState().tick(200_000);
    expect(store.getState().result).toEqual({ winner: 'w', reason: 'timeout' });
    expect(store.getState().move('d6d5', 200_100)).toBeNull();
  });

  it('records checkmate; undo clears it but never a resignation', () => {
    const store = createGameSession(makruk);
    store.getState().start(null, 'k7/2R5/8/8/8/8/8/4K2R w - - 0 1');
    store.getState().move('h1h8');
    expect(store.getState().result).toEqual({ winner: 'w', reason: 'checkmate' });
    store.getState().undo();
    expect(store.getState().result).toBeNull();
    store.getState().resign('w');
    store.getState().undo();
    expect(store.getState().result).toEqual({ winner: 'b', reason: 'resign' });
  });

  it('ends a live game as an agreed draw and does not replace an existing result', () => {
    const store = createGameSession(makruk);
    store.getState().start(null);
    store.getState().agreeDraw();
    expect(store.getState().result).toEqual({ winner: null, reason: 'agreement' });
    store.getState().resign('w');
    expect(store.getState().result).toEqual({ winner: null, reason: 'agreement' });
  });

  it('restores a saved game after a reload and starts fresh from unreadable state', () => {
    const first = createGameSession(sittuyin, 'test.sittuyin');
    first.getState().start(null);
    first.getState().move('K@e2');
    first.getState().move('R@a8');
    first.getState().flip();
    const reloaded = createGameSession(sittuyin, 'test.sittuyin').getState();
    expect(reloaded.game.moves().map((r) => r.uci)).toEqual(['K@e2', 'R@a8']);
    expect(reloaded.game.fen()).toBe(first.getState().game.fen());
    expect(reloaded.flipped).toBe(true);

    localStorage.setItem('test.bad', JSON.stringify({ state: { phase: 'playing', startFen: sittuyin.startFen, moves: ['e3e4'] }, version: 1 }));
    expect(createGameSession(sittuyin, 'test.bad').getState().phase).toBe('setup');
    createGameSession(makruk).getState().start(null);
    expect(localStorage.getItem('test.bad')).not.toBeNull();
    expect(localStorage.length).toBe(2);
  });
});

describe('setup phase and clocks (plat-005b)', () => {
  it('keeps the clock stopped during setup and starts it for White after the last placement', () => {
    const store = createGameSession(sittuyin);
    store.getState().start({ initialMs: 60_000, incrementMs: 2_000 }, undefined, 0);
    expect(inSetupPhase(store.getState().game)).toBe(true);
    expect(store.getState().clock?.running).toBeNull();

    for (let ply = 1; ply <= 16; ply++) {
      expect(store.getState().move(store.getState().game.legalUci()[0]!, ply * 10_000)).not.toBeNull();
      if (ply < 16) expect(store.getState().clock?.running).toBeNull();
      // Nobody can lose on time while placing, however long it takes.
      if (ply === 15) {
        store.getState().tick(10_000_000);
        expect(store.getState().result).toBeNull();
      }
    }
    // Placing cost nobody any time, and no increment was added.
    const { clock, game } = store.getState();
    expect(inSetupPhase(game)).toBe(false);
    expect(clock).toEqual({ remaining: { w: 60_000, b: 60_000 }, running: 'w', since: 160_000 });

    store.getState().move(game.legalUci()[0]!, 165_000);
    expect(timesAt(store.getState().clock!, 165_000)).toEqual({ w: 57_000, b: 60_000 });
  });

  it('taking back the last placement stops the clock again', () => {
    const store = createGameSession(sittuyin);
    store.getState().start({ initialMs: 60_000, incrementMs: 0 }, undefined, 0);
    for (let ply = 1; ply <= 16; ply++) store.getState().move(store.getState().game.legalUci()[0]!, ply * 1_000);
    expect(store.getState().clock?.running).toBe('w');
    store.getState().undo(20_000);
    expect(store.getState().clock?.running).toBeNull();
    expect(store.getState().clock?.remaining).toEqual({ w: 56_000, b: 60_000 });
  });

  it('games without a setup phase are never in setup', () => {
    expect(inSetupPhase(makruk.createGame())).toBe(false);
    expect(inSetupPhase(sittuyin.createGame('4k3/8/8/8/8/8/8/R6K[] w - - 0 1'))).toBe(false);
  });
});

describe('results (plat-005b)', () => {
  it('maps every end of game, including the 50-move rule, and knows which results a takeback may undo', () => {
    expect(resultFromStatus({ kind: 'ongoing' })).toBeNull();
    expect(resultFromStatus({ kind: 'checkmate', winner: 'b' })).toEqual({ winner: 'b', reason: 'checkmate' });
    expect(resultFromStatus({ kind: 'fifty-move' })).toEqual({ winner: null, reason: 'fifty-move' });
    expect(isUndoableResult(null)).toBe(true);
    expect(isUndoableResult({ winner: null, reason: 'fifty-move' })).toBe(true);
    expect(isUndoableResult({ winner: 'w', reason: 'timeout' })).toBe(false);
  });

  it('counts captures and material with the game’s own piece values', () => {
    const game = sittuyin.createGame('4k3/8/8/3r4/8/2N5/8/4K3[] w - - 0 1');
    game.move('c3d5');
    expect(capturedBy(game.moves(), 'w')).toEqual([{ color: 'b', type: 'r', promoted: false }]);
    expect(capturedBy(game.moves(), 'b')).toEqual([]);
    expect(materialBalance(game, { k: 0, r: 5, n: 3 })).toBe(3);
  });
});
