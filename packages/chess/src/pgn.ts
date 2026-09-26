import { type PgnGame, readPgn, writePgn } from '@chaturanga/rules-core';
import { fileOf, parseSquare, squareName } from './board';
import type { Game } from './game';
import type { PieceType } from './types';
import { chess } from './variant';

export { type PgnGame, PgnError } from '@chaturanga/rules-core';

/** Writes a chess game as PGN (the shared writer in rules-core). */
export function toPgn(game: PgnGame): string {
  return writePgn(chess, game);
}

/**
 * Reads the first game of a PGN text. SAN is read loosely (missing or extra disambiguation, `0-0`, `e8Q`,
 * `!?`), but every move must be legal.
 */
export function parsePgn(text: string): PgnGame {
  return readPgn(chess, text, resolveSan);
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
