/**
 * Chu Shogi bot ladder. Run with `npm run test:strength -w packages/chu-shogi-ai`.
 * STRENGTH_PAIR=n limits the run to L(n+1) against Ln; STRENGTH_GAMES controls games per pair.
 * A plain Node process bundles the TypeScript ladder to keep test-transform overhead out of deep search.
 */
import { build } from 'esbuild';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const games = Number(process.env.STRENGTH_GAMES ?? 2);
const onlyPair = process.env.STRENGTH_PAIR ? Number(process.env.STRENGTH_PAIR) : null;
const maxPlies = Number(process.env.STRENGTH_MAX_PLIES ?? 0);
const outfile = join(mkdtempSync(join(tmpdir(), 'chu-shogi-ladder-')), 'ladder.mjs');
await build({ entryPoints: [join(root, 'src/ladder.ts')], bundle: true, platform: 'node', format: 'esm', outfile, logLevel: 'error' });
const { BOTS, MAX_PLIES, OPENING_PLIES, playGame } = await import(pathToFileURL(outfile).href);
let failed = false;

for (let i = 1; i < BOTS.length; i++) {
  if (onlyPair !== null && onlyPair !== i) continue;
  const stronger = BOTS[i];
  const weaker = BOTS[i - 1];
  let wins = 0;
  let losses = 0;
  let draws = 0;
  let points = 0;
  for (let game = 0; game < games; game++) {
    const strongerWhite = game % 2 === 0;
    const result = playGame(
      strongerWhite ? stronger.id : weaker.id,
      strongerWhite ? weaker.id : stronger.id,
      23_401 * i + game,
      7_919 * (Math.floor(game / 2) + 1),
      maxPlies || MAX_PLIES,
    );
    const outcome = result.winner === 'draw' ? 'draw' : result.winner === (strongerWhite ? 'w' : 'b') ? 'win' : 'loss';
    if (outcome === 'win') {
      wins++;
      points++;
    } else if (outcome === 'loss') losses++;
    else {
      draws++;
      points += 0.5;
    }
    console.log(`L${stronger.id} vs L${weaker.id} game ${game + 1}: ${outcome} (${result.reason}, ${result.plies} plies)`);
  }
  console.log(`L${stronger.id} ${stronger.key} vs L${weaker.id} ${weaker.key}: +${wins} -${losses} =${draws} (${games} games; ${OPENING_PLIES}-ply seeded opening; ${maxPlies || MAX_PLIES}-ply cap; ${points}/${games} points)`);
  // Chu games commonly run beyond the standard cap; ties count as half a point.
  if (!maxPlies && points < games / 2) failed = true;
}

process.exit(failed ? 1 : 0);
