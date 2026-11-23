import { GameRoomBase, type RoomState } from '@chaturanga/server-kit';
import { janggi } from '@chaturanga/janggi';
import { recordGame } from '../games';
import type { Env } from '../env';

/**
 * The Janggi game room: the shared room Durable Object playing Janggi. Every move is replayed through the
 * Janggi engine before it is accepted, so the server also decides bikjang, passes, repetition and points.
 */
export class GameRoom extends GameRoomBase<Env> {
  protected readonly variant = janggi;

  protected override async onFinished(room: RoomState): Promise<void> {
    await recordGame(this.env.DB, room, Date.now());
  }
}
