import { chess, parsePgn } from '@chaturanga/chess';
import { type BookData, OpeningBook, positionHash } from '@chaturanga/game-shell';

export { type BookData, OpeningBook } from '@chaturanga/game-shell';

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

let loading: Promise<OpeningBook> | null = null;

/** The book, loaded once and only when a review needs it. */
export function loadOpeningBook(): Promise<OpeningBook> {
  loading ??= import('./openings/book.json').then((m) => new OpeningBook(m.default as unknown as BookData));
  return loading;
}
