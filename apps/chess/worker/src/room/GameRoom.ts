import { GameRoomBase, type RoomState } from '@chaturanga/server-kit';
import { chess } from '@chaturanga/chess';
import { recordGame } from '../games';
import type { Env } from '../env';

/**
 * The Chess game room: the shared room Durable Object playing Chess. Every move is replayed through the
 * Chess engine before it is accepted, so the server also decides stalemate, perpetual check and chase.
 */
export class GameRoom extends GameRoomBase<Env> {
  protected readonly variant = chess;

  protected override async onFinished(room: RoomState): Promise<void> {
    await recordGame(this.env.DB, room, Date.now());
  }
}
