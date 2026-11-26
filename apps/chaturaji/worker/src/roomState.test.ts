import { Game, PLAYERS } from '@chaturanga/chaturaji';
import { expect, it } from 'vitest';
import { applyIntent, createRoom, joinRoom } from './roomState';

const intent = (uci: string, revision: number) => ({ type: 'move' as const, uci, revision });
const fillRoom = () => {
  let room = createRoom('ABCDEF', 'one', 0, 12);
  for (const user of ['two', 'three', 'four']) room = joinRoom(room, user)!.room;
  return room;
};

it('assigns four stable seats, restores the same seat, and rejects a fifth identity', () => {
  const room = fillRoom();
  expect(PLAYERS.map((seat) => room.players[seat])).toEqual(['one', 'two', 'three', 'four']);
  expect(joinRoom(room, 'three')).toEqual({ room, seat: 'y' });
  expect(joinRoom(room, 'five')).toBeNull();
});

it('waits for all four seats and validates the active controller, revision and legal action', () => {
  const waiting = createRoom('ABCDEF', 'one', 0, 12);
  const firstMove = new Game(waiting.fen).legalUci().find((move) => move !== 'pass')!;
  expect(applyIntent(waiting, 'r', intent(firstMove, 0), 99)).toEqual({ error: 'waiting' });

  const room = fillRoom();
  const legal = new Game(room.fen).legalUci().find((move) => move !== 'pass')!;
  expect(applyIntent(room, 'g', intent(legal, 0), 99)).toEqual({ error: 'wrong-turn' });
  expect(applyIntent(room, 'r', intent('a1h8', 0), 99)).toEqual({ error: 'illegal-move' });
  const first = applyIntent(room, 'r', intent(legal, 0), 99);
  if (!('room' in first)) throw new Error(first.error);
  expect(new Game(first.room.fen).dieIndex).toBe(1);
  expect(applyIntent(first.room, 'r', intent(legal, 0), 99)).toEqual({ error: 'stale' });
});

it('records both die actions and the server-generated next roll for deterministic replay', () => {
  let room = fillRoom();
  let game = new Game(room.fen);
  const first = game.legalUci().find((move) => move !== 'pass')!;
  const acceptedFirst = applyIntent(room, 'r', intent(first, 0), 123);
  if (!('room' in acceptedFirst)) throw new Error(acceptedFirst.error);
  room = acceptedFirst.room;
  game = new Game(room.fen);
  const second = game.legalUci()[0]!;
  const acceptedSecond = applyIntent(room, 'r', intent(second, 1), 456);
  if (!('room' in acceptedSecond)) throw new Error(acceptedSecond.error);
  room = acceptedSecond.room;
  expect(room.moves).toHaveLength(3);
  expect(room.moves[2]).toMatch(/^ROLL[1-6]{2}$/);
  const replay = new Game(room.startFen);
  for (const move of room.moves) replay.move(move);
  expect(replay.fen()).toBe(room.fen);
  expect(replay.turn).toBe('g');
  expect(replay.dice).not.toBeNull();
});
