import { GameRoomBase, type RoomState } from '@chaturanga/server-kit';
import { chuShogiVariant } from '@chaturanga/chu-shogi';
import { recordGame } from '../games';
import type { Env } from '../env';

/** Every online move is replayed and validated through the Chu Shogi rules engine. */
export class GameRoom extends GameRoomBase<Env> {
  protected readonly variant = chuShogiVariant;

  protected override async onFinished(room: RoomState): Promise<void> {
    await recordGame(this.env.DB, room, Date.now());
  }
}
