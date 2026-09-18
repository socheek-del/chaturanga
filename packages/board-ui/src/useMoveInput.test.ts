// @vitest-environment happy-dom
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
    expect(hook.result.current.pendingPromotion).toEqual({ from: shogiSquare('e6'), to: shogiSquare('e7') });
  });

  it('plays the promoting move when the player says yes', () => {
    const { hook, onMove } = setupShogi(SILVER_OUTSIDE_ZONE);
    act(() => hook.result.current.onSquareClick(shogiSquare('e6')));
    act(() => hook.result.current.onSquareClick(shogiSquare('e7')));
    act(() => hook.result.current.choosePromotion(true));
    expect(onMove).toHaveBeenCalledWith('e6e7+');
    expect(hook.result.current.pendingPromotion).toBeNull();
  });

  it('plays the plain move when the player says no', () => {
    const { hook, onMove } = setupShogi(SILVER_OUTSIDE_ZONE);
    act(() => hook.result.current.onSquareClick(shogiSquare('e6')));
    act(() => hook.result.current.onSquareClick(shogiSquare('e7')));
    act(() => hook.result.current.choosePromotion(false));
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
