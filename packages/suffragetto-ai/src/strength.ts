import { Game, POLICE_START_FEN, START_FEN } from '@chaturanga/suffragetto';
import { chooseMove, mulberry32 } from './index';

const MAX_PLIES = Number(process.env.STRENGTH_PLIES ?? 32);
const POSITIONS = [START_FEN, POLICE_START_FEN];

for (const [index, start] of POSITIONS.entries()) {
  const game = new Game(start);
  const before = game.fen();
  for (let ply = 0; ply < MAX_PLIES && !game.isGameOver(); ply++) {
    const level = (ply + index) % 2 === 0 ? 1 : 5;
    const choice = chooseMove(game.fen(), level, {
      game,
      rng: mulberry32(40_001 + index * 97 + ply),
      ignoreTime: true,
      maxDepth: 2,
      maxNodes: 500,
    });
    if (!choice || !game.legalUci().includes(choice.uci))
      throw new Error(`Level ${level} returned an illegal move at ${game.fen()}`);
    game.move(choice.uci);
  }
  if (game.fen() === before) throw new Error('Strength smoke played no moves');
  console.log(`Game ${index + 1}: ${game.moves().length} plies, ${game.status().kind}`);
}
