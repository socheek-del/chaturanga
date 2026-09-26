import { chess, START_FEN } from '@chaturanga/chess';
import { describe, expect, it } from 'vitest';
import { exchangeGain, gameAccuracy, hangingBefore, type Label, moveAccuracy, reviewGame, sacrificeValue, sanOf, terminalEval, winPercent } from './analysis';
import type { PositionEval } from './engine';
import { type BookData, OpeningBook } from './openings';
import raw from './openings/book.json';
import type { Score } from './uci';

const book = new OpeningBook(raw as unknown as BookData);

/** Centipawns (White's side) for a win percentage: the inverse of the Lichess curve. */
const cpFor = (win: number): number => Math.round(-Math.log(2 / ((win - 50) / 50 + 1) - 1) / 0.00368208);

const ev = (score: Score, pv: string[] = [], second?: { score: Score; pv: string[] }): PositionEval => ({
  fen: '',
  depth: 14,
  lines: second ? [{ score, pv }, second] : [{ score, pv }],
});

/** Labels of a one-move game from `fen`: White's move `uci`, with the engine's view before and after. */
function labelOf(fen: string, uci: string, before: PositionEval, after: PositionEval): Label {
  return reviewGame({ startFen: fen, moves: [uci], evals: [before, after], book: null }).moves[0]!.label;
}

const OPEN = 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3';

describe('win percentage and accuracy (ch-015)', () => {
  it('follows the Lichess curve and reads a mate as decided', () => {
    expect(winPercent({ cp: 0 })).toBe(50);
    expect(winPercent({ cp: 100 })).toBeCloseTo(59.1, 1);
    expect(winPercent({ cp: -100 })).toBeCloseTo(40.9, 1);
    expect(winPercent({ cp: 5000 })).toBe(winPercent({ cp: 1000 }));
    expect(winPercent({ mate: 3 })).toBe(100);
    expect(winPercent({ mate: -1 })).toBe(0);
    expect(cpFor(59.1)).toBeGreaterThan(95);
  });

  it('scores a move 100 when nothing is lost, and less the more is lost', () => {
    expect(moveAccuracy(50, 50)).toBe(100);
    expect(moveAccuracy(50, 60)).toBe(100);
    expect(moveAccuracy(50, 45)).toBeCloseTo(79.8, 1);
    expect(moveAccuracy(60, 40)).toBeLessThan(moveAccuracy(60, 50));
    expect(moveAccuracy(100, 0)).toBe(0);
  });

  it('gives a side that never loses ground 100, and weighs a collapse heavily', () => {
    const level = Array.from({ length: 21 }, () => 50);
    const moves = Array.from({ length: 20 }, (_, i) => ({ color: (i % 2 ? 'b' : 'w') as 'w' | 'b', accuracy: 100 }));
    expect(gameAccuracy(level, moves, 'w')).toBe(100);
    const blunder = moves.map((m, i) => (i === 10 ? { ...m, accuracy: 0 } : m));
    expect(gameAccuracy(level, blunder, 'w')!).toBeLessThan(60);
    expect(gameAccuracy(level, blunder, 'b')).toBe(100);
    expect(gameAccuracy([50], [], 'w')).toBeNull();
  });
});

