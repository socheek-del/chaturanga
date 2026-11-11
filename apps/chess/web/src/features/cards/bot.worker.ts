/// <reference lib="webworker" />
import { type BotAction, chooseAction } from './bot';
import type { CardChessState } from './rules';

/** Runs the Card Chess bot off the main thread, so the card animations never stutter while it thinks. */
export interface BotRequest {
  id: number;
  state: CardChessState;
  level: number;
}

export interface BotResponse {
  id: number;
  action: BotAction | null;
}

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<BotRequest>) => void) | null;
  postMessage: (message: BotResponse) => void;
};

scope.onmessage = (event) => {
  const { id, state, level } = event.data;
  let action: BotAction | null;
  try {
    action = chooseAction(state, level);
  } catch {
    action = null;
  }
  scope.postMessage({ id, action });
};
