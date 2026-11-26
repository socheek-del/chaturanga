/**
 * Shared conformance suite: every rules engine runs it against its Variant, so AI, server and UI code
 * can rely on the same behaviour from any game.
 */
import { describe, expect, it } from 'vitest';
import { squareNameOf, squareOf } from '../coords';
import { FenError, IllegalMoveError } from '../errors';
import type { GameStatus, VariantSquare } from '../types';
import { activePlayers, legalUciFor, moveFor, type Variant, type VariantGame, type VariantSquareOf } from '../variant';
import { usesSetupPhase } from '../variant';
import { mulberry32 } from './random';

export interface ConformanceFixtures<G extends VariantGame<string, VariantSquare> = VariantGame<string, VariantSquare>> {
  /** Valid positions other than the start; each must round-trip through the game's FEN. */
  fens: readonly string[];
  invalidFens: readonly string[];
  /** Strings that are not legal moves in the start position. */
  illegalMoves: readonly string[];
  /** A position and the move that mates from it, for variants with checkmate. */
  checkmate?: { fen: string; move: string; winner: string };
  /** A non-checkmate terminal move, such as capturing the Biy in Shatra. */
  terminal?: { fen: string; move: string; status: GameStatus<string> };
  /** For high-branching games, select one complete legal move without enumerating the full list each ply. */
  sampleLegalMove?: (game: G, rng: () => number) => string | null;
  /** Empty and occupied sparse coordinates to probe when the variant has no finite board to enumerate. */
  sampleSquares?: (game: G) => readonly VariantSquareOf<G>[];
  /** Destination coordinate for a move when its UCI format is not the bounded-board coordinate format. */
  destinationOfMove?: (uci: string) => VariantSquareOf<G>;
  /** Exact attack-query fixtures for an unbounded board, checked at the start and throughout seeded play. */
  attackSamples?: (game: G) => readonly { color: string; square: VariantSquareOf<G>; attacked: boolean }[];
}

export interface ConformanceTimeouts {
  /** Larger multi-seat boards may need longer to run the unchanged seeded replay suite. */
  seededGamesMs?: number;
  /** Larger boards may need longer to check every attacked square through seeded play. */
  attackedSquaresMs?: number;
}

const PLAYOUT_SEEDS = 5;
const PLAYOUT_PLIES = 120;

