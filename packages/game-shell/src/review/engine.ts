import { negate, parseBestMove, parseInfo, type InfoLine, type Score } from './uci';

/** One engine line: the score from White's side, and the moves it expects. */
export interface EngineLine {
  score: Score;
  pv: string[];
}

/** What the engine thinks of one position: its best line first, then the runner-up when there is one. */
export interface PositionEval {
  fen: string;
  depth: number;
  lines: EngineLine[];
}

/** How the engine is reached: a Web Worker in the browser, a child process in tests. */
export interface UciTransport {
  send(command: string): void;
  onLine(listener: (line: string) => void): void;
  terminate(): void;
}

export interface SearchLimits {
  depth: number;
  /** A ceiling per position, so one hard position cannot stall a review. */
  movetime: number;
}

/** Enough for a trustworthy label and quick on a phone (ch-015). */
export const REVIEW_LIMITS: SearchLimits = { depth: 14, movetime: 1500 };
/** The runner-up is what tells an only move (Great) from a comfortable one. */
export const MULTI_PV = 2;
/** Moves of a line kept for display. */
export const PV_LENGTH = 8;

/**
 * A UCI engine behind a transport. Searches run one at a time; scores come back from White's side.
 */
export class UciEngine {
  private listeners = new Set<(line: string) => void>();
  private queue: Promise<unknown> = Promise.resolve();
  private ready: Promise<void> | null = null;

  /** `options` are UCI options set once at start, e.g. `{ UCI_Variant: 'makruk' }`. */
  constructor(
    private readonly transport: UciTransport,
    private readonly options: Readonly<Record<string, string>> = {},
  ) {
    transport.onLine((line) => {
      for (const listener of [...this.listeners]) listener(line);
    });
  }

  private waitFor(predicate: (line: string) => boolean): Promise<string> {
    return new Promise((resolve) => {
      const listener = (line: string) => {
        if (!predicate(line)) return;
        this.listeners.delete(listener);
        resolve(line);
      };
      this.listeners.add(listener);
    });
  }

  init(): Promise<void> {
    this.ready ??= (async () => {
      const uciok = this.waitFor((l) => l.trim() === 'uciok');
      this.transport.send('uci');
      await uciok;
      this.transport.send(`setoption name MultiPV value ${MULTI_PV}`);
      this.transport.send('setoption name Hash value 32');
      for (const [name, value] of Object.entries(this.options)) this.transport.send(`setoption name ${name} value ${value}`);
      const readyok = this.waitFor((l) => l.trim() === 'readyok');
      this.transport.send('isready');
      await readyok;
    })();
    return this.ready;
  }

  /** Clears what the engine learnt from another game. */
  newGame(): Promise<void> {
    return this.run(async () => {
      this.transport.send('ucinewgame');
      const readyok = this.waitFor((l) => l.trim() === 'readyok');
      this.transport.send('isready');
      await readyok;
    });
  }

  analyse(fen: string, limits: SearchLimits = REVIEW_LIMITS): Promise<PositionEval> {
    return this.run(async () => {
      const blackToMove = fen.split(' ')[1] === 'b';
      const best = new Map<number, InfoLine>();
      const collect = (line: string) => {
        const info = parseInfo(line);
        if (!info) return;
        const previous = best.get(info.multipv);
        // An exact score replaces anything; a bound only fills a gap.
        if (!info.bound || !previous || previous.bound) best.set(info.multipv, info);
      };
      this.listeners.add(collect);
      const done = this.waitFor((l) => parseBestMove(l) !== undefined);
      this.transport.send(`position fen ${fen}`);
      this.transport.send(`go depth ${limits.depth} movetime ${limits.movetime}`);
      const bestmove = parseBestMove(await done);
      this.listeners.delete(collect);

      const lines = [...best.entries()]
        .sort(([a], [b]) => a - b)
        .map(([, info]) => ({ score: blackToMove ? negate(info.score) : info.score, pv: info.pv.slice(0, PV_LENGTH) }));
      // The move the engine finally chose leads, even if its last info line was cut short.
      if (bestmove && lines[0] && lines[0].pv[0] !== bestmove) {
        const chosen = lines.findIndex((l) => l.pv[0] === bestmove);
        if (chosen > 0) lines.unshift(...lines.splice(chosen, 1));
      }
      return { fen, depth: best.get(1)?.depth ?? 0, lines };
    });
  }

  terminate(): void {
    this.transport.send('quit');
    this.transport.terminate();
  }

  private run<T>(task: () => Promise<T>): Promise<T> {
    const next = this.queue.then(() => this.init()).then(task);
    this.queue = next.catch(() => {});
    return next;
  }
}

/** An engine that is its own Web Worker script (Stockfish.js); it finds its `.wasm` next to itself. */
export function workerTransport(url: string): UciTransport {
  const worker = new Worker(url);
  return {
    send: (command) => worker.postMessage(command),
    onLine: (listener) => {
      worker.addEventListener('message', (event: MessageEvent) => {
        if (typeof event.data === 'string') for (const line of event.data.split('\n')) listener(line);
      });
    },
    terminate: () => worker.terminate(),
  };
}
