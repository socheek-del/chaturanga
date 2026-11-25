import { GameRoomBase, type RoomState } from '@chaturanga/server-kit';
import { suffragetto } from '@chaturanga/suffragetto';
import { recordGame } from '../games';
import type { Env } from '../env';

/** Every online move or exchange is replayed and validated through the Suffragetto rules engine. */
export class GameRoom extends GameRoomBase<Env> {
  protected readonly variant = suffragetto;

  protected override async onFinished(room: RoomState): Promise<void> {
    await recordGame(this.env.DB, room, Date.now());
  }
}
