import { GameRoomBase, type RoomState } from '@chaturanga/server-kit';
import { jesonMor } from '@chaturanga/jesonmor';
import { recordGame } from '../games';
import type { Env } from '../env';

/** Every online move is replayed and validated through the Jeson Mor rules engine. */
export class GameRoom extends GameRoomBase<Env> {
  protected readonly variant = jesonMor;

  protected override async onFinished(room: RoomState): Promise<void> {
    await recordGame(this.env.DB, room, Date.now());
  }
}
