import { Game, PLAYERS } from '@chaturanga/fourchess';
import { expect, it } from 'vitest';
import { applyIntent, createRoom, joinRoom } from './roomState';

const move = (uci: string, ply: number) => ({ type: 'move' as const, uci, ply });
const fillRoom = () => {
  let room = createRoom('ABCDEF', 'one', 0);
  for (const user of ['two', 'three', 'four']) room = joinRoom(room, user)!.room;
  return room;
};

it('assigns four stable seats and rejects a fifth identity', () => {
  const room = fillRoom();
  expect(Object.values(room.players)).toEqual(['one', 'two', 'three', 'four']);
  expect(PLAYERS.map((seat) => room.players[seat])).toEqual(['one', 'two', 'three', 'four']);
  expect(joinRoom(room, 'three')).toEqual({ room, seat: 'y' });
  expect(joinRoom(room, 'five')).toBeNull();
});

it('validates complete seating, turn, ply and legal moves before changing state', () => {
  const waiting = createRoom('ABCDEF', 'one', 0);
  expect(applyIntent(waiting, 'r', move('d2d4', 0))).toEqual({ error: 'waiting' });
  const room = fillRoom();
  expect(applyIntent(room, 'b', move('d2d4', 0))).toEqual({ error: 'wrong-turn' });
  expect(applyIntent(room, 'r', move('d2d5', 0))).toEqual({ error: 'illegal-move' });
  const first = applyIntent(room, 'r', move('d2d4', 0));
  if (!('room' in first)) throw new Error(first.error);
  expect(new Game(first.room.fen).legalUci()).toContain('b11c11');
  expect(applyIntent(first.room, 'r', move('d2d4', 0))).toEqual({ error: 'stale' });
  const second = applyIntent(first.room, 'b', move('b11c11', 1));
  if (!('room' in second)) throw new Error(second.error);
  expect(second.room.moves).toEqual(['d2d4', 'b11c11']);
  expect(new Game(second.room.fen).turn).toBe('y');
});

it('keeps the same seat through reconnect and accepts resignation outside the turn', () => {
  const room = fillRoom();
  const result = applyIntent(room, 'g', { type: 'resign', ply: 0 });
  if (!('room' in result)) throw new Error(result.error);
  expect(result.finished).toBe(false);
  expect(new Game(result.room.fen).isActive('g')).toBe(false);
  expect(joinRoom(result.room, 'four')?.seat).toBe('g');
});
