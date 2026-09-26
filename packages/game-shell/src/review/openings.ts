/**
 * An opening book for game review (ch-015, plat-017): hashed positions, the named ones with their code and
 * name. A product builds the data from its own opening list; nothing here knows any game's openings.
 */
export interface Opening {
  eco: string;
  name: string;
}

/** The precomputed book: hashed position keys, the named ones with their code and name. */
export interface BookData {
  /** Positions a named line passes through without being named itself. */
  passing: string[];
  named: Record<string, [eco: string, name: string]>;
}

/** Placement, side to move and the two FEN fields after them: what makes two positions the same. */
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

/** Book lookups over precomputed data. */
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
