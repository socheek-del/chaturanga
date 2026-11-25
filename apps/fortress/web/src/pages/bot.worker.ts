import { chooseMove } from '@chaturanga/fortress-ai';

self.onmessage = (event: MessageEvent<{ fen: string; maxNodes: number }>) => {
  self.postMessage(
    chooseMove(event.data.fen, {
      maxNodes: event.data.maxNodes,
      maxDepth: 3,
      deadline: Date.now() + 1050,
    }),
  );
};
