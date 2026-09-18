/**
 * Captures the README media from the live site (sg-010): three GIFs and a phone collage.
 *   BASE_URL=https://<live site> npm run capture:readme -w apps/shogi/web
 * Needs ffmpeg and ImageMagick (`magick`) on the PATH. Nothing captured shows the site address: the online
 * scene joins the room directly instead of filming the waiting room, whose share link names it.
 */
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, expect } from '@playwright/test';

const BASE = process.env.BASE_URL?.replace(/\/+$/, '');
if (!BASE) throw new Error('Set BASE_URL to the live site address.');

const media = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'docs', 'media');
await mkdir(media, { recursive: true });
const tmp = await mkdtemp(join(tmpdir(), 'shogi-readme-'));
const browser = await chromium.launch();

const PHONE = { width: 390, height: 844 };
const plies = (page) => page.getByTestId('move-list').locator('[data-ply]');
const tap = async (page, square) => page.locator(`[data-square="${square}"]`).click();
const pause = (page, ms) => page.waitForTimeout(ms);

/** Records one scene; returns the video path once the context has flushed it. */
async function record(size, scene, options = {}) {
  const context = await browser.newContext({ viewport: size, recordVideo: { dir: tmp, size }, colorScheme: 'light', ...options });
  const page = await context.newPage();
  await scene(page);
  await context.close();
  return page.video().path();
}

/** Two-pass palette GIF. `inputs` are hstacked when there are two. */
function gif(inputs, out, { width, fps = 10, trim = 1 }) {
  const args = ['-y', '-loglevel', 'error'];
  for (const input of inputs) args.push('-ss', String(trim), '-i', input);
  const base = inputs.length === 2 ? '[0:v][1:v]hstack=inputs=2,' : '';
  args.push(
    '-filter_complex',
    `${base}fps=${fps},scale=${width}:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=5`,
    join(media, out),
  );
  execFileSync('ffmpeg', args);
  console.log(`wrote docs/media/${out}`);
}

// 1. Against the computer: a cannon to the centre file, a horse out, then a hint.
const computer = await record({ width: 1280, height: 800 }, async (page) => {
  await page.goto(`${BASE}/play/computer`);
  await page.locator('[data-bot-level="3"]').click();
  await pause(page, 600);
  await page.getByRole('radio', { name: '先手', exact: true }).click();
  await page.getByRole('button', { name: '開始' }).click();
  await pause(page, 900);
  for (const [from, to, total] of [
    ['g3', 'g4', 2],
    ['h2', 'g2', 4],
  ]) {
    await tap(page, from);
    await pause(page, 400);
    await tap(page, to);
    await expect(plies(page)).toHaveCount(total, { timeout: 60_000 });
    await pause(page, 900);
  }
  await page.getByTestId('hint').click();
  await pause(page, 2500);
});
gif([computer], 'play-computer.gif', { width: 760, fps: 8 });

// 2. Online: one player creates a room off camera, then both join by link and play.
const creator = await browser.newContext();
const creatorPage = await creator.newPage();
await creatorPage.goto(`${BASE}/play/online`);
const create = creatorPage.getByRole('button', { name: '部屋を作る' });
await expect(create).toBeEnabled({ timeout: 15_000 });
await creatorPage.locator('[data-time-control="5+0"]').click();
await creatorPage.getByRole('radio', { name: '先手', exact: true }).click();
await create.click();
const code = (await creatorPage.getByTestId('room-code').textContent()).trim();
const hostState = await creator.storageState();
await creator.close();

const size = { width: 430, height: 880 };
const hostContext = await browser.newContext({ viewport: size, recordVideo: { dir: tmp, size }, storageState: hostState });
const friendContext = await browser.newContext({ viewport: size, recordVideo: { dir: tmp, size } });
const host = await hostContext.newPage();
const friend = await friendContext.newPage();
await Promise.all([host.goto(`${BASE}/play/online/${code}`), friend.goto(`${BASE}/play/online/${code}`)]);
await expect(host.getByRole('grid')).toBeVisible({ timeout: 15_000 });
await expect(friend.getByRole('grid')).toBeVisible({ timeout: 15_000 });
await pause(host, 1200);
for (const [page, other, from, to, total] of [
  [host, friend, 'g3', 'g4', 1],
  [friend, host, 'c7', 'c6', 2],
  [host, friend, 'h2', 'g2', 3],
  [friend, host, 'b8', 'c8', 4],
]) {
  await tap(page, from);
  await pause(page, 350);
  await tap(page, to);
  await expect(plies(other)).toHaveCount(total, { timeout: 15_000 });
  await pause(page, 700);
}
await pause(host, 1500);
await hostContext.close();
await friendContext.close();
gif([await host.video().path(), await friend.video().path()], 'online.gif', { width: 720, fps: 8 });

// 3. A lesson on a phone: the Gold's moves, then the drop lesson's piece from hand.
const lesson = await record(PHONE, async (page) => {
  await page.goto(`${BASE}/learn`);
  await pause(page, 1200);
  await page.locator('[data-lesson="gold"] a').click();
  await pause(page, 1800);
  for (const name of ['d5', 'd6', 'e4', 'e6', 'f5', 'f6']) {
    await tap(page, name);
    await pause(page, 300);
  }
  await page.getByRole('button', { name: '答え合わせ', exact: true }).click();
  await pause(page, 1600);
  await page.getByRole('button', { name: 'つづける', exact: true }).click();
  await pause(page, 2000);
  await page.getByRole('button', { name: 'つづける', exact: true }).click();
  await pause(page, 2500);
});
gif([lesson], 'lesson.gif', { width: 360, fps: 10 });

// 4. Phone collage: home, the lesson path, and a game in dark mode.
const shots = [];
async function phoneShot(name, scene, colorScheme = 'light') {
  const context = await browser.newContext({ viewport: PHONE, deviceScaleFactor: 2, colorScheme });
  const page = await context.newPage();
  await scene(page);
  await pause(page, 600);
  const path = join(tmp, `${name}.png`);
  await page.screenshot({ path });
  shots.push(path);
  await context.close();
}
await phoneShot('home', (page) => page.goto(`${BASE}/`));
await phoneShot('learn', (page) => page.goto(`${BASE}/learn`));
await phoneShot(
  'game',
  async (page) => {
    await page.goto(`${BASE}/play/local`);
    await page.getByRole('button', { name: '開始' }).click();
    await tap(page, 'g3');
    await tap(page, 'g4');
    await tap(page, 'c7');
    await tap(page, 'c6');
    await expect(plies(page)).toHaveCount(2);
  },
  'dark',
);
execFileSync('magick', [...shots, '-bordercolor', '#1f3d5c', '-border', '24', '+append', '-resize', '1600x', join(media, 'mobile.png')]);
console.log('wrote docs/media/mobile.png');

await browser.close();
await rm(tmp, { recursive: true, force: true });
