import { createAiClient } from '@chaturanga/game-shell/ui';
import type { AiRequest } from './ai.worker';

export { AiCancelled } from '@chaturanga/game-shell/ui';

const client = createAiClient<AiRequest>(() => new Worker(new URL('./ai.worker.ts', import.meta.url), { type: 'module' }));

/** Searches off the main thread so the UI never freezes. */
export const requestComputerMove = (startFen: string, moves: string[], level: number) =>
  client.send({ kind: 'move', startFen, moves, level });

export const requestHint = (startFen: string, moves: string[]) => client.send({ kind: 'hint', startFen, moves });

export const cancelAi = (): void => client.cancel();
