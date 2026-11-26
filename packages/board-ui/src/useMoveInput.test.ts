// @vitest-environment happy-dom
import { Game as JanggiGame } from '@chaturanga/janggi';
import { Game as MakrukGame, parseSquare as sq } from '@chaturanga/makruk';
import { Game as ShogiGame } from '@chaturanga/shogi';
import { Game as SittuyinGame } from '@chaturanga/sittuyin';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { type MoveSource, useMoveInput } from './useMoveInput';

function setup<G extends MoveSource & { move(uci: string): unknown }>(game: G, canMove = true) {
  let version = 0;
  const onMove = vi.fn((uci: string) => {
    game.move(uci);
    version++;
  });
  const hook = renderHook(() => useMoveInput({ game, version, canMove, onMove }));
  return { game, onMove, hook };
}

describe('useMoveInput with Makruk (plat-005a)', () => {
  it('selecting a movable piece shows its legal targets', () => {
    const { hook } = setup(new MakrukGame());
    act(() => hook.result.current.onSquareClick(sq('e3')));
    expect(hook.result.current.selected).toBe(sq('e3'));
    expect(hook.result.current.targets).toEqual([sq('e4')]);
    expect(hook.result.current.promotionTargets).toEqual([]);
  });

  it('tapping a legal target plays the move', () => {
    const { hook, onMove } = setup(new MakrukGame());
    act(() => hook.result.current.onSquareClick(sq('b1')));
    act(() => hook.result.current.onSquareClick(sq('d2')));
    expect(onMove).toHaveBeenCalledWith('b1d2');
  });

  it('tapping an illegal square keeps the move unplayed and clears or switches selection', () => {
    const { hook, onMove } = setup(new MakrukGame());
    act(() => hook.result.current.onSquareClick(sq('e3')));
    act(() => hook.result.current.onSquareClick(sq('e5')));
    expect(onMove).not.toHaveBeenCalled();
    expect(hook.result.current.selected).toBeNull();
    act(() => hook.result.current.onSquareClick(sq('e3')));
    act(() => hook.result.current.onSquareClick(sq('d3')));
    expect(hook.result.current.selected).toBe(sq('d3'));
  });

  it('opponent pieces and empty squares cannot be selected', () => {
    const { hook } = setup(new MakrukGame());
    act(() => hook.result.current.onSquareClick(sq('e6')));
    expect(hook.result.current.selected).toBeNull();
    act(() => hook.result.current.onSquareClick(sq('e4')));
    expect(hook.result.current.selected).toBeNull();
  });

  it('drag only accepts legal moves', () => {
    const { hook, onMove } = setup(new MakrukGame());
    let ok = false;
    act(() => {
      ok = hook.result.current.onDrop(sq('g1'), sq('g3'));
    });
    expect(ok).toBe(false);
    act(() => {
      ok = hook.result.current.onDrop(sq('g1'), sq('e2'));
    });
    expect(ok).toBe(true);
    expect(onMove).toHaveBeenCalledTimes(1);
  });

  it("plays Makruk's forced promotion from a plain tap", () => {
    const { hook, onMove } = setup(new MakrukGame('4k3/8/8/P7/8/8/8/4K3 w - - 0 1'));
    act(() => hook.result.current.onSquareClick(sq('a5')));
    expect(hook.result.current.promotionTargets).toEqual([sq('a6')]);
    act(() => hook.result.current.onSquareClick(sq('a6')));
    expect(onMove).toHaveBeenCalledWith('a5a6m');
  });

  it('does nothing when input is disabled', () => {
    const { hook } = setup(new MakrukGame(), false);
    act(() => hook.result.current.onSquareClick(sq('e3')));
    expect(hook.result.current.selected).toBeNull();
    expect(hook.result.current.canDrag(sq('e3'))).toBe(false);
  });
});

