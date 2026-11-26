import { chooseMove } from '@chaturanga/chaturaji-ai';

interface BotRequest { fen: string; seed: number; level: number }
const worker = self as unknown as { onmessage: ((event: MessageEvent<BotRequest>) => void) | null; postMessage(value: string | null): void };
worker.onmessage = (event) => {
  const { fen, seed, level } = event.data;
  worker.postMessage(chooseMove(fen, { seed, level }));
};
