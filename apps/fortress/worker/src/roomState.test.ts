import { Game } from '@chaturanga/fortress';
import { expect, it } from 'vitest';
import { MoveIntent } from '../../online';
import { applyMove, createRoom, joinRoom } from './roomState';

const move = (uci: string, ply: number) => ({ type: 'move' as const, uci, ply });

it('accepts complete Fortress coordinate, promotion and reserve move encodings', () => {
  for (const uci of ['e13e11', 'e4e3q', 'B@a13', 'N@p16', 'R@a1']) {
    expect(MoveIntent.safeParse(move(uci, 0)).success, uci).toBe(true);
  }
  for (const uci of ['e13e111', 'z1a2', 'P@a13', 'e13-e11']) {
    expect(MoveIntent.safeParse(move(uci, 0)).success, uci).toBe(false);
  }
});

function fullRoom() {
  let room = createRoom('ABCDEF', 'one', 0);
  for (const user of ['two', 'three', 'four']) room = joinRoom(room, user)!.room;
  return room;
}

it('reserves four stable seats and refuses a fifth identity', () => {
  const room = fullRoom();
  expect(room.players).toEqual({ r: 'one', b: 'two', w: 'three', k: 'four' });
  expect(joinRoom(room, 'three')).toEqual({ room, seat: 'w' });
  expect(joinRoom(room, 'five')).toBeNull();
});

it('validates the setup phase, turn and ply before accepting a move', () => {
  const waiting = createRoom('ABCDEF', 'one', 0);
  expect(applyMove(waiting, 'r', move('B@a13', 0))).toEqual({ error: 'waiting' });
  const room = fullRoom();
  expect(applyMove(room, 'b', move('B@a13', 0))).toEqual({ error: 'wrong-turn' });
  expect(applyMove(room, 'r', move('B@e5', 0))).toEqual({ error: 'illegal-move' });
  const first = applyMove(room, 'r', move('B@a13', 0));
  if (!('room' in first)) throw new Error(first.error);
  expect(applyMove(first.room, 'r', move('N@b13', 0))).toEqual({ error: 'stale' });
  const second = applyMove(first.room, 'r', move('N@b13', 1));
  if (!('room' in second)) throw new Error(second.error);
  expect(new Game(second.room.fen).turn).toBe('r');
  expect(second.room.moves).toEqual(['B@a13', 'N@b13']);
});

it('replays accepted moves through the rules engine before allowing the next seat', () => {
  let room = fullRoom();
  const opening = [
    'B@a13',
    'N@b13',
    'R@c13',
    'B@m13',
    'N@n13',
    'R@o13',
    'B@m1',
    'N@n1',
    'R@o1',
    'B@a1',
    'N@b1',
    'R@c1',
  ];
  const movingSeats = ['r', 'r', 'r', 'b', 'b', 'b', 'w', 'w', 'w', 'k', 'k', 'k'] as const;
  for (let ply = 0; ply < opening.length; ply++) {
    const result = applyMove(room, movingSeats[ply]!, move(opening[ply]!, ply));
    if (!('room' in result)) throw new Error(result.error);
    room = result.room;
  }
  expect(new Game(room.fen).turn).toBe('r');
  const result = applyMove(room, 'r', move('e13e11', 12));
  if (!('room' in result)) throw new Error(result.error);
  expect(new Game(result.room.fen).turn).toBe('b');
  expect(result.room.moves.at(-1)).toBe('e13e11');
});
