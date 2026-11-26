import { chooseMove, type BotOptions } from '@chaturanga/senterej-ai';
import type { Color } from '@chaturanga/rules-core';

interface AiRequest extends BotOptions {
  fen: string;
  color: Color;
}

self.addEventListener('message', (event: MessageEvent<AiRequest>) => {
  const request = event.data;
  self.postMessage(chooseMove(request.fen, request.color, request));
});
