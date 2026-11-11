import { type BotAction, chooseAction } from './bot';
import type { BotRequest, BotResponse } from './bot.worker';
import type { CardChessState } from './rules';

let worker: Worker | null = null;
let nextId = 0;
const waiting = new Map<number, (action: BotAction | null) => void>();

function getWorker(): Worker | null {
  if (worker || typeof Worker !== 'function') return worker;
  try {
    worker = new Worker(new URL('./bot.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<BotResponse>) => {
      waiting.get(event.data.id)?.(event.data.action);
      waiting.delete(event.data.id);
    };
  } catch {
    worker = null;
  }
  return worker;
}

/** Asks the bot for its action in a Web Worker; falls back to the main thread where workers are missing. */
export function requestBotAction(state: CardChessState, level: number): Promise<BotAction | null> {
  const w = getWorker();
  if (!w) return Promise.resolve(chooseAction(state, level));
  const id = ++nextId;
  return new Promise((resolve) => {
    waiting.set(id, resolve);
    w.postMessage({ id, state, level } satisfies BotRequest);
  });
}
