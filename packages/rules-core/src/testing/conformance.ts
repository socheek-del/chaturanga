/**
 * Shared conformance suite: every rules engine runs it against its Variant, so AI, server and UI code
 * can rely on the same behaviour from any game.
 */
import { describe, expect, it } from 'vitest';
import { squareNameOf, squareOf } from '../coords';
import { FenError, IllegalMoveError } from '../errors';
import type { Color } from '../types';
import type { Variant, VariantGame } from '../variant';
import { mulberry32 } from './random';

export interface ConformanceFixtures {
  /** Valid positions other than the start; each must round-trip through the game's FEN. */
  fens: readonly string[];
  invalidFens: readonly string[];
  /** Strings that are not legal moves in the start position. */
  illegalMoves: readonly string[];
  /** A position and the move that mates from it. */
  checkmate: { fen: string; move: string; winner: Color };
}

const PLAYOUT_SEEDS = 5;
const PLAYOUT_PLIES = 120;

export function describeVariantConformance<G extends VariantGame>(
  variant: Variant<G>,
  fixtures: ConformanceFixtures,
): void {
  describe(`${variant.id} implements the rules-core Variant (plat-002)`, () => {
    it('starts from startFen with White to move', () => {
      const game = variant.createGame();
      expect(game.fen()).toBe(variant.startFen);
      expect(variant.createGame(variant.startFen).fen()).toBe(variant.startFen);
      expect(game.turn).toBe('w');
      expect(game.moves()).toEqual([]);
      expect(game.lastMove()).toBeNull();
      expect(game.status()).toEqual({ kind: 'ongoing' });
      expect(variant.files * variant.ranks).toBeGreaterThan(0);
      if (!variant.hasHands) expect([...game.hand('w'), ...game.hand('b')]).toEqual([]);
    });

    it.each(fixtures.fens)('round-trips %s', (fen) => {
      expect(variant.createGame(fen).fen()).toBe(fen);
    });

    it.each(fixtures.invalidFens)('rejects invalid FEN %j with FenError', (fen) => {
      expect(() => variant.createGame(fen)).toThrow(FenError);
    });

    it.each(fixtures.illegalMoves)('rejects %j with IllegalMoveError and keeps the position', (move) => {
      const game = variant.createGame();
      expect(() => game.move(move)).toThrow(IllegalMoveError);
      expect(game.fen()).toBe(variant.startFen);
    });

    it('pieces() agrees with pieceAt(), using only the declared piece types', () => {
      const boardSize = variant.files * variant.ranks;
      for (const fen of [variant.startFen, ...fixtures.fens]) {
        const game = variant.createGame(fen);
        const listed = new Map(game.pieces().map(({ square, piece }) => [square, piece]));
        for (let square = 0; square < boardSize; square++)
          expect(game.pieceAt(square)).toEqual(listed.get(square) ?? null);
        const types = [...listed.values()].map((p) => p.type).concat(game.hand('w'), game.hand('b'));
        for (const type of types) expect(variant.pieceTypes).toContain(type);
      }
    });

    it('plays seeded random games: every legal move string plays, is recorded, replays and undoes', () => {
      for (let seed = 1; seed <= PLAYOUT_SEEDS; seed++) {
        const rand = mulberry32(seed);
        const game = variant.createGame();
        const fens = [game.fen()];
        while (!game.isGameOver() && game.moves().length < PLAYOUT_PLIES) {
          const legal = game.legalUci();
          expect(legal.length, `seed ${seed}: ongoing game has legal moves`).toBeGreaterThan(0);
          expect(new Set(legal).size).toBe(legal.length);
          const uci = legal[Math.floor(rand() * legal.length)]!;
          const mover = game.turn;
          const record = game.move(uci);
          expect(record).toMatchObject({ uci, color: mover, fenAfter: game.fen() });
          expect(squareNameOf(record.to, variant.files)).toBe(uci.match(/[a-p]\d{1,2}/g)!.at(-1));
          expect(game.lastMove()).toBe(record);
          expect(game.turn).not.toBe(mover);
          expect(game.pieceAt(record.to)?.color).toBe(mover);
          expect(game.checkedKingSquare() !== null).toBe(game.inCheck());
          fens.push(game.fen());
        }

        // The online server rebuilds a game from the start position and the move list.
        const replayed = variant.createGame();
        for (const { uci } of game.moves()) replayed.move(uci);
        expect(replayed.fen()).toBe(game.fen());
        expect(replayed.status()).toEqual(game.status());

        for (let i = fens.length - 1; i > 0; i--) {
          expect(game.fen()).toBe(fens[i]);
          expect(game.undo()).not.toBeNull();
        }
        expect(game.fen()).toBe(fens[0]);
        expect(game.undo()).toBeNull();
      }
    });

    it('attackedSquares covers every capture and every check, on the board only (plat-015)', () => {
      const boardSize = variant.files * variant.ranks;
      for (let seed = 1; seed <= PLAYOUT_SEEDS; seed++) {
        const rand = mulberry32(seed);
        const game = variant.createGame();
        while (!game.isGameOver() && game.moves().length < PLAYOUT_PLIES) {
          const side = game.turn;
          const own = game.attackedSquares(side);
          const enemy = game.attackedSquares(side === 'w' ? 'b' : 'w');
          for (const squares of [own, enemy]) {
            expect(squares).toEqual([...new Set(squares)].sort((a, b) => a - b));
            for (const sq of squares) expect(sq >= 0 && sq < boardSize).toBe(true);
          }
          const checked = game.checkedKingSquare();
          if (checked !== null) expect(enemy, `seed ${seed}: check is an attack`).toContain(checked);
          const legal = game.legalUci();
          for (const uci of legal) {
            if (uci.includes('@')) continue;
            const to = squareOf(uci.match(/[a-p]\d{1,2}/g)!.at(-1)!, variant.files)!;
            const target = game.pieceAt(to);
            if (target && target.color !== side) expect(own, `seed ${seed}: ${uci} captures`).toContain(to);
          }
          game.move(legal[Math.floor(rand() * legal.length)]!);
        }
      }
    });

    it('reports checkmate for the mating side', () => {
      const game = variant.createGame(fixtures.checkmate.fen);
      expect(game.isGameOver()).toBe(false);
      expect(game.move(fixtures.checkmate.move).san.endsWith('#')).toBe(true);
      expect(game.status()).toEqual({ kind: 'checkmate', winner: fixtures.checkmate.winner });
      expect(game.isGameOver()).toBe(true);
      expect(game.inCheck()).toBe(true);
      expect(game.legalUci()).toEqual([]);
    });
  });
}
