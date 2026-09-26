import { expect, test } from '@playwright/test';
import { square } from './helpers';

test('plat-015: the attack map works during setup and can be switched off', async ({ page }) => {
  await page.goto('/play/local');
  await page.getByRole('button', { name: 'စတင်ရန်' }).click();
  const toggle = page.getByRole('switch', { name: 'တိုက်ခိုက်မှုမြေပုံ' });
  await toggle.click();
  // Only the Ne already on the board attack; pieces in hand do not. The two pawn walls cover each other.
  await expect(square(page, 'd5')).toHaveAttribute('data-attack', 'both');
  await expect(square(page, 'a1')).not.toHaveAttribute('data-attack');
  await toggle.click();
  await expect(page.locator('[data-attack]')).toHaveCount(0);
});