describe('useMoveInput with concurrent seats (plat-023)', () => {
  it('keeps the actor attached to each seat’s legal board move', () => {
    const game: MoveSource = {
      turn: 'w',
      activePlayers: () => ['w', 'b'],
      legalUci: () => ['a1a2'],
      legalUciFor: (color) => color === 'w' ? ['a1a2'] : color === 'b' ? ['b1b2'] : [],
      pieceAt: (square) => square === 0 ? { color: 'w' } : square === 1 ? { color: 'b' } : null,
    };
    const onMove = vi.fn();
    const hook = renderHook(() => useMoveInput({ game, version: 0, canMove: true, onMove }));

    act(() => hook.result.current.onSquareClick(1));
    expect(hook.result.current.targets).toEqual([9]);
    act(() => hook.result.current.onSquareClick(9));
    expect(onMove).toHaveBeenCalledWith('b1b2', 'b');
  });

  it('limits concurrent legal actions to the permitted online seat', () => {
    const game: MoveSource = {
      turn: 'w',
      activePlayers: () => ['w', 'b'],
      legalUci: () => ['a1a2'],
      legalUciFor: (color) => color === 'w' ? ['a1a2'] : color === 'b' ? ['b1b2'] : [],
      pieceAt: (square) => square === 0 ? { color: 'w' } : square === 1 ? { color: 'b' } : null,
    };
    const onMove = vi.fn();
    const hook = renderHook(() => useMoveInput({ game, version: 0, canMove: true, players: ['w'], onMove }));
    act(() => hook.result.current.onSquareClick(1));
    expect(hook.result.current.selected).toBeNull();
    act(() => hook.result.current.onSquareClick(0));
    expect(hook.result.current.targets).toEqual([8]);
  });
});

