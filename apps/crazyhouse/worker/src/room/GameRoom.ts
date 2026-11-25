import { GameRoomBase, type RoomState } from '@chaturanga/server-kit';
import { crazyhouse } from '@chaturanga/crazyhouse';
import { recordGame } from '../games';
import type { Env } from '../env';

/** Every room move is replayed through the Crazyhouse engine, including pocket drops. */
export class GameRoom extends GameRoomBase<Env> {
  protected readonly variant = crazyhouse;

  protected override async onFinished(room: RoomState): Promise<void> {
    await recordGame(this.env.DB, room, Date.now());
  }
}
