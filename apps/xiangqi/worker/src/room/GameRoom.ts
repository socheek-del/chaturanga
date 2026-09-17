import { GameRoomBase, type RoomState } from '@chaturanga/server-kit';
import { xiangqi } from '@chaturanga/xiangqi';
import { recordGame } from '../games';
import type { Env } from '../env';

/**
 * The Xiangqi game room: the shared room Durable Object playing Xiangqi. Every move is replayed through the
 * Xiangqi engine before it is accepted, so the server also decides stalemate, perpetual check and chase.
 */
export class GameRoom extends GameRoomBase<Env> {
  protected readonly variant = xiangqi;

  protected override async onFinished(room: RoomState): Promise<void> {
    await recordGame(this.env.DB, room, Date.now());
  }
}
