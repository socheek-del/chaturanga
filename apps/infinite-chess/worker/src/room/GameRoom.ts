import { GameRoomBase } from '@chaturanga/server-kit';
import { infiniteChess, type Game } from '@chaturanga/infinite-chess';
import type { Env } from '../env';

/** Rooms persist independently and validate every submitted coordinate through the Infinite Chess rules. */
export class GameRoom extends GameRoomBase<Env, Game> {
  protected readonly variant = infiniteChess;
}
