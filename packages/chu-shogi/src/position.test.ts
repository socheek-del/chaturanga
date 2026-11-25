import { describe, expect, it } from 'vitest';
import { BOARD_SIZE, FILES, RANKS } from './layout';
import { fenOf, isLion, parseFen, square, START_FEN, startingPosition } from './position';

describe('Chu Shogi positions', () => {
  it('round-trips the 12×12 starting position and side to move', () => {
    const start = startingPosition();
    expect(START_FEN.split(' ')[0]!.split('/')).toHaveLength(RANKS);
    expect(START_FEN.split(' ')[0]!.split('/').every((rank) => rank.split(',').length === FILES)).toBe(true);
    expect(start.board).toHaveLength(BOARD_SIZE);
    expect(parseFen(START_FEN)).toEqual(start);
    expect(fenOf(parseFen(START_FEN))).toBe(START_FEN);
    expect(parseFen(fenOf({ ...start, turn: 'b' })).turn).toBe('b');
  });

  it('preserves a promoted face and a declined promotion right in the position string', () => {
    const fen = START_FEN.replace('wpa', 'wpa+').replace('wgb', 'wgb!');
    const position = parseFen(fen);
    const pawn = position.board[square('a4')]!;
    const goBetween = position.board[square('d5')]!;
    expect(pawn).toMatchObject({ color: 'w', type: 'pawn', promoted: true, promotionEligible: false });
    expect(goBetween).toMatchObject({ type: 'go-between', promoted: false, promotionEligible: false });
    expect(fenOf(position)).toBe(fen);
  });

  it('serializes and validates the temporary first-Lion counterstrike', () => {
    const board = START_FEN.split(' ')[0]!;
    const position = parseFen(`${board} b b@f3 9`);
    expect(position.counterstrike).toEqual({ forbiddenColor: 'b', protectedLion: square('f3') });
    expect(fenOf(position)).toBe(`${board} b b@f3 9`);
    expect(() => parseFen(`${board} b w@f3 9`)).toThrow();
  });

  it('rejects incomplete boards, malformed flags, invalid ranks, and bad side fields', () => {
    const placement = START_FEN.split(' ')[0]!;
    expect(() => parseFen('')).toThrow();
    expect(() => parseFen(`${placement.replace(/\/.+$/, '')} w - 0`)).toThrow();
    expect(() => parseFen(`${placement.replace('wki', 'wki!!')} w - 0`)).toThrow();
    expect(() => parseFen(`${placement.replace('wki', 'wki+!')} w - 0`)).toThrow();
    expect(() => parseFen(`${placement} x - 0`)).toThrow();
    expect(() => square('a13')).toThrow(RangeError);
    expect(() => square('m1')).toThrow(RangeError);
    expect(isLion(parseFen(START_FEN).board[square('f3')]!)).toBe(true);
  });
});
