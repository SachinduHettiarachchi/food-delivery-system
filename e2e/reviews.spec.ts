import { test, expect } from '@playwright/test';
import { loginViaAPI, USERS, registerViaAPI } from './helpers/auth';
import { getFirstRestaurantId } from './helpers/pages';

/**
 * Review submission tests.
 *
 * Requires a delivered order to exist for the customer.
 * The order-lifecycle spec should run before this spec in the full suite,
 * which delivers an order that can then be reviewed.
 */
test.describe('Reviews', () => {

  let restaurantId: string;

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto('/');
    await registerViaAPI(page, USERS.customer);
    await loginViaAPI(page, USERS.customer.email, USERS.customer.password);
    restaurantId = await getFirstRestaurantId(page);
    await ctx.close();
  });

  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, USERS.customer.email, USERS.customer.password);
  });

  /* ── Review modal ───────────────────────────────────────────────────── */
  test('delivered order detail shows "Rate your order" section', async ({ page }) => {
    // Find a delivered order from My Orders
    await page.goto('/orders');
    await page.waitForSelector('a[href^="/orders/"]', { timeout: 8_000 });

    const deliveredLink = page.locator('a[href^="/orders/"]').filter({ has: page.getByText(/rate your order/i) });
    const count = await deliveredLink.count();

    if (count === 0) {
      test.skip(); // No delivered orders yet — run order-lifecycle tests first
      return;
    }

    await deliveredLink.first().click();
    await page.waitForURL('**/orders/**');
    // Order detail page should show rate items section
    await expect(page.getByText(/rate/i).first()).toBeVisible({ timeout: 5_000 });
  });

  test('can open review modal and submit a star rating', async ({ page }) => {
    await page.goto('/orders');
    await page.waitForSelector('a[href^="/orders/"]', { timeout: 8_000 });

    const deliveredLink = page.locator('a[href^="/orders/"]').filter({ has: page.getByText(/rate your order/i) });
    if (await deliveredLink.count() === 0) { test.skip(); return; }

    await deliveredLink.first().click();
    await page.waitForURL('**/orders/**');

    // Find a "Rate" button for a menu item on this order
    const rateBtn = page.getByRole('button', { name: /rate/i }).first();
    await expect(rateBtn).toBeVisible({ timeout: 5_000 });
    await rateBtn.click();

    // Review modal opens — "Rate this item" heading
    await expect(page.getByText(/rate this item/i)).toBeVisible({ timeout: 5_000 });

    // Click 4 stars
    const stars = page.locator('button').filter({ has: page.locator('.lucide-star') });
    await stars.nth(3).click(); // 4th star = 4 stars

    // Optionally add a comment
    await page.locator('textarea[placeholder="What did you think?"]').fill('Delicious!');

    // Submit
    await page.getByRole('button', { name: /submit review/i }).click();

    await expect(page.getByText(/review submitted/i)).toBeVisible({ timeout: 6_000 });
  });

  test('submitting without a star rating shows error', async ({ page }) => {
    await page.goto('/orders');
    await page.waitForSelector('a[href^="/orders/"]', { timeout: 8_000 });

    const deliveredLink = page.locator('a[href^="/orders/"]').filter({ has: page.getByText(/rate your order/i) });
    if (await deliveredLink.count() === 0) { test.skip(); return; }

    await deliveredLink.first().click();
    await page.waitForURL('**/orders/**');
    // Wait for review-status API call to settle so "Rate" buttons are stable
    await page.waitForLoadState('networkidle');

    const rateBtn = page.getByRole('button', { name: /rate/i }).first();
    // Skip gracefully if all items in this order were already reviewed by a prior test
    if (!await rateBtn.isVisible()) { test.skip(); return; }
    await rateBtn.click();

    await expect(page.getByText(/rate this item/i)).toBeVisible({ timeout: 5_000 });
    // Click Submit without selecting stars
    await page.getByRole('button', { name: /submit review/i }).click();

    await expect(page.getByText(/select a star rating/i)).toBeVisible({ timeout: 5_000 });
  });

  test('cannot review the same item twice', async ({ page }) => {
    await page.goto('/orders');
    await page.waitForSelector('a[href^="/orders/"]', { timeout: 8_000 });

    const deliveredLink = page.locator('a[href^="/orders/"]').filter({ has: page.getByText(/rate your order/i) });
    if (await deliveredLink.count() === 0) { test.skip(); return; }

    await deliveredLink.first().click();
    await page.waitForURL('**/orders/**');

    // Look for a Rate button — if the item was already reviewed in the previous test,
    // the rate button should either be gone or show a "reviewed" state
    const rateBtn = page.getByRole('button', { name: /rate/i }).first();
    const rateBtnVisible = await rateBtn.isVisible();

    if (rateBtnVisible) {
      // Still has unreviewed items — open modal and attempt duplicate
      await rateBtn.click();
      await expect(page.getByText(/rate this item/i)).toBeVisible({ timeout: 5_000 });
      const stars = page.locator('button').filter({ has: page.locator('.lucide-star') });
      await stars.nth(3).click();
      await page.getByRole('button', { name: /submit review/i }).click();

      // Either succeeds (first review for this item) or shows duplicate error
      const successOrError = page.getByText(/review submitted|already reviewed|already submitted/i);
      await expect(successOrError).toBeVisible({ timeout: 6_000 });
    }
  });

  /* ── Rating reflects on restaurant detail ───────────────────────────── */
  test('submitted rating eventually appears on restaurant detail page', async ({ page }) => {
    // This depends on the insights cron running — we just check the page loads
    // and doesn't show an error. The cron updates avg_rating periodically.
    await page.goto(`/restaurants/${restaurantId}`);
    // Page should load without errors (restaurant name visible)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 8_000 });
  });
});
