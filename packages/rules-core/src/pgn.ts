import type { Variant, VariantGame } from './variant';

/** A game as PGN carries it: the tag pairs, the starting position and the moves in coordinate notation. */
export interface PgnGame {
  /** Tag pairs in the order they were read or should be written. */
  tags: Record<string, string>;
  startFen: string;
  /** Coordinate notation (`e2e4`, `e1g1`, `a6a7m`), the form the rest of the codebase uses. */
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

/** Finds the legal move a SAN token names, in coordinate notation, or null. */
export type SanResolver<G extends VariantGame = VariantGame> = (game: G, token: string) => string | null;

/** The Seven Tag Roster comes first, in this order; any other tag follows it. */
const ROSTER = ['Event', 'Site', 'Date', 'Round', 'White', 'Black', 'Result'];
const RESULTS = new Set(['1-0', '0-1', '1/2-1/2', '*']);

/**
 * Writes a game as PGN with the variant's own SAN. Missing roster tags are written as "?" (Result as "*"),
 * and a game that does not start from the variant's usual position gets its `SetUp` and `FEN` tags. Move
 * text wraps at 80 columns. The move number comes from the FEN's sixth field.
 */
export function writePgn<G extends VariantGame>(variant: Variant<G>, game: PgnGame): string {
  const tags: Record<string, string> = {};
  for (const name of ROSTER) tags[name] = game.tags[name] ?? (name === 'Result' ? '*' : '?');
  for (const [name, value] of Object.entries(game.tags)) if (!(name in tags)) tags[name] = value;
  if (game.startFen !== variant.startFen) {
    tags.SetUp = '1';
    tags.FEN = game.startFen;
  } else {
    delete tags.SetUp;
    delete tags.FEN;
  }

  const board = variant.createGame(game.startFen);
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
 * each move is found by `resolve` (by default: the legal move whose SAN matches, ignoring check marks,
 * annotations and `=`), and every move must be legal.
 */
export function readPgn<G extends VariantGame>(variant: Variant<G>, text: string, resolve: SanResolver<G> = resolveBySan): PgnGame {
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

  const startFen = tags.FEN ?? variant.startFen;
  let game: G;
  try {
    game = variant.createGame(startFen);
  } catch {
    throw new PgnError('Invalid FEN tag');
  }

  const moves: string[] = [];
  for (const token of tokenize(movetext)) {
    if (RESULTS.has(token)) {
      tags.Result ??= token;
      break;
    }
    const uci = resolve(game, token);
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

/** Check marks, annotations and `=` do not tell moves apart; `0-0` is how some sites write castling. */
const normalizeSan = (san: string): string => san.replace(/[+#!?=]/g, '').replace(/^0-0(-0)?$/, (m) => m.replace(/0/g, 'O'));

/** The legal move whose SAN, as this variant writes it, matches the token. */
export function resolveBySan(game: VariantGame, token: string): string | null {
  const wanted = normalizeSan(token);
  const found: string[] = [];
  for (const uci of game.legalUci()) {
    const record = game.move(uci);
    game.undo();
    if (normalizeSan(record.san) === wanted) found.push(uci);
  }
  return found.length === 1 ? found[0]! : null;
}
