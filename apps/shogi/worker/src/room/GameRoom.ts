import { GameRoomBase, type RoomState } from '@chaturanga/server-kit';
import { shogi } from '@chaturanga/shogi';
import { recordGame } from '../games';
import type { Env } from '../env';

/**
 * The Shogi game room: the shared room Durable Object playing Shogi. Every move is replayed through the
 * Shogi engine before it is accepted, so the server also decides stalemate, perpetual check and chase.
 */
export class GameRoom extends GameRoomBase<Env> {
  protected readonly variant = shogi;

  protected override async onFinished(room: RoomState): Promise<void> {
    await recordGame(this.env.DB, room, Date.now());
  }
}
