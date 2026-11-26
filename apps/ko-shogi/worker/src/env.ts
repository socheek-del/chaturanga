import type { GameRoom } from './room/GameRoom';
import type { Matchmaker } from './match/Matchmaker';

export interface Env {
  ASSETS: Fetcher;
  GAME_ROOM: DurableObjectNamespace<GameRoom>;
  MATCHMAKER: DurableObjectNamespace<Matchmaker>;
  AUTH_SECRET: string;
  RECONNECT_GRACE_MS?: string;
}
