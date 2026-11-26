import { activePlayers, legalUciFor, replayVariantMoves } from '@chaturanga/rules-core';
import { describeVariantConformance, mulberry32 } from '@chaturanga/rules-core/testing';
import { describe, expect, it } from 'vitest';
import { Game, parseSquare, senterej, START_FEN } from './index';

const MATE = 'n5k1/5ppp/8/8/8/8/8/3R2K1 w - - 0 1 turn - -';
const PROMOTION = '6rk/P7/8/8/8/8/8/KR6 w - - 0 1 turn - -';
const CHECKED_WERERA = '4r2k/8/8/8/8/8/8/4K2R w - - 0 1 werera - -';
const CAPTURE = '7k/1p5r/8/8/8/8/8/KR6 w - - 0 1 werera - -';

describeVariantConformance(senterej, {
  fens: [MATE, PROMOTION, '6rk/8/8/8/8/8/8/KR6 b - - 15 3 turn 1,0 62,2'],
  invalidFens: [
    '',
    '7k/8/8/8/8/8/8/8 w - - 0 1 turn - -',
    '7k/8/8/8/8/8/8/K7 w K - 0 1 turn - -',
    '7k/8/8/8/8/8/8/K7 w - - 0 1 opening - -',
    '7k/8/8/8/8/8/8/K7 w - - 0 1 turn 0,0 -',
  ],
  illegalMoves: ['a1a3', 'e2e4', 'e2e3q', 'd1b3'],
  checkmate: { fen: MATE, move: 'd1d8', winner: 'w' },
});

describe('Senterej rules', () => {
  it('uses the selected opposite-King setup and the historical piece movements', () => {
    const game = new Game();
    expect(game.fen()).toBe(START_FEN);
    expect(game.pieceAt(parseSquare('e1'))).toMatchObject({ color: 'w', type: 'k' });
    expect(game.pieceAt(parseSquare('d8'))).toMatchObject({ color: 'b', type: 'k' });
    expect(game.pieceAt(parseSquare('d1'))).toMatchObject({ color: 'w', type: 'q' });
    expect(game.pieceAt(parseSquare('e8'))).toMatchObject({ color: 'b', type: 'q' });
    expect(game.legalUci()).toContain('c1a3');
    expect(game.legalUci()).toContain('c1e3');
    expect(game.legalUci()).not.toContain('c1d2');
    expect(game.legalUci()).not.toContain('e2e4');
    expect(legalUciFor(game, 'b')).toContain('e7e6');
  });

  it('lets either seat act repeatedly during Werera and records the actual actor', () => {
    const game = new Game();
    expect(activePlayers(game)).toEqual(['w', 'b']);
    const black = game.moveFor('b', 'e7e6');
    expect(black.color).toBe('b');
    expect(game.phase).toBe('werera');
    expect(game.turn).toBe('w');
    const white = game.moveFor('w', 'e2e3');
    expect(white.color).toBe('w');
    expect(game.activePlayers()).toEqual(['w', 'b']);
    expect(game.moveFor('w', 'd2d3').color).toBe('w');
    expect(game.moves().map((move) => move.color)).toEqual(['b', 'w', 'w']);
  });

  it('does not apply check restrictions during Werera', () => {
    const game = new Game(CHECKED_WERERA);
    expect(game.inCheck()).toBe(false);
    expect(game.checkedKingSquare()).toBeNull();
    expect(game.legalUciFor('w')).toContain('h1h2');
    expect(game.moveFor('w', 'h1h2').action).toBe('move');
    expect(game.phase).toBe('werera');
  });

  it('ends Werera on the first capture and gives the first ordinary turn to the other seat', () => {
    const game = new Game(CAPTURE);
    const record = game.moveFor('w', 'b1b7');
    expect(record.action).toBe('capture');
    expect(record.captured).toMatchObject({ color: 'b', type: 'p' });
    expect(game.phase).toBe('turn');
    expect(game.turn).toBe('b');
    expect(game.activePlayers()).toEqual(['b']);
    expect(game.legalUciFor('w')).toEqual([]);
    expect(() => game.moveFor('w', 'a1a2')).toThrow();
  });

  it('draws immediately when a capture removes a side’s last non-pawn support', () => {
    const game = new Game('7k/6p1/8/8/8/8/8/KR5r w - - 0 1 werera - -');
    game.moveFor('w', 'b1h1');
    expect(game.phase).toBe('turn');
    expect(game.status()).toEqual({ kind: 'bare-king' });
  });

  it('promotes a Medeq automatically to a Ferz and replays the promotion marker', () => {
    const game = new Game(PROMOTION);
    expect(game.legalUciFor('w')).toContain('a7a8q');
    const record = game.moveFor('w', 'a7a8q');
    expect(record.piece).toMatchObject({ type: 'p', color: 'w' });
    expect(game.pieceAt(parseSquare('a8'))).toMatchObject({ type: 'q', color: 'w', promoted: true });
    const replayed = replayVariantMoves(senterej, PROMOTION, ['a7a8q'], ['w']);
    expect(replayed.fen()).toBe(game.fen());
  });

  it('counts seven moves by the sole support piece, not seven turns by its king', () => {
    const game = new Game('6rk/8/8/8/8/8/8/KR6 w - - 0 1 turn 1,0 62,0');
    const whiteMoves = ['b1b2', 'b2b1', 'b1b2', 'b2b1', 'b1b2', 'b2b1', 'b1b2'];
    const blackMoves = ['h8h7', 'h7h8', 'h8h7', 'h7h8', 'h8h7', 'h7h8'];
    for (let index = 0; index < whiteMoves.length; index++) {
      game.moveFor('w', whiteMoves[index]!);
      if (blackMoves[index]) game.moveFor('b', blackMoves[index]!);
      if (index < 6) expect(game.status()).toEqual({ kind: 'ongoing' });
    }
    expect(game.loneSupport.w).toEqual({ square: parseSquare('b2'), moves: 7 });
    expect(game.status()).toEqual({ kind: 'counting' });
  });

  it('draws a repeated normal-play position for the third time', () => {
    const game = new Game('b6k/7r/8/8/8/8/8/KN1N4 w - - 0 1 turn - -');
    for (let cycle = 0; cycle < 2; cycle++) {
      for (const [color, uci] of [['w', 'b1c3'], ['b', 'h8g8'], ['w', 'c3b1'], ['b', 'g8h8']] as const) {
        game.moveFor(color, uci);
      }
    }
    expect(game.status()).toEqual({ kind: 'repetition' });
  });

  it('restores both the board and the phase when a move is undone', () => {
    const game = new Game(CAPTURE);
    game.moveFor('w', 'b1b7');
    expect(game.phase).toBe('turn');
    game.undo();
    expect(game.phase).toBe('werera');
    expect(game.fen()).toBe(CAPTURE);
    expect(game.moves()).toEqual([]);
  });

  it('keeps actor order stable through seeded concurrent replay', () => {
    const random = mulberry32(4);
    const game = new Game();
    for (let ply = 0; ply < 20 && game.phase === 'werera'; ply++) {
      const actor = random() < 0.5 ? 'w' : 'b';
      const legal = legalUciFor(game, actor);
      if (legal.length) game.moveFor(actor, legal[Math.floor(random() * legal.length)]!);
    }
    const moves = game.moves();
    const replayed = replayVariantMoves(senterej, START_FEN, moves.map((move) => move.uci), moves.map((move) => move.color));
    expect(replayed.fen()).toBe(game.fen());
    expect(replayed.status()).toEqual(game.status());
  });
});
