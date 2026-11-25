import { expect, test } from '@playwright/test';

test('learns Crazyhouse, starts a saved two-player game, captures and drops a pawn', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Chess gets a second life.' })).toBeVisible();

  await page.getByRole('button', { name: 'Learn the rules' }).click();
  await page.getByRole('button', { name: /A piece can return/ }).click();
  await expect(page.getByTestId('lesson-player')).toBeVisible();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('radio', { name: 'It joins the capturer’s pocket.' }).click();
  await page.getByRole('button', { name: 'Check answer' }).click();
  await expect(page.getByText('That’s right')).toBeVisible();

  await page.getByRole('button', { name: 'Leave lesson' }).click();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.getByRole('button', { name: 'Play together' }).click();
  await page.getByRole('button', { name: 'Start game' }).click();

  const square = (name: string) => page.getByRole('gridcell', { name: new RegExp(`^${name},`) });
  await square('e2').click();
  await square('e4').click();
  await square('d7').click();
  await square('d5').click();
  await square('e4').click();
  await square('d5').click();
  const pawnInPocket = page.getByRole('button', { name: 'pawn in pocket, 1' });
  await expect(pawnInPocket).toHaveAttribute('data-count', '1');
  await expect(pawnInPocket).toBeDisabled();

  await square('d8').click();
  await square('d7').click();
  await expect(pawnInPocket).toBeEnabled();
  await pawnInPocket.click();
  await square('e2').click();
  await expect(square('e2')).toHaveAttribute('aria-label', /e2, White pawn/i);
  await expect(page.getByTestId('move-list')).toContainText('P@e2');

  await page.reload();
  await page.getByRole('button', { name: 'Play together' }).click();
  await expect(page.getByTestId('move-list')).toContainText('P@e2');
  await page.getByRole('button', { name: 'Take back' }).click();
  await expect(page.getByTestId('move-list')).not.toContainText('P@e2');
});

test('plays the computer as Black and receives a legal opening move', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Choose an opponent' }).click();
  await page.getByRole('radio', { name: /White/ }).click();
  await page.getByRole('radio', { name: /Black/ }).click();
  await page.getByRole('button', { name: 'Start game' }).click();
  await expect(page.getByTestId('turn-banner')).toContainText('Black to move', { timeout: 10_000 });
  await expect(page.getByTestId('move-list')).toContainText('1.', { timeout: 10_000 });
  await expect(page.getByTestId('player-b')).toContainText('You');
});

test('shows the complete lesson list on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Learn the rules' }).click();
  await expect(page.getByRole('heading', { name: 'Learn Crazyhouse' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Choose a promotion/ })).toBeVisible();
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 390);
});
