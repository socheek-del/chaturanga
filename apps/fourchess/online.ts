import { z } from 'zod';
import { PLAYERS } from '@chaturanga/fourchess';

export const seats = PLAYERS;
const Seat = z.enum(seats);
const Presence = z.enum(['empty', 'online', 'offline']);

export const MoveIntent = z.discriminatedUnion('type', [
  z.object({ type: z.literal('move'), uci: z.string().regex(/^(?:[a-n](?:1[0-4]|[1-9])){2}q?$/), ply: z.number().int().nonnegative() }),
  z.object({ type: z.literal('resign'), ply: z.number().int().nonnegative() }),
]);
export type MoveIntent = z.infer<typeof MoveIntent>;

export const RoomError = z.enum(['bad-message', 'room-full', 'waiting', 'finished', 'wrong-turn', 'stale', 'illegal-move']);
export type RoomError = z.infer<typeof RoomError>;

export const RoomView = z.object({
  type: z.literal('state'),
  code: z.string(),
  you: Seat,
  presence: z.record(Seat, Presence),
  fen: z.string(),
  moves: z.array(z.string()),
});
export type RoomView = z.infer<typeof RoomView>;

export const RoomMessage = z.discriminatedUnion('type', [
  RoomView,
  z.object({ type: z.literal('error'), error: RoomError }),
]);
export type RoomMessage = z.infer<typeof RoomMessage>;
