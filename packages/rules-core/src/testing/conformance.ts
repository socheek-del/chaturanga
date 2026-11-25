/**
 * Shared conformance suite: every rules engine runs it against its Variant, so AI, server and UI code
 * can rely on the same behaviour from any game.
 */
import { describe, expect, it } from 'vitest';
import { squareNameOf, squareOf } from '../coords';
import { FenError, IllegalMoveError } from '../errors';
import type { GameStatus } from '../types';
import type { Variant, VariantGame } from '../variant';
import { usesSetupPhase } from '../variant';
import { mulberry32 } from './random';

export interface ConformanceFixtures {
  /** Valid positions other than the start; each must round-trip through the game's FEN. */
  fens: readonly string[];
  invalidFens: readonly string[];
  /** Strings that are not legal moves in the start position. */
  illegalMoves: readonly string[];
  /** A position and the move that mates from it, for variants with checkmate. */
  checkmate?: { fen: string; move: string; winner: string };
  /** A non-checkmate terminal move, such as capturing the Biy in Shatra. */
  terminal?: { fen: string; move: string; status: GameStatus<string> };
}

export interface ConformanceTimeouts {
  /** Larger multi-seat boards may need longer to run the unchanged seeded replay suite. */
  seededGamesMs?: number;
  /** Larger boards may need longer to check every attacked square through seeded play. */
  attackedSquaresMs?: number;
}

const PLAYOUT_SEEDS = 5;
const PLAYOUT_PLIES = 120;

export function describeVariantConformance<G extends VariantGame<string>>(
  variant: Variant<G>,
  fixtures: ConformanceFixtures,
  timeouts: ConformanceTimeouts = {},
): void {
  describe(`${variant.id} implements the rules-core Variant (plat-002)`, () => {
    const players = variant.players ?? (['w', 'b'] as unknown as readonly G['turn'][]);

    it('starts from startFen with the first seat to move', () => {
      const game = variant.createGame();
      expect(game.fen()).toBe(variant.startFen);
      expect(variant.createGame(variant.startFen).fen()).toBe(variant.startFen);
      expect(game.turn).toBe(players[0]);
      expect(game.moves()).toEqual([]);
      expect(game.lastMove()).toBeNull();
      expect(game.status()).toEqual({ kind: 'ongoing' });
      expect(variant.files * variant.ranks).toBeGreaterThan(0);
      if (!variant.hasHands) expect(players.flatMap((player) => game.hand(player))).toEqual([]);
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
        const types = [...listed.values()].map((p) => p.type).concat(...players.map((player) => [...game.hand(player)]));
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
          const handCountBefore = game.hand(mover).length;
          const inSetupPhase = usesSetupPhase(variant) && players.some((player) => game.hand(player).length > 0);
          const record = game.move(uci);
          expect(record).toMatchObject({ uci, color: mover, fenAfter: game.fen() });
          expect(squareNameOf(record.to, variant.files)).toBe(uci.match(/[a-p]\d{1,2}/g)!.at(-1));
          expect(game.lastMove()).toBe(record);
          if (game.turn === mover) {
            expect(inSetupPhase).toBe(true);
            expect(game.hand(mover).length).toBeLessThan(handCountBefore);
          }
          if (record.movedPieceRemoved) expect(game.pieceAt(record.to)).toBeNull();
          else expect(game.pieceAt(record.to)?.color).toBe(mover);
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
    }, timeouts.seededGamesMs);

    it('attackedSquares covers every capture and every check, on the board only (plat-015)', () => {
      const boardSize = variant.files * variant.ranks;
      for (let seed = 1; seed <= PLAYOUT_SEEDS; seed++) {
        const rand = mulberry32(seed);
        const game = variant.createGame();
        while (!game.isGameOver() && game.moves().length < PLAYOUT_PLIES) {
          const side = game.turn;
          const own = game.attackedSquares(side);
          const enemy = [...new Set(players.filter((player) => player !== side).flatMap((player) => game.attackedSquares(player)))].sort((a, b) => a - b);
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
    }, timeouts.attackedSquaresMs);

    if (fixtures.checkmate) {
      it('reports checkmate for the mating side', () => {
        const game = variant.createGame(fixtures.checkmate!.fen);
        expect(game.isGameOver()).toBe(false);
        expect(game.move(fixtures.checkmate!.move).san.endsWith('#')).toBe(true);
        expect(game.status()).toEqual({ kind: 'checkmate', winner: fixtures.checkmate!.winner });
        expect(game.isGameOver()).toBe(true);
        expect(game.inCheck()).toBe(true);
        expect(game.legalUci()).toEqual([]);
      });
    }

    if (fixtures.terminal) {
      it('reports the variant terminal result after its defining move', () => {
        const game = variant.createGame(fixtures.terminal!.fen);
        expect(game.isGameOver()).toBe(false);
        game.move(fixtures.terminal!.move);
        expect(game.status()).toEqual(fixtures.terminal!.status);
        expect(game.isGameOver()).toBe(true);
      });
    }
  });
}
