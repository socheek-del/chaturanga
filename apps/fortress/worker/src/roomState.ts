import { Game, FortressIllegalMoveError, fortress, type Seat } from '@chaturanga/fortress';
import { IllegalMoveError } from '@chaturanga/rules-core';
import { seats, type MoveIntent, type RoomError } from '../../online';

export interface RoomState {
  code: string;
  createdAt: number;
  players: Record<Seat, string | null>;
  fen: string;
  moves: string[];
}

export function createRoom(code: string, host: string, createdAt: number): RoomState {
  return {
    code,
    createdAt,
    players: { r: host, b: null, w: null, k: null },
    fen: fortress.startFen,
    moves: [],
  };
}

export function seatFor(room: RoomState, user: string): Seat | undefined {
  return seats.find((seat) => room.players[seat] === user);
}

export function joinRoom(room: RoomState, user: string): { room: RoomState; seat: Seat } | null {
  const existing = seatFor(room, user);
  if (existing) return { room, seat: existing };
  const seat = seats.find((player) => room.players[player] === null);
  if (!seat) return null;
  return { room: { ...room, players: { ...room.players, [seat]: user } }, seat };
}

export function applyMove(
  room: RoomState,
  player: Seat,
  move: MoveIntent,
): { room: RoomState; finished: boolean } | { error: RoomError } {
  if (seats.some((seat) => !room.players[seat])) return { error: 'waiting' };
  if (move.ply !== room.moves.length) return { error: 'stale' };
  let game: Game;
  try {
    game = new Game(fortress.startFen);
    for (const uci of room.moves) game.move(uci);
  } catch {
    return { error: 'stale' };
  }
  if (game.fen() !== room.fen) return { error: 'stale' };
  if (game.isGameOver()) return { error: 'finished' };
  if (game.turn !== player) return { error: 'wrong-turn' };
  try {
    const record = game.move(move.uci);
    return {
      room: { ...room, fen: game.fen(), moves: [...room.moves, record.uci] },
      finished: game.isGameOver(),
    };
  } catch (error) {
    if (error instanceof IllegalMoveError || error instanceof FortressIllegalMoveError)
      return { error: 'illegal-move' };
    throw error;
  }
}
