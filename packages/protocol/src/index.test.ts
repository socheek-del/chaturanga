import { describe, expect, it } from 'vitest';
import { ClientMessage, GameResult, GameSnapshot, HealthResponse } from './index';

describe('GameResult point standings', () => {
  it('preserves multi-seat winners and fractional scores', () => {
    const result = {
      winner: null,
      reason: 'elimination',
      winners: ['r', 'y'],
      scores: { r: 4.5, b: 1, y: 4.5, g: 0 },
    } as const;
    expect(GameResult.parse(result)).toEqual(result);
  });
});

describe('HealthResponse', () => {
  it('accepts a valid payload', () => {
    const payload = { ok: true, service: 'makruk', time: new Date().toISOString() };
    expect(HealthResponse.parse(payload)).toEqual(payload);
  });

  it('accepts any product Worker by name', () => {
    expect(HealthResponse.safeParse({ ok: true, service: 'sittuyin', time: new Date().toISOString() }).success).toBe(true);
  });

  // Each product has its own Worker now (plat-005c, sit-008), so the name is no longer a fixed literal —
  // but a health payload must still say which Worker answered.
  it('rejects a missing or empty service name and a bad timestamp', () => {
    const time = new Date().toISOString();
    expect(HealthResponse.safeParse({ ok: true, service: '', time }).success).toBe(false);
    expect(HealthResponse.safeParse({ ok: true, time }).success).toBe(false);
    expect(HealthResponse.safeParse({ ok: true, service: 'makruk', time: 'yesterday' }).success).toBe(false);
  });
});

describe('ClientMessage move notation', () => {
  it('accepts a complete Congo multi-capture route and automatic promotion', () => {
    expect(ClientMessage.safeParse({ type: 'move', uci: 'b2d4f6', ply: 0 }).success).toBe(true);
    expect(ClientMessage.safeParse({ type: 'move', uci: 'a6a7+', ply: 0 }).success).toBe(true);
  });

  it('still accepts ordinary moves, in-place promotions, and drops', () => {
    for (const uci of ['e2e4', 'd5d5f', 'K@e1', 'C100@a1', 'X21@b1', 'pass', 'ROLL16'])
      expect(ClientMessage.safeParse({ type: 'move', uci, ply: 0 }).success, uci).toBe(true);
    expect(ClientMessage.safeParse({
      type: 'move',
      uci: '-9007199254740993,1>-9007199254740992,1q',
      ply: 0,
    }).success).toBe(true);
    const longCoordinate = '7'.repeat(700);
    expect(ClientMessage.safeParse({ type: 'move', uci: `${longCoordinate},1>${longCoordinate},2`, ply: 0 }).success).toBe(true);
    expect(ClientMessage.safeParse({ type: 'move', uci: '1,2>1,4x', ply: 0 }).success).toBe(false);
  });

  it('rejects a move string that is not made from coordinate tokens', () => {
    expect(ClientMessage.safeParse({ type: 'move', uci: 'b2-d4!', ply: 0 }).success).toBe(false);
  });

  it('accepts retract intents and checks optional actor history alignment', () => {
    expect(ClientMessage.safeParse({ type: 'retract', index: 0, ply: 2 }).success).toBe(true);
    expect(ClientMessage.safeParse({ type: 'retract', index: -1, ply: 2 }).success).toBe(false);
    const snapshot = {
      code: 'ABCDEF', variant: 'test', serverTime: 0, status: 'playing', startFen: 'start', moves: ['a1a2'], moveActors: ['w'],
      players: { w: null, b: null }, timeControl: null, rated: false, clock: null, result: null,
      drawOfferBy: null, rematchOfferBy: null, nextCode: null, disconnect: null,
    };
    expect(GameSnapshot.parse(snapshot).moveActors).toEqual(['w']);
    expect(GameSnapshot.safeParse({ ...snapshot, moveActors: [] }).success).toBe(false);
  });
});