describe('useMoveInput with Sittuyin: hands and promotion (plat-005a)', () => {
  it('during setup only hand pieces can be selected, and they show their placement squares', () => {
    const { hook } = setup(new SittuyinGame());
    expect(hook.result.current.canDrag(sq('e4'))).toBe(false);
    expect(hook.result.current.canSelectHand('r')).toBe(true);
    expect(hook.result.current.canSelectHand('p')).toBe(false);
    act(() => hook.result.current.onHandSelect('r'));
    expect(hook.result.current.selectedHand).toBe('r');
    expect([...hook.result.current.targets].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    act(() => hook.result.current.onHandSelect('r'));
    expect(hook.result.current.selectedHand).toBeNull();
  });

  it('places a selected hand piece by tapping a square, and refuses illegal squares', () => {
    const { hook, onMove } = setup(new SittuyinGame());
    act(() => hook.result.current.onHandSelect('r'));
    act(() => hook.result.current.onSquareClick(sq('a2')));
    expect(onMove).not.toHaveBeenCalled();
    expect(hook.result.current.selectedHand).toBeNull();
    act(() => hook.result.current.onHandSelect('r'));
    act(() => hook.result.current.onSquareClick(sq('a1')));
    expect(onMove).toHaveBeenCalledWith('R@a1');
  });

  it('places a piece dragged from hand onto a legal square only', () => {
    const { hook, onMove } = setup(new SittuyinGame());
    let ok = true;
    act(() => {
      ok = hook.result.current.onDropFromHand('r', sq('e2'));
    });
    expect(ok).toBe(false);
    act(() => {
      ok = hook.result.current.onDropFromHand('k', sq('e2'));
    });
    expect(ok).toBe(true);
    expect(onMove).toHaveBeenCalledWith('K@e2');
  });

  it('marks diagonal promotion squares and plays a promotion by tapping one', () => {
    const { hook, onMove } = setup(new SittuyinGame('4k3/8/8/3P4/8/8/P7/4K3[] w - - 0 1'));
    act(() => hook.result.current.onSquareClick(sq('d5')));
    expect([...hook.result.current.targets].sort()).toEqual([sq('c4'), sq('c6'), sq('d6'), sq('e4'), sq('e6')].sort());
    expect([...hook.result.current.promotionTargets].sort()).toEqual([sq('c4'), sq('c6'), sq('d5'), sq('e4'), sq('e6')].sort());
    expect(hook.result.current.canPromoteInPlace).toBe(true);
    act(() => hook.result.current.onSquareClick(sq('c4')));
    expect(onMove).toHaveBeenCalledWith('d5c4f');
  });

  it('promotes in place on request, and a plain push is still a plain move', () => {
    const inPlace = setup(new SittuyinGame('4k3/8/8/3P4/8/8/P7/4K3[] w - - 0 1'));
    expect(inPlace.hook.result.current.promoteInPlace()).toBe(false);
    act(() => inPlace.hook.result.current.onSquareClick(sq('d5')));
    act(() => {
      inPlace.hook.result.current.promoteInPlace();
    });
    expect(inPlace.onMove).toHaveBeenCalledWith('d5d5f');

    const push = setup(new SittuyinGame('4k3/8/8/3P4/8/8/P7/4K3[] w - - 0 1'));
    act(() => push.hook.result.current.onSquareClick(sq('d5')));
    act(() => push.hook.result.current.onSquareClick(sq('d6')));
    expect(push.onMove).toHaveBeenCalledWith('d5d6');
  });

  it('a blocked Ne that can only promote in place can still be selected', () => {
    const { hook } = setup(new SittuyinGame('4k3/8/3p4/3P4/8/8/8/4K3[] w - - 0 1'));
    act(() => hook.result.current.onSquareClick(sq('d5')));
    expect(hook.result.current.selected).toBe(sq('d5'));
    expect(hook.result.current.canPromoteInPlace).toBe(true);
  });
});

/** Square index on the 9x9 Shogi board, which the hook is told about through `files`. */
const shogiSquare = (name: string): number => (Number(name[1]) - 1) * 9 + (name.charCodeAt(0) - 97);

const SILVER_OUTSIDE_ZONE = '2k6/9/9/4S4/9/9/9/9/2K6[] w - - 0 1';

function setupShogi(fen: string) {
  const game = new ShogiGame(fen);
  let version = 0;
  const onMove = vi.fn((uci: string) => {
    game.move(uci);
    version++;
  });
  const hook = renderHook(() => useMoveInput({ game, version, canMove: true, onMove, files: 9 }));
  return { game, onMove, hook };
}

describe('useMoveInput with Shogi, where a move may promote or not (plat-011)', () => {
  it('asks which one the player wants instead of choosing for them', () => {
    const { hook, onMove } = setupShogi(SILVER_OUTSIDE_ZONE);
    act(() => hook.result.current.onSquareClick(shogiSquare('e6')));
    act(() => hook.result.current.onSquareClick(shogiSquare('e7')));
    expect(onMove).not.toHaveBeenCalled();
    expect(hook.result.current.pendingPromotion).toEqual({
      from: shogiSquare('e6'),
      to: shogiSquare('e7'),
      choices: [
        { uci: 'e6e7', promotion: null },
        { uci: 'e6e7+', promotion: '+' },
      ],
    });
  });

  it('plays the promoting move when the player says yes', () => {
    const { hook, onMove } = setupShogi(SILVER_OUTSIDE_ZONE);
    act(() => hook.result.current.onSquareClick(shogiSquare('e6')));
    act(() => hook.result.current.onSquareClick(shogiSquare('e7')));
    act(() => hook.result.current.choosePromotion('e6e7+'));
    expect(onMove).toHaveBeenCalledWith('e6e7+');
    expect(hook.result.current.pendingPromotion).toBeNull();
  });

  it('plays the plain move when the player says no', () => {
    const { hook, onMove } = setupShogi(SILVER_OUTSIDE_ZONE);
    act(() => hook.result.current.onSquareClick(shogiSquare('e6')));
    act(() => hook.result.current.onSquareClick(shogiSquare('e7')));
    act(() => hook.result.current.choosePromotion('e6e7'));
    expect(onMove).toHaveBeenCalledWith('e6e7');
  });

  it('cancelling leaves the position alone', () => {
    const { hook, onMove } = setupShogi(SILVER_OUTSIDE_ZONE);
    act(() => hook.result.current.onSquareClick(shogiSquare('e6')));
    act(() => hook.result.current.onSquareClick(shogiSquare('e7')));
    act(() => hook.result.current.cancelPromotion());
    expect(onMove).not.toHaveBeenCalled();
    expect(hook.result.current.pendingPromotion).toBeNull();
  });

  it('a forced promotion is played straight through, with no question', () => {
    const { hook, onMove } = setupShogi('2k6/4P4/9/9/9/9/9/9/2K6[] w - - 0 1');
    act(() => hook.result.current.onSquareClick(shogiSquare('e8')));
    act(() => hook.result.current.onSquareClick(shogiSquare('e9')));
    expect(onMove).toHaveBeenCalledWith('e8e9+');
    expect(hook.result.current.pendingPromotion).toBeNull();
  });

  it('a move that cannot promote never asks', () => {
    const { hook, onMove } = setupShogi('2k6/9/9/9/4S4/9/9/9/2K6[] w - - 0 1');
    act(() => hook.result.current.onSquareClick(shogiSquare('e5')));
    act(() => hook.result.current.onSquareClick(shogiSquare('e6')));
    expect(onMove).toHaveBeenCalledWith('e5e6');
    expect(hook.result.current.pendingPromotion).toBeNull();
  });

  it('a drag onto a square with both moves asks as well', () => {
    const { hook, onMove } = setupShogi(SILVER_OUTSIDE_ZONE);
    act(() => {
      hook.result.current.onDrop(shogiSquare('e6'), shogiSquare('e7'));
    });
    expect(onMove).not.toHaveBeenCalled();
    expect(hook.result.current.pendingPromotion).not.toBeNull();
  });

  it('a piece can be dropped from hand while the game is in play', () => {
    const { hook, onMove } = setupShogi('2k6/9/9/9/9/9/9/9/2K6[S] w - - 0 1');
    act(() => hook.result.current.onHandSelect('s'));
    expect(hook.result.current.selectedHand).toBe('s');
    act(() => hook.result.current.onSquareClick(shogiSquare('e5')));
    expect(onMove).toHaveBeenCalledWith('S@e5');
  });
});

describe('useMoveInput with multi-capture routes', () => {
  it('asks which path to take when legal moves share their origin and destination', () => {
    const routes = ['d5c6c7d8', 'd5e6e7d8'];
    const game = { legalUci: () => routes };
    const onMove = vi.fn();
    const hook = renderHook(() => useMoveInput({ game, version: 0, canMove: true, onMove, files: 7 }));
    const from = 4 * 7 + 3;
    const to = 7 * 7 + 3;
    act(() => hook.result.current.onSquareClick(from));
    expect(hook.result.current.targets).toContain(to);
    act(() => hook.result.current.onSquareClick(to));
    expect(onMove).not.toHaveBeenCalled();
    expect(hook.result.current.pendingRoute?.choices.map((choice) => choice.uci)).toEqual(routes);
    act(() => hook.result.current.chooseRoute(routes[1]!));
    expect(onMove).toHaveBeenCalledWith(routes[1]);
    expect(hook.result.current.pendingRoute).toBeNull();
  });

  it('chooses the complete route before a route-specific promotion', () => {
    const routes = ['d5c6d8+', 'd5e6d8'];
    const game = { legalUci: () => routes };
    const onMove = vi.fn();
    const hook = renderHook(() => useMoveInput({ game, version: 0, canMove: true, onMove, files: 7 }));
    const from = 4 * 7 + 3;
    const to = 7 * 7 + 3;
    act(() => hook.result.current.onSquareClick(from));
    act(() => hook.result.current.onSquareClick(to));
    expect(hook.result.current.pendingPromotion).toBeNull();
    expect(hook.result.current.pendingRoute?.choices.map((choice) => choice.uci)).toEqual(routes);
    act(() => hook.result.current.chooseRoute(routes[0]!));
    expect(onMove).toHaveBeenCalledWith(routes[0]);
  });
});

/**
 * A promotion that offers a choice of pieces (plat-014). Chess has four promotions on the same from-to pair
 * and no plain move among them, so this uses a stub legal-move source rather than an engine: packages/chess
 * lands in ch-001.
 */
describe('useMoveInput with a promotion that offers a choice of pieces (plat-014)', () => {
  const FOUR_PROMOTIONS = ['e7e8q', 'e7e8r', 'e7e8b', 'e7e8n', 'a1a2'];

  function setupChoice(legal: string[]) {
    const onMove = vi.fn();
    const game: MoveSource = { legalUci: () => legal };
    const hook = renderHook(() => useMoveInput({ game, version: 0, canMove: true, onMove }));
    return { hook, onMove };
  }

  it('asks which piece instead of quietly queening', () => {
    const { hook, onMove } = setupChoice(FOUR_PROMOTIONS);
    act(() => hook.result.current.onSquareClick(sq('e7')));
    act(() => hook.result.current.onSquareClick(sq('e8')));
    expect(onMove).not.toHaveBeenCalled();
    expect(hook.result.current.pendingPromotion).toEqual({
      from: sq('e7'),
      to: sq('e8'),
      choices: [
        { uci: 'e7e8q', promotion: 'q' },
        { uci: 'e7e8r', promotion: 'r' },
        { uci: 'e7e8b', promotion: 'b' },
        { uci: 'e7e8n', promotion: 'n' },
      ],
    });
  });

  it('plays exactly the choice the player picks, including an under-promotion', () => {
    for (const uci of ['e7e8q', 'e7e8r', 'e7e8b', 'e7e8n']) {
      const { hook, onMove } = setupChoice(FOUR_PROMOTIONS);
      act(() => hook.result.current.onSquareClick(sq('e7')));
      act(() => hook.result.current.onSquareClick(sq('e8')));
      act(() => hook.result.current.choosePromotion(uci));
      expect(onMove).toHaveBeenCalledWith(uci);
      expect(hook.result.current.pendingPromotion).toBeNull();
    }
  });

  it('a move string that is not one of the choices plays nothing', () => {
    const { hook, onMove } = setupChoice(FOUR_PROMOTIONS);
    act(() => hook.result.current.onSquareClick(sq('e7')));
    act(() => hook.result.current.onSquareClick(sq('e8')));
    act(() => hook.result.current.choosePromotion('e7e8k'));
    expect(onMove).not.toHaveBeenCalled();
    expect(hook.result.current.pendingPromotion).toBeNull();
  });

  it('a dragged promotion asks as well, and cancelling plays nothing', () => {
    const { hook, onMove } = setupChoice(FOUR_PROMOTIONS);
    act(() => {
      hook.result.current.onDrop(sq('e7'), sq('e8'));
    });
    expect(hook.result.current.pendingPromotion?.choices).toHaveLength(4);
    act(() => hook.result.current.cancelPromotion());
    expect(onMove).not.toHaveBeenCalled();
    expect(hook.result.current.pendingPromotion).toBeNull();
  });

  it('a single promotion plays straight through, and an ordinary move never asks', () => {
    const one = setupChoice(['e7e8q', 'a1a2']);
    act(() => one.hook.result.current.onSquareClick(sq('e7')));
    act(() => one.hook.result.current.onSquareClick(sq('e8')));
    expect(one.onMove).toHaveBeenCalledWith('e7e8q');

    const plain = setupChoice(FOUR_PROMOTIONS);
    act(() => plain.hook.result.current.onSquareClick(sq('a1')));
    act(() => plain.hook.result.current.onSquareClick(sq('a2')));
    expect(plain.onMove).toHaveBeenCalledWith('a1a2');
    expect(plain.hook.result.current.pendingPromotion).toBeNull();
  });

  it('marks the promotion targets so the board can show them', () => {
    const { hook } = setupChoice(FOUR_PROMOTIONS);
    act(() => hook.result.current.onSquareClick(sq('e7')));
    expect(hook.result.current.targets).toEqual([sq('e8')]);
    expect(hook.result.current.promotionTargets).toEqual([sq('e8')]);
  });
});

describe('useMoveInput with Janggi, whose pass is a move onto the same point', () => {
  it('never passes by tapping or by dropping the general back on its point', () => {
    const game = new JanggiGame();
    expect(game.legalUci()).toContain('e2e2');
    const onMove = vi.fn();
    const { result } = renderHook(() => useMoveInput({ game, version: 0, canMove: true, onMove, files: 9 }));
    const e2 = 9 + 4;
    act(() => result.current.onSquareClick(e2));
    expect(result.current.targets).not.toContain(e2);
    act(() => result.current.onSquareClick(e2));
    act(() => void expect(result.current.onDrop(e2, e2)).toBe(false));
    expect(onMove).not.toHaveBeenCalled();
  });
});
