import { createAiClient } from '@chaturanga/game-shell/ui';
import type { AiRequest } from './ai.worker';

export { AiCancelled } from '@chaturanga/game-shell/ui';

const client = createAiClient<AiRequest>(
  () => new Worker(new URL('./ai.worker.ts', import.meta.url), { type: 'module' }),
);

export const requestComputerMove = (startFen: string, moves: string[], level: number, seed: number) =>
  client.send({ startFen, moves, level, seed });
export const cancelComputerMove = () => client.cancel();
