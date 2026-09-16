/**
 * Pure game-room logic for online play, for any rules Variant. The Durable Object is a thin wrapper
 * that loads state, calls these functions with the current time, persists and broadcasts. Keeping the
 * rules here makes clocks, abandonment and validation unit-testable with explicit timestamps.
 */
import type { ClientMessage, Color, ErrorCode, GameResult, GameSnapshot, PublicUser, TimeControl } from '@chaturanga/protocol';
import {
  type ClockState,
  createClock,
  flaggedSide,
  flagTime,
  IllegalMoveError,
  pressClock,
  resultFromStatus,
  runFor,
  stopClock,
  timesAt,
  type Variant,
  type VariantGame,
} from '@chaturanga/rules-core';

export interface RoomState {
  code: string;
  /** The variant this room plays; snapshots carry it so a client can pick the matching engine. */
  variant: string;
  createdAt: number;
  startFen: string;
  moves: string[];
  players: Record<Color, PublicUser | null>;
  timeControl: TimeControl | null;
  /** Counts for ratings when both players are signed in (acct-003). */
  rated: boolean;
  clock: ClockState | null;
  result: GameResult | null;
  drawOfferBy: Color | null;
  rematchOfferBy: Color | null;
  nextCode: string | null;
  disconnect: { color: Color; at: number } | null;
}

export const other = (c: Color): Color => (c === 'w' ? 'b' : 'w');

export function createRoom(
  variant: Variant,
  options: {
    code: string;
    creator: PublicUser;
    color: Color;
    timeControl: TimeControl | null;
    now: number;
    opponent?: PublicUser;
    rated?: boolean;
  },
): RoomState {
  const players: Record<Color, PublicUser | null> = { w: null, b: null };
  players[options.color] = options.creator;
  if (options.opponent) players[other(options.color)] = options.opponent;
  const room: RoomState = {
    code: options.code,
    variant: variant.id,
    createdAt: options.now,
    startFen: variant.startFen,
    moves: [],
    players,
    timeControl: options.timeControl,
    rated: options.rated ?? false,
    clock: null,
    result: null,
    drawOfferBy: null,
    rematchOfferBy: null,
    nextCode: null,
    disconnect: null,
  };
  return options.opponent ? startIfReady(variant, room, options.now) : room;
}

export function roomStatus(room: RoomState): GameSnapshot['status'] {
  if (room.result) return 'finished';
  return room.players.w && room.players.b ? 'playing' : 'waiting';
}

export function replay(variant: Variant, room: RoomState): VariantGame {
  const game = variant.createGame(room.startFen);
  for (const move of room.moves) game.move(move);
  return game;
}

export function seatOf(room: RoomState, userId: string): Color | null {
  if (room.players.w?.id === userId) return 'w';
  if (room.players.b?.id === userId) return 'b';
  return null;
}

/** True while pieces are still being placed from hand (the Sittuyin setup phase). */
function inSetup(game: VariantGame): boolean {
  return game.hand('w').length + game.hand('b').length > 0;
}

/**
 * Both seats are taken: create the clock. Clocks do not run while pieces are being placed, so a game
 * that opens with a setup phase gets a stopped clock that starts after the last placement.
 */
function startIfReady(variant: Variant, room: RoomState, now: number): RoomState {
  if (!room.players.w || !room.players.b || room.clock || !room.timeControl) return room;
  const game = replay(variant, room);
  const clock = createClock(room.timeControl.initialMs, now, game.turn);
  return { ...room, clock: inSetup(game) ? stopClock(clock, now) : clock };
}

function finish(room: RoomState, result: GameResult, now: number): RoomState {
  return {
    ...room,
    result,
    clock: room.clock ? stopClock(room.clock, now) : null,
    drawOfferBy: null,
    disconnect: null,
  };
}

/** Joins or rejoins a room. Returns the user's seat (null = spectator). */
export function join(variant: Variant, room: RoomState, user: PublicUser, now: number): { room: RoomState; color: Color | null } {
  const seated = seatOf(room, user.id);
  if (seated) {
    const back = room.disconnect?.color === seated ? { ...room, disconnect: null } : room;
    return { room: back, color: seated };
  }
  if (roomStatus(room) !== 'waiting') return { room, color: null };
  const color: Color = room.players.w ? 'b' : 'w';
  const seatedRoom = { ...room, players: { ...room.players, [color]: user } };
  return { room: startIfReady(variant, seatedRoom, now), color };
}

