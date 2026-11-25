import { describeVariantConformance, mulberry32 } from '@chaturanga/rules-core/testing';
import { describe, expect, it } from 'vitest';
import { FILES, Game, PIECE_TYPES, RANKS, isPlayable, shatra, square, squareForField, START_FEN } from './index';

function fen(pieces: Record<string, string>, turn = 'w', lock = '-', halfmove = 0, fullmove = 1): string {
  const rows = Array.from({ length: RANKS }, () => Array<string>(FILES).fill('.'));
  for (const [name, piece] of Object.entries(pieces)) {
    const target = square(name);
    const rank = Math.floor(target / FILES);
    rows[RANKS - 1 - rank]![target % FILES] = piece;
  }
  const placement = rows.map((row) => row.join('').replace(/\.+/g, (empty) => String(empty.length))).join('/');
  return `${placement} ${turn} ${lock} ${halfmove} ${fullmove}`;
}

const captureBiy = fen({ c1: 'K', d5: 'S', d6: 'k' });

describeVariantConformance(shatra, {
  fens: [START_FEN, captureBiy, fen({ c1: 'K', e14: 'k', e5: 'S' }, 'w', 'we5+')],
  invalidFens: ['', 'not a position', `${START_FEN} extra`, `K3k2/${Array.from({ length: 13 }, () => '7').join('/')} w - 0 1`],
  illegalMoves: ['a1a2', 'd5d7', 'g1g2'],
  terminal: { fen: captureBiy, move: 'd5d7', status: { kind: 'goal-square', winner: 'w' } },
});

