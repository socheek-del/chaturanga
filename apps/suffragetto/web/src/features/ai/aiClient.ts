import { createAiClient } from '@chaturanga/game-shell/ui';
import type { AiRequest } from './ai.worker';

export { AiCancelled } from '@chaturanga/game-shell/ui';

const client = createAiClient<AiRequest>(
  () => new Worker(new URL('./ai.worker.ts', import.meta.url), { type: 'module' }),
);

/** Search in a worker so the board stays responsive. */
export const requestComputerMove = (startFen: string, moves: string[], level: number) =>
  client.send({ startFen, moves, level });
export const cancelComputerMove = () => client.cancel();
