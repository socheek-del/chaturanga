/// <reference lib="webworker" />
import { Game } from '@chaturanga/ko-shogi';
import { chooseMove, mulberry32, positionKey } from '@chaturanga/ko-shogi-ai';

export type AiRequest = { id: number; startFen: string; moves: string[]; level: number; seed: number };
export type AiResponse = { id: number; uci: string | null; score: number; depth: number; nodes: number; elapsedMs: number };

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<AiRequest>) => void) | null;
  postMessage: (message: AiResponse) => void;
};

scope.onmessage = ({ data }) => {
  const started = performance.now();
  const game = Game.replay(data.startFen, data.moves);
  const history = [positionKey(data.startFen), ...game.moves().map(({ fenAfter }) => positionKey(fenAfter))];
  const result = chooseMove(game.fen(), data.level, {
    history,
    game,
    rng: mulberry32(data.seed),
  });
  scope.postMessage({
    id: data.id,
    uci: result?.uci ?? null,
    score: result?.score ?? 0,
    depth: result?.depth ?? 0,
    nodes: result?.nodes ?? 0,
    elapsedMs: performance.now() - started,
  });
};
