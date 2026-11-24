import { chooseMove } from '@chaturanga/threechess-ai';

self.onmessage = (event: MessageEvent<{ fen: string; earlierFens: string[] }>) => {
  self.postMessage(chooseMove(event.data.fen, {
    earlierFens: event.data.earlierFens,
    deadline: Date.now() + 650,
  }));
};
