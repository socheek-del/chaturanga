import { expect, type Page, test } from '@playwright/test';
import { pieceOn, square } from './helpers';

type Color = 'red' | 'yellow' | 'green' | 'blue';
type Kind = 'number' | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild4';
interface SeedCard {
  id: number;
  kind: Kind;
  color: Color | null;
  value: number | null;
}

const n = (id: number, color: Color, value: number): SeedCard => ({ id, kind: 'number', color, value });
const act = (id: number, kind: Kind, color: Color | null = null): SeedCard => ({ id, kind, color, value: null });
const fillers = (count: number, from: number, color: Color = 'blue'): SeedCard[] =>
  Array.from({ length: count }, (_, i) => n(from + i, color, 9));

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

/** Writes a Card Chess table into the persisted store, so the page opens on a known deal. */
async function seedTable(
  page: Page,
  opts: { white: SeedCard[]; black: SeedCard[]; top?: SeedCard; fen?: string; mode?: 'computer' | 'local'; drawPile?: SeedCard[] },
) {
  const top = opts.top ?? n(900, 'red', 5);
  const saved = {
    state: {
      config: { mode: opts.mode ?? 'computer', side: 'w', level: 1 },
      revealed: true,
      muted: true,
      game: {
        fen: opts.fen ?? START,
        result: null,
        lastMove: null,
        log: [],
        uno: {
          rules: { handSize: 7, unoPenalty: 2, wildDrawFourNeedsNoColorMatch: true },
          players: 2,
          hands: [opts.white, opts.black],
          drawPile: opts.drawPile ?? Array.from({ length: 40 }, (_, i) => n(2000 + i, 'yellow', i % 10)),
          discard: [top],
          color: top.color,
          direction: 1,
          current: 0,
          drawnThisTurn: 0,
          unoCalled: [false, false],
          winner: null,
          seed: 1,
          plays: 1,
        },
      },
    },
    version: 1,
  };
  await page.addInitScript((value) => localStorage.setItem('chess.cards', value), JSON.stringify(saved));
}

const handCard = (page: Page, name: RegExp) => page.getByTestId('hand').getByRole('button', { name });

test('the home page leads to Card Chess and a fresh deal gives seven cards each', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('cards-entry').click();
  await expect(page).toHaveURL(/\/play\/cards$/);
  await expect(page.getByRole('heading', { name: 'Card Chess' })).toBeVisible();
  await page.getByRole('button', { name: 'Pass and play' }).click();
  await page.getByRole('button', { name: 'Deal the cards' }).click();
  await expect(page.getByTestId('hand-card')).toHaveCount(0); // face down until White taps
  await page.getByRole('button', { name: /White to play/ }).click();
  await expect(page.getByTestId('hand-card')).toHaveCount(7);
  await expect(page.getByTestId('opponent-count')).toHaveText('7 cards');
});

test('a card limits the move to its pieces, then the computer answers', async ({ page }) => {
  await seedTable(page, { white: [n(1, 'yellow', 5), n(2, 'green', 3), ...fillers(3, 10)], black: fillers(7, 100, 'yellow') });
  await page.goto('/play/cards');
  // Yellow 5 matches the red 5 by number; green 3 matches nothing.
  await expect(page.locator('[data-testid=hand-card][data-playable]')).toHaveCount(1);
  await handCard(page, /^Yellow 5/).click();
  await expect(page.getByTestId('cards-status')).toContainText('moves a pawn');
  await square(page, 'g1').click();
  await expect(page.locator('[data-square][data-target]')).toHaveCount(0);
  await square(page, 'e2').click();
  await square(page, 'e4').click();
  await expect(pieceOn(page, 'e4')).toBeVisible();
  await expect(page.getByTestId('discard')).toHaveAttribute('aria-label', /Yellow 5/);
  await expect(page.getByTestId('cards-log')).toContainText('5 → e4');
  // The computer holds only yellow cards: it plays one and moves a pawn (or the king).
  await expect(page.getByTestId('opponent-count')).toHaveText('6 cards', { timeout: 10_000 });
  await expect(page.getByTestId('cards-status')).toContainText('Your turn', { timeout: 10_000 });
});

