import { GameRoomBase, type RoomState } from '@chaturanga/server-kit';
import { senterej } from '@chaturanga/senterej';
import { recordGame } from '../games';
import type { Env } from '../env';

/** The shared room validates every accepted actor-tagged action through the Senterej engine. */
export class GameRoom extends GameRoomBase<Env> {
  protected readonly variant = senterej;

  protected override async onFinished(room: RoomState): Promise<void> {
    await recordGame(this.env.DB, room, Date.now());
  }
}
