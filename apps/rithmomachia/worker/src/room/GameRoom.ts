import { GameRoomBase, type RoomState } from '@chaturanga/server-kit';
import { rithmomachia } from '@chaturanga/rithmomachia';
import { recordGame } from '../games';
import type { Env } from '../env';

/** Every online move is replayed and validated through the Rithmomachia rules engine. */
export class GameRoom extends GameRoomBase<Env> {
  protected readonly variant = rithmomachia;

  protected override async onFinished(room: RoomState): Promise<void> {
    await recordGame(this.env.DB, room, Date.now());
  }
}
