import { arimaa } from '@chaturanga/arimaa';
import { GameRoomBase, type RoomState } from '@chaturanga/server-kit';
import { recordGame } from '../games';
import type { Env } from '../env';

/** Every setup placement and complete turn is replayed through the authoritative Arimaa Variant. */
export class GameRoom extends GameRoomBase<Env> {
  protected readonly variant = arimaa;

  protected override async onFinished(room: RoomState): Promise<void> {
    await recordGame(this.env.DB, room, Date.now());
  }
}