describe('move labels (ch-015)', () => {
  const level = ev({ cp: 0 }, ['f1c4']);

  it('Best for the engine move; Excellent, Good, Inaccuracy, Mistake, Blunder by lost win percentage', () => {
    expect(labelOf(OPEN, 'f1c4', level, ev({ cp: 0 }))).toBe('best');
    const cases: Array<[number, Label]> = [
      [49, 'excellent'],
      [46, 'good'],
      [42, 'inaccuracy'],
      [35, 'mistake'],
      [20, 'blunder'],
    ];
    for (const [win, label] of cases) expect(labelOf(OPEN, 'f1b5', level, ev({ cp: cpFor(win) })), `${win}%`).toBe(label);
  });

  it('judges a Black move from Black’s side', () => {
    const fen = 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3';
    expect(labelOf(fen, 'g8f6', ev({ cp: 0 }, ['f8c5']), ev({ cp: cpFor(80) }))).toBe('blunder');
    expect(labelOf(fen, 'g8f6', ev({ cp: 0 }, ['f8c5']), ev({ cp: cpFor(20) }))).toBe('excellent');
  });

  it('Book while the game stays on a named line from the usual start, then leaves it for good', () => {
    const moves = ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'a2a3', 'g8f6'];
    const evals = Array.from({ length: moves.length + 1 }, () => ev({ cp: 20 }, ['d2d4']));
    const review = reviewGame({ startFen: START_FEN, moves, evals, book });
    expect(review.moves.map((m) => m.label).slice(0, 4)).toEqual(['book', 'book', 'book', 'book']);
    expect(review.moves[4]!.label).not.toBe('book');
    expect(review.moves[5]!.label).not.toBe('book');
    expect(review.opening?.name).toMatch(/Knight/);
  });

  it('a named trap is still judged: a book move that loses a lot is not Book, and the book ends there', () => {
    // 1. f3 e5 2. g4?? Qh4# is itself a named line (Barnes Opening: Fool's Mate).
    const moves = ['f2f3', 'e7e5', 'g2g4', 'd8h4'];
    const evals = [ev({ cp: 30 }, ['e2e4']), ev({ cp: -60 }, ['e7e5']), ev({ cp: -60 }, ['e2e4']), ev({ mate: -1 }, ['d8h4']), ev({ mate: -1 })];
    const review = reviewGame({ startFen: START_FEN, moves, evals, book });
    expect(review.moves.map((m) => m.label)).toEqual(['book', 'book', 'blunder', 'best']);
    expect(review.opening?.name).toMatch(/Barnes Opening/);
  });

  it('Brilliant for a sound piece sacrifice, but not for a quiet best move or an unsound one', () => {
    // The Greek gift: Bxh7+ gives the bishop for a pawn.
    const greek = 'r1bq1rk1/pppn1ppp/4p3/3pP3/1b1P4/2NB1N2/PPP2PPP/R2QK2R w KQ - 0 8';
    expect(labelOf(greek, 'd3h7', ev({ cp: 150 }, ['d3h7']), ev({ cp: 170 }))).toBe('brilliant');
    expect(labelOf(greek, 'e1g1', ev({ cp: 150 }, ['e1g1']), ev({ cp: 150 }))).toBe('best');
    expect(labelOf(greek, 'd3h7', ev({ cp: -150 }, ['d3h7']), ev({ cp: -150 }))).toBe('best');
    // Already completely winning: no Brilliant, unless the sacrifice forces mate.
    expect(labelOf(greek, 'd3h7', ev({ cp: 700 }, ['d3h7']), ev({ cp: 700 }))).toBe('best');
    expect(labelOf(greek, 'd3h7', ev({ cp: 700 }, ['d3h7']), ev({ mate: 4 }))).toBe('brilliant');
  });

  it('no Brilliant for leaving a piece that was already hanging, nor when escaping check', () => {
    // Blackburne Shilling after 5. Nxf7: the knight already attacks queen and rook; 5... Qxg2 wins a pawn, not a sacrifice.
    const fen = 'r1b1kbnr/pppp1Npp/8/6q1/2BnP3/8/PPPP1PPP/RNBQK2R b KQkq - 0 5';
    expect(labelOf(fen, 'g5g2', ev({ cp: -600 }, ['g5g2']), ev({ cp: -600 }))).not.toBe('brilliant');
    // The knight on f7 attacks both the queen on g5 and the rook on h8: the queen is the most at stake.
    expect(hangingBefore(fen, 'b')).toBe(9);
    expect(hangingBefore('4k3/8/8/8/8/8/4r3/4K3 w - - 0 1', 'w')).toBeNull();
  });

  it('Great for the only good move, but not for a recapture or a forced move', () => {
    const only = ev({ cp: 50 }, ['f1c4'], { score: { cp: -300 }, pv: ['f1b5'] });
    expect(labelOf(OPEN, 'f1c4', only, ev({ cp: 50 }))).toBe('great');
    // In a position already decided, the only mating move is just Best.
    const decided = ev({ mate: 2 }, ['f1c4'], { score: { cp: -300 }, pv: ['f1b5'] });
    expect(labelOf(OPEN, 'f1c4', decided, ev({ mate: 2 }))).toBe('best');
    const comfortable = ev({ cp: 50 }, ['f1c4'], { score: { cp: 30 }, pv: ['f1b5'] });
    expect(labelOf(OPEN, 'f1c4', comfortable, ev({ cp: 50 }))).toBe('best');

    // 1. e4 d5 2. exd5 Qxd5: the queen takes back on d5.
    const moves = ['e2e4', 'd7d5', 'e4d5', 'd8d5'];
    const evals = [ev({ cp: 30 }), ev({ cp: 30 }), ev({ cp: 30 }), ev({ cp: 200 }, ['d8d5'], { score: { cp: 500 }, pv: ['g8f6'] }), ev({ cp: 30 })];
    expect(reviewGame({ startFen: START_FEN, moves, evals, book: null }).moves[3]!.label).toBe('best');

    // A king in check with one way out.
    const forced = '7k/8/8/8/8/5q2/r7/7K w - - 0 1';
    expect(chess.createGame(forced).legalUci()).toEqual(['h1g1']);
    expect(labelOf(forced, 'h1g1', ev({ cp: -300 }, ['a2a1']), ev({ cp: -900 }))).toBe('best');
  });

  it('Miss when the opponent erred and the player let it pass', () => {
    // White blunders (50% → 15%), then Black plays a move that hands the gift straight back.
    const moves = ['e2e4', 'e7e5', 'd1h5', 'g8f6'];
    const evals = [
      ev({ cp: 20 }, ['e2e4']),
      ev({ cp: 20 }, ['e7e5']),
      ev({ cp: 20 }, ['g1f3']),
      ev({ cp: -cpFor(85) }, ['b8c6']),
      ev({ cp: cpFor(50) }),
    ];
    const review = reviewGame({ startFen: START_FEN, moves, evals, book: null });
    expect(review.moves[2]!.label).toBe('blunder');
    expect(review.moves[3]!.label).toBe('miss');
  });

  it('a mistake with no error before it stays a mistake', () => {
    const moves = ['e2e4', 'e7e5', 'd1h5', 'g8f6'];
    const evals = [ev({ cp: 20 }), ev({ cp: 20 }), ev({ cp: 20 }, ['g1f3']), ev({ cp: 20 }, ['b8c6']), ev({ cp: cpFor(68) })];
    expect(reviewGame({ startFen: START_FEN, moves, evals, book: null }).moves[3]!.label).toBe('mistake');
  });

  it('counts labels per side and writes the best line in SAN', () => {
    const moves = ['e2e4', 'e7e5'];
    const evals = [ev({ cp: 20 }, ['e2e4', 'e7e5', 'g1f3']), ev({ cp: 20 }, ['e7e5']), ev({ cp: 20 })];
    const review = reviewGame({ startFen: START_FEN, moves, evals, book: null });
    expect(review.counts.w.best).toBe(1);
    expect(review.counts.b.best).toBe(1);
    expect(review.moves[0]!.bestLine).toEqual(['e4', 'e5', 'Nf3']);
    expect(review.moves[0]!.bestSan).toBe('e4');
    expect(review.whiteWins).toHaveLength(3);
    expect(() => reviewGame({ startFen: START_FEN, moves, evals: evals.slice(1), book: null })).toThrow();
  });
});

