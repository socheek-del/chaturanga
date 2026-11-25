import { GameRoomBase, type RoomState } from '@chaturanga/server-kit';
import { dameo } from '@chaturanga/dameo';
import { recordGame } from '../games';
import type { Env } from '../env';

/** Every online move is replayed and validated through the Dameo rules engine. */
export class GameRoom extends GameRoomBase<Env> {
  protected readonly variant = dameo;

  protected override async onFinished(room: RoomState): Promise<void> {
    await recordGame(this.env.DB, room, Date.now());
  }
}
