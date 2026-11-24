import { Game, IllegalMoveError, threechess, type Player } from '@chaturanga/threechess';
import { seats, type MoveIntent, type RoomError } from '../../online';

export interface RoomState {
  code: string;
  createdAt: number;
  players: Record<Player, string | null>;
  fen: string;
  moves: string[];
}

export function createRoom(code: string, host: string, createdAt: number): RoomState {
  return { code, createdAt, players: { w: host, b: null, r: null }, fen: threechess.startFen, moves: [] };
}

export function seatFor(room: RoomState, user: string): Player | undefined {
  return seats.find((seat) => room.players[seat] === user);
}

export function joinRoom(room: RoomState, user: string): { room: RoomState; seat: Player } | null {
  const existing = seatFor(room, user);
  if (existing) return { room, seat: existing };
  const seat = seats.find((player) => room.players[player] === null);
  if (!seat) return null;
  return { room: { ...room, players: { ...room.players, [seat]: user } }, seat };
}

export function applyMove(room: RoomState, player: Player, move: MoveIntent):
  { room: RoomState; finished: boolean } | { error: RoomError } {
  if (seats.some((seat) => !room.players[seat])) return { error: 'waiting' };
  const game = new Game(room.fen);
  if (game.isGameOver()) return { error: 'finished' };
  if (move.ply !== room.moves.length) return { error: 'stale' };
  if (game.turn !== player) return { error: 'wrong-turn' };
  try {
    const record = game.move(move.uci);
    return {
      room: { ...room, fen: game.fen(), moves: [...room.moves, record.uci] },
      finished: game.isGameOver(),
    };
  } catch (error) {
    if (error instanceof IllegalMoveError) return { error: 'illegal-move' };
    throw error;
  }
}