/** Applies time-based outcomes: flag fall and abandonment after the reconnect grace period. */
export function settle(room: RoomState, now: number): RoomState {
  if (roomStatus(room) !== 'playing') return room;
  if (room.clock) {
    const flagged = flaggedSide(room.clock, now);
    if (flagged) return finish(room, { winner: other(flagged), reason: 'timeout' }, now);
  }
  if (room.disconnect && now >= room.disconnect.at) {
    return finish(room, { winner: other(room.disconnect.color), reason: 'abandon' }, now);
  }
  return room;
}

/** A player's last connection closed: start the reconnect grace period. */
export function leave(room: RoomState, color: Color, now: number, graceMs: number): RoomState {
  if (roomStatus(room) !== 'playing' || room.disconnect) return room;
  return { ...room, disconnect: { color, at: now + graceMs } };
}

export interface ApplyResult {
  room: RoomState;
  error?: ErrorCode;
  /** Both players asked for a rematch: the caller must create room `room.nextCode` with swapped colours. */
  rematch?: boolean;
}

export function applyMessage(
  variant: Variant,
  current: RoomState,
  color: Color | null,
  message: ClientMessage,
  now: number,
  newCode: () => string,
): ApplyResult {
  const room = settle(current, now);
  const status = roomStatus(room);
  if (message.type === 'ping') return { room };
  if (!color) return { room, error: 'not_a_player' };

  switch (message.type) {
    case 'move': {
      if (status === 'finished') return { room, error: 'game_over' };
      if (status === 'waiting') return { room, error: 'game_not_started' };
      const game = replay(variant, room);
      if (game.turn !== color) return { room, error: 'not_your_turn' };
      if (message.ply !== room.moves.length) return { room, error: 'stale_ply' };
      const placing = inSetup(game);
      let uci: string;
      try {
        uci = game.move(message.uci).uci;
      } catch (err) {
        if (err instanceof IllegalMoveError) return { room, error: 'illegal_move' };
        throw err;
      }
      let clock = room.clock;
      if (clock && room.timeControl) {
        // A placement never presses the clock; the last one starts it for the side to move.
        if (!placing) clock = pressClock(clock, color, now, room.timeControl.incrementMs);
        else if (!inSetup(game)) clock = runFor(clock, game.turn, now);
      }
      const moved: RoomState = { ...room, moves: [...room.moves, uci], clock, drawOfferBy: null };
      const result = resultFromStatus(game.status());
      return { room: result ? finish(moved, result, now) : moved };
    }
    case 'resign':
      if (status !== 'playing') return { room, error: status === 'finished' ? 'game_over' : 'game_not_started' };
      return { room: finish(room, { winner: other(color), reason: 'resign' }, now) };
    case 'offerDraw':
      if (status !== 'playing') return { room, error: 'game_over' };
      return { room: room.drawOfferBy ? room : { ...room, drawOfferBy: color } };
    case 'acceptDraw':
      if (status !== 'playing' || room.drawOfferBy !== other(color)) return { room };
      return { room: finish(room, { winner: null, reason: 'agreement' }, now) };
    case 'declineDraw':
      return { room: room.drawOfferBy === other(color) ? { ...room, drawOfferBy: null } : room };
    case 'rematch':
      if (status !== 'finished' || room.nextCode) return { room };
      if (room.rematchOfferBy === other(color)) return { room: { ...room, nextCode: newCode(), rematchOfferBy: null }, rematch: true };
      return { room: { ...room, rematchOfferBy: color } };
  }
}

/** When the Durable Object alarm should fire next (flag fall or end of grace period). */
export function nextAlarm(room: RoomState): number | null {
  if (roomStatus(room) !== 'playing') return null;
  const times = [room.clock ? flagTime(room.clock) : null, room.disconnect?.at ?? null].filter((t): t is number => t !== null);
  return times.length ? Math.min(...times) : null;
}

export function snapshot(room: RoomState, now: number, connected: Record<Color, boolean>): GameSnapshot {
  const times = room.clock ? timesAt(room.clock, now) : null;
  const seat = (c: Color) => (room.players[c] ? { ...room.players[c]!, connected: connected[c] } : null);
  return {
    code: room.code,
    variant: room.variant,
    serverTime: now,
    status: roomStatus(room),
    startFen: room.startFen,
    moves: room.moves,
    players: { w: seat('w'), b: seat('b') },
    timeControl: room.timeControl,
    rated: room.rated,
    clock: room.clock && times ? { w: times.w, b: times.b, running: room.clock.running, serverTime: now } : null,
    result: room.result,
    drawOfferBy: room.drawOfferBy,
    rematchOfferBy: room.rematchOfferBy,
    nextCode: room.nextCode,
    disconnect: room.disconnect,
  };
}
