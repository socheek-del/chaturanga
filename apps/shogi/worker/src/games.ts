import type { RoomState } from '@chaturanga/server-kit';

/** Stores a finished game once; a second call for the same room is ignored. */
export async function recordGame(db: D1Database, room: RoomState, finishedAt: number): Promise<boolean> {
  const { w: white, b: black } = room.players;
  if (!white || !black || !room.result) return false;
  const insert = await db
    .prepare(
      `INSERT OR IGNORE INTO games (id, code, variant, white_id, black_id, start_fen, moves, time_control, winner, reason, finished_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      `${room.code}-${room.createdAt}`,
      room.code,
      room.variant,
      white.id,
      black.id,
      room.startFen,
      room.moves.join(' '),
      room.timeControl ? JSON.stringify(room.timeControl) : null,
      room.result.winner,
      room.result.reason,
      finishedAt,
    )
    .run();
  return insert.meta.changes > 0;
}
