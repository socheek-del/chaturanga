/**
 * Shogi bot strength ladder (sg-003): each level must beat the level below in a majority of games.
 * Run with `npm run test:strength -w packages/shogi-ai`, or on GitHub Actions with
 * `gh workflow run strength.yml -f package=packages/shogi-ai -f pair=5 -f games=20`.
 * STRENGTH_PAIR=n runs only level n+1 vs level n; STRENGTH_GAMES changes the count.
 *
 * A plain Node script rather than a vitest file: the search runs about 4x faster outside vitest's module
 * transform. It bundles src/ladder.ts with esbuild, then keeps the Makruk/Sittuyin ladder contract: every
 * finished game is appended to strength-games.log with a signature of both bot configs, games already logged
 * are skipped, STRENGTH_SHARD=k/n plays only that shard, and a run without a shard records the verdict in
 * strength-results.log and exits non-zero when a level fails to win the majority.
 */
import { appendFileSync, existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const GAMES = Number(process.env.STRENGTH_GAMES ?? 20);
const ONLY_PAIR = process.env.STRENGTH_PAIR ? Number(process.env.STRENGTH_PAIR) : null;
const SHARD = process.env.STRENGTH_SHARD
  ? (([index, count]) => ({ index: Number(index), count: Number(count) }))(process.env.STRENGTH_SHARD.split('/'))
  : null;
const GAMES_LOG = join(ROOT, 'strength-games.log');
const RESULTS_LOG = join(ROOT, 'strength-results.log');

const outfile = join(mkdtempSync(join(tmpdir(), 'shogi-ladder-')), 'ladder.mjs');
await build({ entryPoints: [join(ROOT, 'src/ladder.ts')], bundle: true, platform: 'node', format: 'esm', outfile, logLevel: 'error' });
const { BOTS, MAX_PLIES, OPENING_PLIES, playGame } = await import(pathToFileURL(outfile).href);

/** Games already played with exactly these bot configs, by game index. */
function loggedGames(signature) {
  const done = new Map();
  if (!existsSync(GAMES_LOG)) return done;
  for (const line of readFileSync(GAMES_LOG, 'utf8').split('\n')) {
    if (!line) continue;
    const entry = JSON.parse(line);
    if (entry.signature === signature) done.set(entry.game, entry.outcome);
  }
  return done;
}

let failed = false;
for (let i = 1; i < BOTS.length; i++) {
  if (ONLY_PAIR !== null && ONLY_PAIR !== i) continue;
  const strong = BOTS[i];
  const weak = BOTS[i - 1];
  const signature = JSON.stringify({ strong, weak, maxPlies: MAX_PLIES, openingPlies: OPENING_PLIES });
  for (let g = 0; g < GAMES; g++) {
    if (SHARD && g % SHARD.count !== SHARD.index) continue;
    // Re-read before each game: parallel shards and earlier runs share the log.
    if (loggedGames(signature).has(g)) continue;
    const strongIsWhite = g % 2 === 0;
    const started = Date.now();
    const { winner, plies, reason, fen } = playGame(
      strongIsWhite ? strong.id : weak.id,
      strongIsWhite ? weak.id : strong.id,
      1_000 * i + g,
      7_919 * (Math.floor(g / 2) + 1),
    );
    const outcome = winner === 'draw' ? 'draw' : winner === (strongIsWhite ? 'w' : 'b') ? 'win' : 'loss';
    const pair = `L${strong.id}-L${weak.id}`;
    const seconds = Math.round((Date.now() - started) / 1000);
    appendFileSync(
      GAMES_LOG,
      `${JSON.stringify({ at: new Date().toISOString(), pair, game: g, outcome, plies, reason, seconds, fen, signature })}\n`,
    );
    console.log(`${pair} game ${g}: ${outcome} (${reason}, ${plies} plies, ${seconds}s)`);
  }
  const done = loggedGames(signature);
  // A shard only plays its own games; the verdict needs every game.
  if (SHARD || [...Array(GAMES).keys()].some((g) => !done.has(g))) continue;
  const results = [...done].filter(([g]) => g < GAMES).map(([, outcome]) => outcome);
  const wins = results.filter((o) => o === 'win').length;
  const losses = results.filter((o) => o === 'loss').length;
  const draws = results.filter((o) => o === 'draw').length;
  const line = `${new Date().toISOString()} L${strong.id} ${strong.key} vs L${weak.id} ${weak.key}: +${wins} -${losses} =${draws} (${GAMES} games)`;
  appendFileSync(RESULTS_LOG, `${line}\n`);
  console.log(line);
  if (wins <= GAMES / 2) failed = true;
}
process.exit(failed ? 1 : 0);
