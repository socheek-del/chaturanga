import { createAiClient } from '@chaturanga/game-shell/ui';
import type { AiRequest } from './ai.worker';

export { AiCancelled } from '@chaturanga/game-shell/ui';

const client = createAiClient<AiRequest>(
  () => new Worker(new URL('./ai.worker.ts', import.meta.url), { type: 'module' }),
);

export const requestBotMove = (startFen: string, moves: string[], botId: number, seed: number) =>
  client.send({ startFen, moves, botId, seed });
export const cancelBotMove = () => client.cancel();
