/**
 * One strength-ladder game between two bot levels (xq-003). Pure: node budgets only, seeded rng, so a game
 * replays identically anywhere. `scripts/strength.mjs` runs the ladder around it.
 */
import { Game } from '@chaturanga/xiangqi';
import { chooseMove, mulberry32, positionKey } from './index';

export { BOTS } from './bots';

/** Plies of seeded random opening before the bots take over, so every game of a pair differs. */
export const OPENING_PLIES = 4;
export const MAX_PLIES = 400;

export interface LadderGame {
  winner: 'w' | 'b' | 'draw';
  plies: number;
  reason: string;
  fen: string;
}

export function playGame(whiteLevel: number, blackLevel: number, seed: number, openingSeed: number, maxPlies = MAX_PLIES): LadderGame {
  const game = new Game();
  const rng = mulberry32(seed);
  const history = [positionKey(game.fen())];
  const openingRng = mulberry32(openingSeed);
  for (let p = 0; p < OPENING_PLIES && !game.isGameOver(); p++) {
    const legal = game.legalUci();
    history.push(positionKey(game.move(legal[Math.floor(openingRng() * legal.length)]!).fenAfter));
  }
  while (!game.isGameOver() && game.moves().length < maxPlies) {
    const level = game.turn === 'w' ? whiteLevel : blackLevel;
    const move = chooseMove(game.fen(), level, { rng, ignoreTime: true, history, game });
    if (!move) break;
    history.push(positionKey(game.move(move.uci).fenAfter));
  }
  const status = game.status();
  return {
    winner: 'winner' in status && status.winner ? status.winner : 'draw',
    plies: game.moves().length,
    reason: status.kind === 'ongoing' ? 'max-plies' : status.kind,
    fen: game.fen(),
  };
}
