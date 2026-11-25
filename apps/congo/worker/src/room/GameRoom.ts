import { GameRoomBase, type RoomState } from '@chaturanga/server-kit';
import { congo } from '@chaturanga/congo';
import { recordGame } from '../games';
import type { Env } from '../env';

/** Every room move and Monkey route is replayed through the Congo engine. */
export class GameRoom extends GameRoomBase<Env> {
  protected readonly variant = congo;

  protected override async onFinished(room: RoomState): Promise<void> {
    await recordGame(this.env.DB, room, Date.now());
  }
}