describe('position helpers (ch-015)', () => {
  it('reads an ended game as won or drawn', () => {
    const mate = chess.createGame('6k1/5ppp/8/8/8/8/8/3R2K1 w - - 0 1');
    mate.move('d1d8');
    expect(terminalEval(mate)!.lines[0]!.score).toEqual({ mate: 1 });
    expect(terminalEval(chess.createGame('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1'))!.lines[0]!.score).toEqual({ cp: 0 });
    expect(terminalEval(chess.createGame())).toBeNull();
  });

  it('finds what exchanges win on a square', () => {
    // A queen en prise to a pawn, and a knight defended by a pawn attacked by a rook.
    expect(exchangeGain(chess.createGame('4k3/8/8/3q4/4P3/8/8/4K3 w - - 0 1'), 35)).toBe(9);
    expect(exchangeGain(chess.createGame('4k3/8/4p3/3n4/8/8/8/3RK3 w - - 0 1'), 35)).toBe(0);
    expect(exchangeGain(chess.createGame('4k3/8/8/3n4/8/8/8/3RK3 w - - 0 1'), 35)).toBe(3);
  });

  it('measures a sacrifice from the side that left the piece', () => {
    const game = chess.createGame('r1bq1rk1/pppn1ppp/4p3/3pP3/1b1P4/2NB1N2/PPP2PPP/R2QK2R w KQ - 0 8');
    game.move('d3h7');
    expect(sacrificeValue(game, 'w')).toBe(3);
  });

  it('writes a line in SAN and stops at a move that does not fit', () => {
    expect(sanOf(chess.createGame(), ['e2e4', 'e7e5', 'e4e5', 'g1f3'])).toEqual(['e4', 'e5']);
  });
});
