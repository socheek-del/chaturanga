/// <reference lib="webworker" />
import { mulberry32 } from '@chaturanga/ai-core';
import { Game } from '@chaturanga/arimaa';
import { chooseMoveById } from '@chaturanga/arimaa-ai';

export interface AiRequest {
  id: number;
  startFen: string;
  moves: string[];
  botId: number;
  seed: number;
}

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<AiRequest>) => void) | null;
  postMessage: (message: { id: number; uci: string | null; score: number; depth: number; nodes: number; elapsedMs: number }) => void;
};

scope.onmessage = ({ data }) => {
  const started = performance.now();
  const game = new Game(data.startFen);
  for (const move of data.moves) game.move(move);
  const result = chooseMoveById(game, data.botId, mulberry32(data.seed));
  scope.postMessage({
    id: data.id,
    uci: result?.uci ?? null,
    score: result?.score ?? 0,
    depth: 1,
    nodes: result?.candidatesEvaluated ?? 0,
    elapsedMs: performance.now() - started,
  });
};
