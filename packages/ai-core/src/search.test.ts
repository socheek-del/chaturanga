import { describe, expect, it } from 'vitest';
import { pickRootMove } from './persona';
import { mulberry32 } from './random';
import { MATE, search, type SearchAdapter } from './search';

/**
 * Nim as a SearchAdapter: take 1–3 stones; a player with no stones left to take has lost (modelled as
 * "in check with no moves", i.e. mated). Positions with a multiple of 4 stones are lost for the side to move.
 * Moves are encoded as the number of stones taken.
 */
class Nim implements SearchAdapter {
  private readonly stack: number[] = [];
  private side: 0 | 1 = 0;
  constructor(private stones: number) {}
  turn() {
    return this.side;
  }
  legalMoves() {
    return [1, 2, 3].filter((n) => n <= this.stones);
  }
  make(move: number) {
    this.stack.push(move);
    this.stones -= move;
    this.side = this.side === 0 ? 1 : 0;
  }
  unmake() {
    this.stones += this.stack.pop()!;
    this.side = this.side === 0 ? 1 : 0;
  }
  inCheck() {
    return this.stones === 0;
  }
  evaluate() {
    return 0;
  }
  isTactical() {
    return false;
  }
  orderKey(move: number) {
    return move;
  }
  key() {
    return `${this.stones} ${this.side}`;
  }
}

describe('search on a SearchAdapter (sit-004)', () => {
  it('finds the forced win and scores it as mate', () => {
    const result = search(new Nim(5), { maxDepth: 6 });
    expect(result.move).toBe(1); // leave 4
    expect(result.score).toBeGreaterThan(MATE - 10);
    expect(new Nim(5).legalMoves()).toHaveLength(3);
  });

  it('scores a lost position as being mated', () => {
    const result = search(new Nim(4), { maxDepth: 6 });
    expect(result.score).toBeLessThan(-MATE + 10);
    expect(result.rootMoves.every((r) => r.score < 0)).toBe(true);
  });

  it('restores the position after searching (make/unmake balanced)', () => {
    const nim = new Nim(9);
    search(nim, { maxDepth: 5 });
    expect(nim.key()).toBe('9 0');
  });

  it('returns no move when there is none', () => {
    const result = search(new Nim(0), { maxDepth: 3 });
    expect(result).toMatchObject({ move: -1, score: -MATE, rootMoves: [] });
  });

  it('keeps the last completed depth when the node budget runs out', () => {
    const full = search(new Nim(21), { maxDepth: 30 });
    const budget = search(new Nim(21), { maxDepth: 30, maxNodes: 600 });
    expect(budget.nodes).toBeLessThan(full.nodes);
    expect(budget.depth).toBeLessThan(full.depth);
    expect(budget.depth).toBeGreaterThan(0);
    expect([1, 2, 3]).toContain(budget.move);
  });

  it('without exact root scores finds the same best move with no more nodes', () => {
    const exact = search(new Nim(13), { maxDepth: 8 });
    const narrow = search(new Nim(13), { maxDepth: 8, exactRootScores: false });
    expect(narrow.move).toBe(exact.move);
    expect(narrow.score).toBe(exact.score);
    expect(narrow.nodes).toBeLessThanOrEqual(exact.nodes);
  });

  it('scores a root move that repeats an earlier position as a contempt draw', () => {
    // From 6 stones the winning move takes 2 (leaving 4); pretend that position was seen before.
    const result = search(new Nim(6), { maxDepth: 6, history: ['4 1'], contempt: 50 });
    expect(result.rootMoves.find((r) => r.move === 2)!.score).toBe(-50);
    // The other moves lose by force, so the repetition draw is still the best choice.
    expect(result.move).toBe(2);
    expect(result.rootMoves.slice(1).every((r) => r.score < -MATE + 10)).toBe(true);
  });

  it("scores the opponent's reply recreating an earlier position as a draw", () => {
    // 7 stones: taking 3 leaves 4 (winning), but every reply from 4 recreates a known position.
    const result = search(new Nim(7), { maxDepth: 4, history: ['3 0', '2 0', '1 0'], contempt: 40 });
    expect(result.rootMoves.find((r) => r.move === 3)!.score).toBe(-40);
  });
});

describe('decisive repetitions (xq-003)', () => {
  /** Nim whose repetitions are decisive: a repeated position loses for the side that just moved into it. */
  class StrictNim extends Nim {
    repetitionScore() {
      return MATE - 1;
    }
  }

  it('uses the adapter score for a root move that repeats a position', () => {
    // From 6 stones taking 2 leaves 4 (the forced win), but that position was seen: now it loses.
    const result = search(new StrictNim(6), { maxDepth: 6, history: ['4 1'], contempt: 50 });
    expect(result.rootMoves.find((r) => r.move === 2)!.score).toBe(-(MATE - 1));
  });

  it("uses the adapter score for the opponent's reply recreating a position", () => {
    // Taking 3 from 7 leaves 4; every reply recreates a known position, which now loses for the replier.
    const result = search(new StrictNim(7), { maxDepth: 4, history: ['3 0', '2 0', '1 0'], contempt: 40 });
    expect(result.rootMoves.find((r) => r.move === 3)!.score).toBe(MATE - 1);
  });

  it('still searches an undecided root repetition, so a losing reply shows through', () => {
    // Taking 2 from 6 repeats '4 1' (undecided); every reply repeats again and loses for the root side.
    class LateNim extends Nim {
      repetitionScore() {
        return this.key() === '4 1' ? undefined : -(MATE - 1);
      }
    }
    const history = ['4 1', '3 0', '2 0', '1 0'];
    const result = search(new LateNim(6), { maxDepth: 6, history, contempt: 50 });
    expect(result.rootMoves.find((r) => r.move === 2)!.score).toBe(-(MATE - 1));
  });

  it('falls back to the contempt draw when the adapter returns undefined', () => {
    class DrawNim extends Nim {
      repetitionScore() {
        return undefined;
      }
    }
    const result = search(new DrawNim(6), { maxDepth: 6, history: ['4 1'], contempt: 50 });
    expect(result.rootMoves.find((r) => r.move === 2)!.score).toBe(-50);
  });
});

describe('pickRootMove (sit-004)', () => {
  const result = {
    move: 1,
    score: 30,
    depth: 3,
    nodes: 100,
    rootMoves: [
      { move: 1, score: 30 },
      { move: 2, score: 25 },
      { move: 3, score: -400 },
    ],
  };

  it('plays the best move without noise', () => {
    expect(pickRootMove(result, 0, () => 0)).toEqual({ move: 1, score: 30 });
  });

  it('lets noise choose among close moves, reproducibly by seed, never a far worse one', () => {
    const picks = new Set<number>();
    for (let seed = 1; seed <= 40; seed++) picks.add(pickRootMove(result, 60, mulberry32(seed)).move);
    expect(picks).toEqual(new Set([1, 2]));
    expect(pickRootMove(result, 60, mulberry32(7))).toEqual(pickRootMove(result, 60, mulberry32(7)));
  });

  it('always plays a found mate', () => {
    const mating = { ...result, rootMoves: [{ move: 3, score: MATE - 3 }, { move: 1, score: 0 }] };
    expect(pickRootMove(mating, 10_000, () => 1).move).toBe(3);
  });
});
