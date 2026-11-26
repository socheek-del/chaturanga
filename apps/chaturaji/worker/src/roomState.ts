import { createSeededStartFen, Game, IllegalMoveError, PLAYERS, type Player } from '@chaturanga/chaturaji';
import { seats, type MoveIntent, type RoomError } from '../../online';

export interface RoomState {
  code: string;
  createdAt: number;
  players: Record<Player, string | null>;
  startFen: string;
  fen: string;
  moves: string[];
}

export function createRoom(code: string, host: string, createdAt: number, seed: number): RoomState {
  const startFen = createSeededStartFen(seed);
  return { code, createdAt, players: { r: host, g: null, y: null, b: null }, startFen, fen: startFen, moves: [] };
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

/** Apply one player action, then let the server create and record the next dice result. */
export function applyIntent(room: RoomState, player: Player, intent: MoveIntent, nextRollSeed: number):
  { room: RoomState; finished: boolean } | { error: RoomError } {
  if (PLAYERS.some((seat) => !room.players[seat])) return { error: 'waiting' };
  const game = new Game(room.fen);
  if (game.isGameOver()) return { error: 'finished' };
  if (intent.revision !== room.moves.length) return { error: 'stale' };
  if (game.turn !== player) return { error: 'wrong-turn' };
  try {
    const record = game.move(intent.uci);
    const moves = [...room.moves, record.uci];
    if (!game.isGameOver() && game.dice === null) {
      const roll = game.prepareTurn(nextRollSeed);
      if (roll) moves.push(roll.uci);
    }
    return { room: { ...room, fen: game.fen(), moves }, finished: game.isGameOver() };
  } catch (error) {
    if (error instanceof IllegalMoveError) return { error: 'illegal-move' };
    throw error;
  }
}
