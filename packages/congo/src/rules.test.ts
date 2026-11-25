import { describeVariantConformance, mulberry32 } from '@chaturanga/rules-core/testing';
import { describe, expect, it } from 'vitest';
import { FILES, Game, RANKS, congo, parseFen, square, START_FEN } from './index';

function fen(pieces: Record<string, string>, turn = 'w', halfmove = 0, fullmove = 1): string {
  const rows = Array.from({ length: RANKS }, () => Array<string>(FILES).fill('.'));
  for (const [name, token] of Object.entries(pieces)) {
    const target = square(name);
    rows[RANKS - 1 - Math.floor(target / FILES)]![target % FILES] = token;
  }
  const placement = rows.map((row) => row.join('').replace(/\.+/g, (empty) => String(empty.length))).join('/');
  return `${placement} ${turn} - ${halfmove} ${fullmove}`;
}

const monkeyTakes = fen({ a1: 'L', b2: 'M', c3: 'p', e5: 'z', g7: 'l' });
const monkeyTakesLion = fen({ a1: 'L', b2: 'M', c3: 'l' });

describeVariantConformance(congo, {
  fens: [START_FEN, monkeyTakes, fen({ c1: 'L', e7: 'l', a1: 'Z' }), fen({ c1: 'L', e7: 'l', a4: 'E!' }, 'b')],
  invalidFens: [
    '', 'not a position', `${START_FEN} extra`,
    fen({ a1: 'L', g7: 'l', b4: 'P' }),
    fen({ a1: 'L', g7: 'l', b4: 'L!' }),
    fen({ a1: 'L', g7: 'l', b4: 'C!' }),
    fen({ a1: 'L', c1: 'L', g7: 'l' }),
  ],
  illegalMoves: ['a2a4', 'b1b3', 'g6g4'],
  terminal: { fen: monkeyTakesLion, move: 'b2d4', status: { kind: 'goal-square', winner: 'w' } },
});

