import { chooseMove, type BotChoice, type BotLevel } from '@chaturanga/infinite-chess-ai';

interface BotRequest { fen: string; seed: number; level: BotLevel }

self.onmessage = (event: MessageEvent<BotRequest>) => {
  let choice: BotChoice | null;
  try {
    choice = chooseMove(event.data.fen, { seed: event.data.seed, level: event.data.level });
  } catch {
    self.postMessage(null);
    return;
  }
  self.postMessage(choice);
};
