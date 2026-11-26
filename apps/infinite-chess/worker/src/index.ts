import { app } from './app';
import type { Env } from './env';

export { GameRoom } from './room/GameRoom';
export { Matchmaker } from './match/Matchmaker';

export default { fetch: app.fetch } satisfies ExportedHandler<Env>;