export function describeVariantConformance<G extends VariantGame<string, VariantSquare>>(
  variant: Variant<G>,
  fixtures: ConformanceFixtures<G>,
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
      if (variant.boardTopology === 'unbounded') {
        expect(variant.files).toBe(0);
        expect(variant.ranks).toBe(0);
        expect(fixtures.sampleSquares).toBeTypeOf('function');
        expect(fixtures.attackSamples).toBeTypeOf('function');
        expect(game.legalUciIn).toBeTypeOf('function');
        expect(game.isAttackedAt).toBeTypeOf('function');
      } else expect(variant.files * variant.ranks).toBeGreaterThan(0);
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
      const bounded = variant.boardTopology !== 'unbounded';
      const boardSize = variant.files * variant.ranks;
      for (const fen of [variant.startFen, ...fixtures.fens]) {
        const game = variant.createGame(fen);
        const listed = new Map(game.pieces().map(({ square, piece }) => [square, piece]));
        if (bounded) {
          for (let square = 0; square < boardSize; square++)
            expect(game.pieceAt(square)).toEqual(listed.get(square) ?? null);
        } else {
          for (const { square, piece } of game.pieces()) expect(game.pieceAt(square)).toEqual(piece);
          for (const square of fixtures.sampleSquares?.(game) ?? [])
            expect(game.pieceAt(square)).toEqual(listed.get(square) ?? null);
        }
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
          const prepared = game.prepareTurn?.(Math.floor(rand() * 0x1_0000_0000));
          if (prepared) {
            expect(prepared).toMatchObject({ color: game.turn, fenAfter: game.fen() });
            fens.push(game.fen());
          }
          let action: { color: string; uci: string } | null;
          if (fixtures.sampleLegalMove) {
            const uci = fixtures.sampleLegalMove(game, rand);
            action = uci ? { color: game.turn, uci } : null;
          } else {
            const legal = activePlayers(game).flatMap((color) => legalUciFor(game, color).map((uci) => ({ color, uci })));
            expect(legal.length, `seed ${seed}: ongoing game has legal actions`).toBeGreaterThan(0);
            expect(new Set(legal.map(({ color, uci }) => `${color}:${uci}`)).size).toBe(legal.length);
            action = legal[Math.floor(rand() * legal.length)]!;
          }
          expect(action, `seed ${seed}: ongoing game has a sampled legal action`).toBeTruthy();
          if (!action) throw new Error(`seed ${seed}: ongoing game has no sampled legal action`);
          const { color: mover, uci } = action;
          const handCountBefore = game.hand(mover).length;
          const inSetupPhase = usesSetupPhase(variant) && players.some((player) => game.hand(player).length > 0);
          const record = moveFor(game, mover, uci);
          expect(record).toMatchObject({ uci, color: mover, fenAfter: game.fen() });
          expect(game.lastMove()).toBe(record);
          if (game.turn === mover && usesSetupPhase(variant)) {
            expect(inSetupPhase).toBe(true);
            expect(game.hand(mover).length).toBeLessThan(handCountBefore);
          }
          if (record.action === 'roll' || record.action === 'pass') {
            expect(record.san).toBeTruthy();
          } else if (variant.boardTopology !== 'unbounded') {
            expect(record.to).toBeGreaterThanOrEqual(0);
            expect(squareNameOf(Number(record.to), variant.files)).toBe(uci.match(/[a-q]\d{1,2}/g)!.at(-1));
          } else {
            expect(typeof record.to).toBe('string');
          }
          const destination = record.to as VariantSquareOf<G>;
          if (record.action === 'roll' || record.action === 'pass') {
            // Chance and pass actions have no board destination or capture.
          } else if (record.action === 'capture') {
            expect(record.captured).not.toBeNull();
            if (variant.hasHands) expect(game.hand(mover).length).toBeGreaterThan(handCountBefore);
          } else if (record.movedPieceRemoved) expect(game.pieceAt(destination)).toBeNull();
          else if (record.multiPieceMove) expect(game.pieceAt(destination)).not.toBeNull();
          else expect(game.pieceAt(destination)?.color).toBe(mover);
          expect(game.checkedKingSquare() !== null).toBe(game.inCheck());
          fens.push(game.fen());
        }

        // The online server rebuilds a game from the start position and the move list.
        const replayed = variant.createGame();
        for (const { uci, color } of game.moves()) moveFor(replayed, color, uci);
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
      const bounded = variant.boardTopology !== 'unbounded';
      const boardSize = variant.files * variant.ranks;
      for (let seed = 1; seed <= PLAYOUT_SEEDS; seed++) {
        const rand = mulberry32(seed);
        const game = variant.createGame();
        while (!game.isGameOver() && game.moves().length < PLAYOUT_PLIES) {
          game.prepareTurn?.(Math.floor(rand() * 0x1_0000_0000));
          const side = game.turn;
          const active = activePlayers(game);
          for (const actor of active) {
            const checked = actor === side ? game.checkedKingSquare() : null;
            if (bounded) {
              const own = game.attackedSquares?.(actor) ?? [];
              const enemy = [...new Set(players.filter((player) => player !== actor).flatMap((player) => game.attackedSquares?.(player) ?? []))].sort((a, b) => Number(a) - Number(b));
              expect(game.attackedSquares).toBeTypeOf('function');
              for (const squares of [own, enemy]) {
                expect(squares).toEqual([...new Set(squares)].sort((a, b) => Number(a) - Number(b)));
                for (const sq of squares) expect(Number(sq) >= 0 && Number(sq) < boardSize).toBe(true);
              }
              if (checked !== null) expect(enemy, `seed ${seed}: check is an attack`).toContain(checked);
            } else {
              for (const sample of fixtures.attackSamples?.(game) ?? [])
                expect(game.isAttackedAt?.(sample.color, sample.square)).toBe(sample.attacked);
              if (checked !== null)
                expect(players.filter((player) => player !== actor).some((player) => game.isAttackedAt?.(player, checked)), `seed ${seed}: check is an attack`).toBe(true);
            }
          }
          const legal = fixtures.sampleLegalMove
            ? [{ color: game.turn, uci: fixtures.sampleLegalMove(game, rand) }].filter((action): action is { color: string; uci: string } => !!action.uci)
            : active.flatMap((color) => legalUciFor(game, color).map((uci) => ({ color, uci })));
          expect(legal.length, `seed ${seed}: ongoing game has a legal action`).toBeGreaterThan(0);
          for (const { color, uci } of legal) {
            if (uci === 'pass' || /^ROLL[1-6]{2}$/.test(uci) || uci.includes('@')) continue;
            const to = variant.boardTopology === 'unbounded'
              ? fixtures.destinationOfMove?.(uci)
              : squareOf(uci.match(/[a-q]\d{1,2}/g)!.at(-1)!, variant.files);
            if (to !== undefined) {
              const target = game.pieceAt(to as VariantSquareOf<G>);
              if (target && target.color !== color) {
                if (bounded) expect(game.attackedSquares?.(color), `seed ${seed}: ${uci} captures`).toContain(to);
                else expect(game.isAttackedAt?.(color, to as VariantSquareOf<G>), `seed ${seed}: ${uci} captures`).toBe(true);
              }
            }
          }
          const selected = legal[Math.floor(rand() * legal.length)]!;
          moveFor(game, selected.color, selected.uci);
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
        if (game.legalUci) expect(game.legalUci()).toEqual([]);
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
