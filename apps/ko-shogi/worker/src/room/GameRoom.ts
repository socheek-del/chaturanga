import { GameRoomBase } from '@chaturanga/server-kit';
import { koShogi, type Game } from '@chaturanga/ko-shogi';
import type { Env } from '../env';

/** Each private room replays and validates whole Ko Shogi turns through the product rules engine. */
export class GameRoom extends GameRoomBase<Env, Game> {
  protected readonly variant = koShogi;
}
