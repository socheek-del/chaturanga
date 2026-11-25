import { Game as ChessGame, parseSquare, squareName, type PieceType } from '@chaturanga/chess';
import { FenError } from '@chaturanga/rules-core';
import type { Color } from '@chaturanga/rules-core';

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR[] w KQkq - 0 1';

export type Pockets = Record<Color, Record<Exclude<PieceType, 'k'>, number>>;

export interface CrazyhouseFenData {
  boardFen: string;
  pockets: Pockets;
  promoted: Set<number>;
}

const POCKET_TYPES = ['q', 'r', 'b', 'n', 'p'] as const;
const POCKET_CHAR_TO_TYPE: Record<string, (typeof POCKET_TYPES)[number]> = {
  P: 'p',
  N: 'n',
  B: 'b',
  R: 'r',
  Q: 'q',
  p: 'p',
  n: 'n',
  b: 'b',
  r: 'r',
  q: 'q',
};

export function emptyPockets(): Pockets {
  const side = (): Record<(typeof POCKET_TYPES)[number], number> => ({ p: 0, n: 0, b: 0, r: 0, q: 0 });
  return { w: side(), b: side() };
}

function parsePromoted(placement: string, fen: string): Set<number> {
  for (let i = 0; i < placement.length; i++) {
    if (placement[i] !== '~') continue;
    if (!/[NBRQnbrq]/.test(placement[i - 1] ?? '') || placement[i + 1] === '~') {
      throw new FenError('a promoted marker must follow a promoted piece', fen);
    }
  }

  const promoted = new Set<number>();
  const ranks = placement.split('/');
  for (let row = 0; row < ranks.length; row++) {
    const rank = ranks[row]!;
    let file = 0;
    for (let i = 0; i < rank.length; i++) {
      const char = rank[i]!;
      if (char >= '1' && char <= '8') {
        file += Number(char);
        continue;
      }
      if (char === '~') continue;
      if (!/[pnbrqkPNBRQK]/.test(char)) continue; // The chess FEN parser below reports unknown letters.
      if (rank[i + 1] === '~') {
        const square = (7 - row) * 8 + file;
        if (file < 8) promoted.add(square);
      }
      file++;
    }
  }
  return promoted;
}

/** Parses Crazyhouse FEN with bracket pockets and `~` promotion provenance. */
export function parseCrazyhouseFen(fen: string): CrazyhouseFenData {
  const fields = fen.trim().split(/\s+/);
  if (fields.length !== 6) throw new FenError(`expected 6 fields, got ${fields.length}`, fen);
  const pocketMatch = /^(.*)\[([PNBRQpnbrq]*)\]$/.exec(fields[0]!);
  if (!pocketMatch) throw new FenError('expected a bracketed pocket after the board placement', fen);

  const placement = pocketMatch[1]!;
  const pocketText = pocketMatch[2]!;
  const promoted = parsePromoted(placement, fen);
  const boardFen = [`${placement.replace(/~/g, '')}`, ...fields.slice(1)].join(' ');
  // Reuse the chess parser for orthodox board geometry, kings, castling, en passant and clocks.
  new ChessGame(boardFen);

  const pockets = emptyPockets();
  for (const char of pocketText) {
    const type = POCKET_CHAR_TO_TYPE[char];
    if (!type) throw new FenError(`unknown pocket piece '${char}'`, fen);
    const color: Color = char === char.toLowerCase() ? 'b' : 'w';
    pockets[color][type]++;
  }

  return { boardFen, pockets, promoted };
}

function placementWithProvenance(placement: string, promoted: ReadonlySet<number>): string {
  const ranks = placement.split('/');
  return ranks
    .map((row, rowIndex) => {
      let file = 0;
      let out = '';
      for (const char of row) {
        if (char >= '1' && char <= '8') {
          file += Number(char);
          out += char;
        } else {
          const square = (7 - rowIndex) * 8 + file;
          out += char + (promoted.has(square) ? '~' : '');
          file++;
        }
      }
      return out;
    })
    .join('/');
}

function serializePocket(pockets: Pockets): string {
  let out = '';
  for (const color of ['w', 'b'] as const) {
    for (const type of POCKET_TYPES) {
      const letter = color === 'w' ? type.toUpperCase() : type;
      out += letter.repeat(pockets[color][type]);
    }
  }
  return out;
}

export function serializeCrazyhouseFen(boardFen: string, pockets: Pockets, promoted: ReadonlySet<number>): string {
  const fields = boardFen.split(' ');
  const placement = placementWithProvenance(fields[0]!, promoted);
  return [`${placement}[${serializePocket(pockets)}]`, ...fields.slice(1)].join(' ');
}

/** Adds a piece to a chess placement field, used to apply a Crazyhouse drop. */
export function withPieceAt(placement: string, square: number, char: string): string {
  const rows = placement.split('/');
  const targetRow = 7 - Math.floor(square / 8);
  const targetFile = square % 8;
  const row = rows[targetRow]!;
  let file = 0;
  let output = '';
  let inserted = false;
  let emptyRun = 0;
  const flushEmpty = (): void => {
    if (emptyRun) output += String(emptyRun);
    emptyRun = 0;
  };

  for (const item of row) {
    const width = item >= '1' && item <= '8' ? Number(item) : 1;
    if (item >= '1' && item <= '8') {
      for (let i = 0; i < width; i++) {
        if (!inserted && file === targetFile) {
          flushEmpty();
          output += char;
          inserted = true;
        } else {
          emptyRun++;
        }
        file++;
      }
    } else {
      if (!inserted && file === targetFile) {
        flushEmpty();
        output += char;
        inserted = true;
      }
      flushEmpty();
      output += item;
      file++;
    }
  }
  if (!inserted && file === targetFile) {
    flushEmpty();
    output += char;
    inserted = true;
  }
  flushEmpty();
  if (!inserted) throw new FenError(`cannot place a drop on ${squareName(square)}`, placement);
  rows[targetRow] = output;
  return rows.join('/');
}

export { parseSquare, squareName };
