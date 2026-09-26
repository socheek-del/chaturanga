import { chess, parsePgn } from '@chaturanga/chess';

export interface Opening {
  eco: string;
  name: string;
}

/** The precomputed book: hashed position keys, the named ones with their ECO code and name. */
export interface BookData {
  /** Positions a named line passes through without being named itself. */
  passing: string[];
  named: Record<string, [eco: string, name: string]>;
}

/** Placement, side to move, castling and en passant: the FEN fields that make two positions the same. */
export function positionKey(fen: string): string {
  return fen.split(' ').slice(0, 4).join(' ');
}

/** 32-bit FNV-1a of the position key, in base 36: short enough to ship ten thousand of them. */
export function positionHash(fen: string): string {
  const key = positionKey(fen);
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

/**
 * Every position along every named line of the lichess opening list (ch-015). Slow (seconds), so
 * `npm run openings` runs it once and ships the result as book.json.
 */
export function buildBookData(tsvs: readonly string[]): BookData {
  const passing = new Set<string>();
  const named: BookData['named'] = {};
  for (const tsv of tsvs) {
    for (const line of tsv.split('\n').slice(1)) {
      const [eco, name, pgn] = line.split('\t');
      if (!eco || !name || !pgn) continue;
      const game = chess.createGame();
      for (const uci of parsePgn(pgn).moves) {
        game.move(uci);
        passing.add(positionHash(game.fen()));
      }
      named[positionHash(game.fen())] = [eco, name];
    }
  }
  for (const hash of Object.keys(named)) passing.delete(hash);
  return { passing: [...passing].sort(), named };
}

/** Book lookups over the precomputed data. */
export class OpeningBook {
  private readonly passing: Set<string>;

  constructor(private readonly data: BookData) {
    this.passing = new Set(data.passing);
  }

  get size(): number {
    return this.passing.size + Object.keys(this.data.named).length;
  }

  has(fen: string): boolean {
    const hash = positionHash(fen);
    return this.passing.has(hash) || hash in this.data.named;
  }

  /** The name of this exact position, when the list names it. */
  name(fen: string): Opening | null {
    const entry = this.data.named[positionHash(fen)];
    return entry ? { eco: entry[0], name: entry[1] } : null;
  }
}

let loading: Promise<OpeningBook> | null = null;

/** The book, loaded once and only when a review needs it. */
export function loadOpeningBook(): Promise<OpeningBook> {
  loading ??= import('./openings/book.json').then((m) => new OpeningBook(m.default as unknown as BookData));
  return loading;
}
