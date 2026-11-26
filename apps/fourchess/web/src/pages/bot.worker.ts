import { chooseMove } from '@chaturanga/fourchess-ai';

self.addEventListener('message', (event: MessageEvent<{ fen: string; seed: number; maxNodes: number }>) => {
  self.postMessage(chooseMove(event.data.fen, { seed: event.data.seed, maxNodes: event.data.maxNodes }));
});
