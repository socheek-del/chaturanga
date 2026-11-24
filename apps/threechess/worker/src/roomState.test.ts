import { Game, hexAt, RADIUS, SIZE, parseSquare } from '@chaturanga/threechess';
import { expect, it } from 'vitest';
import { applyMove, createRoom, joinRoom } from './roomState';

const move = (uci: string, ply: number) => ({ type: 'move' as const, uci, ply });

function fullRoom() {
  const host = createRoom('ABCDEF', 'one', 0);
  const black = joinRoom(host, 'two')!;
  return joinRoom(black.room, 'three')!.room;
}

it('reserves three stable seats and refuses a fourth identity', () => {
  const room = fullRoom();
  expect(room.players).toEqual({ w: 'one', b: 'two', r: 'three' });
  expect(joinRoom(room, 'two')).toEqual({ room, seat: 'b' });
  expect(joinRoom(room, 'four')).toBeNull();
});

it('validates startup, turn and ply before applying legal moves', () => {
  const waiting = createRoom('ABCDEF', 'one', 0);
  expect(applyMove(waiting, 'w', move('d10d9', 0))).toEqual({ error: 'waiting' });
  const room = fullRoom();
  expect(applyMove(room, 'r', move('d4e4', 0))).toEqual({ error: 'wrong-turn' });
  expect(applyMove(room, 'w', move('d10d8', 0))).toEqual({ error: 'illegal-move' });

  const first = applyMove(room, 'w', move('d10d9', 0));
  if (!('room' in first)) throw new Error(first.error);
  expect(applyMove(first.room, 'w', move('d10d9', 0))).toEqual({ error: 'stale' });
  const second = applyMove(first.room, 'b', move('j4i5', 1));
  if (!('room' in second)) throw new Error(second.error);
  const third = applyMove(second.room, 'r', move('d4e4', 2));
  if (!('room' in third)) throw new Error(third.error);
  expect(third.room.moves).toEqual(['d10d9', 'j4i5', 'd4e4']);
  expect(new Game(third.room.fen).turn).toBe('w');
});

it('settles and preserves a checkmate result and rejects subsequent moves', () => {
  const cells = Array.from({ length: SIZE * SIZE }, (_, square): string =>
    hexAt(square % SIZE - RADIUS, Math.floor(square / SIZE) - RADIUS) === null ? '.' : '-');
  cells[parseSquare('f1')!] = 'bk';
  cells[parseSquare('h1')!] = 'wk';
  cells[parseSquare('i1')!] = 'wq';
  const board = Array.from({ length: SIZE }, (_, row) => cells.slice(row * SIZE, (row + 1) * SIZE).join(',')).join('/');
  const room = { ...fullRoom(), fen: `${board} w - r -` };
  const result = applyMove(room, 'w', move('i1g2', 0));
  if (!('room' in result)) throw new Error(result.error);
  expect(result.finished).toBe(true);
  expect(new Game(result.room.fen).status()).toEqual({ kind: 'checkmate', winner: 'w' });
  expect(applyMove(result.room, 'w', move('h1h2', 1))).toEqual({ error: 'finished' });
});
