/** Seeded complete games used to compare adjacent Chu bot levels without wall-clock variance. */
import { Game } from '@chaturanga/chu-shogi';
import { chooseMove, mulberry32, positionKey } from './index';

export { BOTS } from './bots';

export const OPENING_PLIES = 2;
export const MAX_PLIES = 100;

export interface LadderGame {
  winner: 'w' | 'b' | 'draw';
  plies: number;
  reason: string;
  fen: string;
}

export function playGame(
  whiteLevel: number,
  blackLevel: number,
  seed: number,
  openingSeed: number,
  maxPlies = MAX_PLIES,
): LadderGame {
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
    const result = chooseMove(game.fen(), level, { rng, ignoreTime: true, history, game });
    if (!result) break;
    history.push(positionKey(game.move(result.uci).fenAfter));
  }
  const status = game.status();
  return {
    winner: 'winner' in status && status.winner ? status.winner : 'draw',
    plies: game.moves().length,
    reason: status.kind === 'ongoing' ? 'max-plies' : status.kind,
    fen: game.fen(),
  };
}
