import { app } from './app';
import type { Env } from './env';

export { Matchmaker } from './match/Matchmaker';
export { GameRoom } from './room/GameRoom';

export default {
  fetch: app.fetch,
} satisfies ExportedHandler<Env>;
