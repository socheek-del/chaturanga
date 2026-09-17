/// <reference lib="webworker" />
import { Game } from '@chaturanga/xiangqi';
import { bestMove, chooseMove, positionKey } from '@chaturanga/xiangqi-ai';

/** The whole game, not just the position: Xiangqi repetitions are judged by what both sides did (xq-003). */
export type AiRequest =
  | { id: number; kind: 'move'; startFen: string; moves: string[]; level: number }
  | { id: number; kind: 'hint'; startFen: string; moves: string[] };

export interface AiResponse {
  id: number;
  uci: string | null;
  score: number;
  depth: number;
  nodes: number;
  elapsedMs: number;
}

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<AiRequest>) => void) | null;
  postMessage: (message: AiResponse) => void;
};

scope.onmessage = (event) => {
  const request = event.data;
  const started = performance.now();
  const game = new Game(request.startFen);
  const history = [positionKey(game.fen())];
  for (const uci of request.moves) history.push(positionKey(game.move(uci).fenAfter));
  const fen = game.fen();
  const move =
    request.kind === 'move'
      ? chooseMove(fen, request.level, { history, game })
      : bestMove(fen, { maxDepth: 4, maxNodes: 300_000, timeMs: 1_500, history, game });
  scope.postMessage({
    id: request.id,
    uci: move?.uci ?? null,
    score: move?.score ?? 0,
    depth: move?.depth ?? 0,
    nodes: move?.nodes ?? 0,
    elapsedMs: performance.now() - started,
  });
};
