import { chess, type Color, parsePgn, toPgn } from '@chaturanga/chess';
import { type GameResult, resultFromStatus } from '@chaturanga/game-shell';
import { botById } from '@chaturanga/chess-ai';
import type { TFunction } from 'i18next';
import type { PlayerTag, SavedGame } from '../../stores/history';

/** A player's name in the site language: "You", "Opponent", the bot's name, or the colour. */
export function playerName(t: TFunction, tag: PlayerTag, color: Color): string {
  switch (tag.kind) {
    case 'you':
      return t('computer.you');
    case 'opponent':
      return t('online.opponent');
    case 'bot':
      return t(`bots.${botById(tag.level).key}.name`);
    case 'side':
      return t(`colors.${color}`);
    case 'name':
      return tag.name;
  }
}

/** How the game ended for the viewer: a win or loss when they played one side, otherwise who won. */
export type Outcome = 'won' | 'lost' | 'draw' | 'whiteWins' | 'blackWins' | 'unfinished';

export function outcomeOf(game: Pick<SavedGame, 'result' | 'you'>): Outcome {
  const { result, you } = game;
  if (!result) return 'unfinished';
  if (result.winner === null) return 'draw';
  if (you) return result.winner === you ? 'won' : 'lost';
  return result.winner === 'w' ? 'whiteWins' : 'blackWins';
}

const PGN_RESULT = (result: GameResult | null): string =>
  !result ? '*' : result.winner === 'w' ? '1-0' : result.winner === 'b' ? '0-1' : '1/2-1/2';

function pgnDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

/** The game as PGN. An imported game gives back its own tags; the site address never goes in (Site "?"). */
export function savedGameToPgn(game: SavedGame, t: TFunction): string {
  const tags: Record<string, string> = game.tags
    ? { ...game.tags }
    : {
        Event: t(`games.event.${game.mode}`),
        Site: '?',
        Date: pgnDate(game.createdAt),
        Round: '-',
        White: playerName(t, game.players.w, 'w'),
        Black: playerName(t, game.players.b, 'b'),
      };
  tags.Result = PGN_RESULT(game.result);
  if (!game.tags) {
    if (game.timeControl) tags.TimeControl = `${game.timeControl.initialMs / 1000}+${game.timeControl.incrementMs / 1000}`;
    if (game.result) tags.Termination = t(`play.reason.${game.result.reason}`);
  }
  return toPgn({ tags, startFen: game.startFen, moves: game.moves });
}

/**
 * A pasted PGN as a saved game. The result comes from the final position when it is over; otherwise from
 * the Result tag, read as a resignation (a win) or an agreed draw, since PGN does not say more.
 * Throws PgnError when the text cannot be read.
 */
export function importPgn(text: string, now: number): SavedGame {
  const pgn = parsePgn(text);
  const board = chess.createGame(pgn.startFen);
  for (const m of pgn.moves) board.move(m);
  const fromBoard = resultFromStatus(board.status());
  const tag = pgn.tags.Result;
  const result: GameResult | null =
    fromBoard ??
    (tag === '1-0'
      ? { winner: 'w', reason: 'resign' }
      : tag === '0-1'
        ? { winner: 'b', reason: 'resign' }
        : tag === '1/2-1/2'
          ? { winner: null, reason: 'agreement' }
          : null);
  const name = (value: string | undefined): PlayerTag => (value && value !== '?' ? { kind: 'name', name: value } : { kind: 'side' });
  return {
    id: `imported-${now.toString(36)}`,
    mode: 'imported',
    createdAt: now,
    updatedAt: now,
    startFen: pgn.startFen,
    moves: pgn.moves,
    result,
    players: { w: name(pgn.tags.White), b: name(pgn.tags.Black) },
    you: null,
    timeControl: null,
    tags: pgn.tags,
  };
}
