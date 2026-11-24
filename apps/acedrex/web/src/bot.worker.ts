import { chooseMove } from '@chaturanga/acedrex-ai';

self.onmessage = (event: MessageEvent<{ startFen: string; moves: string[] }>) => {
  const { startFen, moves } = event.data;
  self.postMessage(chooseMove(startFen, moves, { deadline: Date.now() + 350 }));
};