test('a wild lets any piece move and names the next colour', async ({ page }) => {
  await seedTable(page, { white: [act(1, 'wild'), ...fillers(4, 10)], black: fillers(7, 100, 'green') });
  await page.goto('/play/cards');
  await handCard(page, /^Wild/).click();
  await square(page, 'g1').click();
  await square(page, 'f3').click();
  await expect(page.getByRole('dialog', { name: 'Name the next colour' })).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: /^Green/ }).click();
  await expect(pieceOn(page, 'f3')).toBeVisible();
  await expect(page.getByTestId('discard')).toHaveAttribute('aria-label', /Green Wild/);
});

test('a skip gives another move', async ({ page }) => {
  await seedTable(page, { white: [act(1, 'skip', 'yellow'), n(2, 'yellow', 4), ...fillers(3, 10)], black: fillers(7, 100), top: n(900, 'yellow', 1) });
  await page.goto('/play/cards');
  await handCard(page, /^Yellow Skip/).click();
  await square(page, 'e2').click();
  await square(page, 'e4').click();
  await expect(page.getByTestId('cards-status')).toContainText('Your turn');
  await handCard(page, /^Yellow 4/).click();
  await square(page, 'd2').click();
  await square(page, 'd4').click();
  await expect(pieceOn(page, 'd4')).toBeVisible();
});

test('nothing fits: draw, then pass', async ({ page }) => {
  await seedTable(page, { white: [n(1, 'blue', 2), n(2, 'blue', 3)], black: fillers(7, 100), drawPile: [n(3000, 'blue', 4)] });
  await page.goto('/play/cards');
  await expect(page.getByTestId('cards-status')).toContainText('Tap the deck to draw');
  await page.getByTestId('draw-pile').click();
  await expect(page.getByTestId('hand-card')).toHaveCount(3);
  await page.getByRole('button', { name: 'Pass' }).click();
  await expect(page.getByTestId('cards-status')).toContainText('is playing');
});

test('calling UNO keeps the hand at one card', async ({ page }) => {
  await seedTable(page, { white: [n(1, 'yellow', 5), n(2, 'red', 3)], black: fillers(7, 100, 'blue') });
  await page.goto('/play/cards');
  await page.getByRole('button', { name: 'UNO!' }).click();
  await handCard(page, /^Yellow 5/).click();
  await square(page, 'e2').click();
  await square(page, 'e4').click();
  await expect(page.getByTestId('hand-card')).toHaveCount(1);
  await expect(page.getByTestId('cards-log')).toContainText('UNO!');
});

test('forgetting UNO costs two cards', async ({ page }) => {
  await seedTable(page, { white: [n(1, 'yellow', 5), n(2, 'red', 3)], black: fillers(7, 100, 'blue') });
  await page.goto('/play/cards');
  await handCard(page, /^Yellow 5/).click();
  await square(page, 'e2').click();
  await square(page, 'e4').click();
  await expect(page.getByTestId('hand-card')).toHaveCount(3);
});

test('playing the last card wins the game', async ({ page }) => {
  await seedTable(page, { white: [n(1, 'yellow', 5)], black: fillers(7, 100) });
  await page.goto('/play/cards');
  await handCard(page, /^Yellow 5/).click();
  await square(page, 'e2').click();
  await square(page, 'e4').click();
  await expect(page.getByRole('dialog', { name: 'You played the last card!' })).toBeVisible();
  await page.getByRole('button', { name: 'Change setup' }).click();
  await expect(page.getByRole('button', { name: 'Deal the cards' })).toBeVisible();
});

test('the table fits a phone screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 664 });
  await seedTable(page, { white: [n(1, 'yellow', 5), ...fillers(6, 10)], black: fillers(7, 100) });
  await page.goto('/play/cards');
  const hand = await page.getByTestId('hand').boundingBox();
  expect(hand!.y + hand!.height).toBeLessThanOrEqual(664 + 4);
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(390);
});
