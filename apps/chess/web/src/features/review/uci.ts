/** An engine score from one side's point of view: centipawns, or moves to mate (negative: being mated). */
export type Score = { cp: number } | { mate: number };

/** One `info` line of a UCI search that carries a principal variation. */
export interface InfoLine {
  depth: number;
  multipv: number;
  /** From the side to move. */
  score: Score;
  /** Only an exact score is worth keeping; a bound is a search still in progress. */
  bound: 'lower' | 'upper' | null;
  pv: string[];
}

/** Reads a UCI `info` line; null for lines without a score and a pv (currmove, string, hashfull…). */
export function parseInfo(line: string): InfoLine | null {
  const tokens = line.trim().split(/\s+/);
  if (tokens[0] !== 'info') return null;
  let depth = 0;
  let multipv = 1;
  let score: Score | null = null;
  let bound: InfoLine['bound'] = null;
  let pv: string[] = [];
  for (let i = 1; i < tokens.length; i++) {
    const token = tokens[i];
    if (token === 'depth') depth = Number(tokens[++i]);
    else if (token === 'multipv') multipv = Number(tokens[++i]);
    else if (token === 'score') {
      const kind = tokens[++i];
      const value = Number(tokens[++i]);
      if (kind === 'cp') score = { cp: value };
      else if (kind === 'mate') score = { mate: value };
    } else if (token === 'lowerbound') bound = 'lower';
    else if (token === 'upperbound') bound = 'upper';
    else if (token === 'pv') {
      pv = tokens.slice(i + 1);
      break;
    }
  }
  if (!score || pv.length === 0 || !Number.isFinite(depth)) return null;
  return { depth, multipv, score, bound, pv };
}

/** The move of a `bestmove` line; null when there is none (`bestmove (none)` in a finished position). */
export function parseBestMove(line: string): string | null | undefined {
  const tokens = line.trim().split(/\s+/);
  if (tokens[0] !== 'bestmove') return undefined;
  const move = tokens[1];
  return !move || move === '(none)' ? null : move;
}

/** The same score from the other side. */
export function negate(score: Score): Score {
  return 'cp' in score ? { cp: -score.cp } : { mate: -score.mate };
}
