import type { Matchmaker } from './match/Matchmaker';
import type { GameRoom } from './room/GameRoom';

export interface Env {
  ASSETS: Fetcher;
  GAME_ROOM: DurableObjectNamespace<GameRoom>;
  MATCHMAKER: DurableObjectNamespace<Matchmaker>;
  DB: D1Database;
  AUTH_SECRET: string;
  RECONNECT_GRACE_MS?: string;
}