describe('Altai Shatra', () => {
  it('maps the 62 numbered fields to the masked 7×14 board and sets 14 active plus 9 reserves', () => {
    const game = new Game();
    expect(game.pieces()).toHaveLength(48);
    expect(Array.from({ length: FILES * RANKS }, (_, index) => index).filter(isPlayable)).toHaveLength(62);
    expect(squareForField(1)).toBe(square('c14'));
    expect(squareForField(10)).toBe(square('d11'));
    expect(squareForField(11)).toBe(square('a10'));
    expect(squareForField(53)).toBe(square('d4'));
    expect(squareForField(62)).toBe(square('e1'));
    expect(game.pieceAt(squareForField(10))).toMatchObject({ color: 'b', type: 'k' });
    expect(game.pieceAt(squareForField(53))).toMatchObject({ color: 'w', type: 'k' });
    expect(game.pieces().filter(({ piece }) => piece.type === 's' && piece.color === 'w')).toHaveLength(23);
    expect(game.pieces().filter(({ piece }) => piece.type === 's' && piece.color === 'b')).toHaveLength(23);
    expect(PIECE_TYPES).toEqual(['k', 's', 'b']);
    expect(game.fen()).toBe(START_FEN);
    expect(new Game(game.fen()).fen()).toBe(game.fen());
  });

  it('moves Shatras forward, diagonally forward and sideways, and deploys reserves to the home field', () => {
    const game = new Game();
    expect(game.legalUci()).toContain('d6d7');
    expect(game.legalUci()).toContain('d6c7');
    expect(game.legalUci()).toContain('d6e7');
    expect(game.legalUci()).not.toContain('d6d5');
    expect(game.legalUci()).toContain('c3d7');
    const record = game.move('c3d7');
    expect(record.san).toContain('↗');
    expect(game.pieceAt(square('d7'))).toMatchObject({ color: 'w', type: 's' });

    const openField = new Game(fen({ c1: 'K', e14: 'k', d6: 'S' }));
    expect(openField.legalUci()).toEqual(expect.arrayContaining(['d6d7', 'd6c7', 'd6e7', 'd6c6', 'd6e6']));
  });

  it('requires a Shatra capture and completes the chosen jump chain', () => {
    const mandatory = new Game(fen({ c1: 'K', e14: 'k', d5: 'S', d6: 's' }));
    expect(mandatory.legalUci()).toEqual(['d5d7']);
    mandatory.move('d5d7');
    expect(mandatory.pieceAt(square('d6'))).toBeNull();
    expect(mandatory.pieceAt(square('d7'))).toMatchObject({ color: 'w', type: 's' });

    const batyr = new Game(fen({ c1: 'K', e14: 'k', d5: 'B', d7: 's', d9: 's' }));
    expect(batyr.legalUci()).toContain('d5d8d10');
    batyr.move('d5d8d10');
    expect(batyr.pieceAt(square('d7'))).toBeNull();
    expect(batyr.pieceAt(square('d9'))).toBeNull();
    expect(batyr.pieceAt(square('d10'))).toMatchObject({ color: 'w', type: 'b' });
  });

  it('gives the Biy its optional-capture right but requires it to move when it can capture', () => {
    const game = new Game(fen({ c1: 'S', e14: 'k', d5: 'K', d6: 's', a5: 'S' }));
    const legal = game.legalUci();
    expect(legal.some((move) => move.startsWith('d5'))).toBe(true);
    expect(legal.some((move) => move.startsWith('a5'))).toBe(false);
    expect(legal).toContain('d5d7');
  });

  it('promotes on the three far fortress fields and retains the alternating horizontal restriction', () => {
    const promotion = new Game(fen({ c1: 'K', e14: 'k', d13: 'S' }));
    expect(promotion.legalUci()).toContain('d13d14b');
    promotion.move('d13d14b');
    expect(promotion.pieceAt(square('d14'))).toMatchObject({ color: 'w', type: 'b', promoted: true });

    const game = new Game(fen({ c1: 'K', e14: 'k', d5: 'S' }));
    game.move('d5e5');
    expect(game.fen()).toContain('we5+');
    game.move('e14d14');
    expect(game.legalUci()).not.toContain('e5d5');
    expect(game.legalUci()).toContain('e5f5');
    expect(new Game(game.fen()).fen()).toBe(game.fen());
  });

  it('lets a piece stop a capture route in a gate and lets Batyry make long jumps', () => {
    const gate = new Game(fen({ c1: 'K', e14: 'k', d9: 'S', d10: 's', d12: 's' }));
    expect(gate.legalUci()).toContain('d9d11');
    expect(gate.legalUci()).toContain('d9d11d13');
  });

  it('ends on a Biy capture and round-trips the terminal board', () => {
    const game = new Game(captureBiy);
    game.move('d5d7');
    expect(game.status()).toEqual({ kind: 'goal-square', winner: 'w' });
    expect(game.legalUci()).toEqual([]);
    expect(new Game(game.fen()).status()).toEqual(game.status());
    game.undo();
    expect(game.fen()).toBe(captureBiy);
  });

  it('records decisive immobilization, repetition and the digital no-progress draw', () => {
    const repeated = new Game(fen({ c1: 'K', d14: 'k' }));
    for (let cycle = 0; cycle < 2; cycle++) {
      repeated.move('c1d1');
      repeated.move('d14e14');
      repeated.move('d1c1');
      repeated.move('e14d14');
    }
    expect(repeated.status()).toEqual({ kind: 'repetition' });
    const noProgress = new Game(fen({ c1: 'K', d14: 'k' }, 'w', '-', 99));
    noProgress.move('c1d1');
    expect(noProgress.status()).toEqual({ kind: 'fifty-move' });
  });

  it('replays and undoes seeded legal play', () => {
    const random = mulberry32(18);
    const game = new Game();
    for (let ply = 0; ply < 60 && !game.isGameOver(); ply++) {
      const moves = game.legalUci();
      expect(moves.length).toBeGreaterThan(0);
      game.move(moves[Math.floor(random() * moves.length)]!);
    }
    const finalFen = game.fen();
    const replay = new Game();
    for (const record of game.moves()) expect(replay.move(record.uci).fenAfter).toBe(record.fenAfter);
    expect(replay.fen()).toBe(finalFen);
    while (game.undo()) { /* rewind to the initial position */ }
    expect(game.fen()).toBe(shatra.startFen);
  });
});