describe('Congo board and movement', () => {
  it('round-trips the 7×7 start and represents river deadlines in FEN', () => {
    const game = new Game();
    expect(game.fen()).toBe(START_FEN);
    expect(game.pieces()).toHaveLength(28);
    expect(game.legalUci()).toContain('b2b3');
    expect(game.legalUci()).toContain('b2c3');
    expect(new Game(game.fen()).fen()).toBe(game.fen());

    expect(game.legalUci()).toContain('d2d3');
    const riverGame = new Game(fen({ a1: 'L', g7: 'l', d3: 'P' }));
    const riverMove = riverGame.move('d3d4');
    expect(riverMove.fenAfter).toContain('P!');
    expect(parseFen(riverMove.fenAfter)).toEqual(expect.objectContaining({ turn: 'b' }));
    expect(new Game(riverMove.fenAfter).fen()).toBe(riverMove.fenAfter);
  });

  it('implements Zebra, jumping Elephant, Giraffe and Crocodile movement', () => {
    const zebra = new Game(fen({ a1: 'L', g7: 'l', b2: 'Z' }));
    expect(zebra.legalUci()).toEqual(expect.arrayContaining(['b2a4', 'b2c4', 'b2d3', 'b2d1']));

    const elephant = new Game(fen({ a1: 'L', g7: 'l', d2: 'E', d3: 'P' }));
    expect(elephant.legalUci()).toContain('d2d4'); // Its two-square move jumps.
    expect(elephant.legalUci()).not.toContain('d2d3');

    const giraffe = new Game(fen({ a1: 'L', g7: 'l', b2: 'G' }));
    expect(giraffe.legalUci()).toContain('b2d4');
    expect(giraffe.legalUci()).toContain('b2c2');

    const croc = new Game(fen({ a1: 'L', g7: 'l', b2: 'C' }));
    expect(croc.legalUci()).toContain('b2b4');
    expect(croc.legalUci()).not.toContain('b2b5');
    expect(croc.attackedSquares('w')).toContain(square('b4'));
    expect(croc.attackedSquares('w')).not.toContain(square('b5'));
    const riverCroc = new Game(fen({ a1: 'L', g7: 'l', b4: 'C' }));
    expect(riverCroc.legalUci()).toContain('b4a4');
    expect(riverCroc.legalUci()).toContain('b4g4');
    expect(riverCroc.legalUci()).toContain('b4b3');
  });

  it('lets Pawns move and capture forward, retreat on the far bank, and promote automatically', () => {
    const pawn = new Game(fen({ a1: 'L', g7: 'l', d3: 'P', c4: 'p!', e4: 'p!' }));
    expect(pawn.legalUci()).toEqual(expect.arrayContaining(['d3d4', 'd3c4', 'd3e4']));
    expect(pawn.move('d3c4').captured).toMatchObject({ color: 'b', type: 'p' });

    const retreat = new Game(fen({ a1: 'L', g7: 'l', d5: 'P' }));
    expect(retreat.legalUci()).toEqual(expect.arrayContaining(['d5d4', 'd5d3']));

    const blockedRetreat = new Game(fen({ a1: 'L', g7: 'l', d5: 'P', d4: 'Z!' }));
    expect(blockedRetreat.legalUci()).not.toContain('d5d3');

    const promote = new Game(fen({ a1: 'L', g7: 'l', d6: 'P' }));
    expect(promote.legalUci()).toContain('d6d7+');
    promote.move('d6d7+');
    expect(promote.pieceAt(square('d7'))).toMatchObject({ type: 's', promoted: true });
  });

  it('gives a Superpawn sideways captures and backward retreats anywhere', () => {
    const game = new Game(fen({ a1: 'L', g7: 'l', d5: 'S', c5: 'p' }));
    expect(game.legalUci()).toEqual(expect.arrayContaining(['d5c5', 'd5e5', 'd5c4', 'd5e4', 'd5d4']));
    expect(game.move('d5c5').captured).toMatchObject({ color: 'b', type: 'p' });
  });

  it('keeps Lions in their castles except for the flying capture of the other Lion', () => {
    const localCapture = new Game(fen({ c1: 'L', d2: 'z', g7: 'l' }));
    expect(localCapture.legalUci()).toContain('c1d2');
    expect(localCapture.move('c1d2').captured).toMatchObject({ type: 'z', color: 'b' });

    const game = new Game(fen({ c1: 'L', c7: 'l' }));
    expect(game.legalUci()).toContain('c1d1');
    expect(game.legalUci()).toContain('c1c7');
    expect(game.legalUci()).not.toContain('c1b1');
    const record = game.move('c1c7');
    expect(record.san).toMatch(/×$/);
    expect(game.status()).toEqual({ kind: 'goal-square', winner: 'w' });

    const rankAligned = new Game(fen({ c1: 'L', e1: 'l' }));
    expect(rankAligned.legalUci()).not.toContain('c1e1');
    expect(rankAligned.status()).toEqual({ kind: 'insufficient-material' });
  });

  it('allows optional Monkey jump routes and records every captured piece', () => {
    const game = new Game(monkeyTakes);
    expect(game.legalUci()).toContain('b2d4');
    expect(game.legalUci()).toContain('b2d4f6');
    const record = game.move('b2d4f6');
    expect(record.captured).toMatchObject({ type: 'p', color: 'b' });
    expect(record.captures).toEqual([
      expect.objectContaining({ type: 'p', color: 'b' }),
      expect.objectContaining({ type: 'z', color: 'b' }),
    ]);
    expect(game.pieceAt(square('c3'))).toBeNull();
    expect(game.pieceAt(square('e5'))).toBeNull();
    expect(game.pieceAt(square('f6'))).toMatchObject({ type: 'm', color: 'w' });
    expect(record.san).toBe('b2×d4×f6');
    expect(game.undo()?.uci).toBe('b2d4f6');
    expect(game.fen()).toBe(monkeyTakes);

    const cannotRepeat = new Game(fen({ a1: 'L', c3: 'M', d4: 'p!', g7: 'l' }));
    expect(cannotRepeat.legalUci()).toContain('c3e5');
    expect(cannotRepeat.legalUci()).not.toContain('c3e5c3');
  });

  it('ends a Monkey route when it captures the Lion', () => {
    const game = new Game(monkeyTakesLion);
    game.move('b2d4');
    expect(game.status()).toEqual({ kind: 'goal-square', winner: 'w' });
    expect(game.legalUci()).toEqual([]);
  });

  it('marks river entry, clears the deadline on exit, and drowns due pieces at turn end', () => {
    const leave = new Game(fen({ c1: 'L', e7: 'l', a2: 'E' }));
    leave.move('a2a4');
    expect(leave.pieceAt(square('a4'))).toMatchObject({ riverDeadline: true });
    leave.move('e7d7');
    leave.move('a4a5');
    expect(leave.pieceAt(square('a5'))).toMatchObject({ riverDeadline: false });

    const drown = new Game(fen({ c1: 'L', e7: 'l', a2: 'E' }));
    drown.move('a2a4');
    drown.move('e7d7');
    drown.move('c1d1');
    expect(drown.pieceAt(square('a4'))).toBeNull();

    const dueMover = new Game(fen({ c1: 'L', e7: 'l', a4: 'E!' }));
    const record = dueMover.move('a4b4');
    expect(record.movedPieceRemoved).toBe(true);
    expect(record.fenAfter).not.toContain('E!');
    expect(dueMover.pieceAt(square('b4'))).toBeNull();
  });

  it('uses the Monkey route endpoint to decide whether it drowns', () => {
    const routeGame = new Game(fen({ a1: 'L', b2: 'M', c3: 'p', g7: 'l' }));
    routeGame.move('b2d4');
    expect(routeGame.pieceAt(square('d4'))).toMatchObject({ type: 'm', riverDeadline: true });
  });

  it('draws only bare Lions when neither can capture immediately and detects threefold repetition', () => {
    expect(new Game(fen({ c1: 'L', g7: 'l' })).status()).toEqual({ kind: 'insufficient-material' });
    expect(new Game(fen({ c1: 'L', c7: 'l' })).status()).toEqual({ kind: 'ongoing' });

    const repeated = new Game(fen({ a1: 'Z', c1: 'L', e7: 'l' }));
    for (let cycle = 0; cycle < 2; cycle++) {
      repeated.move('c1d1');
      repeated.move('e7d7');
      repeated.move('d1c1');
      repeated.move('d7e7');
    }
    expect(repeated.status()).toEqual({ kind: 'repetition' });
    expect(repeated.undo()?.uci).toBe('d7e7');
    expect(repeated.status()).toEqual({ kind: 'ongoing' });
  });

  it('awards the game to the opponent when the side to move has no legal moves', () => {
    const packed: Record<string, string> = {};
    for (let rank = 1; rank <= 7; rank++) {
      for (const file of 'abcdefg') packed[`${file}${rank}`] = rank === 4 ? 'p!' : 'p';
    }
    packed.c1 = 'L';
    packed.e7 = 'l';
    packed.b2 = 'z';
    packed.c2 = 'z';
    packed.d2 = 'z';
    const game = new Game(fen(packed, 'b'));
    expect(game.legalUci()).toEqual([]);
    expect(game.status()).toEqual({ kind: 'stalemate', winner: 'w' });
  });

  it('replays and undoes seeded legal games', () => {
    const random = mulberry32(41982);
    const game = new Game();
    for (let ply = 0; ply < 100 && !game.isGameOver(); ply++) {
      const moves = game.legalUci();
      expect(moves.length).toBeGreaterThan(0);
      game.move(moves[Math.floor(random() * moves.length)]!);
    }
    const finalFen = game.fen();
    const replay = new Game();
    for (const record of game.moves()) expect(replay.move(record.uci).fenAfter).toBe(record.fenAfter);
    expect(replay.fen()).toBe(finalFen);
    while (game.undo()) { /* rewind to the start */ }
    expect(game.fen()).toBe(congo.startFen);
  });
});
