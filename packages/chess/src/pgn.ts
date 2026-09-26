import { fileOf, parseSquare, squareName } from './board';
import { START_FEN } from './fen';
import { Game } from './game';
import type { PieceType } from './types';

/** A game as PGN carries it: the tag pairs, the starting position and the moves in coordinate notation. */
export interface PgnGame {
  /** Tag pairs in the order they were read or should be written. */
  tags: Record<string, string>;
  startFen: string;
  /** Coordinate notation (`e2e4`, `e1g1`, `e7e8q`), the form the rest of the codebase uses. */
  moves: string[];
}

/** A PGN that cannot be read; `ply` is the 1-based half-move that failed, when a move was the problem. */
export class PgnError extends Error {
  constructor(
    message: string,
    readonly ply: number | null = null,
    readonly san: string | null = null,
  ) {
    super(message);
    this.name = 'PgnError';
  }
}

/** The Seven Tag Roster comes first, in this order; any other tag follows it. */
const ROSTER = ['Event', 'Site', 'Date', 'Round', 'White', 'Black', 'Result'];
const RESULTS = new Set(['1-0', '0-1', '1/2-1/2', '*']);

/**
 * Writes a game as PGN. Missing roster tags are written as "?" (Result as "*"), and a game that does not
 * start from the usual position gets its `SetUp` and `FEN` tags. Move text wraps at 80 columns.
 */
export function toPgn(game: PgnGame): string {
  const tags: Record<string, string> = {};
  for (const name of ROSTER) tags[name] = game.tags[name] ?? (name === 'Result' ? '*' : '?');
  for (const [name, value] of Object.entries(game.tags)) if (!(name in tags)) tags[name] = value;
  if (game.startFen !== START_FEN) {
    tags.SetUp = '1';
    tags.FEN = game.startFen;
  } else {
    delete tags.SetUp;
    delete tags.FEN;
  }

  const board = new Game(game.startFen);
  let number = Number(game.startFen.split(' ')[5]) || 1;
  const tokens: string[] = [];
  game.moves.forEach((uci, i) => {
    const white = board.turn === 'w';
    if (white) tokens.push(`${number}.`);
    else if (i === 0) tokens.push(`${number}...`);
    tokens.push(board.move(uci).san);
    if (!white) number++;
  });
  tokens.push(tags.Result!);

  const lines: string[] = [];
  let line = '';
  for (const token of tokens) {
    if (line && line.length + 1 + token.length > 80) {
      lines.push(line);
      line = token;
    } else line = line ? `${line} ${token}` : token;
  }
  if (line) lines.push(line);

  const header = Object.entries(tags).map(([name, value]) => `[${name} "${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"]`);
  return `${header.join('\n')}\n\n${lines.join('\n')}\n`;
}

/**
 * Reads the first game of a PGN text. Comments, variations, annotation glyphs and move numbers are skipped;
 * SAN is read loosely (missing or extra disambiguation, `0-0`, `e8Q`, `!?`), but every move must be legal.
 */
export function parsePgn(text: string): PgnGame {
  const tags: Record<string, string> = {};
  const body = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const tagPattern = /^\s*\[\s*([A-Za-z0-9_]+)\s+"((?:[^"\\]|\\.)*)"\s*\]\s*$/;
  const lines = body.split('\n');
  let i = 0;
  // Skip blank lines and escape lines before the tags.
  while (i < lines.length && (lines[i]!.trim() === '' || lines[i]!.startsWith('%'))) i++;
  for (; i < lines.length; i++) {
    const match = tagPattern.exec(lines[i]!);
    if (!match) break;
    tags[match[1]!] = match[2]!.replace(/\\(.)/g, '$1');
  }
  const movetext = lines
    .slice(i)
    .filter((l) => !l.startsWith('%'))
    .join('\n');

  const startFen = tags.FEN ?? START_FEN;
  let game: Game;
  try {
    game = new Game(startFen);
  } catch {
    throw new PgnError('Invalid FEN tag');
  }

  const moves: string[] = [];
  for (const token of tokenize(movetext)) {
    if (RESULTS.has(token)) {
      tags.Result ??= token;
      break;
    }
    const uci = resolveSan(game, token);
    if (!uci) throw new PgnError(`Illegal move ${token}`, moves.length + 1, token);
    game.move(uci);
    moves.push(uci);
  }
  if (moves.length === 0 && Object.keys(tags).length === 0) throw new PgnError('No game found');
  return { tags, startFen, moves };
}

/** Move and result tokens of the main line, in order. */
function tokenize(movetext: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let i = 0;
  while (i < movetext.length) {
    const c = movetext[i]!;
    if (c === '{') {
      const end = movetext.indexOf('}', i);
      i = end < 0 ? movetext.length : end + 1;
    } else if (c === ';') {
      const end = movetext.indexOf('\n', i);
      i = end < 0 ? movetext.length : end + 1;
    } else if (c === '(') {
      depth++;
      i++;
    } else if (c === ')') {
      depth = Math.max(0, depth - 1);
      i++;
    } else if (/\s/.test(c)) {
      i++;
    } else {
      let j = i;
      while (j < movetext.length && !/[\s{}();]/.test(movetext[j]!)) j++;
      const word = movetext.slice(i, j);
      i = j;
      if (depth > 0) continue;
      if (RESULTS.has(word)) {
        out.push(word);
        continue;
      }
      // "12.", "12...", "12.e4": strip the move number, keep what follows it.
      const move = word.replace(/^\d+\.+/, '');
      if (!move || move.startsWith('$')) continue;
      out.push(move);
    }
  }
  return out;
}

const SAN = /^([NBRQK])?([a-h])?([1-8])?x?-?([a-h][1-8])(?:=?([NBRQnbrq]))?$/;

/** The legal move a SAN token names, in coordinate notation, or null. */
export function resolveSan(game: Game, token: string): string | null {
  const san = token.replace(/[+#!?]+$/g, '').replace(/[+#]/g, '');
  const castle = /^([O0])-\1(-\1)?$/.exec(san);
  const legal = game.legalMoves();
  if (castle) {
    const long = !!castle[2];
    const king = legal.find((m) => {
      const piece = game.pieceAt(m.from);
      return piece?.type === 'k' && Math.abs(fileOf(m.to) - fileOf(m.from)) === 2 && fileOf(m.to) < fileOf(m.from) === long;
    });
    return king ? `${squareName(king.from)}${squareName(king.to)}` : null;
  }
  const match = SAN.exec(san);
  if (!match) return null;
  const [, pieceLetter, fromFile, fromRank, target, promo] = match;
  const type = (pieceLetter?.toLowerCase() ?? 'p') as PieceType;
  const to = parseSquare(target!);
  const promotion = promo ? (promo.toLowerCase() as PieceType) : null;
  const candidates = legal.filter((m) => {
    if (m.to !== to) return false;
    if (game.pieceAt(m.from)?.type !== type) return false;
    const from = squareName(m.from);
    if (fromFile && from[0] !== fromFile) return false;
    if (fromRank && from[1] !== fromRank) return false;
    return (m.promotion ?? null) === (type === 'p' ? promotion : null) || (type === 'p' && !promotion && m.promotion === 'q');
  });
  // An unwritten promotion piece defaults to a queen only when nothing else matched exactly.
  const exact = candidates.filter((m) => (m.promotion ?? null) === promotion);
  const pick = exact.length === 1 ? exact[0] : candidates.length === 1 ? candidates[0] : undefined;
  if (!pick) return null;
  return `${squareName(pick.from)}${squareName(pick.to)}${pick.promotion ?? ''}`;
}
